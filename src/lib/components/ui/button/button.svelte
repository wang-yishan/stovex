<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '#lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	/**
	 * Bag Store button variants.
	 *
	 * Restyled from the shadcn-svelte `nova` preset to match the product
	 * design system: pill radius, 11–13px label sizes, and the 6/7/8/9/10px
	 * icon-button scale used across the dashboard.
	 *
	 * Every colour comes from a semantic token (`--primary`, `--primary-hover`,
	 * `--card`, `--input`, `--ring`, …) so the same markup renders correctly
	 * in both light and dark mode — see `src/routes/layout.css`.
	 */
	export const buttonVariants = tv({
		base: 'focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-full border border-transparent bg-clip-padding font-medium transition-colors active:not-aria-[haspopup]:translate-y-px group/button inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
				outline:
					'border-input bg-card text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
				ghost:
					'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/25',
				link: 'text-primary underline-offset-4 hover:underline'
			},
			size: {
				xs: 'h-8 gap-1 px-2 text-[11px] leading-none',
				sm: 'h-9 gap-1 px-2.5 text-[11px] leading-none',
				default: 'h-10 gap-1.5 px-3 text-[12px] leading-none sm:h-8',
				lg: 'h-11 gap-1.5 px-3.5 text-[12px] leading-none sm:h-9',
				xl: 'h-12 gap-2 px-4 text-[13px] leading-none sm:h-10',
				'icon-xs': 'size-8 rounded-full sm:size-6',
				'icon-sm': 'size-9 rounded-full sm:size-7',
				icon: 'size-10 rounded-full sm:size-8',
				'icon-lg': 'size-11 rounded-full sm:size-9',
				'icon-xl': 'size-12 rounded-full sm:size-10'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
