import { getAllPosts } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const posts = await getAllPosts();

	const latestPost = posts[0];
	const allPages = [
		{
			loc: origin,
			lastmod: latestPost ? new Date(latestPost.createdAt).toISOString().split('T')[0] : undefined,
			priority: '1.0',
			changefreq: 'daily'
		},
		{ loc: `${origin}/?tab=about`, priority: '0.5', changefreq: 'monthly' },
		{ loc: `${origin}/?tab=tags`, priority: '0.4', changefreq: 'weekly' }
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
	.map(
		(page) => `  <url>
    <loc>${page.loc}</loc>${'lastmod' in page && page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
