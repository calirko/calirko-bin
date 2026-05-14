<script lang="ts">
	import type { Post } from '$lib/types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { enhance } from '$app/forms';
	import { PaperPlaneIcon, Image, FilmStrip, File as FileIcon, X } from 'phosphor-svelte';

	let {
		post,
		action,
		error
	}: {
		post?: Post;
		action: string;
		error?: string;
	} = $props();

	let selectedFiles = $state<File[]>([]);
	let submitting = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	const isEdit = $derived(!!post);

	function onPick(e: Event) {
		const list = (e.target as HTMLInputElement).files;
		if (!list) return;
		selectedFiles = [...selectedFiles, ...Array.from(list)];
		if (fileInput) fileInput.value = '';
	}

	function remove(idx: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== idx);
	}

	function iconFor(file: File) {
		if (file.type.startsWith('image/')) return Image;
		if (file.type.startsWith('video/')) return FilmStrip;
		return FileIcon;
	}

	function previewUrl(file: File) {
		return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
	}
</script>

<Card.Root>
	<form
		method="POST"
		{action}
		enctype="multipart/form-data"
		use:enhance={({ formData }) => {
			formData.delete('files');
			for (const f of selectedFiles) formData.append('files', f);
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<Card.Content class="flex flex-col gap-5">
			{#if error}
				<p class="text-destructive text-xs">{error}</p>
			{/if}

			<div class="flex flex-col gap-1.5">
				<Label for="content">content (markdown)</Label>
				<Textarea
					id="content"
					name="content"
					rows={16}
					required
					class="font-mono text-xs"
					placeholder="write something..."
					value={post?.content ?? ''}
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="tags">tags</Label>
				<Input
					id="tags"
					name="tags"
					type="text"
					placeholder="dev, notes, misc"
					value={post?.tags.join(', ') ?? ''}
				/>
			</div>

			{#if post && post.files.length > 0}
				<div class="flex flex-col gap-1.5">
					<Label>current attachments</Label>
					<ul class="text-xs text-muted-foreground space-y-0.5">
						{#each post.files as file}
							<li>{file.name}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="flex flex-col gap-1.5">
				<Label>{isEdit ? 'add attachments' : 'attachments'}</Label>

				{#if selectedFiles.length > 0}
					<ul class="flex flex-col gap-1">
						{#each selectedFiles as file, i}
							{@const Icon = iconFor(file)}
							{@const preview = previewUrl(file)}
							<li class="flex items-center gap-2 border border-border px-2 py-1.5 text-xs">
								{#if preview}
									<img src={preview} alt="" class="h-6 w-6 shrink-0 object-cover" />
								{:else}
									<Icon size={14} class="shrink-0 text-muted-foreground" />
								{/if}
								<span class="flex-1 truncate">{file.name}</span>
								<span class="shrink-0 text-muted-foreground"
									>{(file.size / 1024).toFixed(1)} kb</span
								>
								<button
									type="button"
									onclick={() => remove(i)}
									class="shrink-0 text-muted-foreground hover:text-foreground"
									aria-label="remove {file.name}"
								>
									<X size={12} />
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				<input
					bind:this={fileInput}
					type="file"
					name="files"
					multiple
					accept="image/*,video/*,audio/*,.pdf,.txt,.md,.csv,.json,.zip"
					onchange={onPick}
					class="text-sm text-muted-foreground file:mr-3 file:border file:border-border file:bg-muted file:px-2 file:py-0.5 file:text-xs file:cursor-pointer"
				/>
			</div>
		</Card.Content>

		<Card.Footer class="justify-end">
			<Button type="submit" disabled={submitting}>
				{#if !submitting}<PaperPlaneIcon size={16} />{/if}
				{submitting ? (isEdit ? 'updating...' : 'posting...') : isEdit ? 'update' : 'post'}
			</Button>
		</Card.Footer>
	</form>
</Card.Root>
