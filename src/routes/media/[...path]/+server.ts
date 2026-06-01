import { error } from '@sveltejs/kit';
import { getFileStreamResponse } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	const key = params.path;
	if (!key) throw error(404);

	try {
		return await getFileStreamResponse(key, request.headers.get('range') ?? undefined);
	} catch {
		throw error(404);
	}
};
