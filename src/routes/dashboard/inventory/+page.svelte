<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Path } from '$app/types';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import StockBadge from '#lib/admin/components/StockBadge.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { stockStatus } from '#lib/admin/data.ts';
	import type { StockLevel } from '#lib/admin/types.ts';
	import { Eye, PenLine, TriangleAlert } from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let statusFilter = $state<'All' | StockLevel>('All');
	let target = $state<{
		productId: string;
		variantId?: string;
		currentStock: number;
		sku: string;
		productName: string;
		variantName?: string;
	} | null>(null);
	let delta = $state(0);
	let reason = $state('');
	let note = $state('');

	type Row = {
		productId: string;
		productName: string;
		variantId?: string;
		variantName?: string;
		sku: string;
		stock: number;
		threshold: number;
		status: StockLevel;
		updatedAt: string;
		tracking: boolean;
	};

	let rows = $derived.by((): Row[] => {
		const all: Row[] = [];
		for (const p of admin.products) {
			if (p.hasVariants) {
				for (const v of p.variants) {
					all.push({
						productId: p.id,
						productName: p.name,
						variantId: v.id,
						variantName: v.name,
						sku: v.sku || p.sku || '',
						stock: v.stock,
						threshold: v.lowThreshold || p.lowStockThreshold,
						status: stockStatus(v.stock, v.lowThreshold || p.lowStockThreshold, p.trackInventory),
						updatedAt: p.updatedAt,
						tracking: p.trackInventory
					});
				}
			} else {
				all.push({
					productId: p.id,
					productName: p.name,
					sku: p.sku || '',
					stock: p.stock,
					threshold: p.lowStockThreshold,
					status: stockStatus(p.stock, p.lowStockThreshold, p.trackInventory),
					updatedAt: p.updatedAt,
					tracking: p.trackInventory
				});
			}
		}
		const q = search.toLowerCase();
		return all.filter((r) => {
			const okQ =
				!q ||
				r.productName.toLowerCase().includes(q) ||
				r.sku.toLowerCase().includes(q) ||
				(r.variantName?.toLowerCase().includes(q) ?? false);
			const okS = statusFilter === 'All' || r.status === statusFilter;
			return okQ && okS;
		});
	});

	let lowRows = $derived(rows.filter((r) => r.status === 'low' && r.tracking));

	function openAdjust(r: Row) {
		target = {
			productId: r.productId,
			variantId: r.variantId,
			currentStock: r.stock,
			sku: r.sku,
			productName: r.productName,
			variantName: r.variantName
		};
		delta = 0;
		reason = '';
		note = '';
	}

	function confirmAdjust() {
		if (!target || !reason) {
			admin.showToast('Reason required', 'error');
			return;
		}
		if (delta === 0) {
			admin.showToast('Quantity change cannot be 0', 'error');
			return;
		}
		admin.adjustStock({
			productId: target.productId,
			variantId: target.variantId,
			delta,
			reason: reason as 'Restock' | 'Correction' | 'Damaged',
			note: note || undefined
		});
		admin.showToast('Stock adjusted — movement traceable', 'success');
		target = null;
	}

	function chipClass(type: string) {
		return type === 'restock'
			? 'bg-[#F0FAF6] text-[#1A7A52] border-[#C7EBDB]'
			: type === 'damaged'
				? 'bg-[#FFF0F0] text-[#A33A37] border-[#F2C2C0]'
				: 'bg-[#F5F5F4] text-[#5A5A5A] border-[#EAEAEA]';
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Inventory' }]}
	title="Inventory"
	subtitle="Stock levels & movements."
/>

<div class="mx-auto max-w-[1280px] w-full {isMobile ? 'px-4 py-4 pb-[112px]' : 'px-4 md:px-6 lg:px-8 py-6'}">
	{#if lowRows.length > 0}
		<div class="bg-[#FFFDF3] border rounded-[12px] p-3 mb-4 flex items-start gap-2" style="border-color: #F0D99E;">
			<TriangleAlert class="h-5 w-5 text-[#D69A35] mt-0.5 shrink-0" />
			<div>
				<p class="text-[12px] font-medium text-[#7A5A1A]">Low-stock alerts — {lowRows.length} items need attention</p>
				<p class="text-[11px] text-[#8A6A24] mt-0.5">
					{lowRows.slice(0, 3).map((r) => `${r.productName}${r.variantName ? ` / ${r.variantName}` : ''} (${r.stock})`).join(', ')}
				</p>
			</div>
		</div>
	{/if}

	<div class="bg-white border rounded-[12px] p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 justify-between" style="border-color: var(--border);">
		<SearchInput bind:value={search} placeholder="Search by name/SKU..." />
		<div class="flex gap-2">
			<select
				class="h-10 sm:h-9 w-full sm:w-auto rounded-full border bg-white px-3 pr-7 text-[12px] font-medium appearance-none"
				style="border-color: var(--border);"
				bind:value={statusFilter}
			>
				<option value="All">All Stock</option>
				<option value="in-stock">In Stock</option>
				<option value="low">Low</option>
				<option value="out">Out</option>
			</select>
		</div>
	</div>

	<div class="bg-white border rounded-[12px] overflow-hidden mb-6" style="border-color: var(--border);">
		{#if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="bg-[#FBFBFA] border-b text-[10px] font-semibold tracking-[0.08em] uppercase text-[#999]" style="border-color: var(--border);">
							<th class="px-5 py-2.5">Product / Variant</th>
							<th class="px-5 py-2.5">SKU</th>
							<th class="px-5 py-2.5">Current stock</th>
							<th class="px-5 py-2.5">Low threshold</th>
							<th class="px-5 py-2.5">Status</th>
							<th class="px-5 py-2.5">Last updated</th>
							<th class="px-5 py-2.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y" style="border-color: var(--border);">
						{#each rows as r, i (`${r.productId}-${r.variantId || 'prod'}-${i}`)}
							<tr class="hover:bg-[#F8F8F7]">
								<td class="px-5 py-3">
									<div class="text-[13px] font-medium">{r.productName}</div>
									{#if r.variantName}<div class="text-[11px] text-[#777]">{r.variantName}</div>{/if}
								</td>
								<td class="px-5 py-3 mono text-[11px] text-[#777]">{r.sku || '—'}</td>
								<td class="px-5 py-3 text-[13px] font-medium">{r.tracking ? r.stock : '—'}</td>
								<td class="px-5 py-3 text-[12px]">{r.threshold}</td>
								<td class="px-5 py-3"><StockBadge status={r.status} stock={r.stock} tracking={r.tracking} /></td>
								<td class="px-5 py-3 text-[11px] text-[#777]">{new Date(r.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
								<td class="px-5 py-3 text-right">
									<div class="flex justify-end gap-1">
										<button type="button" class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]" style="border-color: var(--border);" onclick={() => void goto(resolve(`/dashboard/products/${r.productId}` as Path))} aria-label="View product"><Eye class="h-3.5 w-3.5 text-[#777]" /></button>
										<button type="button" class="h-8 px-2.5 rounded-full border bg-white text-[12px] font-medium flex items-center gap-1" style="border-color: var(--border);" onclick={() => openAdjust(r)}><PenLine class="h-4 w-4 shrink-0" /> Adjust</button>
									</div>
								</td>
							</tr>
						{/each}
						{#if rows.length === 0}
							<tr><td colspan="7" class="px-5 py-12 text-center text-[13px]">No inventory items</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y" style="border-color: var(--border);">
				{#each rows as r, i (`${r.productId}-${r.variantId}-${i}`)}
					<div class="p-4 flex justify-between gap-3">
						<div>
							<div class="text-[13px] font-medium">{r.productName}</div>
							<div class="text-[11px] text-[#777]">{r.variantName || '—'} • <span class="mono">{r.sku}</span></div>
							<div class="flex gap-2 mt-1">
								<StockBadge status={r.status} stock={r.stock} tracking={r.tracking} />
								<span class="text-[11px] text-[#777]">Thr {r.threshold}</span>
							</div>
						</div>
						<button type="button" class="h-10 rounded-full border bg-white px-4 text-[12px] font-medium self-center shrink-0" style="border-color: var(--border);" onclick={() => openAdjust(r)}>Adjust</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="bg-white border rounded-[12px] overflow-hidden" style="border-color: var(--border);">
		<div class="px-4 md:px-5 py-3 border-b flex items-center justify-between" style="border-color: var(--border);">
			<h3 class="text-[13px] font-semibold">Movement history — traceable</h3>
			<span class="text-[11px] text-[#777]">{admin.movements.length} records • never silently overwrite</span>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead>
					<tr class="bg-[#FBFBFA] border-b text-[10px] font-semibold tracking-[0.08em] uppercase text-[#999]" style="border-color: var(--border);">
						<th class="px-5 py-2.5">Date</th>
						<th class="px-5 py-2.5">Product</th>
						<th class="px-5 py-2.5">SKU</th>
						<th class="px-5 py-2.5">Type</th>
						<th class="px-5 py-2.5">Change</th>
						<th class="px-5 py-2.5">Prev → New</th>
						<th class="px-5 py-2.5">Reason</th>
					</tr>
				</thead>
				<tbody class="divide-y" style="border-color: var(--border);">
					{#each admin.movements as m (m.id)}
						<tr class="hover:bg-[#F8F8F7]">
							<td class="px-5 py-2.5 text-[11px] text-[#777]">{new Date(m.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
							<td class="px-5 py-2.5 text-[12px]">{m.productName}{m.variantName ? ` / ${m.variantName}` : ''}</td>
							<td class="px-5 py-2.5 mono text-[11px] text-[#777]">{m.sku}</td>
							<td class="px-5 py-2.5"><span class="text-[10px] px-2 py-0.5 rounded-full border {chipClass(m.type)}">{m.type}</span></td>
							<td class="px-5 py-2.5 text-[12px] font-medium"><span class={m.quantityChange >= 0 ? 'text-[#269B65]' : 'text-[#D9534F]'}>{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}</span></td>
							<td class="px-5 py-2.5 text-[11px]">{m.previousStock} → {m.newStock}</td>
							<td class="px-5 py-2.5 text-[11px] text-[#777] max-w-[200px] truncate">{m.reason}</td>
						</tr>
					{/each}
					{#if admin.movements.length === 0}
						<tr><td colspan="7" class="px-5 py-12 text-center text-[13px]">No movements yet</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

{#if target}
	<Modal title="Adjust stock">
		<p class="text-[12px] text-[#777] mt-1">
			{target.productName}{target.variantName ? ` / ${target.variantName}` : ''} — current {target.currentStock} • SKU {target.sku || '—'}
		</p>
		<div class="mt-3 space-y-3">
			<div>
				<label for="adj-delta" class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">Quantity change (+/-)</label>
				<input id="adj-delta" type="number" class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]" style="border-color: var(--border);" placeholder="e.g. 5 or -2" bind:value={delta} />
				<p class="text-[10px] text-[#777] mt-1">Never silently overwrite — creates movement record traceable. Inventory never negative via manual adjustment.</p>
			</div>
			<div>
				<label for="adj-reason" class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">Reason required</label>
				<select id="adj-reason" class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-white" style="border-color: var(--border);" bind:value={reason}>
					<option value="">Select reason</option>
					<option value="Restock">Restock</option>
					<option value="Correction">Correction</option>
					<option value="Damaged">Damaged</option>
				</select>
			</div>
			<div>
				<label for="adj-note" class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">Note</label>
				<input id="adj-note" class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]" style="border-color: var(--border);" placeholder="Optional note" bind:value={note} />
			</div>
			<div class="bg-[#FBFBFA] border rounded-[8px] p-2 text-[11px] text-[#777]" style="border-color: var(--border);">
				New stock will be: <b>{Math.max(0, target.currentStock + delta)}</b>
				{#if target.currentStock + delta < 0}<span class="text-[#D9534F]"> — will be clamped to 0, never negative</span>{/if}
			</div>
		</div>
		<div class="flex gap-2 mt-4">
			<button type="button" class="flex-1 h-10 rounded-full bg-[#242424] text-white text-[12px]" onclick={confirmAdjust}>Confirm adjust</button>
			<button type="button" class="flex-1 h-10 rounded-full border bg-white text-[12px]" style="border-color: var(--border);" onclick={() => (target = null)}>Cancel</button>
		</div>
	</Modal>
{/if}
