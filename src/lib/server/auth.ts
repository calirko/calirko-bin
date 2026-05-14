import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'admin_session';

const SECRET = process.env.ADMIN_SECRET ?? 'change-me-in-production';
const USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';

function safeEqual(a: string, b: string): boolean {
	try {
		return timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
	} catch {
		return false;
	}
}

export function verifyCredentials(username: string, password: string): boolean {
	return safeEqual(username, USERNAME) && safeEqual(password, PASSWORD);
}

export function createSessionToken(): string {
	return createHmac('sha256', SECRET).update(USERNAME).digest('hex');
}

export function verifySessionToken(token: string): boolean {
	const expected = createHmac('sha256', SECRET).update(USERNAME).digest('hex');
	try {
		return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'));
	} catch {
		return false;
	}
}
