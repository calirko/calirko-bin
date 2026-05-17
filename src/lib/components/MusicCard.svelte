<script lang="ts">
    import type { Music } from "$lib/types";
    import { MusicNote, NoteIcon } from "phosphor-svelte";

    let { music }: { music: Music } = $props();
</script>

<div class="flex items-center gap-3 border">
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
    <div class="flex items-center gap-2 shrink-0">
        {#if music.tidalUrl}
            <a
                href={music.tidalUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Listen on Tidal"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                >
                    <path
                        d="M12.012 3.992L8.508 7.496l3.504 3.504 3.504-3.504zM4.996 3.992L1.492 7.496 4.996 11l3.512-3.504zM19.004 3.992L15.5 7.496 19.004 11l3.504-3.504zM8.508 11l-3.512 3.504L8.508 18l3.504-3.496zM15.5 11l-3.488 3.504L15.5 18l3.504-3.496z"
                    />
                </svg>
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
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                >
                    <path
                        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                    />
                </svg>
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
                <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                >
                    <path
                        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    />
                </svg>
            </a>
        {/if}
    </div>
</div>
