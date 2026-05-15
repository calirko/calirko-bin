<script lang="ts">
    import type { PostRendered } from "$lib/types";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { FileArrowDown, PencilIcon, TrashIcon } from "phosphor-svelte";

    let { post, isAdmin = false }: { post: PostRendered; isAdmin?: boolean } =
        $props();

    const imageFiles = $derived(
        post.files.filter((f) => f.type.startsWith("image/")),
    );
    const otherFiles = $derived(
        post.files.filter((f) => !f.type.startsWith("image/")),
    );
</script>

<div class="flex flex-col gap-4 px-6 py-4 border-b">
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
    </div>

    <!-- markdown body -->
    <div
        class="text-sm leading-relaxed
				[&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-6
				[&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-5
				[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
				[&>*:first-child]:mt-0
				[&_p]:mb-3 last:[&_p]:mb-0
				[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
				[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
				[&_li]:mb-1
				[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre]:text-xs
				[&_code]:bg-muted [&_code]:px-1 [&_code]:text-xs
				[&_pre_code]:bg-transparent [&_pre_code]:p-0
				[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:mb-3
				[&_a]:underline [&_a]:underline-offset-2
				[&_img]:max-w-full [&_img]:h-auto [&_img]:my-3
				[&_hr]:border-border [&_hr]:my-6"
    >
        {@html post.html}
    </div>

    <!-- image previews -->
    {#if imageFiles.length > 0}
        <div
            class="grid gap-2 pt-1 border-t"
            class:grid-cols-1={imageFiles.length === 1}
            class:grid-cols-2={imageFiles.length === 2}
            class:grid-cols-3={imageFiles.length >= 3}
        >
            {#each imageFiles as file}
                <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="overflow-hidden"
                >
                    <img
                        src={file.url}
                        alt={file.name}
                        loading="lazy"
                        class="w-full transition-opacity hover:opacity-80 {imageFiles.length ===
                        1
                            ? 'h-auto'
                            : 'h-40 object-cover'}"
                    />
                </a>
            {/each}
        </div>
    {/if}

    <!-- other attachments -->
    {#if otherFiles.length > 0}
        <div
            class="flex flex-col gap-1"
            class:border-t={imageFiles.length === 0}
            class:pt-1={imageFiles.length === 0}
        >
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

    <!-- admin controls -->
    {#if isAdmin}
        <div class="flex gap-1 justify-end">
            <Button href="/admin/edit/{post.id}" variant="ghost" size="xs"
                ><PencilIcon />edit</Button
            >
            <form method="POST" action="/?/delete">
                <input type="hidden" name="id" value={post.id} />
                <Button type="submit" variant="destructive" size="xs">
                    <TrashIcon />
                    delete
                </Button>
            </form>
        </div>
    {/if}
</div>
