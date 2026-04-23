export function debounce<T extends (...args: unknown[]) => void>(
	fn: T,
	waitMs: number,
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
	let timer: number | null = null;
	return {
		call: (...args: Parameters<T>) => {
			if (timer !== null) window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				timer = null;
				fn(...args);
			}, waitMs);
		},
		cancel: () => {
			if (timer !== null) {
				window.clearTimeout(timer);
				timer = null;
			}
		},
	};
}
