import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

async function heicToPng(buffer: Buffer): Promise<Buffer> {
  const id = crypto.randomUUID();
  const inputPath = join(tmpdir(), `${id}-in.heic`);
  const outputPath = join(tmpdir(), `${id}-out.png`);
  await writeFile(inputPath, buffer);
  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
    return await readFile(outputPath);
  } finally {
    await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
  }
}

async function toWebp(
  buffer: Buffer,
): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  const png = await sharp(buffer).png().toBuffer();
  const out = await sharp(png).webp({ quality: 82 }).toBuffer();
  return { buffer: out, mimeType: "image/webp", ext: "webp" };
}

async function toMp4(
  buffer: Buffer,
): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  const id = crypto.randomUUID();
  const inputPath = join(tmpdir(), `${id}-in`);
  const outputPath = join(tmpdir(), `${id}-out.mp4`);

  await writeFile(inputPath, buffer);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-crf 28", "-preset fast", "-movflags +faststart"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    const out = await readFile(outputPath);
    return { buffer: out, mimeType: "video/mp4", ext: "mp4" };
  } finally {
    await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
  }
}

const HEIC_EXT = /\.(heic|heif)$/i;
const HEIC_MIME = /^image\/(heic|heif)$/i;

export async function maybeCompress(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
  const base = fileName.replace(/\.[^.]+$/, "");

  // iOS often uploads HEIC with no MIME type — detect by extension
  const effectiveMime =
    !mimeType.startsWith("image/") &&
    !mimeType.startsWith("video/") &&
    HEIC_EXT.test(fileName)
      ? "image/heic"
      : mimeType;

  if (effectiveMime.startsWith("image/")) {
    try {
      const imageBuffer = HEIC_MIME.test(effectiveMime)
        ? await heicToPng(buffer)
        : buffer;
      const result = await toWebp(imageBuffer);
      return {
        buffer: result.buffer,
        mimeType: result.mimeType,
        fileName: `${base}.${result.ext}`,
      };
    } catch {
      return { buffer, mimeType, fileName };
    }
  }

  if (effectiveMime.startsWith("video/")) {
    try {
      const result = await toMp4(buffer);
      return {
        buffer: result.buffer,
        mimeType: result.mimeType,
        fileName: `${base}.${result.ext}`,
      };
    } catch {
      return { buffer, mimeType, fileName };
    }
  }

  return { buffer, mimeType, fileName };
}
