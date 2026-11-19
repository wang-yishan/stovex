<script lang="ts">
	import type { ProductStatus } from '#lib/admin/types.ts';

	let { status }: { status: ProductStatus } = $props();
</script>

<!--
	@component
	Product lifecycle pill (converted from ref StatusBadge).
-->

{#if status === 'active'}
	<span
		class="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success-text"
	>
		<span class="h-1.5 w-1.5 rounded-full bg-success"></span>
		Active
	</span>
{:else if status === 'draft'}
	<span
		class="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
	>
		<span class="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"></span>
		Draft
	</span>
{:else}
	<span
		class="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
	>
		<span class="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></span>
		Archived
	</span>
{/if}
