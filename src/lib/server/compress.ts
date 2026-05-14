import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

async function toWebp(buffer: Buffer): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
	const out = await sharp(buffer).webp({ quality: 82 }).toBuffer();
	return { buffer: out, mimeType: 'image/webp', ext: 'webp' };
}

async function toMp4(buffer: Buffer): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
	const id = crypto.randomUUID();
	const inputPath = join(tmpdir(), `${id}-in`);
	const outputPath = join(tmpdir(), `${id}-out.mp4`);

	await writeFile(inputPath, buffer);

	try {
		await new Promise<void>((resolve, reject) => {
			ffmpeg(inputPath)
				.videoCodec('libx264')
				.audioCodec('aac')
				.outputOptions(['-crf 28', '-preset fast', '-movflags +faststart'])
				.output(outputPath)
				.on('end', () => resolve())
				.on('error', (err) => reject(err))
				.run();
		});

		const out = await readFile(outputPath);
		return { buffer: out, mimeType: 'video/mp4', ext: 'mp4' };
	} finally {
		await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
	}
}

export async function maybeCompress(
	buffer: Buffer,
	mimeType: string,
	fileName: string
): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
	const base = fileName.replace(/\.[^.]+$/, '');

	if (mimeType.startsWith('image/')) {
		try {
			const result = await toWebp(buffer);
			return { buffer: result.buffer, mimeType: result.mimeType, fileName: `${base}.${result.ext}` };
		} catch {
			return { buffer, mimeType, fileName };
		}
	}

	if (mimeType.startsWith('video/')) {
		try {
			const result = await toMp4(buffer);
			return { buffer: result.buffer, mimeType: result.mimeType, fileName: `${base}.${result.ext}` };
		} catch {
			return { buffer, mimeType, fileName };
		}
	}

	return { buffer, mimeType, fileName };
}
