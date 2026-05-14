<script lang="ts">
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { FileArrowDown, Image } from 'phosphor-svelte';

	let { data }: PageProps = $props();
</script>

<nav class="flex gap-1 border-b pb-px mb-8 -mt-2">
	<Button
		href="/?tab=posts"
		variant={data.tab === 'posts' ? 'secondary' : 'ghost'}
		size="sm"
	>
		posts
	</Button>
	<Button
		href="/?tab=tags"
		variant={data.tab === 'tags' ? 'secondary' : 'ghost'}
		size="sm"
	>
		tags
	</Button>
	<Button
		href="/?tab=about"
		variant={data.tab === 'about' ? 'secondary' : 'ghost'}
		size="sm"
	>
		about
	</Button>
</nav>

{#if data.tab === 'posts'}
	{#if data.filterTag}
		<div class="mb-6 flex items-center gap-2 text-sm">
			<span class="text-muted-foreground">filtered by</span>
			<span class="text-xs border px-2 py-0.5">#{data.filterTag}</span>
			<Button href="/?tab=posts" variant="ghost" size="xs">clear</Button>
		</div>
	{/if}

	{#if data.posts.length === 0}
		<p class="text-muted-foreground text-sm">no posts yet.</p>
	{:else}
		<div class="flex flex-col gap-4">
			{#each data.posts as post}
				<Card.Root>
					<Card.Content class="pt-6 flex flex-col gap-4">
						<div class="flex items-center gap-3 text-xs text-muted-foreground">
							<time>
								{new Date(post.createdAt).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</time>
							{#if post.tags.length > 0}
								<span class="text-border">|</span>
								<div class="flex gap-1 flex-wrap">
									{#each post.tags as tag}
										<Button href="/?tab=posts&tag={tag}" variant="ghost" size="xs">
											#{tag}
										</Button>
									{/each}
								</div>
							{/if}
						</div>

						<div class="text-sm leading-relaxed
							[&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-6 first:[&_h1]:mt-0
							[&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-5
							[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
							[&_p]:mb-3 last:[&_p]:mb-0
							[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
							[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
							[&_li]:mb-1
							[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre]:text-xs
							[&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs
							[&_pre_code]:bg-transparent [&_pre_code]:p-0
							[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:mb-3
							[&_a]:underline [&_a]:underline-offset-2
							[&_img]:max-w-full [&_img]:h-auto [&_img]:my-3
							[&_hr]:border-border [&_hr]:my-6"
						>
							{@html post.html}
						</div>

						{#if post.files.length > 0}
							<div class="flex flex-col gap-1 pt-1 border-t">
								{#each post.files as file}
									<a
										href={file.url}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
									>
										{#if file.type.startsWith('image/')}
											<Image size={14} />
										{:else}
											<FileArrowDown size={14} />
										{/if}
										{file.name}
									</a>
								{/each}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
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
					<Button href="/?tab=posts&tag={tag.name}" variant="ghost" size="sm">
						#{tag.name}
					</Button>
					<span class="text-xs text-muted-foreground">({tag.count})</span>
				</div>
			{/each}
		</div>
	{/if}

{:else if data.tab === 'about'}
	<Card.Root>
		<Card.Content class="pt-6 text-sm leading-relaxed space-y-3">
			<p>this is /bin/calirko.</p>
			<p class="text-muted-foreground">a place for notes, files, and things worth keeping.</p>
		</Card.Content>
	</Card.Root>
{/if}
