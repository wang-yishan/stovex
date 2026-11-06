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
	<span class="text-[11px] text-[#777]">Stock not tracked</span>
{:else if status === 'out'}
	<span
		class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[#FFF0F0] text-[#A33A37] border-[#F2C2C0]"
	>
		Out • {stock}
	</span>
{:else if status === 'low'}
	<span
		class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[#FFF8E6] text-[#8A6A24] border-[#F3D9A0]"
	>
		Low • {stock}
	</span>
{:else}
	<span
		class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[#F5F5F4] text-[#5A5A5A] border-[#EAEAEA]"
	>
		In • {stock}
	</span>
{/if}
