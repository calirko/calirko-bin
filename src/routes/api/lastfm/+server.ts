import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

export const GET: RequestHandler = async ({ url }) => {
	const apiKey = env.LASTFM_API_KEY;
	if (!apiKey) return json({ error: 'LASTFM_API_KEY not configured' }, { status: 500 });

	const params = new URLSearchParams(url.searchParams);
	params.set('api_key', apiKey);
	params.set('format', 'json');

	const res = await fetch(`${LASTFM_BASE}?${params}`);
	const data = await res.json();
	return json(data);
};
