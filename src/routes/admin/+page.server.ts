import { fail, redirect } from '@sveltejs/kit';
import { createPost } from '$lib/server/db';
import { uploadFile, getFileUrl } from '$lib/server/storage';
import { SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
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

		const uploadedFiles: { key: string; name: string; type: string }[] = [];

		for (const file of fileEntries) {
			if (!(file instanceof File) || file.size === 0) continue;
			const key = `posts/${crypto.randomUUID()}/${file.name}`;
			const buffer = Buffer.from(await file.arrayBuffer());
			await uploadFile(key, buffer, file.type || 'application/octet-stream');
			uploadedFiles.push({ key, name: file.name, type: file.type });
		}

		await createPost({ content, tags, files: uploadedFiles });

		redirect(303, '/');
	},

	logout: async ({ cookies }) => {
		cookies.delete(SESSION_COOKIE, { path: '/admin' });
		redirect(303, '/admin/login');
	}
};
