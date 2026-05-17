<script lang="ts">
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import { cn } from "$lib/utils";

    export type ComboboxItem = {
        value: string;
        label: string;
        sublabel?: string;
        image?: string;
    };

    let {
        items,
        placeholder = "Search...",
        triggerText = "Search...",
        loading = false,
        open = $bindable(false),
        class: className,
        onSearch,
        onSelect,
    }: {
        items: ComboboxItem[];
        placeholder?: string;
        triggerText?: string;
        loading?: boolean;
        open?: boolean;
        class?: string;
        onSearch: (query: string) => void;
        onSelect: (item: ComboboxItem) => void;
    } = $props();

    let searchValue = $state("");

    $effect(() => {
        onSearch(searchValue);
    });
</script>

<Popover.Root bind:open>
    <Popover.Trigger
        class={cn(
            "text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
            className,
        )}
    >
        {triggerText}
    </Popover.Trigger>

    <Popover.Content class="w-80 p-0" align="start" sideOffset={6}>
        <Command.Root filter={() => 1}>
            <Command.Input bind:value={searchValue} {placeholder} />
            <Command.List>
                {#if loading}
                    <Command.Loading>
                        <span class="py-4 text-center text-xs text-muted-foreground block"
                            >searching...</span
                        >
                    </Command.Loading>
                {:else if searchValue.length > 1 && items.length === 0}
                    <Command.Empty>no results</Command.Empty>
                {/if}

                {#each items as item (item.value)}
                    <Command.Item
                        value={item.value}
                        onSelect={() => {
                            onSelect(item);
                            open = false;
                            searchValue = "";
                        }}
                        class="gap-2.5"
                    >
                        {#if item.image}
                            <img
                                src={item.image}
                                alt=""
                                class="h-9 w-9 shrink-0 object-cover rounded-sm"
                            />
                        {/if}
                        <div class="flex flex-col min-w-0">
                            <span class="text-sm truncate">{item.label}</span>
                            {#if item.sublabel}
                                <span class="text-xs text-muted-foreground truncate"
                                    >{item.sublabel}</span
                                >
                            {/if}
                        </div>
                    </Command.Item>
                {/each}
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
