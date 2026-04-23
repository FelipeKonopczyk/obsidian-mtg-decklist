import { Platform } from "obsidian";
import type { ImageQuality } from "../settings";
import type { ScryfallCard } from "../scryfall/types";

const PREVIEW_MARGIN = 12;

export class CardPreview {
	private el: HTMLElement | null = null;
	private overlay: HTMLElement | null = null;
	private currentImageUrl: string | null = null;

	private ensureEl(): HTMLElement {
		if (this.el) return this.el;
		const el = document.body.createDiv({ cls: "mtg-card-preview is-hidden" });
		this.el = el;
		return el;
	}

	private ensureOverlay(): HTMLElement {
		if (this.overlay) return this.overlay;
		const overlay = document.body.createDiv({ cls: "mtg-card-preview-overlay is-hidden" });
		overlay.addEventListener("click", () => this.hide());
		this.overlay = overlay;
		return overlay;
	}

	private pickImageUrl(card: ScryfallCard, quality: ImageQuality): string | null {
		const fromUris = (uris?: { small?: string; normal?: string; large?: string }) => {
			if (!uris) return null;
			return uris[quality] ?? uris.normal ?? uris.large ?? uris.small ?? null;
		};
		const direct = fromUris(card.image_uris);
		if (direct) return direct;
		const face = card.card_faces?.[0]?.image_uris;
		return fromUris(face);
	}

	showHover(card: ScryfallCard, anchor: HTMLElement, quality: ImageQuality): void {
		const url = this.pickImageUrl(card, quality);
		if (!url) return;
		const el = this.ensureEl();

		if (this.currentImageUrl !== url) {
			el.empty();
			const img = el.createEl("img", { cls: "mtg-card-preview-img" });
			img.src = url;
			img.alt = card.name;
			this.currentImageUrl = url;
		}

		el.removeClass("is-hidden");
		this.position(el, anchor);
	}

	showTap(card: ScryfallCard, quality: ImageQuality): void {
		const overlay = this.ensureOverlay();
		const url = this.pickImageUrl(card, quality);
		if (!url) return;

		overlay.empty();
		const img = overlay.createEl("img", { cls: "mtg-card-preview-img" });
		img.src = url;
		img.alt = card.name;
		overlay.removeClass("is-hidden");
	}

	show(card: ScryfallCard, anchor: HTMLElement, quality: ImageQuality): void {
		if (Platform.isMobile) {
			this.showTap(card, quality);
		} else {
			this.showHover(card, anchor, quality);
		}
	}

	hide(): void {
		if (this.el) this.el.addClass("is-hidden");
		if (this.overlay) this.overlay.addClass("is-hidden");
	}

	destroy(): void {
		this.el?.remove();
		this.overlay?.remove();
		this.el = null;
		this.overlay = null;
		this.currentImageUrl = null;
	}

	private position(el: HTMLElement, anchor: HTMLElement): void {
		const rect = anchor.getBoundingClientRect();
		const elRect = el.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let left = rect.right + PREVIEW_MARGIN;
		if (left + elRect.width > vw - PREVIEW_MARGIN) {
			left = Math.max(PREVIEW_MARGIN, rect.left - elRect.width - PREVIEW_MARGIN);
		}

		let top = rect.top;
		if (top + elRect.height > vh - PREVIEW_MARGIN) {
			top = Math.max(PREVIEW_MARGIN, vh - elRect.height - PREVIEW_MARGIN);
		}

		el.setCssStyles({
			left: `${left}px`,
			top: `${top}px`,
		});
	}
}
