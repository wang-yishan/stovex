<script lang="ts">
	import { Search } from '@lucide/svelte';

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
	`bg-[#FBFBFA]` field treatment as the reference bundle.
-->

<div class={wrapper}>
	<Search
		class={size === 'sm'
			? 'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#999]'
			: 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]'}
	/>
	<input
		{id}
		{placeholder}
		aria-label={ariaLabel ?? placeholder}
		bind:value
		class={size === 'sm'
			? 'w-full h-8 pl-8 pr-3 rounded-[6px] border bg-[#FBFBFA] text-[12px]'
			: 'w-full h-9 pl-9 pr-3 rounded-full border bg-[#FBFBFA] text-[13px] placeholder:text-[#999] focus:outline-none focus:border-[#242424] focus:bg-white transition'}
		style="border-color: var(--border);"
	/>
</div>
