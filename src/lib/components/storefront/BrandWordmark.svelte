<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';

	interface Props {
		/** Render the uploaded logo image instead of the wordmark text. */
		image?: boolean;
		/** Extra classes for the wrapper. */
		class?: string;
	}

	let { image = false, class: className = '' }: Props = $props();

	const brand = $derived(admin.settings.brand);
</script>

<!--
	@component
	The brand lockup — the uploaded logo image when the merchant set one,
	otherwise the wordmark text with the accent dot.
-->

{#if image && brand.logoUrl}
	<img
		src={brand.logoUrl}
		alt={brand.name}
		class="block h-8 w-auto max-w-[12rem] object-contain {className}"
		loading="eager"
		decoding="async"
	/>
{:else}
	<span class={className}>
		{brand.wordmark}<span class="text-brand-accent">.</span>
	</span>
{/if}
