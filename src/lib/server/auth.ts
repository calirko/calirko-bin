import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '$env/dynamic/private';

export const SESSION_COOKIE = 'admin_session';

function safeEqual(a: string, b: string): boolean {
	try {
		return timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
	} catch {
		return false;
	}
}

export function verifyCredentials(username: string, password: string): boolean {
	return (
		safeEqual(username, env.ADMIN_USERNAME ?? 'admin') &&
		safeEqual(password, env.ADMIN_PASSWORD ?? 'admin')
	);
}

export function createSessionToken(): string {
	const secret = env.ADMIN_SECRET ?? 'change-me-in-production';
	const username = env.ADMIN_USERNAME ?? 'admin';
	return createHmac('sha256', secret).update(username).digest('hex');
}

export function verifySessionToken(token: string): boolean {
	const secret = env.ADMIN_SECRET ?? 'change-me-in-production';
	const username = env.ADMIN_USERNAME ?? 'admin';
	const expected = createHmac('sha256', secret).update(username).digest('hex');
	try {
		return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
	} catch {
		return false;
	}
}
