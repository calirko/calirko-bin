import { fail, redirect } from '@sveltejs/kit';
import { createPost, getAllTags } from '$lib/server/db';
import { uploadFile, getFileUrl } from '$lib/server/storage';
import { maybeCompress } from '$lib/server/compress';
import { SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { allTags: await getAllTags() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const content = (formData.get('content') as string)?.trim();
		const tagsRaw = (formData.get('tags') as string)?.trim();
		const fileEntries = formData.getAll('files') as File[];

		if (!content) {
			return fail(400, { error: 'content is required' });
		}

		const tags = tagsRaw
			? tagsRaw
					.split(',')
					.map((t) => t.trim().toLowerCase())
					.filter(Boolean)
			: [];

		const uploadedFiles: { key: string; name: string; type: string; width?: number; height?: number }[] = [];

		for (const file of fileEntries) {
			if (!(file instanceof File) || file.size === 0) continue;
			const raw = Buffer.from(await file.arrayBuffer());
			const { buffer, mimeType, fileName, width, height } = await maybeCompress(
				raw,
				file.type || 'application/octet-stream',
				file.name
			);
			const ext = fileName.split('.').pop() ?? 'bin';
			const key = `posts/${crypto.randomUUID()}/file.${ext}`;
			await uploadFile(key, buffer, mimeType);
			uploadedFiles.push({ key, name: fileName, type: mimeType, width, height });
		}

		const hasMusic = formData.get('has_music') === '1';
		const music = hasMusic
			? {
					artist: (formData.get('music_artist') as string)?.trim() ?? '',
					album: (formData.get('music_album') as string)?.trim() ?? '',
					title: (formData.get('music_title') as string)?.trim() ?? '',
					coverUrl: (formData.get('music_cover_url') as string)?.trim() || undefined,
					tidalUrl: (formData.get('music_tidal_url') as string)?.trim() || undefined,
					spotifyUrl: (formData.get('music_spotify_url') as string)?.trim() || undefined,
					youtubeUrl: (formData.get('music_youtube_url') as string)?.trim() || undefined,
				}
			: null;

		await createPost({ content, tags, files: uploadedFiles, music });

		redirect(303, '/');
	},

	logout: async ({ cookies }) => {
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/admin/login');
	}
};
