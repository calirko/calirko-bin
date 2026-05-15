<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button";
    import { Link } from "$lib/components/ui/link";
    import { ArrowLeftIcon } from "phosphor-svelte";
</script>

<div class="mb-8 flex items-center justify-between border-b px-6 py-2">
    <div class="flex items-center gap-4">
        <Link href="/" class="text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon size={14} />back
        </Link>
        <nav class="flex gap-3">
            <Link
                href="/admin"
                class={$page.url.pathname === "/admin"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"}
            >
                new post
            </Link>
            <Link
                href="/admin/settings"
                class={$page.url.pathname === "/admin/settings"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"}
            >
                settings
            </Link>
        </nav>
    </div>
    <form method="POST" action="/admin?/logout">
        <Button type="submit" variant="destructive" size="sm">logout</Button>
    </form>
</div>
