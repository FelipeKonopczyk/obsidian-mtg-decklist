import type { ScryfallCard } from "../scryfall/types";
import type { SymbologyClient } from "../scryfall/symbology";

const SYMBOL_LABELS: Record<string, string> = {
	W: "White",
	U: "Blue",
	B: "Black",
	R: "Red",
	G: "Green",
	C: "Colorless",
	S: "Snow",
	X: "X",
	T: "Tap",
	Q: "Untap",
	E: "Energy",
};

const COLOR_CLASS: Record<string, string> = {
	W: "mtg-mana-w",
	U: "mtg-mana-u",
	B: "mtg-mana-b",
	R: "mtg-mana-r",
	G: "mtg-mana-g",
	C: "mtg-mana-c",
	S: "mtg-mana-c",
	X: "mtg-mana-c",
};

interface FallbackGlyph {
	text: string;
	cls: string;
	label: string;
}

function fallbackGlyph(token: string): FallbackGlyph {
	const upper = token.toUpperCase();

	if (/^\d+$/.test(upper)) {
		return { text: upper, cls: "mtg-mana-c", label: `${upper} generic` };
	}

	if (upper.includes("/")) {
		const parts = upper.split("/");
		const cls = parts.map((p) => COLOR_CLASS[p] ?? "mtg-mana-c").join(" ") + " mtg-mana-hybrid";
		return { text: parts.join("/"), cls, label: parts.map((p) => SYMBOL_LABELS[p] ?? p).join("/") };
	}

	const cls = COLOR_CLASS[upper] ?? "mtg-mana-c";
	const label = SYMBOL_LABELS[upper] ?? upper;
	return { text: upper, cls, label };
}

function renderSingleSymbol(parent: HTMLElement, inner: string, symbology: SymbologyClient | null, sizeClass?: string): void {
	const symKey = `{${inner.toUpperCase()}}`;
	const fromApi = symbology?.get(symKey);
	const wrapperCls = `mtg-mana-symbol${sizeClass ? ` ${sizeClass}` : ""}`;

	if (fromApi?.svg_uri) {
		const img = parent.createEl("img", { cls: `${wrapperCls} mtg-mana-symbol-img` });
		img.src = fromApi.svg_uri;
		const label = fromApi.english ?? fallbackGlyph(inner).label;
		img.alt = label;
		img.setAttribute("title", label);
		img.setAttribute("loading", "lazy");
		return;
	}

	const { text, cls, label } = fallbackGlyph(inner);
	const span = parent.createSpan({ cls: `${wrapperCls} ${cls}`, text });
	span.setAttribute("aria-label", label);
	span.setAttribute("title", label);
}

function appendManaSymbols(parent: HTMLElement, manaCost: string, symbology: SymbologyClient | null): void {
	const tokens = manaCost.match(/\{([^}]+)\}/g);
	if (!tokens) return;
	for (const raw of tokens) {
		const inner = raw.slice(1, -1);
		renderSingleSymbol(parent, inner, symbology);
	}
}

export function renderManaCost(parent: HTMLElement, manaCost: string | undefined, symbology: SymbologyClient | null): void {
	if (!manaCost) return;
	if (!/\{[^}]+\}/.test(manaCost)) return;
	const wrap = parent.createSpan({ cls: "mtg-mana-cost" });
	appendManaSymbols(wrap, manaCost, symbology);
}

// Layouts where every face has its own castable mana cost and we want to show
// them all (joined by a `//` separator).
const MULTI_FACE_LAYOUTS = new Set(["modal_dfc", "split"]);

// Layouts where the card is cast for the front face's cost from hand; we hide
// the back face's cost (e.g. Adventure's instant/sorcery half, transform DFC
// back, flip cards, meld results).
const FRONT_FACE_ONLY_LAYOUTS = new Set([
	"adventure",
	"transform",
	"flip",
	"meld",
	"battle",
	"reversible_card",
]);

export function renderCardManaCost(
	parent: HTMLElement,
	card: ScryfallCard,
	symbology: SymbologyClient | null,
): boolean {
	const layout = card.layout;
	const faces = card.card_faces ?? [];

	if (layout && MULTI_FACE_LAYOUTS.has(layout) && faces.length >= 2) {
		const costs = faces.map((f) => f.mana_cost?.trim() ?? "").filter((c) => c.length > 0);
		if (costs.length >= 2) {
			const wrap = parent.createSpan({ cls: "mtg-mana-cost mtg-mana-cost-multi" });
			for (let i = 0; i < costs.length; i++) {
				if (i > 0) {
					const sep = wrap.createSpan({ cls: "mtg-mana-cost-separator", text: "//" });
					sep.setAttribute("aria-hidden", "true");
				}
				appendManaSymbols(wrap, costs[i] ?? "", symbology);
			}
			return true;
		}
		if (costs.length === 1) {
			renderManaCost(parent, costs[0], symbology);
			return true;
		}
	}

	if (layout && FRONT_FACE_ONLY_LAYOUTS.has(layout)) {
		const front = faces[0]?.mana_cost;
		if (front && front.length > 0) {
			renderManaCost(parent, front, symbology);
			return true;
		}
	}

	if (card.mana_cost && card.mana_cost.length > 0) {
		renderManaCost(parent, card.mana_cost, symbology);
		return true;
	}

	const fallbackFront = faces[0]?.mana_cost;
	if (fallbackFront && fallbackFront.length > 0) {
		renderManaCost(parent, fallbackFront, symbology);
		return true;
	}

	return false;
}

const COLOR_PIP_ORDER = ["W", "U", "B", "R", "G"];

export function renderColorIdentityPips(
	parent: HTMLElement,
	colors: Iterable<string>,
	symbology: SymbologyClient | null,
	options?: { sizeClass?: string; emptyAsColorless?: boolean },
): void {
	const set = new Set<string>();
	for (const c of colors) {
		const upper = c.toUpperCase();
		if (COLOR_PIP_ORDER.includes(upper)) set.add(upper);
	}
	const ordered = COLOR_PIP_ORDER.filter((c) => set.has(c));

	const wrap = parent.createSpan({ cls: "mtg-color-pips" });
	if (ordered.length === 0) {
		if (options?.emptyAsColorless) {
			renderSingleSymbol(wrap, "C", symbology, options?.sizeClass ?? "mtg-mana-symbol-lg");
		}
		return;
	}
	for (const c of ordered) {
		renderSingleSymbol(wrap, c, symbology, options?.sizeClass ?? "mtg-mana-symbol-lg");
	}
}
