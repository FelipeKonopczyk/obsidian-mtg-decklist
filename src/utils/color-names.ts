const WUBRG_ORDER = ["W", "U", "B", "R", "G"];

const COLOR_COMBO_NAMES: Record<string, string> = {
	"": "Colorless",
	W: "Mono-White",
	U: "Mono-Blue",
	B: "Mono-Black",
	R: "Mono-Red",
	G: "Mono-Green",
	WU: "Azorius",
	UB: "Dimir",
	BR: "Rakdos",
	RG: "Gruul",
	WG: "Selesnya",
	WB: "Orzhov",
	UR: "Izzet",
	BG: "Golgari",
	WR: "Boros",
	UG: "Simic",
	WUG: "Bant",
	WUB: "Esper",
	UBR: "Grixis",
	BRG: "Jund",
	WRG: "Naya",
	WBG: "Abzan",
	WUR: "Jeskai",
	UBG: "Sultai",
	WBR: "Mardu",
	URG: "Temur",
	UBRG: "Glint-Eye",
	WBRG: "Dune-Brood",
	WURG: "Ink-Treader",
	WUBG: "Witch-Maw",
	WUBR: "Yore-Tiller",
	WUBRG: "Five-Color",
};

export function normalizeColorKey(colors: Iterable<string>): string {
	const set = new Set<string>();
	for (const c of colors) {
		const upper = c.toUpperCase();
		if (WUBRG_ORDER.includes(upper)) set.add(upper);
	}
	return WUBRG_ORDER.filter((c) => set.has(c)).join("");
}

export function colorComboName(colors: Iterable<string>): string {
	const key = normalizeColorKey(colors);
	return COLOR_COMBO_NAMES[key] ?? key;
}
