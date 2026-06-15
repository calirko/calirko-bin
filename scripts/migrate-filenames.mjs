#!/usr/bin/env node
/**
 * One-time migration: rename all MinIO objects that expose original filenames
 * to anonymous names, and update the JSON DB to match.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-filenames.mjs
 *
 * Dry run (no changes written):
 *   DRY_RUN=1 node --env-file=.env scripts/migrate-filenames.mjs
 */

import { Client } from 'minio';
import { readFile, writeFile, copyFile } from 'fs/promises';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

const DRY_RUN = process.env.DRY_RUN === '1';

const DB_PATH = resolve(process.env.DATABASE_PATH ?? './data/db.json');

const BUCKET = process.env.MINIO_BUCKET ?? 'calirko-bin';

const client = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: parseInt(process.env.MINIO_PORT ?? '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
});

/** Returns true if the filename segment looks like an original user filename */
function isRevealingFilename(key) {
  const segment = key.split('/').at(-1) ?? '';
  // generic patterns we already use: file.ext, bg.ext, or a UUID.ext
  if (/^(file|bg)\.[a-z0-9]+$/i.test(segment)) return false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;
  if (uuidPattern.test(segment)) return false;
  return true;
}

async function renameObject(oldKey, newKey) {
  console.log(`  copy  ${oldKey}`);
  console.log(`     -> ${newKey}`);
  if (DRY_RUN) return;
  await client.copyObject(BUCKET, newKey, `/${BUCKET}/${oldKey}`);
  await client.removeObject(BUCKET, oldKey);
}

async function run() {
  if (DRY_RUN) console.log('[DRY RUN] no changes will be written\n');

  // Back up the DB first
  const backupPath = `${DB_PATH}.bak`;
  await copyFile(DB_PATH, backupPath);
  console.log(`backed up DB to ${backupPath}\n`);

  const raw = await readFile(DB_PATH, 'utf8');
  const db = JSON.parse(raw);

  let changed = 0;

  // --- posts ---
  for (const post of db.posts ?? []) {
    for (const file of post.files ?? []) {
      if (!file.key || !isRevealingFilename(file.key)) continue;
      const ext = file.key.split('.').at(-1) ?? 'bin';
      const dir = file.key.split('/').slice(0, -1).join('/');
      const newKey = `${dir}/file.${ext}`;
      await renameObject(file.key, newKey);
      file.key = newKey;
      changed++;
    }
  }

  // --- settings background ---
  const bgKey = db.settings?.backgroundKey;
  if (bgKey && isRevealingFilename(bgKey)) {
    const ext = bgKey.split('.').at(-1) ?? 'webp';
    const dir = bgKey.split('/').slice(0, -1).join('/');
    const newKey = `${dir}/bg.${ext}`;
    await renameObject(bgKey, newKey);
    db.settings.backgroundKey = newKey;
    changed++;
  }

  console.log(`\n${changed} object(s) renamed`);

  if (!DRY_RUN && changed > 0) {
    await writeFile(DB_PATH, JSON.stringify(db, null, 2));
    console.log('DB written');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
