<script lang="ts">
    import { cn } from "$lib/utils.js";

    let { ref = $bindable(null), class: className, ...restProps } = $props();
</script>

<a
    bind:this={ref}
    data-slot="link"
    class={cn(
        "transition-all duration-200 gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
        className,
    )}
    {...restProps}>{@render restProps.children?.()}</a
>
