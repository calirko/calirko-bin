<script lang="ts">
    import {
        GithubLogo,
        XLogo,
        TumblrLogo,
        GithubLogoIcon,
        XLogoIcon,
        TumblrLogoIcon,
    } from "phosphor-svelte";
    import { Button } from "$lib/components/ui/button";
    const { postCount } = $props();
</script>

<footer class="border-t-2 px-4 sm:px-6 py-4 mt-auto">
    <div class="flex items-center justify-between">
        <p class="text-xs text-muted-foreground">
            end of log. you've just read {postCount || 0} posts
        </p>
        <div class="flex items-center gap-0.5">
            <Button
                href="https://github.com/calirko"
                variant="ghost"
                size="icon-xs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
            >
                <GithubLogoIcon size={14} />
            </Button>
            <Button
                href="https://x.com/calirkoo"
                variant="ghost"
                size="icon-xs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
            >
                <XLogoIcon size={14} />
            </Button>
            <Button
                href="https://calirko.tumblr.com"
                variant="ghost"
                size="icon-xs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tumblr"
            >
                <TumblrLogoIcon size={14} />
            </Button>
        </div>
    </div>
</footer>
