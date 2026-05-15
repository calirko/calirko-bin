<script lang="ts">
    import type { PageProps } from "./$types";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Link } from "$lib/components/ui/link";
    import { Badge } from "$lib/components/ui/badge";
    import PostCard from "$lib/components/PostCard.svelte";

    let { data }: PageProps = $props();
</script>

<nav class="flex items-center border-b px-6">
    <div class="flex gap-4 py-3">
        <Link
            href="/?tab=posts"
            class={data.tab === "posts"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"}
        >
            posts
        </Link>
        <Link
            href="/?tab=tags"
            class={data.tab === "tags"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"}
        >
            tags
        </Link>
        <Link
            href="/?tab=about"
            class={data.tab === "about"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"}
        >
            about
        </Link>
    </div>
    {#if data.isAdmin}
        <Link
            href="/admin"
            class="ml-auto text-muted-foreground hover:text-foreground"
        >
            + new post
        </Link>
    {/if}
</nav>

{#if data.tab === "posts"}
    {#if data.filterTag}
        <div class="mb-6 flex items-center gap-2 text-sm">
            <span class="text-muted-foreground">filtered by</span>
            <Badge variant="outline">#{data.filterTag}</Badge>
            <Button href="/?tab=posts" variant="ghost" size="xs">clear</Button>
        </div>
    {/if}

    {#if data.posts.length === 0}
        <p class="text-muted-foreground text-sm">no posts yet.</p>
    {:else}
        <div class="flex flex-col gap-4">
            {#each data.posts as post}
                <PostCard {post} isAdmin={data.isAdmin} />
            {/each}
        </div>
    {/if}
{:else if data.tab === "tags"}
    <div class="px-6 py-4">
        {#if data.tags.length === 0}
            <p class="text-muted-foreground text-sm">no tags yet.</p>
        {:else}
            <div class="flex flex-col gap-2">
                {#each data.tags as tag}
                    <div class="flex items-center gap-2">
                        <Badge
                            href="/?tab=posts&tag={tag.name}"
                            variant="outline"
                            ><span
                                ><span class="text-muted-foreground">#</span
                                >{tag.name}</span
                            ></Badge
                        >
                        <span class="text-xs text-muted-foreground"
                            >({tag.count})</span
                        >
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{:else if data.tab === "about"}
    <div class="flex px-6 py-4 flex-col gap-y-2">
        <b>this is /bin/calirko</b>
        <p class="text-muted-foreground text-xs">
            a place for notes, files, and things worth keeping.
        </p>
        <p class="text-muted-foreground text-xs">
            i'm just a chill fur from 2007 that decided to make this small place
            in my domain calirko.com to put some tech to the test and also just
            vent stuff and ideas for anyone to read
        </p>
        <p class="text-muted-foreground text-xs">
            my tastes are super mixed, they dont fit a genre in any way... i can
            like progressive metal and djent but also enjoy uptempo; love
            breakcore but ignore drum n bass...
        </p>
        <p class="text-muted-foreground text-xs">
            i like coding in svelte, react, using some frameworks like vite,
            even nextjs, tailwindcss, yada yada... i prefer bun over node.
            recently ive been touching a bit of rust too, and i have back
            experience with langs such as java (for desktop interfaces), c and
            c#. you'll definetely see a pattern in my stacks lol
        </p>
        <p class="text-muted-foreground text-xs">
            yup, i am a furry, and i'm very whatever about it. my sona is a dark
            gray/black raccoon (cute lil guys omg) and his name is Kuro. i don't
            take much part into the furry fandom cause i still have different
            values and stardarts for me.
        </p>
        <p class="text-muted-foreground text-xs">
            but anyway, there's ton of stuff around here, feel free to hit me up
            and be friends with me! add me in dc, it's calirko too (everything's
            calirko :p)
        </p>
    </div>
{/if}
