export interface CardTagDefinition {
	id: string;
	label: string;
	shortLabel: string;
	icon: string;
	colorVar: string;
}

const ALIASES: Record<string, string> = {
	"mana-rock": "ramp",
	"mana-dork": "ramp",
	"draw-engine": "draw",
	cantrip: "draw",
	"card-draw": "draw",
	advantage: "draw",
	"spot-removal": "removal",
	kill: "removal",
	"single-target": "removal",
	wipe: "boardwipe",
	sweeper: "boardwipe",
	wrath: "boardwipe",
	mwipe: "boardwipe",
	counter: "counterspell",
	counterspell: "counterspell",
	permission: "counterspell",
	reanimate: "recursion",
	"graveyard-recursion": "recursion",
	tutor: "tutor",
	tutoring: "tutor",
	search: "tutor",
	protection: "protection",
	hexproof: "protection",
	indestructible: "protection",
	wincon: "wincon",
	finisher: "wincon",
	win: "wincon",
	threat: "wincon",
	combo: "combo",
	"combo-piece": "combo",
	enabler: "combo",
	utility: "utility",
	tech: "utility",
};

export const CARD_TAG_DEFINITIONS: Record<string, CardTagDefinition> = {
	ramp: {
		id: "ramp",
		label: "Ramp / mana acceleration",
		shortLabel: "Ramp",
		icon: "sprout",
		colorVar: "--mtg-tag-ramp",
	},
	draw: {
		id: "draw",
		label: "Card draw",
		shortLabel: "Draw",
		icon: "plus",
		colorVar: "--mtg-tag-draw",
	},
	removal: {
		id: "removal",
		label: "Targeted removal",
		shortLabel: "Removal",
		icon: "target",
		colorVar: "--mtg-tag-removal",
	},
	boardwipe: {
		id: "boardwipe",
		label: "Board wipe / sweeper",
		shortLabel: "Wipes",
		icon: "bomb",
		colorVar: "--mtg-tag-boardwipe",
	},
	counterspell: {
		id: "counterspell",
		label: "Counterspell",
		shortLabel: "Counters",
		icon: "shield",
		colorVar: "--mtg-tag-counterspell",
	},
	recursion: {
		id: "recursion",
		label: "Recursion / reanimate",
		shortLabel: "Recursion",
		icon: "rotate-ccw",
		colorVar: "--mtg-tag-recursion",
	},
	tutor: {
		id: "tutor",
		label: "Tutor",
		shortLabel: "Tutors",
		icon: "search",
		colorVar: "--mtg-tag-tutor",
	},
	protection: {
		id: "protection",
		label: "Protection",
		shortLabel: "Protection",
		icon: "shield-check",
		colorVar: "--mtg-tag-protection",
	},
	wincon: {
		id: "wincon",
		label: "Win condition / threat",
		shortLabel: "Wincons",
		icon: "trophy",
		colorVar: "--mtg-tag-wincon",
	},
	combo: {
		id: "combo",
		label: "Combo piece",
		shortLabel: "Combo",
		icon: "link",
		colorVar: "--mtg-tag-combo",
	},
	utility: {
		id: "utility",
		label: "Utility",
		shortLabel: "Utility",
		icon: "wrench",
		colorVar: "--mtg-tag-utility",
	},
};

export interface ResolvedCardTag {
	id: string;
	label: string;
	shortLabel: string;
	icon: string;
	colorVar: string;
	custom: boolean;
}

export function resolveCardTag(raw: string): ResolvedCardTag {
	const lower = raw.toLowerCase();
	const canonical = ALIASES[lower] ?? lower;
	const def = CARD_TAG_DEFINITIONS[canonical];
	if (def) {
		return { ...def, custom: false };
	}
	return {
		id: lower,
		label: raw,
		shortLabel: raw,
		icon: "tag",
		colorVar: "--mtg-tag-custom",
		custom: true,
	};
}
