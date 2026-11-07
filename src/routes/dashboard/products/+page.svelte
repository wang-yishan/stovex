<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import { SvelteSet } from 'svelte/reactivity';
	import { innerWidth } from 'svelte/reactivity/window';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import StatusBadge from '#lib/admin/components/StatusBadge.svelte';
	import StockBadge from '#lib/admin/components/StockBadge.svelte';
	import ConfirmModal from '#lib/admin/components/ConfirmModal.svelte';
	import WhatsAppModal from '#lib/admin/components/WhatsAppModal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, lowThreshold, stockStatus } from '#lib/admin/data.ts';
	import type { Product, ProductStatus, StockLevel } from '#lib/admin/types.ts';
	import {
		Archive,
		ArrowDown,
		ArrowUp,
		ChevronLeft,
		ChevronRight,
		Copy,
		Ellipsis,
		Eye,
		EyeOff,
		MessageCircle,
		Package,
		PenLine,
		Plus,
		Search,
		TriangleAlert,
		Trash2
	} from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let statusFilter = $state<'all' | ProductStatus>('all');
	let categoryFilter = $state<string>('all');
	let stockFilter = $state<'all' | StockLevel>('all');
	let sortKey = $state<'updated' | 'name' | 'price' | 'stock'>('updated');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let page = $state(1);
	const PAGE_SIZE = 10;

	let selected = new SvelteSet<string>();
	let storefrontPreview = $state(false);
	let loading = $state(true);
	let deleteId = $state<string | null>(null);
	let deleteMany = $state(false);
	let waProduct = $state<Product | null>(null);

	// Ref: brief loading skeleton on mount (650ms).
	$effect(() => {
		const t = setTimeout(() => (loading = false), 650);
		return () => clearTimeout(t);
	});

	// Ref stats: total / active / draft / low-stock (needs attention).
	let stats = $derived.by(() => ({
		total: admin.products.length,
		active: admin.products.filter((p) => p.status === 'active').length,
		draft: admin.products.filter((p) => p.status === 'draft').length,
		low: admin.products.filter((p) => {
			const n = effectiveStock(p);
			return p.trackInventory && n > 0 && n <= lowThreshold(p);
		}).length
	}));

	let filtered = $derived.by(() => {
		let list = [...admin.products];
		const q = search.toLowerCase();
		if (q) {
			list = list.filter(
				(p) =>
					p.name.toLowerCase().includes(q) ||
					(p.sku ? p.sku.toLowerCase().includes(q) : false) ||
					p.variants.some((v) => (v.sku ? v.sku.toLowerCase().includes(q) : false))
			);
		}
		if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
		if (categoryFilter !== 'all') list = list.filter((p) => p.categoryId === categoryFilter);
		if (stockFilter !== 'all') {
			list = list.filter(
				(p) => stockStatus(effectiveStock(p), lowThreshold(p), p.trackInventory) === stockFilter
			);
		}
		if (storefrontPreview) list = list.filter((p) => p.status === 'active');
		list.sort((a, b) => {
			let n = 0;
			if (sortKey === 'name') n = a.name.localeCompare(b.name);
			else if (sortKey === 'price') n = a.basePrice - b.basePrice;
			else if (sortKey === 'stock') n = effectiveStock(a) - effectiveStock(b);
			else n = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			return sortDir === 'asc' ? n : -n;
		});
		return list;
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
	// Clamp current page to the (possibly shrunk) page count without an effect.
	let clampedPage = $derived(Math.min(page, totalPages));
	let pageItems = $derived(filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE));

	// Reset page when filters change.
	$effect(() => {
		search;
		statusFilter;
		categoryFilter;
		stockFilter;
		page = 1;
	});

	function toggleSelect(id: string) {
		if (selected.has(id)) selected.delete(id);
		else selected.add(id);
	}
	function toggleAll() {
		if (selected.size === pageItems.length && pageItems.length > 0) selected.clear();
		else {
			selected.clear();
			for (const p of pageItems) selected.add(p.id);
		}
	}
	function togglePreview() {
		storefrontPreview = !storefrontPreview;
		selected.clear();
	}
	function bulkSet(status: 'active' | 'archived') {
		admin.setProductsStatus([...selected], status);
		admin.showToast(status === 'active' ? 'Activated selected' : 'Archived selected', 'success');
		selected.clear();
	}
	function doDeleteMany() {
		admin.deleteProducts([...selected]);
		admin.showToast('Deleted selected', 'success');
		selected.clear();
		deleteMany = false;
	}
	function toggleStatus(p: Product) {
		if (p.status === 'archived') {
			admin.setProductsStatus([p.id], 'active');
			admin.showToast('Activated', 'success');
		} else {
			admin.archiveProduct(p.id);
			admin.showToast('Archived', 'success');
		}
	}
	function clearFilters() {
		search = '';
		statusFilter = 'all';
		categoryFilter = 'all';
		stockFilter = 'all';
	}
</script>

<!-- @component
	Products management (ref V2): stat cards, search/filters with stock + sort,
	storefront preview mode, bulk actions, table/mobile cards with SKU & Updated
	columns, hover action menu, in-card pagination, empty states, WhatsApp modal. -->

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Products' }]}
	title="Products"
	subtitle="Manage catalog • {admin.products.length} bags • IDR pricing"
>
	{#snippet actions()}
		<button
			type="button"
			class="flex h-10 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition sm:h-8 {storefrontPreview
				? 'border-transparent bg-[#242424] text-white'
				: 'bg-white hover:border-[#242424]'}"
			style="border-color: {storefrontPreview ? 'transparent' : 'var(--border)'};"
			onclick={togglePreview}
			aria-pressed={storefrontPreview}
		>
			{#if storefrontPreview}
				<EyeOff class="h-4 w-4 shrink-0" />
			{:else}
				<Eye class="h-4 w-4 shrink-0" />
			{/if}
			<span class="hidden sm:inline"
				>{storefrontPreview ? 'Exit Preview' : 'Storefront Preview'}</span
			><span class="sm:hidden">{storefrontPreview ? 'Exit' : 'Preview'}</span>
		</button>
		<a
			href={resolve('/dashboard/products/new' as Path)}
			class="flex h-10 items-center gap-1.5 rounded-full bg-[#343434] px-3 text-[12px] font-medium text-white transition hover:bg-[#242424] sm:h-8 sm:px-4"
		>
			<Plus class="h-4 w-4 shrink-0" />
			<span class="hidden min-[420px]:inline">Add Product</span><span class="min-[420px]:hidden"
				>Add</span
			>
		</a>
	{/snippet}
</Topbar>

<div
	class="mx-auto w-full max-w-[1280px] {isMobile
		? 'px-4 py-4 pb-[112px]'
		: 'px-4 py-6 md:px-6 lg:px-8'}"
>
	<!-- Stat cards -->
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="rounded-[12px] border bg-white p-3.5" style="border-color: var(--border);">
			<div class="text-[11px] font-semibold tracking-[0.08em] text-[#999] uppercase">Total</div>
			<div class="mt-1 text-[22px] leading-none font-semibold">{stats.total}</div>
			<div class="mt-1 text-[11px] text-[#777]">All catalog</div>
		</div>
		<div class="rounded-[12px] border bg-white p-3.5" style="border-color: var(--border);">
			<div
				class="flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-[#999] uppercase"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-[#269B65]"></span> Active
			</div>
			<div class="mt-1 text-[22px] leading-none font-semibold">{stats.active}</div>
			<div class="mt-1 text-[11px] text-[#777]">In storefront</div>
		</div>
		<div class="rounded-[12px] border bg-white p-3.5" style="border-color: var(--border);">
			<div class="text-[11px] font-semibold tracking-[0.08em] text-[#999] uppercase">Draft</div>
			<div class="mt-1 text-[22px] leading-none font-semibold">{stats.draft}</div>
			<div class="mt-1 text-[11px] text-[#777]">Not visible</div>
		</div>
		<div class="rounded-[12px] border bg-[#FFFDF3] p-3.5" style="border-color: #F0D99E;">
			<div
				class="flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-[#8A6A24] uppercase"
			>
				<TriangleAlert class="h-3.5 w-3.5 shrink-0" /> Low Stock
			</div>
			<div class="mt-1 text-[22px] leading-none font-semibold text-[#7A5A1A]">{stats.low}</div>
			<div class="mt-1 text-[11px] text-[#8A6A24]">Needs attention</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-4 rounded-[12px] border bg-white p-3 md:p-4" style="border-color: var(--border);">
		<div class="flex flex-col gap-2 lg:flex-row">
			<SearchInput bind:value={search} placeholder="Search by name, SKU..." />
			<div class="flex flex-wrap items-center gap-2">
				<select
					class="h-10 rounded-full border bg-white px-3 text-[12px] font-medium sm:h-9"
					style="border-color: var(--border);"
					bind:value={statusFilter}
				>
					<option value="all">All Status</option>
					<option value="active">Active</option>
					<option value="draft">Draft</option>
					<option value="archived">Archived</option>
				</select>
				<select
					class="h-10 rounded-full border bg-white px-3 text-[12px] font-medium sm:h-9"
					style="border-color: var(--border);"
					bind:value={categoryFilter}
				>
					<option value="all">All Categories</option>
					{#each admin.categories as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
				<select
					class="h-10 rounded-full border bg-white px-3 text-[12px] font-medium sm:h-9"
					style="border-color: var(--border);"
					bind:value={stockFilter}
				>
					<option value="all">All Stock</option>
					<option value="in-stock">In Stock</option>
					<option value="low">Low</option>
					<option value="out">Out</option>
				</select>
				<select
					class="h-10 rounded-full border bg-white px-3 text-[12px] font-medium sm:h-9"
					style="border-color: var(--border);"
					bind:value={sortKey}
				>
					<option value="updated">Sort: Updated</option>
					<option value="name">Sort: Name</option>
					<option value="price">Sort: Price</option>
					<option value="stock">Sort: Stock</option>
				</select>
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full border bg-white transition hover:border-[#242424] sm:h-9 sm:w-9"
					style="border-color: var(--border);"
					onclick={() => (sortDir = sortDir === 'asc' ? 'desc' : 'asc')}
					aria-label="Toggle sort direction"
					title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
				>
					{#if sortDir === 'asc'}
						<ArrowUp class="h-4 w-4 text-[#777]" />
					{:else}
						<ArrowDown class="h-4 w-4 text-[#777]" />
					{/if}
				</button>
			</div>
		</div>
		{#if storefrontPreview}
			<div
				class="mt-3 flex items-center gap-2 rounded-[8px] border bg-[#F0FAF6] p-2.5 text-[11px] text-[#1A7A52]"
				style="border-color: #C7EBDB;"
			>
				<Eye class="h-4 w-4 shrink-0" />
				<span
					>Storefront preview: only Active products with primary image ordering, correct variant
					price/availability, out-of-stock identification.</span
				>
			</div>
		{/if}
	</div>

	<!-- Bulk selection bar -->
	{#if selected.size > 0}
		<div
			class="mb-4 flex flex-col items-start justify-between gap-3 rounded-[12px] bg-[#242424] p-3 text-white md:flex-row md:items-center"
		>
			<div class="text-[12px] font-medium">{selected.size} selected</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="h-10 rounded-full bg-white px-3 text-[12px] font-medium text-[#242424] sm:h-7 sm:text-[11px]"
					onclick={() => bulkSet('active')}>Activate</button
				>
				<button
					type="button"
					class="h-10 rounded-full border border-white/20 bg-white/10 px-3 text-[12px] font-medium hover:bg-white/20 sm:h-7 sm:text-[11px]"
					onclick={() => bulkSet('archived')}>Archive</button
				>
				<button
					type="button"
					class="h-10 rounded-full bg-[#D9534F] px-3 text-[12px] font-medium sm:h-7 sm:text-[11px]"
					onclick={() => (deleteMany = true)}>Delete</button
				>
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 sm:h-7 sm:w-7"
					onclick={() => selected.clear()}
					aria-label="Clear selection"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}

	<!-- Table (desktop) / mobile cards -->
	<div class="overflow-hidden rounded-[12px] border bg-white" style="border-color: var(--border);">
		{#if loading}
			<div class="space-y-3 p-4" aria-hidden="true">
				{#each Array(5) as _, i (i)}
					<div class="flex animate-pulse gap-3">
						<div class="h-10 w-10 rounded-[8px] bg-[#F5F5F4]"></div>
						<div class="flex-1 space-y-2">
							<div class="h-3 w-1/3 rounded bg-[#F5F5F4]"></div>
							<div class="h-2 w-1/2 rounded bg-[#F5F5F4]"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filtered.length === 0 && admin.products.length === 0}
			<div class="px-6 py-16 text-center">
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-[#F5F5F4]"
					style="border-color: var(--border);"
				>
					<Package class="h-6 w-6 text-[#999]" />
				</div>
				<h3 class="text-[14px] font-semibold">Empty catalog</h3>
				<p class="mx-auto mt-1 max-w-[320px] text-[12px] text-[#777]">
					No products yet. Add your first bag to start managing catalog with full spec.
				</p>
				<a
					href={resolve('/dashboard/products/new' as Path)}
					class="mt-4 inline-flex h-10 items-center rounded-full bg-[#242424] px-5 text-[12px] font-medium text-white sm:h-9"
				>
					Add first product
				</a>
			</div>
		{:else if filtered.length === 0}
			<div class="px-6 py-16 text-center">
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-[#F5F5F4]"
					style="border-color: var(--border);"
				>
					<Search class="h-6 w-6 text-[#999]" />
				</div>
				<h3 class="text-[14px] font-semibold">No search results</h3>
				<p class="mt-1 text-[12px] text-[#777]">Try adjusting search or filters.</p>
				<button
					type="button"
					class="mt-4 h-10 rounded-full border bg-white px-4 text-[12px] font-medium sm:h-8"
					style="border-color: var(--border);"
					onclick={clearFilters}>Clear filters</button
				>
			</div>
		{:else if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr
							class="border-b bg-[#FBFBFA] text-[10px] font-semibold tracking-[0.08em] text-[#999] uppercase"
							style="border-color: var(--border);"
						>
							<th class="w-8 px-3 py-2.5">
								<input
									type="checkbox"
									checked={selected.size === pageItems.length && pageItems.length > 0}
									onchange={toggleAll}
									class="rounded"
									aria-label="Select all on page"
								/>
							</th>
							<th class="px-3 py-2.5 font-semibold">Image</th>
							<th class="px-3 py-2.5 font-semibold">Name</th>
							<th class="px-3 py-2.5 font-semibold">SKU</th>
							<th class="px-3 py-2.5 font-semibold">Category</th>
							<th class="px-3 py-2.5 font-semibold">Price IDR</th>
							<th class="px-3 py-2.5 font-semibold">Stock</th>
							<th class="px-3 py-2.5 font-semibold">Status</th>
							<th class="px-3 py-2.5 font-semibold">Updated</th>
							<th class="px-3 py-2.5 text-right font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y" style="border-color: var(--border);">
						{#each pageItems as p (p.id)}
							{@const stock = effectiveStock(p)}
							{@const st = stockStatus(stock, lowThreshold(p), p.trackInventory)}
							{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
							<tr class="transition hover:bg-[#F8F8F7]">
								<td class="px-3 py-3">
									<input
										type="checkbox"
										checked={selected.has(p.id)}
										onchange={() => toggleSelect(p.id)}
										class="rounded"
										aria-label="Select {p.name}"
									/>
								</td>
								<td class="px-3 py-3">
									<a
										href={resolve(`/dashboard/products/${p.id}` as Path)}
										class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[8px] border bg-[#F5F5F4] text-[10px] font-bold"
										style="border-color: var(--border);"
									>
										{#if primary?.url}
											<img
												src={primary.url}
												alt={primary.alt ?? p.name}
												class="h-full w-full object-cover"
											/>
										{:else}
											{p.name.slice(0, 2).toUpperCase()}
										{/if}
									</a>
								</td>
								<td class="px-3 py-3">
									<a
										href={resolve(`/dashboard/products/${p.id}` as Path)}
										class="block max-w-[180px] truncate text-left text-[13px] leading-tight font-medium text-[#242424] hover:underline"
										title={p.name}>{p.name}</a
									>
									{#if p.featured}
										<span
											class="mt-1 inline-flex rounded-full border bg-[#FFF8E6] px-1.5 py-0.5 text-[9px] text-[#8A6A24]"
											style="border-color: #F3D9A0;">Featured</span
										>
									{/if}
								</td>
								<td class="mono max-w-[110px] truncate px-3 py-3 text-[11px] text-[#777]"
									>{p.sku || '—'}</td
								>
								<td class="px-3 py-3 text-[12px] text-[#5A5A5A]">
									{admin.categories.find((c) => c.id === p.categoryId)?.name ?? '—'}
								</td>
								<td class="px-3 py-3">
									<div class="text-[12px] font-medium">{formatIDR(p.basePrice)}</div>
									{#if p.compareAtPrice}
										<div class="text-[11px] text-[#999] line-through">
											{formatIDR(p.compareAtPrice)}
										</div>
									{/if}
									{#if p.hasVariants}
										<div class="text-[10px] text-[#777]">{p.variants.length} variants</div>
									{/if}
								</td>
								<td class="px-3 py-3"
									><StockBadge status={st} {stock} tracking={p.trackInventory} /></td
								>
								<td class="px-3 py-3"><StatusBadge status={p.status} /></td>
								<td class="px-3 py-3 text-[11px] text-[#777]">
									{new Date(p.updatedAt).toLocaleDateString('id-ID', {
										day: '2-digit',
										month: 'short'
									})}
								</td>
								<td class="px-3 py-3 text-right">
									<div class="flex items-center justify-end gap-1">
										<a
											href={resolve(`/dashboard/products/${p.id}/edit` as Path)}
											class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]"
											style="border-color: var(--border);"
											aria-label="Edit"
										>
											<PenLine class="h-3.5 w-3.5 text-[#777]" />
										</a>
										<button
											type="button"
											class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]"
											style="border-color: var(--border);"
											onclick={() => toggleStatus(p)}
											aria-label={p.status === 'archived' ? 'Reactivate' : 'Archive'}
										>
											<Archive class="h-3.5 w-3.5 text-[#777]" />
										</button>
										<div class="group/menu relative">
											<button
												type="button"
												class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]"
												style="border-color: var(--border);"
												aria-label="More actions"
											>
												<Ellipsis class="h-3.5 w-3.5 text-[#777]" />
											</button>
											<div
												class="absolute top-8 right-0 z-20 hidden min-w-[160px] rounded-[10px] border bg-white p-1 shadow-lg group-hover/menu:block"
												style="border-color: var(--border);"
											>
												<button
													type="button"
													class="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[12px] hover:bg-[#F8F8F7]"
													onclick={() => {
														admin.duplicateProduct(p.id);
														selected.clear();
													}}
												>
													<Copy class="h-3.5 w-3.5" /> Duplicate
												</button>
												<button
													type="button"
													class="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[12px] hover:bg-[#F8F8F7]"
													onclick={() => (waProduct = p)}
												>
													<MessageCircle class="h-3.5 w-3.5" /> WhatsApp enquiry
												</button>
												<button
													type="button"
													class="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[12px] text-[#A33A37] hover:bg-[#FFF0F0]"
													onclick={() => (deleteId = p.id)}
												>
													<Trash2 class="h-3.5 w-3.5" /> Delete
												</button>
											</div>
										</div>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y" style="border-color: var(--border);">
				{#each pageItems as p (p.id)}
					{@const stock = effectiveStock(p)}
					{@const st = stockStatus(stock, lowThreshold(p), p.trackInventory)}
					<div class="flex gap-3 p-4">
						<input
							type="checkbox"
							checked={selected.has(p.id)}
							onchange={() => toggleSelect(p.id)}
							class="mt-1 h-4 w-4 shrink-0 rounded"
							aria-label="Select {p.name}"
						/>
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border bg-[#F5F5F4] text-[11px] font-bold"
							style="border-color: var(--border);"
						>
							{p.name.slice(0, 2).toUpperCase()}
						</div>
						<div class="min-w-0 flex-1">
							<a
								href={resolve(`/dashboard/products/${p.id}` as Path)}
								class="block truncate text-left text-[13px] font-medium">{p.name}</a
							>
							<div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#777]">
								<span class="mono">{p.sku || '—'}</span>
								<span class="h-1 w-1 rounded-full bg-[#D9D9D9]"></span>
								<span class="truncate"
									>{admin.categories.find((c) => c.id === p.categoryId)?.name ?? '—'}</span
								>
								<span class="h-1 w-1 rounded-full bg-[#D9D9D9]"></span>
								<span class="shrink-0">{formatIDR(p.basePrice)}</span>
							</div>
							<div class="mt-2 flex items-center gap-2">
								<StockBadge status={st} {stock} tracking={p.trackInventory} />
								<StatusBadge status={p.status} />
							</div>
						</div>
						<a
							href={resolve(`/dashboard/products/${p.id}/edit` as Path)}
							class="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border bg-white"
							style="border-color: var(--border);"
							aria-label="Edit"
						>
							<PenLine class="h-4 w-4 text-[#777]" />
						</a>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Pagination footer (inside card, ref parity) -->
		{#if !loading && filtered.length > 0}
			<div
				class="flex items-center justify-between gap-3 border-t bg-[#FBFBFA] px-4 py-3 md:px-5"
				style="border-color: var(--border);"
			>
				<span class="text-[11px] text-[#777]">
					Showing <span class="font-medium text-[#242424]">{pageItems.length}</span> of
					<span class="font-medium text-[#242424]">{filtered.length}</span> • Page {clampedPage}/{totalPages}
				</span>
				<div class="flex items-center gap-1">
					<button
						type="button"
						disabled={page <= 1}
						class="flex h-10 w-10 items-center justify-center rounded-full border bg-white disabled:opacity-40 sm:h-7 sm:w-7"
						style="border-color: var(--border);"
						onclick={() => (page = Math.max(1, page - 1))}
						aria-label="Previous page"
					>
						<ChevronLeft class="h-3.5 w-3.5" />
					</button>
					<span class="px-2 text-[11px]">{clampedPage}/{totalPages}</span>
					<button
						type="button"
						disabled={page >= totalPages}
						class="flex h-10 w-10 items-center justify-center rounded-full border bg-white disabled:opacity-40 sm:h-7 sm:w-7"
						style="border-color: var(--border);"
						onclick={() => (page = Math.min(totalPages, page + 1))}
						aria-label="Next page"
					>
						<ChevronRight class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if deleteId}
	{@const target = admin.products.find((p) => p.id === deleteId)}
	<ConfirmModal
		title="Delete product?"
		body={`Delete "${target?.name ?? deleteId}" permanently? This respects order references — prefer archiving if orders exist.`}
		note="Deletion is permanent and cannot be undone."
		confirmLabel="Delete"
		danger
		requireArm
		armLabel="I understand this will permanently delete"
		onconfirm={() => {
			const id = deleteId!;
			admin.deleteProducts([id]);
			admin.showToast('Product deleted', 'success');
			selected.delete(id);
			deleteId = null;
		}}
		oncancel={() => (deleteId = null)}
	/>
{/if}

{#if deleteMany}
	<ConfirmModal
		title="Bulk delete?"
		body={`${selected.size} products will be deleted.`}
		note="Deletion respects order references — prefer archiving."
		confirmLabel="Delete"
		danger
		requireArm
		armLabel="I confirm bulk delete"
		onconfirm={doDeleteMany}
		oncancel={() => (deleteMany = false)}
	/>
{/if}

{#if waProduct}
	<WhatsAppModal product={waProduct} onclose={() => (waProduct = null)} />
{/if}
