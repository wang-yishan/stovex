<script lang="ts" module>
	import { tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '#lib/utils.js';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = WithElementRef<
		Omit<HTMLTextareaAttributes, 'value' | 'rows'> & {
			/** The bound value; `number` is allowed for numeric fields. */
			value?: string | number;
			/** Row count. Accepts a string literal (`rows="2"`) as well as a number. */
			rows?: number | string;
		}
	>;

	/** Bag Store textarea — same field treatment as `Input`, multi-line. */
	export const textareaVariants = tv({
		base: 'w-full min-w-0 rounded-[8px] border border-input bg-field px-3 py-2 text-[13px] leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-field-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
		variants: {
			size: {
				sm: 'text-[12px]',
				md: 'text-[13px]'
			},
			font: {
				sans: 'font-sans',
				mono: 'font-mono'
			}
		},
		defaultVariants: {
			size: 'md',
			font: 'sans'
		}
	});
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		value = $bindable<string | number>(),
		rows,
		size = 'md',
		font = 'sans',
		class: className,
		'data-slot': dataSlot = 'textarea',
		...restProps
	}: Props & {
		size?: 'sm' | 'md';
		font?: 'sans' | 'mono';
	} = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(textareaVariants({ size, font }), className)}
	value={value == null ? '' : String(value)}
	oninput={(e) => (value = (e.currentTarget as HTMLTextAreaElement).value)}
	rows={rows == null ? undefined : Number(rows)}
	{...restProps}></textarea>
