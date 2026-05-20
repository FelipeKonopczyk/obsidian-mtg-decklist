import { App, Editor, Modal, Notice } from "obsidian";

export class DeckExportModal extends Modal {
	constructor(
		app: App,
		private readonly title: string,
		private readonly content: string,
		private readonly editor: Editor | null,
	) {
		super(app);
	}

	onOpen(): void {
		this.modalEl.addClass("mtg-export-modal");
		this.titleEl.setText(this.title);

		const { contentEl } = this;
		contentEl.createEl("p", {
			cls: "mtg-export-modal-hint",
			text: "Select the text below and copy with your system shortcut, or insert it at the cursor.",
		});

		const preview = contentEl.createEl("textarea", {
			cls: "mtg-export-modal-preview",
		});
		preview.value = this.content;
		preview.readOnly = true;
		preview.rows = Math.min(24, Math.max(8, this.content.split("\n").length + 1));

		const footer = contentEl.createDiv({ cls: "mtg-export-modal-footer" });

		if (this.editor) {
			footer.createEl("button", { text: "Insert at cursor", attr: { type: "button" } })
				.addEventListener("click", () => {
					this.editor!.replaceSelection(this.content);
					new Notice("Export inserted at cursor.");
					this.close();
				});
		}

		footer.createEl("button", { text: "Close", attr: { type: "button" } }).addEventListener("click", () => {
			this.close();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
