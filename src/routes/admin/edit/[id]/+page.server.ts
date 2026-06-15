import { error, fail, redirect } from '@sveltejs/kit';
import { getPost, updatePost } from '$lib/server/db';
import { uploadFile } from '$lib/server/storage';
import { maybeCompress } from '$lib/server/compress';
import { SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPost(params.id);
	if (!post) error(404, 'post not found');
	return { post };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();
		const content = (formData.get('content') as string)?.trim();
		const tagsRaw = (formData.get('tags') as string)?.trim();
		const fileEntries = formData.getAll('files') as File[];

		if (!content) return fail(400, { error: 'content is required' });

		const existing = await getPost(params.id);
		if (!existing) error(404, 'post not found');

		const tags = tagsRaw
			? tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
			: [];

		const newFiles: typeof existing.files = [];
		for (const file of fileEntries) {
			if (!(file instanceof File) || file.size === 0) continue;
			const raw = Buffer.from(await file.arrayBuffer());
			const { buffer, mimeType, fileName, width, height } = await maybeCompress(
				raw,
				file.type || 'application/octet-stream',
				file.name
			);
			const key = `posts/${params.id}/${fileName}`;
			await uploadFile(key, buffer, mimeType);
			newFiles.push({ key, name: fileName, type: mimeType, width, height });
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

		await updatePost(params.id, {
			content,
			tags,
			files: [...existing.files, ...newFiles],
			music,
		});

		redirect(303, '/');
	},

	logout: async ({ cookies }) => {
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/admin/login');
	}
};
