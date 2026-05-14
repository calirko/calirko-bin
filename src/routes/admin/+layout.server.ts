import { redirect } from '@sveltejs/kit';
import { verifySessionToken, SESSION_COOKIE } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	if (url.pathname === '/admin/login') return {};

	const token = cookies.get(SESSION_COOKIE);
	if (!token || !verifySessionToken(token)) {
		redirect(303, '/admin/login');
	}

	return {};
};
