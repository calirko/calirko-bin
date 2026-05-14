<script lang="ts">
    import type { ActionData } from "./$types";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { enhance } from "$app/forms";
    import { ArrowRightIcon } from "phosphor-svelte";

    let { form }: { form: ActionData } = $props();
    let submitting = $state(false);
</script>

<svelte:head>
    <title>login — /bin/calirko</title>
</svelte:head>

<div class="flex h-full grow items-center justify-center">
    <Card.Root class="w-full max-w-sm">
        <Card.Header>
            <Card.Title>admin</Card.Title>
            <Card.Description>/bin/calirko</Card.Description>
        </Card.Header>

        <form
            method="POST"
            class="space-y-8"
            use:enhance={() => {
                submitting = true;
                return async ({ update }) => {
                    await update();
                    submitting = false;
                };
            }}
        >
            <Card.Content class="flex flex-col gap-4">
                {#if form?.error}
                    <p class="text-destructive text-xs">{form.error}</p>
                {/if}

                <div class="flex flex-col gap-1.5">
                    <Label for="username">username</Label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        autocomplete="username"
                        required
                    />
                </div>

                <div class="flex flex-col gap-1.5">
                    <Label for="password">password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autocomplete="current-password"
                        required
                    />
                </div>
            </Card.Content>

            <Card.Footer>
                <Button type="submit" disabled={submitting} class="w-full">
                    <ArrowRightIcon />
                    {submitting ? "signing in..." : "sign in"}
                </Button>
            </Card.Footer>
        </form>
    </Card.Root>
</div>
