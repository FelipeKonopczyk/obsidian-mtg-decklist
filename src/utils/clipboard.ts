import { Notice } from "obsidian";

/**
 * Write-only clipboard helper for user-initiated copy commands.
 * Does not read from the clipboard.
 */
export async function writeToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export function copyToClipboardWithNotice(text: string, successMessage: string): void {
	void writeToClipboard(text).then(
		(ok) => new Notice(ok ? successMessage : "Clipboard write failed"),
		() => new Notice("Clipboard write failed"),
	);
}
