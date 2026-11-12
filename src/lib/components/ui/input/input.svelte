<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '#lib/utils.js';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type' | 'size' | 'value'> & {
			/** The bound value; `number` is allowed for numeric inputs. */
			value?: string | number;
		} & ({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	/**
	 * Bag Store field variants.
	 *
	 * Restyled from the shadcn-svelte `nova` preset to the product spec:
	 * 8px radius (12px on the pill shape), a `--field` resting fill that
	 * lifts to `--field-focus` on focus, and the `--ring` focus outline.
	 *
	 * The `mono` shape matches the dashboard's slug/SKU/code fields.
	 */
	export const inputVariants = tv({
		base: 'w-full min-w-0 rounded-[8px] border border-input bg-field px-3 text-[13px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-field-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
		variants: {
			shape: {
				field: 'rounded-[8px]',
				pill: 'rounded-full'
			},
			size: {
				sm: 'h-8 px-2 text-[12px]',
				md: 'h-10 sm:h-9',
				lg: 'h-11 sm:h-10'
			},
			font: {
				sans: 'font-sans',
				mono: 'font-mono'
			}
		},
		defaultVariants: {
			shape: 'field',
			size: 'md',
			font: 'sans'
		}
	});
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		value = $bindable<string | number>(),
		type,
		files = $bindable(),
		shape = 'field',
		size = 'md',
		font = 'sans',
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props & {
		shape?: 'field' | 'pill';
		size?: 'sm' | 'md' | 'lg';
		font?: 'sans' | 'mono';
	} = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			inputVariants({ shape, size, font }),
			'file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[12px] file:font-medium file:text-foreground',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(inputVariants({ shape, size, font }), className)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
