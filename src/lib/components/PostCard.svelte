<script lang="ts">
    import type { PostRendered } from "$lib/types";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import {
        FileArrowDown,
        PencilIcon,
        TrashIcon,
        LinkSimple,
        LinkIcon,
    } from "phosphor-svelte";
    import MediaViewer from "./MediaViewer.svelte";
    import MusicCard from "./MusicCard.svelte";

    let { post, isAdmin = false }: { post: PostRendered; isAdmin?: boolean } =
        $props();

    const imageFiles = $derived(
        post.files.filter((f) => f.type.startsWith("image/")),
    );
    const otherFiles = $derived(
        post.files.filter((f) => !f.type.startsWith("image/")),
    );

    const imageUrls = $derived(imageFiles.map((f) => f.url));

    const useOverflowGrid = $derived(imageFiles.length > 3);
    const overflowCount = $derived(imageFiles.length - 3);
    const gridImages = $derived(
        useOverflowGrid ? imageFiles.slice(0, 3) : imageFiles,
    );

    let viewerOpen = $state(false);
    let viewerStart = $state(0);
    let copied = $state(false);

    function openViewer(index: number) {
        viewerStart = index;
        viewerOpen = true;
    }

    async function copyLink() {
        const url = `${location.origin}${location.pathname}#post-${post.id}`;
        await navigator.clipboard.writeText(url);
        copied = true;
        setTimeout(() => (copied = false), 1500);
    }

    $effect(() => {
        if (location.hash !== `#post-${post.id}`) return;
        const el = document.getElementById(`post-${post.id}`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("post-highlight");
        el.addEventListener(
            "animationend",
            () => el.classList.remove("post-highlight"),
            { once: true },
        );
    });
</script>

<MediaViewer urls={imageUrls} startIndex={viewerStart} bind:open={viewerOpen} />

<div id="post-{post.id}" class="flex flex-col gap-4 px-6 py-4 border-b">
    <!-- meta row -->
    <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <time>
            {new Date(post.createdAt).toLocaleString()}
        </time>
        {#if post.tags.length > 0}
            <span class="text-border">|</span>
            <div class="flex gap-1.5 flex-wrap">
                {#each post.tags as tag}
                    <Badge href="/?tab=posts&tag={tag}" variant="outline"
                        ><span
                            ><span class="text-muted-foreground">#</span
                            >{tag}</span
                        ></Badge
                    >
                {/each}
            </div>
        {/if}

        <div class="flex gap-0.5 ml-auto items-center">
            <Button
                type="button"
                onclick={copyLink}
                size="icon-sm"
                title="Copy link"
                variant="ghost"
            >
                {#if copied}
                    <span class="text-[10px] leading-none">copied</span>
                {:else}
                    <LinkIcon />
                {/if}
            </Button>

            {#if isAdmin}
                <Button
                    href="/admin/edit/{post.id}"
                    variant="ghost"
                    size="icon-sm"
                >
                    <PencilIcon />
                </Button>
                <form method="POST" action="/?/delete">
                    <input type="hidden" name="id" value={post.id} />
                    <Button type="submit" variant="destructive" size="icon-sm">
                        <TrashIcon />
                    </Button>
                </form>
            {/if}
        </div>
    </div>

    <!-- markdown body -->
    <div
        class="text-sm leading-relaxed
				[&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-6
				[&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-5
				[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
				[&>*:first-child]:mt-0
				[&_p]:mb-3 [&_p]:text-justify last:[&_p]:mb-0
				[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
				[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
				[&_li]:mb-1
				[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre]:text-xs
				[&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs [&_code]:dynround
				[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:dynround
				[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:mb-3
				[&_a]:underline [&_a]:underline-offset-2
				[&_img]:max-w-full [&_img]:h-auto [&_img]:my-3
				[&_hr]:border-border [&_hr]:my-6"
    >
        {@html post.html}
    </div>

    <!-- music -->
    {#if post.music}
        <MusicCard music={post.music} />
    {/if}

    <!-- image previews -->
    {#if imageFiles.length > 0}
        <div
            class="grid gap-2 pt-1"
            class:grid-cols-1={!useOverflowGrid && imageFiles.length === 1}
            class:grid-cols-2={(!useOverflowGrid && imageFiles.length === 2) ||
                useOverflowGrid}
            class:grid-cols-3={!useOverflowGrid && imageFiles.length >= 3}
        >
            {#each gridImages as file, i}
                <button
                    class="overflow-hidden cursor-pointer block dynround"
                    onclick={() => openViewer(i)}
                >
                    <img
                        src={file.url}
                        alt={file.name}
                        loading="lazy"
                        class="w-full transition-opacity hover:opacity-80 {imageFiles.length ===
                        1
                            ? 'max-h-96 object-cover'
                            : 'h-40 object-cover'}"
                    />
                </button>
            {/each}

            {#if useOverflowGrid}
                <button
                    class="relative overflow-hidden dynround cursor-pointer block h-40 bg-muted hover:bg-muted/80 transition-colors"
                    onclick={() => openViewer(3)}
                >
                    <img
                        src={imageFiles[3].url}
                        alt={imageFiles[3].name}
                        loading="lazy"
                        class="w-full h-full object-cover opacity-30"
                    />
                    <span
                        class="absolute inset-0 flex items-center justify-center text-foreground font-semibold text-sm"
                    >
                        +{overflowCount} more
                    </span>
                </button>
            {/if}
        </div>
    {/if}

    <!-- other attachments -->
    {#if otherFiles.length > 0}
        <div class="flex flex-col gap-1" class:pt-1={imageFiles.length === 0}>
            {#each otherFiles as file}
                <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <FileArrowDown size={14} />
                    {file.name}
                </a>
            {/each}
        </div>
    {/if}
</div>

<style>
    @keyframes post-highlight {
        0% {
            background-color: transparent;
        }
        20% {
            background-color: color-mix(
                in srgb,
                var(--color-primary, #6366f1) 10%,
                transparent
            );
        }
        70% {
            background-color: color-mix(
                in srgb,
                var(--color-primary, #6366f1) 10%,
                transparent
            );
        }
        100% {
            background-color: transparent;
        }
    }

    :global(.post-highlight) {
        animation: post-highlight 1.6s ease;
    }
</style>
