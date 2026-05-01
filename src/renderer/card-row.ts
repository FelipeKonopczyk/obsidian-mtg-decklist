import { Platform, setIcon } from "obsidian";
import { renderCardManaCost, renderManaCost } from "../ui/mana-symbols";
import type { CardPreview } from "../ui/card-preview";
import type { SymbologyClient } from "../scryfall/symbology";
import { debounce } from "../utils/debounce";
import type { ImageQuality, LegalityFormat } from "../settings";
import { legalityNote } from "./legality";
import type { ResolvedEntry } from "./grouping";
import { resolveCardTag } from "../utils/card-tags";

const BASIC_LAND_NAMES = new Set([
	"plains",
	"island",
	"swamp",
	"mountain",
	"forest",
	"wastes",
	"snow-covered plains",
	"snow-covered island",
	"snow-covered swamp",
	"snow-covered mountain",
	"snow-covered forest",
	"snow-covered wastes",
]);

function isBasicLandName(name: string): boolean {
	return BASIC_LAND_NAMES.has(name.trim().toLowerCase());
}

export interface CardRowOptions {
	preview: CardPreview;
	symbology: SymbologyClient;
	hoverDelayMs: number;
	imageQuality: ImageQuality;
	legalityFormat: LegalityFormat;
	colorIdentityViolation?: string[];
	isCommanderDeck?: boolean;
	registerDom: (target: Window | Document | HTMLElement, type: string, listener: EventListenerOrEventListenerObject) => void;
}

export function renderCardRow(parent: HTMLElement, resolved: ResolvedEntry, opts: CardRowOptions): void {
	const { entry, card } = resolved;

	const row = parent.createDiv({ cls: "mtg-card-row" });

	const cardName = card?.name ?? entry.name;
	const isBasic = isBasicLandName(cardName);
	const showQtyColumn = !opts.isCommanderDeck && !isBasic;
	const showInlineCount = !showQtyColumn && entry.quantity > 1;

	if (showQtyColumn) {
		row.createSpan({ cls: "mtg-card-qty", text: `${entry.quantity}` });
	}

	const nameEl = row.createSpan({ cls: "mtg-card-name" });
	if (card?.scryfall_uri) {
		const link = nameEl.createEl("a", {
			text: card.name,
			href: card.scryfall_uri,
			cls: "mtg-card-link",
		});
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noopener");
	} else if (card) {
		nameEl.setText(card.name);
	} else {
		nameEl.setText(entry.name);
		nameEl.addClass("mtg-card-pending");
	}

	if (showInlineCount) {
		nameEl.createSpan({ cls: "mtg-card-name-count", text: ` (${entry.quantity})` });
	}

	if (opts.colorIdentityViolation && opts.colorIdentityViolation.length > 0) {
		const warn = nameEl.createSpan({ cls: "mtg-card-warning mtg-card-warning-ci" });
		setIcon(warn, "triangle-alert");
		const label = `Outside commander color identity: ${opts.colorIdentityViolation.join("")}`;
		warn.setAttribute("title", label);
		warn.setAttribute("aria-label", label);
	}

	const tagsEl = row.createSpan({ cls: "mtg-card-tags" });
	if (entry.tags.length > 0) {
		for (const raw of entry.tags) {
			const tag = resolveCardTag(raw);
			const badge = tagsEl.createSpan({ cls: `mtg-card-tag mtg-card-tag-${tag.id}` });
			if (tag.custom) badge.addClass("mtg-card-tag-custom");
			setIcon(badge, tag.icon);
			badge.setAttribute("title", tag.label);
			badge.setAttribute("aria-label", tag.label);
		}
	} else {
		const placeholder = tagsEl.createSpan({ cls: "mtg-card-tag mtg-card-tag-placeholder" });
		placeholder.setAttribute("aria-hidden", "true");
		setIcon(placeholder, "tag");
	}

	if (card) {
		renderCardManaCost(row, card, opts.symbology);
	} else if (entry.hints?.mana_cost) {
		renderManaCost(row, entry.hints.mana_cost, opts.symbology);
	}

	const note = card ? legalityNote(card, opts.legalityFormat) : null;
	if (note) {
		const warn = row.createSpan({ cls: "mtg-card-warning mtg-card-warning-legality" });
		setIcon(warn, "ban");
		warn.setAttribute("title", note);
		warn.setAttribute("aria-label", note);
	}

	if (!card) return;

	if (Platform.isMobile) {
		const onTap = () => opts.preview.show(card, row, opts.imageQuality);
		row.addClass("mtg-card-row-tappable");
		opts.registerDom(row, "click", onTap as EventListener);
	} else {
		const debounced = debounce(() => opts.preview.show(card, row, opts.imageQuality), opts.hoverDelayMs);
		const onEnter = () => debounced.call();
		const onLeave = () => {
			debounced.cancel();
			opts.preview.hide();
		};
		opts.registerDom(row, "mouseenter", onEnter as EventListener);
		opts.registerDom(row, "mouseleave", onLeave as EventListener);
	}
}
