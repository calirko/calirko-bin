import { marked } from 'marked';
import { fail, redirect } from '@sveltejs/kit';
import { getAllPosts, getAllTags, deletePost } from '$lib/server/db';
import { getFileUrl } from '$lib/server/storage';
import { verifySessionToken, SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const tab = url.searchParams.get('tab') ?? 'posts';
	const filterTag = url.searchParams.get('tag') ?? null;
	const token = cookies.get(SESSION_COOKIE);
	const isAdmin = !!token && verifySessionToken(token);

	if (tab === 'tags') {
		const tags = await getAllTags();
		return { tab: 'tags' as const, tags, isAdmin };
	}

	if (tab === 'about') {
		return { tab: 'about' as const, isAdmin };
	}

	const posts = await getAllPosts();
	const filtered = filterTag ? posts.filter((p) => p.tags.includes(filterTag)) : posts;

	const rendered = await Promise.all(
		filtered.map(async (post) => ({
			...post,
			html: await marked.parse(post.content),
			files: post.files.map((f) => ({ ...f, url: getFileUrl(f.key) }))
		}))
	);

	return { tab: 'posts' as const, posts: rendered, filterTag, isAdmin };
};

export const actions: Actions = {
	delete: async ({ request, cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token || !verifySessionToken(token)) return fail(403, { error: 'unauthorized' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'missing id' });

		await deletePost(id);
		redirect(303, '/');
	}
};
