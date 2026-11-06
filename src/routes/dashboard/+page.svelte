<script lang="ts">
	import { get, innerWidth } from 'svelte/reactivity/window';
	import { page } from '$app/state';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import {
		SEED_ORDERS,
		SEED_ACTIVITY,
		effectiveStock,
		lowThreshold,
		stockStatus
	} from '#lib/admin/data.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import {
		ShoppingCart,
		LayoutDashboard,
		Bell,
		ChevronDown,
		Package,
		TriangleAlert
	} from '@lucide/svelte';

	const isMobile = $derived(get(innerWidth) < 768);

	let activeCount = $derived(admin.products.filter((p) => p.status === 'active').length);
	let lowCount = $derived(
		admin.products.filter((p) => {
			const s = effectiveStock(p);
			return p.trackInventory && s > 0 && s <= lowThreshold(p);
		}).length
	);
	let ordersNeedingAction = 3; /* Ref: static KPI value */

	/* Mobile uses card layout, desktop uses table */
	const ordersView = $derived(!isMobile);
</script>

<!--
	@component
	Full Overview dashboard (KPIs, seed orders table/cards, activity stream).
-->

<Topbar
	crumbs={[{ label: 'Dashboard' }]}
	title="Overview"
	subtitle="Monitor your store activity."
