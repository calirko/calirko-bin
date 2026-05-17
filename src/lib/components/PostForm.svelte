<script lang="ts">
    import type { Post } from "$lib/types";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { enhance } from "$app/forms";
    import { untrack } from "svelte";
    import {
        PaperPlaneIcon,
        Image,
        FilmStrip,
        File as FileIcon,
        X,
        MusicNote,
    } from "phosphor-svelte";
    import Combobox, { type ComboboxItem } from "./Combobox.svelte";

    let {
        post,
        action,
        error,
    }: {
        post?: Post;
        action: string;
        error?: string;
    } = $props();

    let selectedFiles = $state<File[]>([]);
    let submitting = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);
    let showMusic = $state(untrack(() => !!post?.music));

    // music field state — bound to inputs so search can auto-fill them
    let musicArtist = $state(untrack(() => post?.music?.artist ?? ""));
    let musicAlbum = $state(untrack(() => post?.music?.album ?? ""));
    let musicTitle = $state(untrack(() => post?.music?.title ?? ""));
    let musicCoverUrl = $state(untrack(() => post?.music?.coverUrl ?? ""));

    // last.fm search
    type SearchMode = "album" | "track";
    let searchMode = $state<SearchMode>("album");
    let searchResults = $state<ComboboxItem[]>([]);
    let searchLoading = $state(false);
    let comboboxOpen = $state(false);
    let rawMap = new Map<string, Record<string, unknown>>();
    let debounceTimer: ReturnType<typeof setTimeout>;

    function getImage(images: { size: string; "#text": string }[], ...sizes: string[]) {
        for (const size of sizes) {
            const found = images?.find((i) => i.size === size);
            if (found?.["#text"]) return found["#text"];
        }
        return "";
    }

    async function handleSearch(query: string) {
        clearTimeout(debounceTimer);
        if (query.length < 2) {
            searchResults = [];
            return;
        }
        debounceTimer = setTimeout(async () => {
            searchLoading = true;
            rawMap.clear();
            try {
                const method = searchMode === "album" ? "album.search" : "track.search";
                const qParam =
                    searchMode === "album"
                        ? `album=${encodeURIComponent(query)}`
                        : `track=${encodeURIComponent(query)}`;
                const res = await fetch(
                    `/api/lastfm?method=${method}&${qParam}&limit=8`,
                );
                const data = await res.json();

                if (searchMode === "album") {
                    const albums: Record<string, unknown>[] =
                        data.results?.albummatches?.album ?? [];
                    searchResults = albums.map((a) => {
                        const key = `${a.artist}::${a.name}`;
                        rawMap.set(key, a);
                        return {
                            value: key,
                            label: String(a.name),
                            sublabel: String(a.artist),
                            image: getImage(
                                a.image as { size: string; "#text": string }[],
                                "medium",
                                "small",
                            ),
                        };
                    });
                } else {
                    const tracks: Record<string, unknown>[] =
                        data.results?.trackmatches?.track ?? [];
                    searchResults = tracks.map((t) => {
                        const key = `${t.artist}::${t.name}`;
                        rawMap.set(key, t);
                        return {
                            value: key,
                            label: String(t.name),
                            sublabel: String(t.artist),
                            image: getImage(
                                t.image as { size: string; "#text": string }[],
                                "medium",
                                "small",
                            ),
                        };
                    });
                }
            } catch {
                searchResults = [];
            } finally {
                searchLoading = false;
            }
        }, 300);
    }

    async function handleSelect(item: ComboboxItem) {
        const raw = rawMap.get(item.value);
        if (!raw) return;

        if (searchMode === "album") {
            musicArtist = item.sublabel ?? "";
            musicAlbum = item.label;
            musicTitle = item.label;
            musicCoverUrl = getImage(
                raw.image as { size: string; "#text": string }[],
                "extralarge",
                "large",
                "medium",
            );
        } else {
            musicTitle = item.label;
            musicArtist = item.sublabel ?? "";
            musicCoverUrl = getImage(
                raw.image as { size: string; "#text": string }[],
                "large",
                "medium",
            );
            // Fetch album info for the track
            try {
                const res = await fetch(
                    `/api/lastfm?method=track.getInfo&artist=${encodeURIComponent(item.sublabel ?? "")}&track=${encodeURIComponent(item.label)}&autocorrect=1`,
                );
                const data = await res.json();
                const album = data.track?.album;
                if (album) {
                    musicAlbum = String(album.title ?? "");
                    const albumCover = getImage(
                        album.image as { size: string; "#text": string }[],
                        "extralarge",
                        "large",
                    );
                    if (albumCover) musicCoverUrl = albumCover;
                }
            } catch {
                // user can fill manually
            }
        }
    }

    const isEdit = $derived(!!post);

    function onPick(e: Event) {
        const list = (e.target as HTMLInputElement).files;
        if (!list) return;
        selectedFiles = [...selectedFiles, ...Array.from(list)];
        if (fileInput) fileInput.value = "";
    }

    function remove(idx: number) {
        selectedFiles = selectedFiles.filter((_, i) => i !== idx);
    }

    function iconFor(file: File) {
        if (file.type.startsWith("image/")) return Image;
        if (file.type.startsWith("video/")) return FilmStrip;
        return FileIcon;
    }

    function previewUrl(file: File) {
        return file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null;
    }
</script>

