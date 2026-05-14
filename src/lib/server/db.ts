import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import type { Post } from '../types.js';

type DB = { posts: Post[] };

const DB_PATH = resolve(process.env.DATABASE_PATH ?? './data/db.json');

let _db: Low<DB> | null = null;

async function getDb(): Promise<Low<DB>> {
	if (!_db) {
		mkdirSync(dirname(DB_PATH), { recursive: true });
		const adapter = new JSONFile<DB>(DB_PATH);
		_db = new Low<DB>(adapter, { posts: [] });
		await _db.read();
	}
	return _db;
}

export async function getAllPosts(): Promise<Post[]> {
	const db = await getDb();
	await db.read();
	return [...db.data.posts].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);
}

export async function createPost(data: {
	content: string;
	tags: string[];
	files: Post['files'];
}): Promise<Post> {
	const db = await getDb();
	const post: Post = {
		id: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
		...data
	};
	db.data.posts.push(post);
	await db.write();
	return post;
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
