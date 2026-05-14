import { getSettings } from '$lib/server/db';
import { getFileUrl } from '$lib/server/storage';
import type { LayoutServerLoad } from './$types';

function hexToHue(hex: string): number | null {
	const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
	if (!m) return null;
	const r = parseInt(m[1], 16) / 255;
	const g = parseInt(m[2], 16) / 255;
	const b = parseInt(m[3], 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	if (d === 0) return null;
	let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	h *= 60;
	return h < 0 ? h + 360 : h;
}

export const load: LayoutServerLoad = async () => {
	const settings = await getSettings();
	const accentHue = settings.accentColor ? hexToHue(settings.accentColor) : null;
	return {
		slogan: settings.slogan,
		backgroundUrl: settings.backgroundKey ? getFileUrl(settings.backgroundKey) : null,
		accentHue
	};
};
