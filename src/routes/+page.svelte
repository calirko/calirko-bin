<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import PostCard from '$lib/components/PostCard.svelte';

	let { data }: PageProps = $props();
</script>

<nav class="flex items-center border-b mb-8 pb-1">
	<div class="flex gap-0.5">
		<Button href="/?tab=posts" variant={data.tab === 'posts' ? 'secondary' : 'ghost'} size="sm">
			posts
		</Button>
		<Button href="/?tab=tags" variant={data.tab === 'tags' ? 'secondary' : 'ghost'} size="sm">
			tags
		</Button>
		<Button href="/?tab=about" variant={data.tab === 'about' ? 'secondary' : 'ghost'} size="sm">
			about
		</Button>
	</div>
	{#if data.isAdmin}
		<Button href="/admin" variant="ghost" size="sm" class="ml-auto text-muted-foreground">
			+ new post
		</Button>
	{/if}
</nav>

{#if data.tab === 'posts'}
	{#if data.filterTag}
		<div class="mb-6 flex items-center gap-2 text-sm">
			<span class="text-muted-foreground">filtered by</span>
			<Badge variant="outline">#{data.filterTag}</Badge>
			<Button href="/?tab=posts" variant="ghost" size="xs">clear</Button>
		</div>
	{/if}

	{#if data.posts.length === 0}
		<p class="text-muted-foreground text-sm">no posts yet.</p>
	{:else}
		<div class="flex flex-col gap-4">
			{#each data.posts as post}
				<PostCard {post} isAdmin={data.isAdmin} />
			{/each}
		</div>
	{/if}

{:else if data.tab === 'tags'}
	{#if data.tags.length === 0}
		<p class="text-muted-foreground text-sm">no tags yet.</p>
	{:else}
		<div class="flex flex-col gap-1">
			{#each data.tags as tag}
				<div class="flex items-center gap-2">
					<Badge href="/?tab=posts&tag={tag.name}" variant="outline">#{tag.name}</Badge>
					<span class="text-xs text-muted-foreground">({tag.count})</span>
				</div>
			{/each}
		</div>
	{/if}

{:else if data.tab === 'about'}
	<Card.Root>
		<Card.Content class="pt-6 text-sm leading-relaxed space-y-3">
			<p>this is /bin/calirko</p>
			<p class="text-muted-foreground">a place for notes, files, and things worth keeping.</p>
		</Card.Content>
	</Card.Root>
{/if}
