import type { ResolvedSection } from "./grouping";

export interface ManaCurveBucket {
	cmc: number;
	count: number;
}

export interface ColorBucket {
	color: string;
	count: number;
}

export interface DeckStats {
	manaCurve: ManaCurveBucket[];
	colors: ColorBucket[];
	typeDistribution: { type: string; count: number }[];
}

const COLOR_ORDER = ["W", "U", "B", "R", "G", "C"];

function isMainGameplaySection(kind: ResolvedSection["kind"]): boolean {
	return kind !== "sideboard" && kind !== "maybeboard";
}

export function computeStats(sections: ResolvedSection[]): DeckStats {
	const curveMap = new Map<number, number>();
	const colorMap = new Map<string, number>();
	const typeMap = new Map<string, number>();

	for (const section of sections) {
		if (!isMainGameplaySection(section.kind)) continue;
		for (const { entry, card } of section.entries) {
			const typeLine = card?.type_line ?? entry.hints?.type_line;
			const cmcVal = card?.cmc ?? entry.hints?.cmc;
			const colorsVal = card?.color_identity ?? card?.colors ?? entry.hints?.color_identity ?? entry.hints?.colors;
			if (typeLine === undefined && cmcVal === undefined && !colorsVal) continue;

			const isLand = (typeLine ?? "").toLowerCase().includes("land");
			if (!isLand && cmcVal !== undefined) {
				const cmc = Math.max(0, Math.floor(cmcVal));
				const bucket = cmc >= 7 ? 7 : cmc;
				curveMap.set(bucket, (curveMap.get(bucket) ?? 0) + entry.quantity);
			}
			const colors = colorsVal ?? [];
			if (colors.length === 0) {
				colorMap.set("C", (colorMap.get("C") ?? 0) + entry.quantity);
			} else {
				for (const c of colors) {
					const upper = c.toUpperCase();
					colorMap.set(upper, (colorMap.get(upper) ?? 0) + entry.quantity);
				}
			}
			const typeKey = primaryType(typeLine);
			typeMap.set(typeKey, (typeMap.get(typeKey) ?? 0) + entry.quantity);
		}
	}

	const manaCurve: ManaCurveBucket[] = [];
	for (let i = 0; i <= 7; i++) {
		manaCurve.push({ cmc: i, count: curveMap.get(i) ?? 0 });
	}

	const colors: ColorBucket[] = COLOR_ORDER.filter((c) => (colorMap.get(c) ?? 0) > 0).map((c) => ({
		color: c,
		count: colorMap.get(c) ?? 0,
	}));

	const typeDistribution = Array.from(typeMap.entries())
		.map(([type, count]) => ({ type, count }))
		.sort((a, b) => b.count - a.count);

	return {
		manaCurve,
		colors,
		typeDistribution,
	};
}

function primaryType(typeLine: string | undefined): string {
	if (!typeLine) return "Other";
	const t = typeLine.toLowerCase();
	if (t.includes("creature")) return "Creature";
	if (t.includes("planeswalker")) return "Planeswalker";
	if (t.includes("battle")) return "Battle";
	if (t.includes("instant")) return "Instant";
	if (t.includes("sorcery")) return "Sorcery";
	if (t.includes("artifact")) return "Artifact";
	if (t.includes("enchantment")) return "Enchantment";
	if (t.includes("land")) return "Land";
	return "Other";
}
