import { Client } from 'minio';

const ENDPOINT = process.env.MINIO_ENDPOINT ?? 'localhost';
const PORT = parseInt(process.env.MINIO_PORT ?? '9000');
const USE_SSL = process.env.MINIO_USE_SSL === 'true';
const BUCKET = process.env.MINIO_BUCKET ?? 'calirko-bin';
const PUBLIC_URL =
	process.env.MINIO_PUBLIC_URL ??
	`${USE_SSL ? 'https' : 'http'}://${ENDPOINT}:${PORT}`;

const client = new Client({
	endPoint: ENDPOINT,
	port: PORT,
	useSSL: USE_SSL,
	accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
	secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin'
});

export async function uploadFile(key: string, data: Buffer, contentType: string): Promise<void> {
	await client.putObject(BUCKET, key, data, data.length, { 'Content-Type': contentType });
}

export function getFileUrl(key: string): string {
	return `${PUBLIC_URL}/${BUCKET}/${key}`;
}
