export type ComboSectionKey =
	| "prerequisites"
	| "steps"
	| "loop"
	| "break"
	| "interact"
	| "notes";

export interface ParsedCombo {
	name: string;
	result?: string;
	prerequisites: string[];
	steps: string[];
	loop: string[];
	breaks: string[];
	interact: string[];
	notes: string[];
	errors: string[];
}
