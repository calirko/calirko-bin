export interface PostFile {
	key: string;
	name: string;
	type: string;
	width?: number;
	height?: number;
}

export interface Music {
	artist: string;
	album: string;
	title: string;
	coverUrl?: string;
	tidalUrl?: string;
	spotifyUrl?: string;
	youtubeUrl?: string;
}

export interface Post {
	id: string;
	content: string;
	tags: string[];
	createdAt: string;
	files: PostFile[];
	music?: Music | null;
}

export interface PostRendered extends Post {
	files: (PostFile & { url: string })[];
	html: string;
}

export interface Settings {
	slogan: string;
	backgroundKey: string | null;
	accentColor: string | null;
}
