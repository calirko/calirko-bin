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
    import * as ContextMenu from "$lib/components/ui/context-menu";
    import {
        TextB,
        TextItalic,
        TextStrikethrough,
        TextHOne,
        TextHTwo,
        TextHThree,
        Code,
        Link,
        ListBullets,
        ListNumbers,
        Quotes,
        Minus,
        Eraser,
    } from "phosphor-svelte";

    let {
        post,
        action,
        error,
        allTags = [],
    }: {
        post?: Post;
        action: string;
        error?: string;
        allTags?: { name: string; count: number }[];
    } = $props();

    // tags
    let tags = $state<string[]>(untrack(() => [...(post?.tags ?? [])]));
    let tagInput = $state("");
    let tagOpen = $state(false);
    let tagActive = $state(0);

    const tagSuggestions = $derived.by(() => {
        const q = tagInput.trim().toLowerCase();
        const available = allTags.filter((t) => !tags.includes(t.name));
        if (!q) return available.slice(0, 8);
        return available
            .filter((t) => t.name.toLowerCase().includes(q))
            .slice(0, 8);
    });

    const exactExists = $derived(
        allTags.some((t) => t.name === tagInput.trim().toLowerCase()),
    );

    function addTag(raw: string) {
        const t = raw.trim().toLowerCase();
        if (!t) return;
        if (!tags.includes(t)) tags = [...tags, t];
        tagInput = "";
        tagActive = 0;
        tagOpen = false;
    }

    function removeTag(t: string) {
        tags = tags.filter((x) => x !== t);
    }

    function onTagKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (tagOpen && tagSuggestions[tagActive]) {
                addTag(tagSuggestions[tagActive].name);
            } else {
                addTag(tagInput);
            }
        } else if (e.key === "Backspace" && !tagInput && tags.length) {
            tags = tags.slice(0, -1);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            tagOpen = true;
            tagActive = Math.min(tagActive + 1, tagSuggestions.length - 1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            tagActive = Math.max(tagActive - 1, 0);
        } else if (e.key === "Escape") {
            tagOpen = false;
        }
    }

    let selectedFiles = $state<File[]>([]);
    let submitting = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);
    let showMusic = $state(untrack(() => !!post?.music));

    // editor
    let textareaRef = $state<HTMLTextAreaElement | null>(null);
    let contentValue = $state(untrack(() => post?.content ?? ""));

    function format(type: string) {
        if (!textareaRef) return;
        const ta = textareaRef;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = contentValue;
        const sel = val.slice(start, end);
        const before = val.slice(0, start);
        const after = val.slice(end);
        const lineStart = before.lastIndexOf("\n") + 1;

        let newVal: string;
        let newStart: number;
        let newEnd: number;

        switch (type) {
            case "bold": {
                const t = sel || "bold";
                newVal = before + `**${t}**` + after;
                newStart = start + 2;
                newEnd = newStart + t.length;
                break;
            }
            case "italic": {
                const t = sel || "italic";
                newVal = before + `_${t}_` + after;
                newStart = start + 1;
                newEnd = newStart + t.length;
                break;
            }
            case "strikethrough": {
                const t = sel || "text";
                newVal = before + `~~${t}~~` + after;
                newStart = start + 2;
                newEnd = newStart + t.length;
                break;
            }
            case "code": {
                const t = sel || "code";
                newVal = before + `\`${t}\`` + after;
                newStart = start + 1;
                newEnd = newStart + t.length;
                break;
            }
            case "codeblock": {
                const t = sel || "code";
                newVal = before + `\`\`\`\n${t}\n\`\`\`` + after;
                newStart = start + 4;
                newEnd = newStart + t.length;
                break;
            }
            case "link": {
                const t = sel || "link text";
                newVal = before + `[${t}](url)` + after;
                newStart = start + t.length + 3;
                newEnd = newStart + 3;
                break;
            }
            case "h1":
            case "h2":
            case "h3": {
                const prefix = "#".repeat(parseInt(type[1])) + " ";
                const lineEnd = val.indexOf("\n", lineStart);
                const end2 = lineEnd === -1 ? val.length : lineEnd;
                const clean = val.slice(lineStart, end2).replace(/^#+\s/, "");
                newVal =
                    val.slice(0, lineStart) + prefix + clean + val.slice(end2);
                newStart = newEnd = lineStart + prefix.length + clean.length;
                break;
            }
            case "quote": {
                newVal = val.slice(0, lineStart) + "> " + val.slice(lineStart);
                newStart = start + 2;
                newEnd = end + 2;
                break;
            }
            case "ul": {
                newVal = val.slice(0, lineStart) + "- " + val.slice(lineStart);
                newStart = start + 2;
                newEnd = end + 2;
                break;
            }
            case "ol": {
                newVal = val.slice(0, lineStart) + "1. " + val.slice(lineStart);
                newStart = start + 3;
                newEnd = end + 3;
                break;
            }
            case "hr": {
                const le = val.indexOf("\n", end);
                const ins = le === -1 ? val.length : le;
                newVal = val.slice(0, ins) + "\n\n---\n" + val.slice(ins);
                newStart = newEnd = ins + 6;
                break;
            }
            case "strip": {
                const stripped = sel
                    .replace(/\*\*(.+?)\*\*/gs, "$1")
                    .replace(/~~(.+?)~~/gs, "$1")
                    .replace(/`{3}[\s\S]*?`{3}/g, (m) =>
                        m.replace(/```\n?/g, ""),
                    )
                    .replace(/`(.+?)`/gs, "$1")
                    .replace(/_{1,2}(.+?)_{1,2}/gs, "$1")
                    .replace(/\*(.+?)\*/gs, "$1")
                    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
                    .replace(/^#{1,6}\s/gm, "")
                    .replace(/^>\s/gm, "")
                    .replace(/^[-*]\s/gm, "")
                    .replace(/^\d+\.\s/gm, "");
                newVal = before + stripped + after;
                newStart = start;
                newEnd = start + stripped.length;
                break;
            }
            default:
                return;
        }

        contentValue = newVal;
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(newStart, newEnd);
        });
    }

    function onEditorKeydown(e: KeyboardEvent) {
        const ctrl = e.ctrlKey || e.metaKey;

        if (e.key === "Tab") {
            e.preventDefault();
            if (!textareaRef) return;
            const s = textareaRef.selectionStart;
            const en = textareaRef.selectionEnd;
            contentValue =
                contentValue.slice(0, s) + "  " + contentValue.slice(en);
            requestAnimationFrame(() =>
                textareaRef?.setSelectionRange(s + 2, s + 2),
            );
            return;
        }

        if (!ctrl) return;
        const key = e.key.toLowerCase();

        if (key === "b" && !e.shiftKey) {
            e.preventDefault();
            format("bold");
        } else if (key === "i" && !e.shiftKey) {
            e.preventDefault();
            format("italic");
        } else if (key === "k" && !e.shiftKey) {
            e.preventDefault();
            format("link");
        } else if (key === "`" && !e.shiftKey) {
            e.preventDefault();
            format("code");
        } else if (key === "s" && e.shiftKey) {
            e.preventDefault();
            format("strikethrough");
        } else if (key === "k" && e.shiftKey) {
            e.preventDefault();
            format("codeblock");
        } else if (key === "\\" && e.shiftKey) {
            e.preventDefault();
            format("strip");
        }
    }

    // music field state — bound to inputs so search can auto-fill them
    let musicArtist = $state(untrack(() => post?.music?.artist ?? ""));
    let musicAlbum = $state(untrack(() => post?.music?.album ?? ""));
    let musicTitle = $state(untrack(() => post?.music?.title ?? ""));
    let musicCoverUrl = $state(untrack(() => post?.music?.coverUrl ?? ""));
    let musicTidalUrl = $state(untrack(() => post?.music?.tidalUrl ?? ""));
    let musicSpotifyUrl = $state(untrack(() => post?.music?.spotifyUrl ?? ""));
    let musicYoutubeUrl = $state(untrack(() => post?.music?.youtubeUrl ?? ""));

    // last.fm search
    type SearchMode = "album" | "track";
    let searchMode = $state<SearchMode>("album");
    let searchResults = $state<ComboboxItem[]>([]);
    let searchLoading = $state(false);
    let comboboxOpen = $state(false);
    let rawMap = new Map<string, Record<string, unknown>>();
    let debounceTimer: ReturnType<typeof setTimeout>;

    function getImage(
        images: { size: string; "#text": string }[],
        ...sizes: string[]
    ) {
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
                const method =
                    searchMode === "album" ? "album.search" : "track.search";
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

    function fillServiceUrls(artist: string, title: string) {
        const q = encodeURIComponent(`${artist} ${title}`);
        musicTidalUrl = `https://listen.tidal.com/search?q=${q}`;
        musicSpotifyUrl = `https://open.spotify.com/search/${q}`;
        musicYoutubeUrl = `https://www.youtube.com/results?search_query=${q}`;
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
                "large",
                "medium",
            );
            fillServiceUrls(musicArtist, musicTitle);
        } else {
            musicTitle = item.label;
            musicArtist = item.sublabel ?? "";
            musicCoverUrl = getImage(
                raw.image as { size: string; "#text": string }[],
                "large",
                "medium",
            );
            fillServiceUrls(musicArtist, musicTitle);
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

{#snippet tbtn(type: string, Icon: any, title: string, extraClass = "")}
    <button
        type="button"
        {title}
        onclick={() => format(type)}
        class="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors {extraClass}"
    >
        <Icon size={14} />
    </button>
{/snippet}

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

        <div class="flex flex-col gap-0">
            <!-- toolbar -->
            <div
                class="dynround mb-2 flex items-center gap-0.5 flex-wrap border dark:bg-input/30 px-1.5 py-1 rounded-t-md"
            >
                {@render tbtn("bold", TextB, "Bold (** **)")}
                {@render tbtn("italic", TextItalic, "Italic (_ _)")}
                {@render tbtn(
                    "strikethrough",
                    TextStrikethrough,
                    "Strikethrough (~~ ~~)",
                )}
                <span class="w-px h-4 bg-border mx-0.5"></span>
                {@render tbtn("h1", TextHOne, "Heading 1")}
                {@render tbtn("h2", TextHTwo, "Heading 2")}
                {@render tbtn("h3", TextHThree, "Heading 3")}
                <span class="w-px h-4 bg-border mx-0.5"></span>
                {@render tbtn("code", Code, "Inline code (` `)")}
                {@render tbtn(
                    "codeblock",
                    Code,
                    "Code block (``` ```)",
                    "opacity-60",
                )}
                <span class="w-px h-4 bg-border mx-0.5"></span>
                {@render tbtn("link", Link, "Link")}
                {@render tbtn("ul", ListBullets, "Bullet list")}
                {@render tbtn("ol", ListNumbers, "Numbered list")}
                <span class="w-px h-4 bg-border mx-0.5"></span>
                {@render tbtn("quote", Quotes, "Blockquote")}
                {@render tbtn("hr", Minus, "Horizontal rule")}
                <span class="w-px h-4 bg-border mx-0.5"></span>
                {@render tbtn(
                    "strip",
                    Eraser,
                    "Remove formatting (Ctrl+Shift+\\)",
                )}
            </div>

            <!-- textarea with context menu -->
            <ContextMenu.Root>
                <ContextMenu.Trigger class="block">
                    <Textarea
                        id="content"
                        name="content"
                        bind:ref={textareaRef}
                        bind:value={contentValue}
                        rows={16}
                        required
                        class="font-mono text-xs rounded-t-none"
                        placeholder="write something..."
                        onkeydown={onEditorKeydown}
                    />
                </ContextMenu.Trigger>
                <ContextMenu.Content>
                    <ContextMenu.Item onSelect={() => format("bold")}>
                        <TextB size={14} /> Bold
                        <ContextMenu.Shortcut>Ctrl B</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                    <ContextMenu.Item onSelect={() => format("italic")}>
                        <TextItalic size={14} /> Italic
                        <ContextMenu.Shortcut>Ctrl I</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                    <ContextMenu.Item onSelect={() => format("strikethrough")}>
                        <TextStrikethrough size={14} /> Strikethrough
                        <ContextMenu.Shortcut>Ctrl⇧S</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item onSelect={() => format("h1")}
                        ><TextHOne size={14} /> Heading 1</ContextMenu.Item
                    >
                    <ContextMenu.Item onSelect={() => format("h2")}
                        ><TextHTwo size={14} /> Heading 2</ContextMenu.Item
                    >
                    <ContextMenu.Item onSelect={() => format("h3")}
                        ><TextHThree size={14} /> Heading 3</ContextMenu.Item
                    >
                    <ContextMenu.Separator />
                    <ContextMenu.Item onSelect={() => format("code")}>
                        <Code size={14} /> Inline code
                        <ContextMenu.Shortcut>Ctrl `</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                    <ContextMenu.Item onSelect={() => format("codeblock")}>
                        <Code size={14} /> Code block
                        <ContextMenu.Shortcut>Ctrl⇧K</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                    <ContextMenu.Item onSelect={() => format("link")}>
                        <Link size={14} /> Link
                        <ContextMenu.Shortcut>Ctrl K</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item onSelect={() => format("ul")}
                        ><ListBullets size={14} /> Bullet list</ContextMenu.Item
                    >
                    <ContextMenu.Item onSelect={() => format("ol")}
                        ><ListNumbers size={14} /> Numbered list</ContextMenu.Item
                    >
                    <ContextMenu.Item onSelect={() => format("quote")}
                        ><Quotes size={14} /> Blockquote</ContextMenu.Item
                    >
                    <ContextMenu.Item onSelect={() => format("hr")}
                        ><Minus size={14} /> Horizontal rule</ContextMenu.Item
                    >
                    <ContextMenu.Separator />
                    <ContextMenu.Item onSelect={() => format("strip")}>
                        <Eraser size={14} /> Remove formatting
                        <ContextMenu.Shortcut>Ctrl⇧\</ContextMenu.Shortcut>
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Root>
        </div>

        <div class="flex flex-col gap-1.5">
            <Label for="tags">tags</Label>
            <input type="hidden" name="tags" value={tags.join(", ")} />
            <div class="relative">
                <div
                    class="dynround flex flex-wrap items-center gap-1 rounded-md border border-input px-2 py-1.5 dark:bg-input/30 focus-within:ring-1 focus-within:ring-ring"
                >
                    {#each tags as tag (tag)}
                        <span
                            class="flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-xs"
                        >
                            {tag}
                            <button
                                type="button"
                                onclick={() => removeTag(tag)}
                                class="text-muted-foreground hover:text-foreground"
                                aria-label="remove {tag}"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    {/each}
                    <input
                        id="tags"
                        bind:value={tagInput}
                        oninput={() => {
                            tagOpen = true;
                            tagActive = 0;
                        }}
                        onkeydown={onTagKeydown}
                        onfocus={() => (tagOpen = true)}
                        onblur={() =>
                            setTimeout(() => (tagOpen = false), 120)}
                        autocomplete="off"
                        placeholder={tags.length ? "" : "dev, notes, misc"}
                        class="min-w-[6rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                {#if tagOpen && (tagSuggestions.length > 0 || (tagInput.trim() && !exactExists))}
                    <div
                        class="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
                    >
                        {#each tagSuggestions as s, i (s.name)}
                            <button
                                type="button"
                                onmousedown={(e) => {
                                    e.preventDefault();
                                    addTag(s.name);
                                }}
                                onmouseenter={() => (tagActive = i)}
                                class="flex w-full items-center justify-between px-2 py-1 text-left text-xs {i ===
                                tagActive
                                    ? 'bg-muted'
                                    : ''}"
                            >
                                <span>{s.name}</span>
                                <span class="text-muted-foreground">{s.count}</span>
                            </button>
                        {/each}
                        {#if tagInput.trim() && !exactExists}
                            <button
                                type="button"
                                onmousedown={(e) => {
                                    e.preventDefault();
                                    addTag(tagInput);
                                }}
                                class="flex w-full items-center gap-1 border-t border-border px-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground"
                            >
                                create “{tagInput.trim().toLowerCase()}”
                            </button>
                        {/if}
                    </div>
                {/if}
            </div>
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

            <input
                type="hidden"
                name="has_music"
                value={showMusic ? "1" : "0"}
            />

            {#if showMusic}
                <div class="flex flex-col gap-3 border border-border p-3">
                    <!-- search row -->
                    <div class="flex items-center gap-2">
                        <div
                            class="flex rounded-sm overflow-hidden border border-border text-xs"
                        >
                            <button
                                type="button"
                                class="px-2 py-1 transition-colors {searchMode ===
                                'album'
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
                            <Label for="music_artist" class="text-xs"
                                >artist</Label
                            >
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
                            <Label for="music_album" class="text-xs"
                                >album / lp</Label
                            >
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
                        <Label for="music_title" class="text-xs"
                            >track / title</Label
                        >
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
                        <Label for="music_cover_url" class="text-xs"
                            >cover art url</Label
                        >
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
                            <Label for="music_tidal_url" class="text-xs"
                                >tidal</Label
                            >
                            <Input
                                id="music_tidal_url"
                                name="music_tidal_url"
                                type="url"
                                placeholder="https://tidal.com/..."
                                class="h-7 text-xs"
                                bind:value={musicTidalUrl}
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <Label for="music_spotify_url" class="text-xs"
                                >spotify</Label
                            >
                            <Input
                                id="music_spotify_url"
                                name="music_spotify_url"
                                type="url"
                                placeholder="https://open.spotify.com/..."
                                class="h-7 text-xs"
                                bind:value={musicSpotifyUrl}
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <Label for="music_youtube_url" class="text-xs"
                                >youtube</Label
                            >
                            <Input
                                id="music_youtube_url"
                                name="music_youtube_url"
                                type="url"
                                placeholder="https://youtube.com/..."
                                class="h-7 text-xs"
                                bind:value={musicYoutubeUrl}
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
                accept="image/*,.heic,.heif,video/*,audio/*,.pdf,.txt,.md,.csv,.json,.zip"
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
