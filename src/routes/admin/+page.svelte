<script lang="ts">
	import type { ActionData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();

	let files: FileList | undefined = $state();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>admin — /bin/calirko</title>
</svelte:head>

<div class="mb-8 flex items-center justify-between">
	<div class="flex items-center gap-4">
		<Button href="/" variant="ghost" size="sm">← back</Button>
		<span class="text-sm font-medium">new post</span>
	</div>

	<form method="POST" action="?/logout">
		<Button type="submit" variant="ghost" size="sm">logout</Button>
	</form>
</div>

<Card.Root>
	<form
		method="POST"
		action="?/create"
		enctype="multipart/form-data"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<Card.Content class="flex flex-col gap-5 pt-6">
			{#if form?.error}
				<p class="text-destructive text-xs">{form.error}</p>
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
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="tags">tags</Label>
				<Input
					id="tags"
					name="tags"
					type="text"
					placeholder="dev, notes, misc"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="files">attachments</Label>
				<Input
					id="files"
					name="files"
					type="file"
					multiple
					bind:files
				/>
				{#if files && files.length > 0}
					<ul class="text-muted-foreground space-y-0.5 text-xs">
						{#each Array.from(files) as file}
							<li>
								{file.name}
								<span class="opacity-60">({(file.size / 1024).toFixed(1)} kb)</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</Card.Content>

		<Card.Footer class="justify-end">
			<Button type="submit" disabled={submitting}>
				{submitting ? 'posting...' : 'post'}
			</Button>
		</Card.Footer>
	</form>
</Card.Root>
