import { error } from '@sveltejs/kit';
import { getFileStreamResponse, getFileBuffer } from '$lib/server/storage';
import type { RequestHandler } from './$types';
import sharp from 'sharp';
import { Readable } from 'stream';

export const GET: RequestHandler = async ({ params, request, url }) => {
	const key = params.path;
	if (!key) throw error(404);

	const widthParam = url.searchParams.get('w');
	const width = widthParam ? parseInt(widthParam, 10) : null;

	try {
		if (width && Number.isFinite(width) && width > 0 && width <= 3840) {
			const { buffer, contentType } = await getFileBuffer(key);
			if (contentType.startsWith('image/')) {
				const resized = await sharp(buffer)
					.resize({ width, withoutEnlargement: true })
					.webp({ quality: 82 })
					.toBuffer();
				return new Response(Readable.toWeb(Readable.from(resized)) as ReadableStream, {
					headers: {
						'Content-Type': 'image/webp',
						'Content-Length': String(resized.length),
						'Cache-Control': 'public, max-age=31536000, immutable'
					}
				});
			}
		}
		return await getFileStreamResponse(key, request.headers.get('range') ?? undefined);
	} catch {
		throw error(404);
	}
};
