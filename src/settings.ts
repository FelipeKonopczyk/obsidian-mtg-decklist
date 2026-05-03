import { App, PluginSettingTab, Setting } from "obsidian";
import type MtgDecklistPlugin from "./main";
import { MOXFIELD_DEFAULT_TTL_MINUTES } from "./utils/constants";

export type GroupingMode = "auto" | "manual" | "respect-manual";
export type CardSortOrder = "source" | "name" | "cmc-name";
export type ImageQuality = "small" | "normal" | "large";
export type LegalityFormat =
	| "off"
	| "standard"
	| "pioneer"
	| "modern"
	| "legacy"
	| "vintage"
	| "pauper"
	| "commander"
	| "brawl";

export interface MtgDecklistSettings {
	groupingMode: GroupingMode;
	cardSortOrder: CardSortOrder;
	imageQuality: ImageQuality;
	hoverDelayMs: number;
	legalityFormat: LegalityFormat;
	showStats: boolean;
	collapseSideboardByDefault: boolean;
	inlineManaSymbols: boolean;
	inlineCardLinks: boolean;
	moxfieldCacheTtlMinutes: number;
}

export const DEFAULT_SETTINGS: MtgDecklistSettings = {
	groupingMode: "respect-manual",
	cardSortOrder: "name",
	imageQuality: "normal",
	hoverDelayMs: 200,
	legalityFormat: "off",
	showStats: true,
	collapseSideboardByDefault: true,
	inlineManaSymbols: true,
	inlineCardLinks: true,
	moxfieldCacheTtlMinutes: MOXFIELD_DEFAULT_TTL_MINUTES,
};

export class MtgDecklistSettingTab extends PluginSettingTab {
	plugin: MtgDecklistPlugin;

