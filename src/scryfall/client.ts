import { requestUrl } from "obsidian";
import {
	PLUGIN_USER_AGENT,
	SCRYFALL_NAMED_FUZZY,
	SCRYFALL_REQUEST_SPACING_MS,
	SCRYFALL_RETRY_BACKOFF_BASE_MS,
	SCRYFALL_RETRY_BACKOFF_MAX_MS,
	SCRYFALL_RETRY_MAX_ATTEMPTS,
} from "../utils/constants";
import { CardCache, normalizeCardName } from "./cache";
import type { ScryfallCard } from "./types";

export class ScryfallClient {
	private queue: Promise<unknown> = Promise.resolve();
	private inflight: Map<string, Promise<ScryfallCard | null>> = new Map();
	private lastRequestAt = 0;

	constructor(private readonly cache: CardCache) {}

	getCached(name: string): ScryfallCard | undefined {
		return this.cache.get(name);
	}

	async fetchCardByName(name: string): Promise<ScryfallCard | null> {
		const key = normalizeCardName(name);
		const cached = this.cache.get(name);
		if (cached) return cached;
		if (this.cache.hasNotFound(name)) return null;

		const existing = this.inflight.get(key);
		if (existing) return existing;

		const promise = this.enqueue(() => this.doFetch(name));
		this.inflight.set(key, promise);
		try {
			return await promise;
		} finally {
			this.inflight.delete(key);
		}
	}

	async fetchCardByPrint(set: string, collectorNumber: string): Promise<ScryfallCard | null> {
		const cacheKey = printCacheKey(set, collectorNumber);
		const cached = this.cache.get(cacheKey);
		if (cached) return cached;
		if (this.cache.hasNotFound(cacheKey)) return null;
	
		const existing = this.inflight.get(cacheKey);
		if (existing) return existing;
	
		const promise = this.enqueue(() => this.doFetchPrint(set, collectorNumber, cacheKey));
		this.inflight.set(cacheKey, promise);
		try {
			return await promise;
		} finally {
			this.inflight.delete(cacheKey);
		}
	}


	private enqueue<T>(task: () => Promise<T>): Promise<T> {
		const next = this.queue.then(async () => {
			const since = Date.now() - this.lastRequestAt;
			const wait = Math.max(0, SCRYFALL_REQUEST_SPACING_MS - since);
			if (wait > 0) await sleep(wait);
			this.lastRequestAt = Date.now();
			return task();
		});
		this.queue = next.catch(() => undefined);
		return next;
	}

	private async doFetch(name: string, attempt = 0): Promise<ScryfallCard | null> {
		const url = `${SCRYFALL_NAMED_FUZZY}${encodeURIComponent(name)}`;
		try {
			const response = await requestUrl({
				url,
				method: "GET",
				headers: {
					Accept: "application/json",
					"User-Agent": PLUGIN_USER_AGENT,
				},
				throw: false,
			});

			if (response.status === 404) {
				this.cache.markNotFound(name);
				return null;
			}

			if (isThrottleStatus(response.status)) {
				if (attempt >= SCRYFALL_RETRY_MAX_ATTEMPTS) {
					console.warn(
						`[mtg-decklist] Scryfall ${response.status} for "${name}" after ${attempt} retries; giving up for now`,
					);
					return null;
				}
				const headerDelay = parseRetryAfterMs(response.headers);
				const backoff = backoffDelay(attempt);
				const delay = Math.max(headerDelay ?? 0, backoff);
				console.debug(
					`[mtg-decklist] Scryfall ${response.status} for "${name}", retrying in ${delay}ms (attempt ${attempt + 1}/${SCRYFALL_RETRY_MAX_ATTEMPTS})`,
				);
				await sleep(delay);
				this.lastRequestAt = Date.now();
				return this.doFetch(name, attempt + 1);
			}

			if (response.status < 200 || response.status >= 300) {
				return null;
			}

			const card = response.json as ScryfallCard | undefined;
			if (!card || !card.name) return null;

			this.cache.set(name, card);
			this.cache.set(card.name, card);
			return card;
		} catch (err) {
			console.warn("[mtg-decklist] Scryfall request failed", name, err);
			return null;
		}
	}

	private async doFetchPrint(
		set: string,
		collectorNumber: string,
		cacheKey: string,
		attempt = 0,
	): Promise<ScryfallCard | null> {
		const url = `${SCRYFALL_CARDS}${encodeURIComponent(set.toLowerCase())}/${encodeURIComponent(collectorNumber)}`;
		try {
			const response = await requestUrl({
				url,
				method: "GET",
				headers: { Accept: "application/json", "User-Agent": PLUGIN_USER_AGENT },
				throw: false,
			});
	
			if (response.status === 404) {
				this.cache.markNotFound(cacheKey);
				return null;
			}
	
			if (isThrottleStatus(response.status)) {
				if (attempt >= SCRYFALL_RETRY_MAX_ATTEMPTS) {
					console.warn(`[mtg-decklist] Scryfall ${response.status} for "${cacheKey}" after ${attempt} retries; giving up`);
					return null;
				}
				const headerDelay = parseRetryAfterMs(response.headers);
				const delay = Math.max(headerDelay ?? 0, backoffDelay(attempt));
				await sleep(delay);
				this.lastRequestAt = Date.now();
				return this.doFetchPrint(set, collectorNumber, cacheKey, attempt + 1);
			}
	
			if (response.status < 200 || response.status >= 300) return null;
	
			const card = response.json as ScryfallCard | undefined;
			if (!card || !card.name) return null;
	
			// Cache under the print key ONLY. Do not write card.name here, or a later
			// bare "Sol Ring" lookup could resolve to this specific print.
			this.cache.set(cacheKey, card);
			return card;
		} catch (err) {
			console.warn("[mtg-decklist] Scryfall print request failed", set, collectorNumber, err);
			return null;
		}
	}
	
}

function isThrottleStatus(status: number): boolean {
	return status === 429 || status === 503 || status === 502 || status === 504;
}

function parseRetryAfterMs(headers: Record<string, string> | undefined): number | null {
	if (!headers) return null;
	const raw = headers["retry-after"] ?? headers["Retry-After"];
	if (!raw) return null;
	const seconds = Number.parseInt(raw, 10);
	if (Number.isFinite(seconds) && seconds > 0) {
		return Math.min(SCRYFALL_RETRY_BACKOFF_MAX_MS, seconds * 1000);
	}
	return null;
}

function backoffDelay(attempt: number): number {
	const exp = SCRYFALL_RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt);
	const jitter = Math.floor(Math.random() * 250);
	return Math.min(SCRYFALL_RETRY_BACKOFF_MAX_MS, exp + jitter);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function printCacheKey(set: string, collectorNumber: string): string {
	return `print:${set.toLowerCase()}/${collectorNumber.toLowerCase()}`;
}
