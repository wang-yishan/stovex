<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import { page } from '$app/state';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
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
		ChevronDown,
		CircleCheck,
		Package,
		TriangleAlert
	} from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

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

<Topbar crumbs={[{ label: 'Dashboard' }]} title="Overview" subtitle="Monitor your store activity.">
	{#snippet actions()}
		<Button variant="outline">
			Today
			<ChevronDown class="h-4 w-4 text-muted-foreground" />
		</Button>
	{/snippet}
</Topbar>

<div
	class="mx-auto w-full max-w-[1280px] {isMobile
		? 'px-4 py-4 pb-[112px]'
		: 'px-4 py-6 md:px-6 lg:px-8'}"
>
	<!-- KPI cards -->
	<div class="mb-4 flex flex-wrap gap-3 md:gap-4">
		<!-- Orders KPI -->
		<div
			class="min-w-0 grow basis-[calc(50%-0.375rem)] rounded-[12px] border border-border bg-card p-4 md:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]"
		>
			<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border bg-[#FFF8E6]"
					style="border-color: #F3D9A0;"
				>
					<ShoppingCart class="h-5 w-5 text-[#8A6A24]" strokeWidth={1.6} />
				</div>
				<span
					class="ml-auto inline-flex max-w-[92px] shrink-0 items-center gap-1 truncate rounded-full border bg-[#FFF8E6] px-2 py-0.5 text-[10px] font-medium text-[#8A6A24]"
					style="border-color: #F3D9A0;"
				>
					<span class="h-1 w-1 shrink-0 rounded-full bg-[#D69A35]"></span>
					Needs action
				</span>
			</div>
			<div
				class="text-[24px] leading-none font-semibold tracking-tight text-foreground sm:text-[28px]"
			>
				{ordersNeedingAction}
			</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Orders awaiting confirmation</div>
		</div>

		<!-- Active products KPI -->
		<div
			class="min-w-0 grow basis-[calc(50%-0.375rem)] rounded-[12px] border border-border bg-card p-4 md:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]"
		>
			<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border bg-[#F0FAF6]"
					style="border-color: #C7EBDB;"
				>
					<Package class="h-5 w-5 text-[#1A7A52]" strokeWidth={1.6} />
				</div>
				<span
					class="ml-auto inline-flex max-w-[92px] shrink-0 items-center gap-1 truncate rounded-full border bg-[#F0FAF6] px-2 py-0.5 text-[10px] font-medium text-[#1A7A52]"
					style="border-color: #C7EBDB;"
				>
					<span class="h-1 w-1 shrink-0 rounded-full bg-[#269B65]"></span>
					Live
				</span>
			</div>
			<div
				class="text-[24px] leading-none font-semibold tracking-tight text-foreground sm:text-[28px]"
			>
				{activeCount}
			</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Active in storefront</div>
		</div>

		<!-- Low stock KPI -->
		<div
			class="min-w-0 grow basis-[calc(50%-0.375rem)] rounded-[12px] border border-border bg-card p-4 md:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]"
		>
			<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border bg-[#FFF0F0]"
					style="border-color: #F2C2C0;"
				>
					<TriangleAlert class="h-5 w-5 text-[#A33A37]" strokeWidth={1.6} />
				</div>
				<span
					class="ml-auto inline-flex max-w-[92px] shrink-0 items-center gap-1 truncate rounded-full border bg-[#FFF0F0] px-2 py-0.5 text-[10px] font-medium text-[#A33A37]"
					style="border-color: #F2C2C0;"
				>
					<span class="h-1 w-1 shrink-0 rounded-full bg-[#D9534F]"></span>
					Attention
				</span>
			</div>
			<div
				class="text-[24px] leading-none font-semibold tracking-tight text-foreground sm:text-[28px]"
			>
				{lowCount}
			</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Low stock items</div>
		</div>

		<!-- Store health KPI -->
		<div
			class="min-w-0 grow basis-[calc(50%-0.375rem)] rounded-[12px] border border-border bg-card p-4 md:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]"
		>
			<div class="mb-3 flex flex-wrap items-start justify-between gap-2">
				<div
					class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-muted"
				>
					<LayoutDashboard class="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
				</div>
				<span
					class="ml-auto inline-flex max-w-[92px] shrink-0 items-center gap-1 truncate rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
				>
					<span class="h-1 w-1 shrink-0 rounded-full bg-[#269B65]"></span>
					Healthy
				</span>
			</div>
			<div
				class="text-[24px] leading-none font-semibold tracking-tight text-foreground sm:text-[28px]"
			>
				<CircleCheck class="h-6 w-6 text-[#269B65]" strokeWidth={1.6} />
			</div>
			<div class="mt-1 text-[11px] text-muted-foreground">All systems operational</div>
		</div>
	</div>

	<!-- Orders -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<div class="overflow-hidden rounded-[12px] border border-border bg-card">
			<div class="flex items-center justify-between border-b border-border px-4 py-3 md:px-5">
				<h3 class="text-[13px] font-semibold">Recent orders</h3>
				<span class="text-[11px] text-muted-foreground">Latest {SEED_ORDERS.length}</span>
			</div>

			{#if ordersView}
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead>
							<tr
								class="border-b border-border bg-field text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
							>
								<th class="px-4 py-2">Order</th>
								<th class="px-4 py-2">Customer</th>
								<th class="px-4 py-2">Date</th>
								<th class="px-4 py-2">Total</th>
								<th class="px-4 py-2 text-right">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each SEED_ORDERS as order (order.id)}
								<tr class="hover:bg-muted">
									<td class="mono px-4 py-2.5 text-[11px] text-muted-foreground">{order.id}</td>
									<td class="px-4 py-2.5 text-[12px]">{order.customer}</td>
									<td class="px-4 py-2.5 text-[11px] text-muted-foreground">{order.date}</td>
									<td class="px-4 py-2.5 text-[12px] font-medium">{order.total}</td>
									<td class="px-4 py-2.5 text-right">
										<span
											class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium {order.statusTone ===
											'amber'
												? 'border-[#F3D9A0] bg-[#FFF8E6] text-[#8A6A24]'
												: 'border-border bg-muted text-muted-foreground'}"
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
				<div class="divide-y divide-border">
					{#each SEED_ORDERS as order (order.id)}
						<div class="p-4">
							<div class="flex items-center justify-between">
								<span class="mono text-[11px] text-muted-foreground">{order.id}</span>
								<span
									class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium {order.statusTone ===
									'amber'
										? 'border-[#F3D9A0] bg-[#FFF8E6] text-[#8A6A24]'
										: 'border-border bg-muted text-muted-foreground'}"
								>
									{order.status}
								</span>
							</div>
							<div class="mt-1 text-[13px] font-medium">{order.customer}</div>
							<div class="mt-1 flex items-center justify-between">
								<span class="text-[11px] text-muted-foreground">{order.date}</span>
								<span class="text-[12px] font-semibold">{order.total}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Activity stream: matches ref Recent store activity (timeline + footer) -->
		<div class="overflow-hidden rounded-[12px] border border-border bg-card">
			<div class="flex items-center justify-between border-b border-border px-4 py-3.5 md:px-5">
				<h2 class="text-[13px] font-semibold tracking-tight text-foreground">
					Recent store activity
				</h2>
			</div>
			<div class="p-4 md:p-5">
				<div class="relative">
					<div class="absolute top-1 bottom-1 left-[4px] w-px bg-border"></div>
					<div class="space-y-5">
						{#each SEED_ACTIVITY as item (item.time + item.title)}
							<div class="relative flex gap-3">
								<span
									class="mt-1 h-2 w-2 shrink-0 rounded-full {item.dot} relative z-10 ring-4 ring-card"
								></span>
								<div class="-mt-0.5 min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="text-[11px] text-muted-foreground">{item.time}</span>
									</div>
									<div class="mt-1 text-[12px] leading-snug">
										<span class="text-muted-foreground">{item.title}</span> <span class="font-medium text-foreground">{item.entity}</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
			<div
				class="flex items-center justify-between border-t border-border bg-field px-5 py-3 text-[11px] text-muted-foreground"
			>
				<span>Showing last 6 events</span>
			</div>
		</div>
	</div>
</div>