	constructor(app: App, plugin: MtgDecklistPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Rendering").setHeading();

		new Setting(containerEl)
			.setName("Grouping mode")
			.setDesc(
				"How to group cards. Auto groups by card type. Manual uses your # section headers. Respect-manual uses your headers when present and otherwise falls back to auto-grouping.",
			)
			.addDropdown((dd) =>
				dd
					.addOption("respect-manual", "Respect manual, fall back to auto")
					.addOption("auto", "Auto (by card type)")
					.addOption("manual", "Manual (only your headers)")
					.setValue(this.plugin.settings.groupingMode)
					.onChange(async (value) => {
						this.plugin.settings.groupingMode = value as GroupingMode;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Sort within group")
			.setDesc("Order cards inside each section. Source keeps the order you typed.")
			.addDropdown((dd) =>
				dd
					.addOption("name", "Name (alphabetical)")
					.addOption("cmc-name", "Mana value, then name")
					.addOption("source", "Source (as typed)")
					.setValue(this.plugin.settings.cardSortOrder)
					.onChange(async (value) => {
						this.plugin.settings.cardSortOrder = value as CardSortOrder;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Image quality")
			.setDesc("Size of the card image shown in the hover/tap preview.")
			.addDropdown((dd) =>
				dd
					.addOption("small", "Small")
					.addOption("normal", "Normal")
					.addOption("large", "Large")
					.setValue(this.plugin.settings.imageQuality)
					.onChange(async (value) => {
						this.plugin.settings.imageQuality = value as ImageQuality;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Hover delay (ms)")
			.setDesc("Delay before showing the card preview on desktop hover.")
			.addText((text) =>
				text
					.setPlaceholder("200")
					.setValue(String(this.plugin.settings.hoverDelayMs))
					.onChange(async (value) => {
						const n = Number.parseInt(value, 10);
						if (Number.isFinite(n) && n >= 0 && n <= 5000) {
							this.plugin.settings.hoverDelayMs = n;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl).setName("Sections").setHeading();

		new Setting(containerEl)
			.setName("Collapse sideboard by default")
			.setDesc("Sideboard and maybeboard sections start collapsed.")
			.addToggle((tg) =>
				tg
					.setValue(this.plugin.settings.collapseSideboardByDefault)
					.onChange(async (value) => {
						this.plugin.settings.collapseSideboardByDefault = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName("Stats and metadata").setHeading();

		new Setting(containerEl)
			.setName("Show deck stats")
			.setDesc("Display mana curve, color identity, and type distribution.")
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.showStats).onChange(async (value) => {
					this.plugin.settings.showStats = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Legality warnings")
			.setDesc("Warn when cards are not legal in the selected format.")
			.addDropdown((dd) =>
				dd
					.addOption("off", "Off")
					.addOption("standard", "Standard")
					.addOption("pioneer", "Pioneer")
					.addOption("modern", "Modern")
					.addOption("legacy", "Legacy")
					.addOption("vintage", "Vintage")
					.addOption("pauper", "Pauper")
					.addOption("commander", "Commander")
					.addOption("brawl", "Brawl")
					.setValue(this.plugin.settings.legalityFormat)
					.onChange(async (value) => {
						this.plugin.settings.legalityFormat = value as LegalityFormat;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl).setName("Inline rendering").setHeading();

		new Setting(containerEl)
			.setName("Render inline mana symbols")
			.setDesc("Replace mana tokens like {R}, {2}{U}, or {W/U} in regular note text with Scryfall icons.")
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.inlineManaSymbols).onChange(async (value) => {
					this.plugin.settings.inlineManaSymbols = value;
					await this.plugin.saveSettings();
				}),
			);

		const cardSyntaxFrag = document.createDocumentFragment();
		cardSyntaxFrag.appendText("Render `mtg:Card Name` and [Display](mtg:Card Name) as hoverable card links. ");
		cardSyntaxFrag.createEl("strong", { text: "Tip: " });
		cardSyntaxFrag.appendText(
			"Desktop: hover to preview the image; click the link to open in browser. Mobile: tap for preview only, then tap open in browser in the overlay to open the site.",
		);

		new Setting(containerEl)
			.setName("Render inline card links")
			.setDesc(cardSyntaxFrag)
			.addToggle((tg) =>
				tg.setValue(this.plugin.settings.inlineCardLinks).onChange(async (value) => {
					this.plugin.settings.inlineCardLinks = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl).setName("Remote sources").setHeading();

		new Setting(containerEl)
			.setName("Moxfield cache lifetime (minutes)")
			.setDesc(
				"Moxfield decks are cached for this long before being refetched. Use the refresh button on a deck to force a refresh sooner.",
			)
			.addText((text) =>
				text
					.setPlaceholder(`${MOXFIELD_DEFAULT_TTL_MINUTES}`)
					.setValue(String(this.plugin.settings.moxfieldCacheTtlMinutes))
					.onChange(async (value) => {
						const n = Number.parseInt(value, 10);
						if (Number.isFinite(n) && n >= 1 && n <= 60 * 24 * 30) {
							this.plugin.settings.moxfieldCacheTtlMinutes = n;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl).setName("Cache").setHeading();

		const cacheSize = this.plugin.cardCache?.size() ?? 0;
		new Setting(containerEl)
			.setName("Card cache")
			.setDesc(`Cached cards: ${cacheSize}`)
			.addButton((btn) =>
				btn
					.setButtonText("Clear cache")
					.setWarning()
					.onClick(async () => {
						await this.plugin.clearCardCache();
						this.display();
					}),
			);

		const moxfieldSize = this.plugin.moxfield?.size() ?? 0;
		new Setting(containerEl)
			.setName("Moxfield deck cache")
			.setDesc(`Cached decks: ${moxfieldSize}`)
			.addButton((btn) =>
				btn
					.setButtonText("Clear cache")
					.setWarning()
					.onClick(async () => {
						await this.plugin.clearMoxfieldCache();
						this.display();
					}),
			);
	}
}
