<script lang="ts">
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import PostForm from '$lib/components/PostForm.svelte';
	import { page } from '$app/stores';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>admin — /bin/calirko</title>
</svelte:head>

<div class="mb-8 flex items-center justify-between">
	<div class="flex items-center gap-4">
		<Button href="/" variant="ghost" size="sm">← back</Button>
		<nav class="flex gap-0.5">
			<Button
				href="/admin"
				variant={$page.url.pathname === '/admin' ? 'secondary' : 'ghost'}
				size="sm"
			>
				new post
			</Button>
			<Button
				href="/admin/settings"
				variant={$page.url.pathname === '/admin/settings' ? 'secondary' : 'ghost'}
				size="sm"
			>
				settings
			</Button>
		</nav>
	</div>
	<form method="POST" action="?/logout">
		<Button type="submit" variant="ghost" size="sm">logout</Button>
	</form>
</div>

<PostForm action="?/create" error={form?.error} />
