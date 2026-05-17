<script lang="ts">
    import type { Music } from "$lib/types";
    import {
        MusicNote,
        NoteIcon,
        SpotifyLogoIcon,
        TidalLogoIcon,
        YoutubeLogoIcon,
    } from "phosphor-svelte";

    let { music }: { music: Music } = $props();
</script>

<div class="flex items-center gap-3 border dynround overflow-hidden">
    <!-- cover art -->
    <div class="shrink-0 h-16 w-16 bg-muted overflow-hidden">
        {#if music.coverUrl}
            <img
                src={music.coverUrl}
                alt="cover"
                class="h-full w-full object-cover"
            />
        {:else}
            <div
                class="h-full w-full flex items-center justify-center text-muted-foreground"
            >
                <NoteIcon size={24} />
            </div>
        {/if}
    </div>

    <!-- info -->
    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
        <span class="text-xs text-muted-foreground truncate"
            >{music.artist}</span
        >
        {#if music.album}
            <span class="text-xs text-muted-foreground/70 truncate"
                >{music.album}</span
            >
        {/if}
        <span class="text-sm font-medium truncate">{music.title}</span>
    </div>

    <!-- streaming links -->
    <div class="flex items-center gap-2 shrink-0 pr-4">
        {#if music.tidalUrl}
            <a
                href={music.tidalUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Listen on Tidal"
            >
                <TidalLogoIcon />
            </a>
        {/if}
        {#if music.spotifyUrl}
            <a
                href={music.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Listen on Spotify"
            >
                <SpotifyLogoIcon />
            </a>
        {/if}
        {#if music.youtubeUrl}
            <a
                href={music.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Watch on YouTube"
            >
                <YoutubeLogoIcon />
            </a>
        {/if}
    </div>
</div>
