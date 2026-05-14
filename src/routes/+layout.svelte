<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>/bin/calirko</title>
</svelte:head>

<div class="min-h-screen">
	<header class="border-b">
		<div class="max-w-2xl mx-auto px-4 py-4">
			<a href="/" class="font-bold text-sm">/bin/calirko</a>
		</div>
	</header>
	<main class="max-w-2xl mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>
