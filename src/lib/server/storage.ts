import { Client } from 'minio';
import { Readable } from 'stream';
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
	return `/media/${key}`;
}

export async function getFileStreamResponse(key: string, rangeHeader?: string): Promise<Response> {
	const client = getClient();
	const bucketName = bucket();
	const stat = await client.statObject(bucketName, key);
	const contentType = (stat.metaData?.['content-type'] as string | undefined) ?? 'application/octet-stream';
	const totalSize = stat.size;

	if (rangeHeader) {
		const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
		if (match) {
			const start = parseInt(match[1]);
			const end = match[2] ? parseInt(match[2]) : totalSize - 1;
			const length = end - start + 1;
			const nodeStream = await client.getPartialObject(bucketName, key, start, length);
			return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
				status: 206,
				headers: {
					'Content-Type': contentType,
					'Content-Range': `bytes ${start}-${end}/${totalSize}`,
					'Content-Length': String(length),
					'Accept-Ranges': 'bytes',
					'Cache-Control': 'public, max-age=31536000, immutable'
				}
			});
		}
	}

	const nodeStream = await client.getObject(bucketName, key);
	return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
		headers: {
			'Content-Type': contentType,
			'Content-Length': String(totalSize),
			'Accept-Ranges': 'bytes',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
}
