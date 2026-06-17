<script lang="ts">
    import type { ActionData, PageData } from "./$types";
    import PostForm from "$lib/components/PostForm.svelte";
    import AdminNav from "$lib/components/AdminNav.svelte";

    let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
    <title>admin — /bin/calirko</title>
</svelte:head>

<AdminNav />

<div class="px-4 sm:px-6">
    <PostForm action="?/create" error={form?.error} allTags={data.allTags} />
</div>
