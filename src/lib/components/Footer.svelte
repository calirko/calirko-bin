<script lang="ts">
	import { GithubLogo, XLogo, TumblrLogo } from 'phosphor-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<footer class="border-t px-6 py-5 mt-auto">
	<div class="flex items-center justify-between">
		<p class="text-xs text-muted-foreground">end of log.</p>
		<div class="flex items-center gap-0.5">
			<Button
				href="https://github.com/calirko"
				variant="ghost"
				size="icon-xs"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="GitHub"
			>
				<GithubLogo size={14} />
			</Button>
			<Button
				href="https://x.com/calirko"
				variant="ghost"
				size="icon-xs"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="X"
			>
				<XLogo size={14} />
			</Button>
			<Button
				href="https://calirko.tumblr.com"
				variant="ghost"
				size="icon-xs"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Tumblr"
			>
				<TumblrLogo size={14} />
			</Button>
		</div>
	</div>
</footer>
