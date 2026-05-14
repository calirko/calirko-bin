import { fail } from '@sveltejs/kit';
import { getSettings, updateSettings } from '$lib/server/db';
import { uploadFile, getFileUrl } from '$lib/server/storage';
import { maybeCompress } from '$lib/server/compress';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const settings = await getSettings();
	return {
		slogan: settings.slogan,
		backgroundUrl: settings.backgroundKey ? getFileUrl(settings.backgroundKey) : null,
		backgroundKey: settings.backgroundKey,
		accentColor: settings.accentColor
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = await request.formData();
		const slogan = (formData.get('slogan') as string)?.trim();
		const bgFile = formData.get('background') as File | null;
		const removeBackground = formData.get('removeBackground') === 'true';
		const accentColor = (formData.get('accentColor') as string)?.trim() || null;

		if (!slogan) return fail(400, { error: 'slogan cannot be empty' });

		const patch: { slogan: string; backgroundKey?: string | null; accentColor?: string | null } = {
			slogan,
			accentColor: /^#[0-9a-f]{6}$/i.test(accentColor ?? '') ? accentColor : null
		};

		if (removeBackground) {
			patch.backgroundKey = null;
		} else if (bgFile instanceof File && bgFile.size > 0) {
			const raw = Buffer.from(await bgFile.arrayBuffer());
			const { buffer, mimeType, fileName } = await maybeCompress(
				raw,
				bgFile.type || 'application/octet-stream',
				bgFile.name
			);
			const key = `settings/background-${crypto.randomUUID()}/${fileName}`;
			await uploadFile(key, buffer, mimeType);
			patch.backgroundKey = key;
		}

		await updateSettings(patch);
		return { success: true };
	}
};
