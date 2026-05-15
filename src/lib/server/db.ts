import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import type { Post, Settings } from "../types.js";

const DEFAULT_SETTINGS: Settings = {
  slogan: "calirko's personal log",
  backgroundKey: null,
  accentColor: null,
};

type DB = { posts: Post[]; settings: Settings };

const DB_PATH = resolve(process.env.DATABASE_PATH ?? "./data/db.json");

let _db: Low<DB> | null = null;

async function getDb(): Promise<Low<DB>> {
  if (!_db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    const adapter = new JSONFile<DB>(DB_PATH);
    _db = new Low<DB>(adapter, {
      posts: [],
      settings: { ...DEFAULT_SETTINGS },
    });
    await _db.read();
    if (!_db.data.settings) {
      _db.data.settings = { ...DEFAULT_SETTINGS };
    }
  }
  return _db;
}

export async function getAllPosts(): Promise<Post[]> {
  const db = await getDb();
  await db.read();
  return [...db.data.posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createPost(data: {
  content: string;
  tags: string[];
  files: Post["files"];
}): Promise<Post> {
  const db = await getDb();
  const post: Post = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  db.data.posts.push(post);
  await db.write();
  return post;
}

export async function getPost(id: string): Promise<Post | null> {
  const db = await getDb();
  await db.read();
  return db.data.posts.find((p) => p.id === id) ?? null;
}

export async function updatePost(
  id: string,
  data: { content: string; tags: string[]; files: Post["files"] },
): Promise<Post | null> {
  const db = await getDb();
  const idx = db.data.posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.data.posts[idx] = { ...db.data.posts[idx], ...data };
  await db.write();
  return db.data.posts[idx];
}

export async function deletePost(id: string): Promise<void> {
  const db = await getDb();
  db.data.posts = db.data.posts.filter((p) => p.id !== id);
  await db.write();
}

export async function getAllTags(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPosts();
  const counts: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  await db.read();
  return { ...DEFAULT_SETTINGS, ...db.data.settings };
}

export async function updateSettings(
  data: Partial<Settings>,
): Promise<Settings> {
  const db = await getDb();
  db.data.settings = { ...db.data.settings, ...data };
  await db.write();
  return db.data.settings;
}

export async function getPostCount(): Promise<number> {
  const db = await getDb();
  await db.read();
  return db.data.posts.length;
}
