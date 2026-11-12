<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '#lib/utils.js';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	type Props = WithElementRef<Omit<HTMLSelectAttributes, 'size'>>;

	/**
	 * Bag Store native select — same field treatment as `Input`.
	 *
	 * Native `<select>` (not the bits-ui popover) so the dashboard's
	 * `bind:value` filters keep working without a rewrite.
	 */
	export const nativeSelectVariants = tv({
		base: 'w-full min-w-0 appearance-none rounded-[8px] border border-input bg-field px-3 pr-8 text-[13px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-field-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
		variants: {
			shape: {
				field: 'rounded-[8px]',
				pill: 'rounded-full'
			},
			size: {
				sm: 'h-8 px-2 pr-7 text-[12px]',
				md: 'h-10 sm:h-9',
				lg: 'h-11 sm:h-10'
			}
		},
		defaultVariants: {
			shape: 'field',
			size: 'md'
		}
	});
</script>

<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		value = $bindable(),
		shape = 'field',
		size = 'md',
		class: className,
		children,
		...restProps
	}: Props & {
		shape?: 'field' | 'pill';
		size?: 'sm' | 'md' | 'lg';
	} = $props();
</script>

<div class="group/native-select relative w-fit" data-slot="native-select-wrapper">
	<select
		bind:this={ref}
		data-slot="native-select"
		class={cn(nativeSelectVariants({ shape, size }), className)}
		bind:value
		{...restProps}
	>
		{@render children?.()}
	</select>
	<ChevronDown
		data-slot="native-select-icon"
		class="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
	/>
</div>
