<script lang="ts">
    import "./layout.css";
    import { ModeWatcher, mode, toggleMode } from "mode-watcher";
    import { Button } from "$lib/components/ui/button";
    import { Sun, Moon } from "phosphor-svelte";
    import Footer from "$lib/components/Footer.svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    import { onDestroy } from "svelte";
    import type { LayoutProps } from "./$types";

    let { data, children }: LayoutProps = $props();

    // easter egg: flicker through furry emotes when the title is hovered/focused
    const faces = [
        "⚞^. .^⚟",
        "ฅ^•ﻌ•^ฅ",
        "(=^･ω･^=)",
        "/ᐠ｡ꞈ｡ᐟ\\",
        "ʕ•ᴥ•ʔ",
        "(•ᴥ•)",
        "=^._.^=",
        "(=｀ω´=)",
        "^•ﻌ•^",
        "(ↀᴥↀ)",
        "(=ↀωↀ=)",
        "ᘛ⁐̤ᕐᐷ",
    ];

    let emoting = $state(false);
    let faceIndex = $state(0);
    let timer: ReturnType<typeof setInterval> | null = null;

    function startEmote() {
        emoting = true;
        if (
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
            timer
        )
            return; // reduced motion: show one static face, no flicker
        timer = setInterval(() => {
            let next = faceIndex;
            while (next === faceIndex && faces.length > 1)
                next = Math.floor(Math.random() * faces.length);
            faceIndex = next;
        }, 75);
    }

    function stopEmote() {
        emoting = false;
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    onDestroy(() => {
        if (timer) clearInterval(timer);
    });

    // time-on-page beacon: measure visible dwell time and report it per pageview.
    // Re-runs on client-side navigation (keyed on pathname); cookieless.
    $effect(() => {
        if (!browser) return;
        const path = page.url.pathname; // tracked dep — restarts on SPA nav
        let activeSince = Date.now();
        let accrued = 0;
        let sent = false;

        const flush = () => {
            if (sent) return;
            sent = true;
            const ms =
                accrued +
                (document.visibilityState === "visible"
                    ? Date.now() - activeSince
                    : 0);
            if (ms <= 0) return;
            navigator.sendBeacon?.(
                "/api/analytics/beacon",
                new Blob([JSON.stringify({ path, ms })], { type: "text/plain" }),
            );
        };

        const onVisibility = () => {
            if (document.visibilityState === "hidden") {
                accrued += Date.now() - activeSince;
                flush();
            } else {
                activeSince = Date.now();
                sent = false; // returned to tab — allow a fresh flush later
            }
        };

        document.addEventListener("visibilitychange", onVisibility);
        // pagehide is more reliable than unload on mobile/bfcache
        window.addEventListener("pagehide", flush);

        return () => {
            flush();
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("pagehide", flush);
        };
    });

    const title = "/bin/calirko";
    const description = $derived(data.slogan);
    const canonicalUrl = $derived(page.url.href);
    const imageUrl = "https://calirko.com/favicon.png";
</script>

<svelte:head>
    <link rel="icon" href={"/favicon.png"} />
    <link rel="canonical" href={canonicalUrl} />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="author" content="calirko" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={title} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={imageUrl} />

    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={imageUrl} />

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
        class="content-panel max-w-2xl mx-auto bg-background min-h-screen border-0 sm:border-x-2 flex flex-col"
    >
        <header class="border-b-2 px-4 sm:px-6 py-4">
            <div class="flex items-center justify-between">
                <div>
                    <a
                        href="/"
                        class="font-bold text-2xl mb-1 typewriter-link relative"
                        onmouseenter={startEmote}
                        onmouseleave={stopEmote}
                        onfocus={startEmote}
                        onblur={stopEmote}
                        ><span class="typewriter-text" class:opacity-0={emoting}
                            ><span class="text-muted-foreground">/</span
                            >bin<span class="text-muted-foreground">/</span
                            >calirko</span
                        >{#if emoting}<span class="emote-face" aria-hidden="true"
                                >{faces[faceIndex]}</span
                            >{/if}</a
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
