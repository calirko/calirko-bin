import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { recordView, shouldTrack } from '$lib/server/analytics/capture';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	if (response.status === 404) {
		throw redirect(307, '/');
	}

	// fire-and-forget traffic capture: must never block or break the response
	if (event.request.method === 'GET' && shouldTrack(event, response)) {
		queueMicrotask(() => {
			try {
				recordView(event);
			} catch {
				/* analytics must never affect the site */
			}
		});
	}

	return response;
};
