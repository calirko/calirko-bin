<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import AdminNav from '$lib/components/AdminNav.svelte';

	let { data, form }: PageProps = $props();

	let removeBackground = $state(false);
	let bgPreview = $state<string | null>(data.backgroundUrl);
	let fileInput = $state<HTMLInputElement | null>(null);
	let accentColor = $state(data.accentColor ?? '');

	function hexToHue(hex: string): number | null {
		const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
		if (!m) return null;
		const r = parseInt(m[1], 16) / 255;
		const g = parseInt(m[2], 16) / 255;
		const b = parseInt(m[3], 16) / 255;
		const max = Math.max(r, g, b), min = Math.min(r, g, b);
		const d = max - min;
		if (d === 0) return null;
		let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
		h *= 60;
		return h < 0 ? h + 360 : h;
	}

	$effect(() => {
		const hue = accentColor ? hexToHue(accentColor) : null;
		if (hue !== null) {
			document.documentElement.style.setProperty('--tint-h', String(Math.round(hue)));
			document.documentElement.style.setProperty('--tint-c', '0.015');
		} else {
			document.documentElement.style.removeProperty('--tint-h');
			document.documentElement.style.removeProperty('--tint-c');
		}
		return () => {
			document.documentElement.style.removeProperty('--tint-h');
			document.documentElement.style.removeProperty('--tint-c');
		};
	});

	function onFileChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			bgPreview = URL.createObjectURL(file);
			removeBackground = false;
		}
	}

	function handleRemove() {
		removeBackground = true;
		bgPreview = null;
		if (fileInput) fileInput.value = '';
	}

	function clearAccent() {
		accentColor = '';
	}
</script>

<svelte:head>
	<title>settings — /bin/calirko</title>
</svelte:head>

<AdminNav />

<form method="POST" action="?/save" enctype="multipart/form-data" class="flex flex-col gap-6 px-6">
	{#if form?.error}
		<p class="text-sm text-destructive">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="text-sm text-muted-foreground">saved.</p>
	{/if}

	<div class="flex flex-col gap-1.5">
		<label for="slogan" class="text-sm font-medium">slogan</label>
		<input
			id="slogan"
			name="slogan"
			type="text"
			value={data.slogan}
			class="border border-input bg-background px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-ring"
		/>
	</div>

	<div class="flex flex-col gap-1.5">
		<label class="text-sm font-medium" for="accent-color">accent tint</label>
		<div class="flex items-center gap-3">
			<input
				id="accent-color"
				name="accentColor"
				type="color"
				bind:value={accentColor}
				class="h-8 w-12 cursor-pointer border border-input bg-background p-0.5"
			/>
			{#if accentColor}
				<span class="text-xs text-muted-foreground">{accentColor}</span>
				<button
					type="button"
					onclick={clearAccent}
					class="text-xs text-muted-foreground hover:text-foreground"
				>
					clear
				</button>
			{:else}
				<span class="text-xs text-muted-foreground">no tint — pure grayscale</span>
			{/if}
		</div>
		<p class="text-xs text-muted-foreground">
			subtly shifts all grayscale theme colors toward this hue. previews live.
		</p>
	</div>

	<div class="flex flex-col gap-1.5">
		<label for="bg-file" class="text-sm font-medium">background image</label>
		{#if bgPreview}
			<div class="relative border border-border overflow-hidden" style="height: 140px;">
				<img src={bgPreview} alt="background preview" class="w-full h-full object-cover" />
				<button
					type="button"
					onclick={handleRemove}
					class="absolute top-2 right-2 bg-background border border-border px-2 py-0.5 text-xs hover:bg-muted"
				>
					remove
				</button>
			</div>
		{:else}
			<p class="text-xs text-muted-foreground">no background set — dotted pattern is used.</p>
		{/if}
		<input
			id="bg-file"
			bind:this={fileInput}
			type="file"
			name="background"
			accept="image/*"
			onchange={onFileChange}
			class="text-sm text-muted-foreground file:mr-3 file:border file:border-border file:bg-muted file:px-2 file:py-0.5 file:text-xs file:cursor-pointer"
		/>
		<input type="hidden" name="removeBackground" value={removeBackground} />
	</div>

	<div>
		<Button type="submit" size="sm">save</Button>
	</div>
</form>
