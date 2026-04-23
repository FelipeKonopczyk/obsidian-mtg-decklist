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

export function renderManaCost(parent: HTMLElement, manaCost: string | undefined, symbology: SymbologyClient | null): void {
	if (!manaCost) return;
	const tokens = manaCost.match(/\{([^}]+)\}/g);
	if (!tokens) return;

	const wrap = parent.createSpan({ cls: "mtg-mana-cost" });
	for (const raw of tokens) {
		const inner = raw.slice(1, -1);
		renderSingleSymbol(wrap, inner, symbology);
	}
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
