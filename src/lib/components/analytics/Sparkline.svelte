<script lang="ts">
    type Point = { date: string; views: number };
    let { points, height = 56 }: { points: Point[]; height?: number } = $props();
    const max = $derived(Math.max(1, ...points.map((p) => p.views)));
    const w = 100;
    const n = $derived(Math.max(1, points.length));
    const barW = $derived(w / n);
</script>

<svg
    viewBox="0 0 {w} {height}"
    preserveAspectRatio="none"
    class="w-full"
    style="height: {height}px"
    role="img"
    aria-label="views over time"
>
    {#each points as p, i (p.date)}
        {@const h = (p.views / max) * height}
        <rect
            x={i * barW}
            y={height - h}
            width={Math.max(0.4, barW - 0.6)}
            height={h}
            class="fill-foreground/70"
        >
            <title>{p.date}: {p.views}</title>
        </rect>
    {/each}
</svg>
