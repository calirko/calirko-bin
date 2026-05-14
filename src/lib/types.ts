export interface PostFile {
	key: string;
	name: string;
	type: string;
}

export interface Post {
	id: string;
	content: string;
	tags: string[];
	createdAt: string;
	files: PostFile[];
}

export interface PostRendered extends Post {
	files: (PostFile & { url: string })[];
	html: string;
}
