<script lang="ts">
    import type { PageProps } from "./$types";
    import AdminNav from "$lib/components/AdminNav.svelte";
    import * as Card from "$lib/components/ui/card";
    import BarChart from "$lib/components/analytics/BarChart.svelte";
    import Sparkline from "$lib/components/analytics/Sparkline.svelte";

    let { data }: PageProps = $props();
    const a = $derived(data.analytics);

    function fmtDwell(ms: number | null): string {
        if (ms == null) return "—";
        const s = Math.round(ms / 1000);
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        return `${m}m ${s % 60}s`;
    }

    // ISO 3166-1 alpha-2 → flag emoji (regional indicator letters)
    function flag(cc: string): string {
        if (!/^[A-Za-z]{2}$/.test(cc)) return "🏳";
        return String.fromCodePoint(
            ...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
        );
    }

    function fmtTime(ts: number): string {
        const d = new Date(ts);
        return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    }

    const stats = $derived([
        { label: "views (30d)", value: String(a.totals.views) },
        { label: "unique visitors", value: String(a.totals.uniqueVisitors) },
        { label: "views (24h)", value: String(a.totals.last24hViews) },
        { label: "median time", value: fmtDwell(a.totals.medianDwellMs) },
    ]);
</script>

<svelte:head>
    <title>analytics — /bin/calirko</title>
</svelte:head>

<AdminNav />

<div class="flex flex-col gap-6 px-4 sm:px-6">
    {#if !a.enabled}
        <p class="text-sm text-destructive">
            analytics store unavailable in this runtime (node:sqlite required —
            production runs on node, local <code>bun run dev</code> does not capture).
        </p>
    {/if}

    <!-- summary tiles -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
        {#each stats as s (s.label)}
            <div class="bg-background p-3 flex flex-col gap-0.5">
                <span class="text-xl font-medium tabular-nums">{s.value}</span>
                <span class="text-xs text-muted-foreground">{s.label}</span>
            </div>
        {/each}
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>views over time</Card.Title>
            <Card.Description>daily, last 30 days</Card.Description>
        </Card.Header>
        <Card.Content>
            <Sparkline points={a.viewsOverTime} />
        </Card.Content>
    </Card.Root>

    <div class="grid sm:grid-cols-2 gap-6">
        <Card.Root>
            <Card.Header><Card.Title>top pages</Card.Title></Card.Header>
            <Card.Content>
                <BarChart
                    data={a.topPaths.map((p) => ({ label: p.path, value: p.views }))}
                />
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header><Card.Title>where from</Card.Title></Card.Header>
            <Card.Content>
                <BarChart
                    data={a.topReferrers.map((r) => ({
                        label: r.referrer,
                        value: r.views,
                    }))}
                    empty="no external referrers yet"
                />
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header><Card.Title>geography</Card.Title></Card.Header>
            <Card.Content>
                <BarChart
                    data={a.countries.map((c) => ({
                        label: `${flag(c.country)} ${c.country}`,
                        value: c.views,
                    }))}
                    empty="no geo data — enable Cloudflare visitor location headers"
                />
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title>recent visits</Card.Title>
                <Card.Description>last 25 page views</Card.Description>
            </Card.Header>
            <Card.Content>
                {#if a.recent.length === 0}
                    <p class="text-xs text-muted-foreground">no visits yet</p>
                {:else}
                    <div class="flex flex-col gap-1 text-xs font-mono">
                        {#each a.recent as r (r.ts + r.path)}
                            <div
                                class="grid grid-cols-[auto_1fr_auto] items-center gap-2"
                            >
                                <span class="text-muted-foreground tabular-nums"
                                    >{fmtTime(r.ts)}</span
                                >
                                <span class="truncate" title={r.path}>{r.path}</span>
                                <span class="text-muted-foreground"
                                    >{r.country ? flag(r.country) : ""}
                                    {r.referrer ?? ""}</span
                                >
                            </div>
                        {/each}
                    </div>
                {/if}
            </Card.Content>
        </Card.Root>
    </div>
</div>
