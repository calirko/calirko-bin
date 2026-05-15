<script lang="ts">
    import type { ActionData } from "./$types";
    import PostForm from "$lib/components/PostForm.svelte";
    import AdminNav from "$lib/components/AdminNav.svelte";

    let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
    <title>admin — /bin/calirko</title>
</svelte:head>

<AdminNav />

<div class="px-6">
    <PostForm action="?/create" error={form?.error} />
</div>
