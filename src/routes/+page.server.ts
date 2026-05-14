import { marked } from 'marked';
import { getAllPosts, getAllTags } from '$lib/server/db';
import { getFileUrl } from '$lib/server/storage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const tab = url.searchParams.get('tab') ?? 'posts';
	const filterTag = url.searchParams.get('tag') ?? null;

	if (tab === 'tags') {
		const tags = await getAllTags();
		return { tab: 'tags' as const, tags };
	}

	if (tab === 'about') {
		return { tab: 'about' as const };
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

	return { tab: 'posts' as const, posts: rendered, filterTag };
};
