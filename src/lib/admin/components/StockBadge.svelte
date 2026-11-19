<script lang="ts">
	import type { StockLevel } from '#lib/admin/types.ts';

	let { status, stock, tracking }: { status: StockLevel; stock: number; tracking: boolean } =
		$props();
</script>

<!--
	@component
	Stock level pill (converted from ref StockBadge).
-->

{#if !tracking}
	<span class="text-[11px] text-muted-foreground">Stock not tracked</span>
{:else if status === 'out'}
	<span
		class="inline-flex rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive"
	>
		Out • {stock}
	</span>
{:else if status === 'low'}
	<span
		class="inline-flex rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning-text"
	>
		Low • {stock}
	</span>
{:else}
	<span
		class="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
	>
		In • {stock}
	</span>
{/if}
