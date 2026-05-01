export type ComboSectionKey =
	| "battlefield"
	| "hand"
	| "prerequisites"
	| "steps"
	| "loop"
	| "break"
	| "interact"
	| "notes";

export interface ComboLine {
	name: string;
	infinite?: boolean;
	battlefield: string[];
	hand: string[];
	prerequisites: string[];
	steps: string[];
	loop: string[];
	breaks: string[];
	notes: string[];
}

export interface ParsedCombo {
	name: string;
	result?: string;
	infinite?: boolean;
	battlefield: string[];
	hand: string[];
	prerequisites: string[];
	steps: string[];
	loop: string[];
	breaks: string[];
	interact: string[];
	notes: string[];
	lines: ComboLine[];
	errors: string[];
}
