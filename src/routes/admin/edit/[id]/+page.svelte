<script lang="ts">
    import type { PageProps, ActionData } from "./$types";
    import { Button } from "$lib/components/ui/button";
    import PostForm from "$lib/components/PostForm.svelte";
    import AdminNav from "$lib/components/AdminNav.svelte";

    let { data, form }: PageProps & { form: ActionData } = $props();
</script>

<svelte:head>
    <title>edit post — /bin/calirko</title>
</svelte:head>

<AdminNav />

<div class="px-4 sm:px-6">
    <PostForm post={data.post} action="?/update" error={form?.error} />
</div>
