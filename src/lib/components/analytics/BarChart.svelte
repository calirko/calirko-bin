<script lang="ts">
    type Row = { label: string; value: number };
    let { data, empty = "no data yet" }: { data: Row[]; empty?: string } =
        $props();
    const max = $derived(Math.max(1, ...data.map((d) => d.value)));
</script>

{#if data.length === 0}
    <p class="text-xs text-muted-foreground">{empty}</p>
{:else}
    <div class="flex flex-col gap-1 text-xs">
        {#each data as d (d.label)}
            <div class="grid grid-cols-[1fr_auto] items-center gap-2">
                <div class="relative h-5 bg-muted/50">
                    <div
                        class="absolute inset-y-0 left-0 bg-foreground/75"
                        style="width: {(d.value / max) * 100}%"
                    ></div>
                    <span
                        class="absolute inset-y-0 left-1.5 right-1 flex items-center truncate text-foreground mix-blend-difference"
                        title={d.label}
                    >
                        {d.label}
                    </span>
                </div>
                <span class="tabular-nums text-muted-foreground">{d.value}</span>
            </div>
        {/each}
    </div>
{/if}
