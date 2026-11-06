<script lang="ts">
	import { resolve } from '$app/paths';
	import { Layers } from '@lucide/svelte';

	let { title }: { title: string } = $props();
</script>

<!--
	@component
	"Module coming" placeholder card for the 8 supporting admin pages (converted from ref).
-->

<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-12">
	<div class="bg-white border rounded-[12px] p-8 max-w-[480px] mx-auto text-center" style="border-color: var(--border);">
		<div class="h-10 w-10 mx-auto rounded-full bg-[#F5F5F4] border flex items-center justify-center mb-3" style="border-color: var(--border);">
			<Layers className="h-5 w-5 text-[#999]" />
		</div>
		<h3 class="text-[14px] font-semibold capitalize">{title.replace(/-/g, ' ')} — Module coming</h3>
		<p class="text-[12px] text-[#777] mt-1">
			This supporting page is placeholder per spec. Products, Categories, Collections, Inventory are
			fully linked in same dashboard chrome.
		</p>
		<a
			href={resolve('/dashboard')}
			class="inline-flex items-center justify-center mt-4 h-8 rounded-full border bg-white px-4 text-[12px] font-medium hover:border-[#242424] transition"
			style="border-color: var(--border);"
		>
			Back to Overview
		</a>
	</div>
</div>
