<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		maxW = 380,
		children
	}: {
		title?: string;
		maxW?: number;
		children: Snippet;
	} = $props();
</script>

<!--
	@component
	Generic overlay modal (converted from ref fixed overlay pattern — z-[120], no backdrop click close, ref parity).
-->

<div class="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4">
	<div
		class="bg-white rounded-[12px] border shadow-xl w-full p-5"
		style="border-color: var(--border); max-width: {maxW}px;"
	>
		{#if title}
			<h3 class="text-[14px] font-semibold">{title}</h3>
		{/if}
		{@render children()}
	</div>
</div>
