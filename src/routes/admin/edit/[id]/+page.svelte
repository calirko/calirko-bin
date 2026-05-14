<script lang="ts">
	import type { PageProps, ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import PostForm from '$lib/components/PostForm.svelte';

	let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<svelte:head>
	<title>edit post — /bin/calirko</title>
</svelte:head>

<div class="mb-8 flex items-center justify-between">
	<div class="flex items-center gap-4">
		<Button href="/" variant="ghost" size="sm">← back</Button>
		<span class="text-sm font-medium">edit post</span>
	</div>
	<form method="POST" action="?/logout">
		<Button type="submit" variant="ghost" size="sm">logout</Button>
	</form>
</div>

<PostForm post={data.post} action="?/update" error={form?.error} />
