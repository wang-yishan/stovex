<script lang="ts">
	import { Search } from '@lucide/svelte';
	import { Input } from '#lib/components/ui/input/index.ts';

	let {
		value = $bindable(''),
		placeholder = 'Search...',
		size = 'md',
		wrapperClass,
		id,
		ariaLabel
	}: {
		value?: string;
		placeholder?: string;
		/** `md`: filter-bar pill (h-9, rounded-full) · `sm`: in-modal field (h-8, rounded-[6px]). */
		size?: 'md' | 'sm';
		/** Wrapper classes; defaults to `flex-1 relative` (md) / `relative` (sm). */
		wrapperClass?: string;
		id?: string;
		ariaLabel?: string;
	} = $props();

	let wrapper = $derived(wrapperClass ?? (size === 'sm' ? 'relative' : 'flex-1 relative'));
</script>

<!--
	@component
	Search field converted from ref filter bars (Products / Categories / Collections /
	Inventory) and the in-modal "Assign products" search. Two sizes, same icon +
	field treatment as the rest of the dashboard.
-->

<div class={wrapper}>
	<Search
		class={size === 'sm'
			? 'pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground'
			: 'pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground'}
	/>
	<Input
		{id}
		{placeholder}
		aria-label={ariaLabel ?? placeholder}
		bind:value
		shape="pill"
		size={size === 'sm' ? 'sm' : 'md'}
		class={size === 'sm' ? 'pr-3 pl-8' : 'w-full pr-3 pl-9 placeholder:text-muted-foreground'}
	/>
</div>
