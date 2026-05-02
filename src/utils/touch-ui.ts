import { Platform } from "obsidian";

/** Tap preview and non-navigating card links (mobile app or mobile-style UI). */
export function useTouchCardUi(): boolean {
	return Platform.isMobileApp || Platform.isMobile;
}

