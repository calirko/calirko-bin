import { Client } from 'minio';
import { env } from '$env/dynamic/private';

let _client: Client | null = null;
let _initialized = false;

function getClient(): Client {
	if (!_client) {
		_client = new Client({
			endPoint: env.MINIO_ENDPOINT ?? 'localhost',
			port: parseInt(env.MINIO_PORT ?? '9000'),
			useSSL: env.MINIO_USE_SSL === 'true',
			accessKey: env.MINIO_ACCESS_KEY ?? 'minioadmin',
			secretKey: env.MINIO_SECRET_KEY ?? 'minioadmin'
		});
	}
	return _client;
}

function bucket(): string {
	return env.MINIO_BUCKET ?? 'calirko-bin';
}

function publicUrl(): string {
	const ssl = env.MINIO_USE_SSL === 'true';
	const host = env.MINIO_ENDPOINT ?? 'localhost';
	const port = env.MINIO_PORT ?? '9000';
	return env.MINIO_PUBLIC_URL ?? `${ssl ? 'https' : 'http'}://${host}:${port}`;
}

async function init(client: Client, bucketName: string): Promise<void> {
	if (_initialized) return;

	const exists = await client.bucketExists(bucketName);
	if (!exists) await client.makeBucket(bucketName);

	await client.setBucketPolicy(
		bucketName,
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Principal: { AWS: ['*'] },
					Action: ['s3:GetObject'],
					Resource: [`arn:aws:s3:::${bucketName}/*`]
				}
			]
		})
	);

	_initialized = true;
}

export async function uploadFile(key: string, data: Buffer, contentType: string): Promise<void> {
	const client = getClient();
	await init(client, bucket());
	await client.putObject(bucket(), key, data, data.length, { 'Content-Type': contentType });
}

export function getFileUrl(key: string): string {
	return `${publicUrl()}/${bucket()}/${key}`;
}