<form
    method="POST"
    {action}
    enctype="multipart/form-data"
    class="flex gap-y-4 flex-col"
    use:enhance={({ formData }) => {
        formData.delete("files");
        for (const f of selectedFiles) formData.append("files", f);
        submitting = true;
        return async ({ update }) => {
            await update();
            submitting = false;
        };
    }}
>
    <div class="flex flex-col gap-4">
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
                value={post?.content ?? ""}
            />
        </div>

        <div class="flex flex-col gap-1.5">
            <Label for="tags">tags</Label>
            <Input
                id="tags"
                name="tags"
                type="text"
                placeholder="dev, notes, misc"
                value={post?.tags.join(", ") ?? ""}
            />
        </div>

        <!-- music section -->
        <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
                <Label>music</Label>
                <button
                    type="button"
                    class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onclick={() => (showMusic = !showMusic)}
                >
                    <MusicNote size={12} />
                    {showMusic ? "remove" : "attach"}
                </button>
            </div>

            <input type="hidden" name="has_music" value={showMusic ? "1" : "0"} />

            {#if showMusic}
                <div class="flex flex-col gap-3 border border-border p-3">
                    <!-- search row -->
                    <div class="flex items-center gap-2">
                        <div class="flex rounded-sm overflow-hidden border border-border text-xs">
                            <button
                                type="button"
                                class="px-2 py-1 transition-colors {searchMode === 'album'
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'}"
                                onclick={() => {
                                    searchMode = "album";
                                    searchResults = [];
                                }}
                            >
                                album
                            </button>
                            <button
                                type="button"
                                class="px-2 py-1 transition-colors border-l border-border {searchMode ===
                                'track'
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'}"
                                onclick={() => {
                                    searchMode = "track";
                                    searchResults = [];
                                }}
                            >
                                track
                            </button>
                        </div>

                        <Combobox
                            items={searchResults}
                            loading={searchLoading}
                            bind:open={comboboxOpen}
                            placeholder="search last.fm..."
                            triggerText="search last.fm →"
                            onSearch={handleSearch}
                            onSelect={handleSelect}
                        />
                    </div>

                    <!-- fields -->
                    <div class="grid grid-cols-2 gap-2">
                        <div class="flex flex-col gap-1">
                            <Label for="music_artist" class="text-xs">artist</Label>
                            <Input
                                id="music_artist"
                                name="music_artist"
                                type="text"
                                placeholder="Artist Name"
                                class="h-7 text-xs"
                                bind:value={musicArtist}
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <Label for="music_album" class="text-xs">album / lp</Label>
                            <Input
                                id="music_album"
                                name="music_album"
                                type="text"
                                placeholder="Album Name"
                                class="h-7 text-xs"
                                bind:value={musicAlbum}
                            />
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <Label for="music_title" class="text-xs">track / title</Label>
                        <Input
                            id="music_title"
                            name="music_title"
                            type="text"
                            placeholder="Track or Album Title"
                            class="h-7 text-xs"
                            bind:value={musicTitle}
                        />
                    </div>
                    <div class="flex flex-col gap-1">
                        <Label for="music_cover_url" class="text-xs">cover art url</Label>
                        <Input
                            id="music_cover_url"
                            name="music_cover_url"
                            type="url"
                            placeholder="https://..."
                            class="h-7 text-xs"
                            bind:value={musicCoverUrl}
                        />
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div class="flex flex-col gap-1">
                            <Label for="music_tidal_url" class="text-xs">tidal</Label>
                            <Input
                                id="music_tidal_url"
                                name="music_tidal_url"
                                type="url"
                                placeholder="https://tidal.com/..."
                                class="h-7 text-xs"
                                value={post?.music?.tidalUrl ?? ""}
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <Label for="music_spotify_url" class="text-xs">spotify</Label>
                            <Input
                                id="music_spotify_url"
                                name="music_spotify_url"
                                type="url"
                                placeholder="https://open.spotify.com/..."
                                class="h-7 text-xs"
                                value={post?.music?.spotifyUrl ?? ""}
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <Label for="music_youtube_url" class="text-xs">youtube</Label>
                            <Input
                                id="music_youtube_url"
                                name="music_youtube_url"
                                type="url"
                                placeholder="https://youtube.com/..."
                                class="h-7 text-xs"
                                value={post?.music?.youtubeUrl ?? ""}
                            />
                        </div>
                    </div>
                </div>
            {/if}
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
            <Label>{isEdit ? "add attachments" : "attachments"}</Label>

            {#if selectedFiles.length > 0}
                <ul class="flex flex-col gap-1">
                    {#each selectedFiles as file, i}
                        {@const Icon = iconFor(file)}
                        {@const preview = previewUrl(file)}
                        <li
                            class="flex items-center gap-2 border border-border px-2 py-1.5 text-xs"
                        >
                            {#if preview}
                                <img
                                    src={preview}
                                    alt=""
                                    class="h-6 w-6 shrink-0 object-cover"
                                />
                            {:else}
                                <Icon
                                    size={14}
                                    class="shrink-0 text-muted-foreground"
                                />
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
    </div>

    <div>
        <Button type="submit" disabled={submitting}>
            {#if !submitting}<PaperPlaneIcon size={16} />{/if}
            {submitting
                ? isEdit
                    ? "updating..."
                    : "posting..."
                : isEdit
                  ? "update"
                  : "post"}
        </Button>
    </div>
</form>
