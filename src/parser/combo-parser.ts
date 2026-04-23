import type { ParsedCombo } from "./combo-types";

const SCALAR_KEYS = new Set(["name", "result"]);
const LIST_KEYS = new Set(["prerequisites", "steps", "loop", "break", "interact", "notes"]);
const KEY_ALIASES: Record<string, string> = {
	prereqs: "prerequisites",
	prereq: "prerequisites",
	requires: "prerequisites",
	step: "steps",
	loops: "loop",
	cycle: "loop",
	breaks: "break",
	exit: "break",
	disrupt: "interact",
	disruption: "interact",
	counterplay: "interact",
	note: "notes",
	outcome: "result",
	wins: "result",
	win: "result",
};

export function parseCombo(source: string): ParsedCombo {
	const combo: ParsedCombo = {
		name: "",
		result: undefined,
		prerequisites: [],
		steps: [],
		loop: [],
		breaks: [],
		interact: [],
		notes: [],
		errors: [],
	};

	const lines = source.split(/\r?\n/);
	let currentList: string[] | null = null;
	let currentKey: string | null = null;

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i] ?? "";
		const trimmed = raw.trim();

		if (!trimmed) {
			currentList = null;
			currentKey = null;
			continue;
		}
		if (trimmed.startsWith("//")) continue;

		if (trimmed.startsWith("- ")) {
			const item = trimmed.slice(2).trim();
			if (!item) continue;
			if (currentList) {
				currentList.push(item);
			} else {
				combo.errors.push(`Line ${i + 1}: list item without an active section ("${trimmed}")`);
			}
			continue;
		}

		const m = raw.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
		if (!m) {
			if (currentKey === "notes" || currentKey === "result") {
				const target = currentKey;
				if (target === "result") {
					combo.result = (combo.result ? combo.result + " " : "") + trimmed;
				} else {
					combo.notes.push(trimmed);
				}
				continue;
			}
			combo.errors.push(`Line ${i + 1}: unrecognized line "${trimmed}"`);
			continue;
		}

		const rawKey = (m[1] ?? "").toLowerCase();
		const key = KEY_ALIASES[rawKey] ?? rawKey;
		const value = (m[2] ?? "").trim();

		if (SCALAR_KEYS.has(key)) {
			currentList = null;
			currentKey = key;
			if (key === "name") {
				combo.name = value;
			} else if (key === "result") {
				combo.result = value || undefined;
			}
			continue;
		}

		if (LIST_KEYS.has(key)) {
			currentKey = key;
			currentList = listFor(combo, key);
			if (value) currentList.push(value);
			continue;
		}

		combo.errors.push(`Line ${i + 1}: unknown key "${rawKey}"`);
	}

	if (!combo.name) combo.errors.unshift("Missing required \"name:\" field.");

	return combo;
}

function listFor(combo: ParsedCombo, key: string): string[] {
	switch (key) {
		case "prerequisites":
			return combo.prerequisites;
		case "steps":
			return combo.steps;
		case "loop":
			return combo.loop;
		case "break":
			return combo.breaks;
		case "interact":
			return combo.interact;
		case "notes":
			return combo.notes;
		default:
			return [];
	}
}
