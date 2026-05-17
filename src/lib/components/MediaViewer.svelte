<script lang="ts">
    import { X, CaretLeft, CaretRight } from "phosphor-svelte";

    let {
        urls,
        startIndex = 0,
        open = $bindable(false),
    }: {
        urls: string[];
        startIndex?: number;
        open: boolean;
    } = $props();

    let current = $state(startIndex);

    $effect(() => {
        if (open) current = startIndex;
    });

    function prev() {
        current = (current - 1 + urls.length) % urls.length;
    }

    function next() {
        current = (current + 1) % urls.length;
    }

    function onkeydown(e: KeyboardEvent) {
        if (!open) return;
        if (e.key === "ArrowLeft") prev();
        else if (e.key === "ArrowRight") next();
        else if (e.key === "Escape") open = false;
    }
</script>

<svelte:window {onkeydown} />

{#if open}
    <div
        class="fixed inset-0 z-50 bg-black/85 flex flex-col"
        role="dialog"
        aria-modal="true"
    >
        <!-- close -->
        <button
            class="absolute top-4 right-4 text-white/60 hover:text-white transition-colors cursor-pointer z-10"
            onclick={() => (open = false)}
            aria-label="Close"
        >
            <X size={22} />
        </button>

        <!-- main image -->
        <div class="flex-1 flex items-center justify-center relative min-h-0 px-14 py-8">
            {#if urls.length > 1}
                <button
                    class="absolute left-4 text-white/60 hover:text-white transition-colors cursor-pointer"
                    onclick={prev}
                    aria-label="Previous"
                >
                    <CaretLeft size={28} />
                </button>
            {/if}

            <img
                src={urls[current]}
                alt=""
                class="max-h-full max-w-full object-contain select-none"
            />

            {#if urls.length > 1}
                <button
                    class="absolute right-4 text-white/60 hover:text-white transition-colors cursor-pointer"
                    onclick={next}
                    aria-label="Next"
                >
                    <CaretRight size={28} />
                </button>
            {/if}
        </div>

        <!-- thumbnail strip — bottom left -->
        {#if urls.length > 1}
            <div class="flex gap-2 px-4 pb-4 justify-start">
                {#each urls as url, i}
                    <button
                        class="shrink-0 h-14 w-14 overflow-hidden transition-opacity cursor-pointer
                               {i === current
                            ? 'ring-2 ring-white opacity-100'
                            : 'opacity-40 hover:opacity-70'}"
                        onclick={() => (current = i)}
                        aria-label="Go to image {i + 1}"
                    >
                        <img
                            src={url}
                            alt=""
                            class="h-full w-full object-cover"
                        />
                    </button>
                {/each}
            </div>
        {/if}
    </div>
{/if}