>
	{#snippet actions()}
		<button
			type="button"
			class="h-8 rounded-full border bg-white px-3 text-[12px] font-medium flex items-center gap-1.5 hover:border-[#242424] transition"
			style="border-color: var(--border);"
		>
			Today
			<ChevronDown className="h-3.5 w-3.5 text-[#777]" />
		</button>
		<button
			type="button"
			class="h-8 w-8 rounded-full border bg-white flex items-center justify-center relative hover:border-[#242424] transition"
			style="border-color: var(--border);"
			aria-label="Notifications"
		>
			<Bell className="h-4 w-4 text-[#242424]" strokeWidth={1.6} />
			<span
				class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#D9534F] border-2 border-white"
			></span>
		</button>
	{/snippet}
</Topbar>

<div class="mx-auto max-w-[1280px] w-full {isMobile ? 'px-4 py-4 pb-[112px]' : 'px-4 md:px-6 lg:px-8 py-6'}">
	<!-- KPI cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
		<!-- Orders KPI -->
		<div class="bg-white border rounded-[12px] p-4 min-w-0" style="border-color: var(--border);">
			<div class="flex items-start justify-between gap-2 mb-3">
				<div class="h-8 w-8 rounded-[8px] bg-[#FFF8E6] border flex items-center justify-center shrink-0" style="border-color: #F3D9A0;">
					<ShoppingCart className="h-4 w-4 text-[#8A6A24]" strokeWidth={1.6} />
				</div>
				<span
					class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF8E6] text-[#8A6A24] border shrink-0 max-w-[92px] truncate"
					style="border-color: #F3D9A0;"
				>
					<span class="h-1 w-1 rounded-full bg-[#D69A35] shrink-0"></span>
					Needs action
				</span>
			</div>
			<div class="text-[28px] font-semibold leading-none tracking-tight text-[#242424]">
				{ordersNeedingAction}
			</div>
			<div class="mt-1 text-[11px] text-[#777]">Orders awaiting confirmation</div>
		</div>

		<!-- Active products KPI -->
		<div class="bg-white border rounded-[12px] p-4 min-w-0" style="border-color: var(--border);">
			<div class="flex items-start justify-between gap-2 mb-3">
				<div class="h-8 w-8 rounded-[8px] bg-[#F0FAF6] border flex items-center justify-center shrink-0" style="border-color: #C7EBDB;">
					<Package className="h-4 w-4 text-[#1A7A52]" strokeWidth={1.6} />
				</div>
				<span
					class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F0FAF6] text-[#1A7A52] border shrink-0 max-w-[92px] truncate"
					style="border-color: #C7EBDB;"
				>
					<span class="h-1 w-1 rounded-full bg-[#269B65] shrink-0"></span>
					Live
				</span>
			</div>
			<div class="text-[28px] font-semibold leading-none tracking-tight text-[#242424]">
				{activeCount}
			</div>
			<div class="mt-1 text-[11px] text-[#777]">Active in storefront</div>
		</div>

		<!-- Low stock KPI -->
		<div class="bg-white border rounded-[12px] p-4 min-w-0" style="border-color: var(--border);">
			<div class="flex items-start justify-between gap-2 mb-3">
				<div class="h-8 w-8 rounded-[8px] bg-[#FFF0F0] border flex items-center justify-center shrink-0" style="border-color: #F2C2C0;">
					<TriangleAlert className="h-4 w-4 text-[#A33A37]" strokeWidth={1.6} />
				</div>
				<span
					class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF0F0] text-[#A33A37] border shrink-0 max-w-[92px] truncate"
					style="border-color: #F2C2C0;"
				>
					<span class="h-1 w-1 rounded-full bg-[#D9534F] shrink-0"></span>
					Attention
				</span>
			</div>
			<div class="text-[28px] font-semibold leading-none tracking-tight text-[#242424]">
				{lowCount}
			</div>
			<div class="mt-1 text-[11px] text-[#777]">Low stock items</div>
		</div>

		<!-- Store health KPI -->
		<div class="bg-white border rounded-[12px] p-4 min-w-0" style="border-color: var(--border);">
			<div class="flex items-start justify-between gap-2 mb-3">
				<div class="h-8 w-8 rounded-[8px] bg-[#F5F5F4] border flex items-center justify-center shrink-0" style="border-color: var(--border);">
					<LayoutDashboard className="h-4 w-4 text-[#5A5A5A]" strokeWidth={1.6} />
				</div>
				<span
					class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F4] text-[#5A5A5A] border shrink-0 max-w-[92px] truncate"
					style="border-color: var(--border);"
				>
					<span class="h-1 w-1 rounded-full bg-[#269B65] shrink-0"></span>
					Healthy
				</span>
			</div>
			<div class="text-[28px] font-semibold leading-none tracking-tight text-[#242424]">
				✓
			</div>
			<div class="mt-1 text-[11px] text-[#777]">All systems operational</div>
		</div>
	</div>

	<!-- Orders -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div
			class="bg-white border rounded-[12px] overflow-hidden"
			style="border-color: var(--border);"
		>
			<div class="px-4 md:px-5 py-3 border-b flex items-center justify-between" style="border-color: var(--border);">
				<h3 class="text-[13px] font-semibold">Recent orders</h3>
				<span class="text-[11px] text-[#777]">Latest {SEED_ORDERS.length}</span>
			</div>

			{#if ordersView}
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead>
							<tr class="bg-[#FBFBFA] border-b text-[10px] font-semibold tracking-[0.08em] uppercase text-[#999]" style="border-color: var(--border);">
								<th class="px-4 py-2">Order</th>
								<th class="px-4 py-2">Customer</th>
								<th class="px-4 py-2">Date</th>
								<th class="px-4 py-2">Total</th>
								<th class="px-4 py-2 text-right">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y" style="border-color: var(--border);">
							{#each SEED_ORDERS as order (order.id)}
								<tr class="hover:bg-[#F8F8F7]">
									<td class="px-4 py-2.5 mono text-[11px] text-[#777]">{order.id}</td>
									<td class="px-4 py-2.5 text-[12px]">{order.customer}</td>
									<td class="px-4 py-2.5 text-[11px] text-[#777]">{order.date}</td>
									<td class="px-4 py-2.5 text-[12px] font-medium">{order.total}</td>
									<td class="px-4 py-2.5 text-right">
										<span
											class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border {order.statusTone === 'amber'
												? 'bg-[#FFF8E6] text-[#8A6A24] border-[#F3D9A0]'
												: 'bg-[#F5F5F4] text-[#5A5A5A] border-[#EAEAEA]'}"
										>
											{order.status}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="divide-y" style="border-color: var(--border);">
					{#each SEED_ORDERS as order (order.id)}
						<div class="p-4">
							<div class="flex items-center justify-between">
								<span class="mono text-[11px] text-[#777]">{order.id}</span>
								<span
									class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border {order.statusTone === 'amber'
										? 'bg-[#FFF8E6] text-[#8A6A24] border-[#F3D9A0]'
										: 'bg-[#F5F5F4] text-[#5A5A5A] border-[#EAEAEA]'}"
								>
									{order.status}
								</span>
							</div>
							<div class="text-[13px] font-medium mt-1">{order.customer}</div>
							<div class="flex items-center justify-between mt-1">
								<span class="text-[11px] text-[#777]">{order.date}</span>
								<span class="text-[12px] font-semibold">{order.total}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Activity stream -->
		<div class="bg-white border rounded-[12px] overflow-hidden" style="border-color: var(--border);">
			<div class="px-4 md:px-5 py-3 border-b flex items-center justify-between" style="border-color: var(--border);">
				<h3 class="text-[13px] font-semibold">Recent activity</h3>
				<span class="text-[11px] text-[#777]">Live</span>
			</div>
			<div class="divide-y" style="border-color: var(--border);">
				{#each SEED_ACTIVITY as item (item.time + item.title)}
					<div class="px-4 md:px-5 py-3 flex items-start gap-3">
						<span class="h-2 w-2 rounded-full mt-1.5 shrink-0 {item.dot}"></span>
						<div class="flex-1 min-w-0">
							<div class="text-[12px] font-medium">{item.title}</div>
							<div class="text-[11px] text-[#777]">
								{item.entity} • {item.time}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
