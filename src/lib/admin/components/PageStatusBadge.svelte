<script lang="ts">
	import type { PageStatus } from '#lib/admin/types.ts';

	let { status }: { status: PageStatus } = $props();
</script>

<!--
	@component
	Page lifecycle pill (ref Cr badge: draft / published / archived).
-->

{#if status === 'published'}
	<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[#F0FAF6] text-[#1A7A52] border-[#C7EBDB]">
		<span class="h-1 w-1 rounded-full bg-[#269B65]"></span>
		Published
	</span>
{:else if status === 'draft'}
	<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[#F5F5F4] text-[#5A5A5A] border-[#EAEAEA]">
		<span class="h-1 w-1 rounded-full bg-[#999]"></span>
		Draft
	</span>
{:else}
	<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-[#F5F5F4] text-[#5A5A5A] border-[#EAEAEA]">
		<span class="h-1 w-1 rounded-full bg-[#777]"></span>
		Archived
	</span>
{/if}
