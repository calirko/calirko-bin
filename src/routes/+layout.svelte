<script lang="ts">
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";
    import { ModeWatcher, mode, toggleMode } from "mode-watcher";
    import { Button } from "$lib/components/ui/button";
    import { Sun, Moon } from "phosphor-svelte";
    import Footer from "$lib/components/Footer.svelte";
    import type { LayoutProps } from "./$types";

    let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <title>/bin/calirko</title>
    {#if data.accentHue != null}
        {@html `<style>:root{--tint-h:${Math.round(data.accentHue)};--tint-c:0.015}</style>`}
    {/if}
</svelte:head>

<ModeWatcher />

<div
    class="min-h-screen bg-background {data.backgroundUrl ? '' : 'dotted-bg'}"
    style={data.backgroundUrl
        ? `background-image: url('${data.backgroundUrl}'); background-size: cover; background-position: center; background-attachment: fixed;`
        : ""}
>
    <div
        class="max-w-2xl mx-auto bg-background min-h-screen border-x border-border flex flex-col"
    >
        <header class="border-b px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <a href="/" class="font-bold text-2xl mb-1"
                        ><span class="text-muted-foreground">/</span>bin<span
                            class="text-muted-foreground">/</span
                        >calirko</a
                    >
                    <p class="text-xs text-muted-foreground mt-0.5">
                        {data.slogan}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onclick={toggleMode}
                    aria-label="toggle theme"
                >
                    {#if mode.current === "dark"}
                        <Sun size={15} />
                    {:else}
                        <Moon size={15} />
                    {/if}
                </Button>
            </div>
        </header>

        <main class="flex-1 flex flex-col">
            {@render children()}
        </main>

        <Footer postCount={data.postCount} />
    </div>
</div>
