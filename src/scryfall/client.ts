import { requestUrl } from "obsidian";
import { PLUGIN_USER_AGENT, SCRYFALL_NAMED_FUZZY, SCRYFALL_REQUEST_SPACING_MS } from "../utils/constants";
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

	private async doFetch(name: string): Promise<ScryfallCard | null> {
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
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
