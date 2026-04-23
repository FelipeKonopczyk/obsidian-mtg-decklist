import type { ParsedDecklist } from "../parser/types";

export function toMoxfieldText(parsed: ParsedDecklist): string {
	const lines: string[] = [];
	for (const section of parsed.sections) {
		if (lines.length > 0) lines.push("");
		lines.push(`# ${section.title}`);
		for (const e of section.entries) {
			lines.push(`${e.quantity} ${e.name}`);
		}
	}
	return lines.join("\n");
}

export function toArenaImport(parsed: ParsedDecklist): string {
	const main: string[] = [];
	const side: string[] = [];
	for (const section of parsed.sections) {
		const target = section.kind === "sideboard" ? side : main;
		for (const e of section.entries) {
			target.push(`${e.quantity} ${e.name}`);
		}
	}
	const out: string[] = ["Deck", ...main];
	if (side.length > 0) {
		out.push("", "Sideboard", ...side);
	}
	return out.join("\n");
}
