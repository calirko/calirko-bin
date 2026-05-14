import { fail, redirect } from '@sveltejs/kit';
import { verifyCredentials, verifySessionToken, createSessionToken, SESSION_COOKIE } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (token && verifySessionToken(token)) redirect(303, '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = (data.get('username') as string) ?? '';
		const password = (data.get('password') as string) ?? '';

		if (!verifyCredentials(username, password)) {
			return fail(401, { error: 'invalid credentials' });
		}

		cookies.set(SESSION_COOKIE, createSessionToken(), {
			path: '/admin',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		redirect(303, '/admin');
	}
};
