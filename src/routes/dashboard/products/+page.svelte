<script lang="ts">
	import { resolve } from '$app/paths';
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
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
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
	import { resolvePath } from '#lib/admin/paths.ts';

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
	async function bulkSet(status: 'active' | 'archived') {
		await admin.setProductsStatus([...selected], status);
		admin.showToast(status === 'active' ? 'Activated selected' : 'Archived selected', 'success');
		selected.clear();
	}
	async function doDeleteMany() {
		await admin.deleteProducts([...selected]);
		selected.clear();
		deleteMany = false;
	}
	async function toggleStatus(p: Product) {
		if (p.status === 'archived') {
			await admin.setProductsStatus([p.id], 'active');
			admin.showToast('Activated', 'success');
		} else {
			await admin.archiveProduct(p.id);
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
		<Button
			variant={storefrontPreview ? 'default' : 'outline'}
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
		</Button>
		<Button href={resolve('/dashboard/products/new')}>
			<Plus class="h-4 w-4 shrink-0" />
			<span class="hidden min-[420px]:inline">Add Product</span><span class="min-[420px]:hidden"
				>Add</span
			>
		</Button>
	{/snippet}
</Topbar>

<div
	class="mx-auto w-full max-w-[1280px] {isMobile
		? 'px-4 py-4 pb-[112px]'
		: 'px-4 py-6 md:px-6 lg:px-8'}"
>
	<!-- Stat cards -->
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="rounded-[12px] border border-border bg-card p-3.5">
			<div class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Total</div>
			<div class="mt-1 text-[22px] leading-none font-semibold text-foreground">{stats.total}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">All catalog</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-3.5">
			<div
				class="flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-success"></span> Active
			</div>
			<div class="mt-1 text-[22px] leading-none font-semibold text-foreground">{stats.active}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">In storefront</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-3.5">
			<div class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Draft</div>
			<div class="mt-1 text-[22px] leading-none font-semibold text-foreground">{stats.draft}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Not visible</div>
		</div>
		<div class="rounded-[12px] border border-warning/30 bg-warning/10 p-3.5">
			<div
				class="flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-warning-text uppercase"
			>
				<TriangleAlert class="h-3.5 w-3.5 shrink-0" /> Low Stock
			</div>
			<div class="mt-1 text-[22px] leading-none font-semibold text-warning-text">{stats.low}</div>
			<div class="mt-1 text-[11px] text-warning-text/80">Needs attention</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-4 rounded-[12px] border border-border bg-card p-3 md:p-4">
		<div class="flex flex-col gap-2 lg:flex-row">
			<SearchInput bind:value={search} placeholder="Search by name, SKU..." />
			<div class="flex flex-wrap items-center gap-2">
				<NativeSelect shape="pill" class="text-[12px] font-medium" bind:value={statusFilter}>
					<option value="all">All Status</option>
					<option value="active">Active</option>
					<option value="draft">Draft</option>
					<option value="archived">Archived</option>
				</NativeSelect>
				<NativeSelect shape="pill" class="text-[12px] font-medium" bind:value={categoryFilter}>
					<option value="all">All Categories</option>
					{#each admin.categories as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</NativeSelect>
				<NativeSelect shape="pill" class="text-[12px] font-medium" bind:value={stockFilter}>
					<option value="all">All Stock</option>
					<option value="in-stock">In Stock</option>
					<option value="low">Low</option>
					<option value="out">Out</option>
				</NativeSelect>
				<NativeSelect shape="pill" class="text-[12px] font-medium" bind:value={sortKey}>
					<option value="updated">Sort: Updated</option>
					<option value="name">Sort: Name</option>
					<option value="price">Sort: Price</option>
					<option value="stock">Sort: Stock</option>
				</NativeSelect>
				<Button
					variant="outline"
					size="icon-lg"
					onclick={() => (sortDir = sortDir === 'asc' ? 'desc' : 'asc')}
					aria-label="Toggle sort direction"
					title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
				>
					{#if sortDir === 'asc'}
						<ArrowUp class="h-4 w-4 text-muted-foreground" />
					{:else}
						<ArrowDown class="h-4 w-4 text-muted-foreground" />
					{/if}
				</Button>
			</div>
		</div>
		{#if storefrontPreview}
			<div
				class="mt-3 flex items-center gap-2 rounded-[8px] border border-success/25 bg-success/10 p-2.5 text-[11px] text-success-text"
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
			class="mb-4 flex flex-col items-start justify-between gap-3 rounded-[12px] bg-primary p-3 text-primary-foreground md:flex-row md:items-center"
		>
			<div class="text-[12px] font-medium">{selected.size} selected</div>
			<div class="flex items-center gap-2">
				<Button
					variant="secondary"
					size="sm"
					class="h-10 text-[12px] sm:h-7 sm:text-[11px]"
					onclick={() => bulkSet('active')}>Activate</Button
				>
				<Button
					variant="secondary"
					size="sm"
					class="h-10 border border-primary-foreground/20 bg-primary-foreground/10 text-[12px] text-primary-foreground hover:bg-primary-foreground/20 sm:h-7 sm:text-[11px]"
					onclick={() => bulkSet('archived')}>Archive</Button
				>
				<Button
					variant="destructive"
					size="sm"
					class="h-10 text-[12px] sm:h-7 sm:text-[11px]"
					onclick={() => (deleteMany = true)}>Delete</Button
				>
				<Button
					variant="secondary"
					size="icon-lg"
					class="h-10 w-10 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 sm:h-7 sm:w-7"
					onclick={() => selected.clear()}
					aria-label="Clear selection"
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			</div>
		</div>
	{/if}

	<!-- Table (desktop) / mobile cards -->
	<div class="overflow-hidden rounded-[12px] border border-border bg-card">
		{#if loading}
			<div class="space-y-3 p-4" aria-hidden="true">
				{#each Array(5) as _, i (i)}
					<div class="flex animate-pulse gap-3">
						<div class="h-10 w-10 rounded-[8px] bg-muted"></div>
						<div class="flex-1 space-y-2">
							<div class="h-3 w-1/3 rounded bg-muted"></div>
							<div class="h-2 w-1/2 rounded bg-muted"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filtered.length === 0 && admin.products.length === 0}
			<div class="px-6 py-16 text-center">
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted"
				>
					<Package class="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 class="text-[14px] font-semibold text-foreground">Empty catalog</h3>
				<p class="mx-auto mt-1 max-w-[320px] text-[12px] text-muted-foreground">
					No products yet. Add your first bag to start managing catalog with full spec.
				</p>
				<Button href={resolve('/dashboard/products/new')} class="mt-4 px-5">
					Add first product
				</Button>
			</div>
		{:else if filtered.length === 0}
			<div class="px-6 py-16 text-center">
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted"
				>
					<Search class="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 class="text-[14px] font-semibold text-foreground">No search results</h3>
				<p class="mt-1 text-[12px] text-muted-foreground">Try adjusting search or filters.</p>
				<Button variant="outline" class="mt-4 px-4" onclick={clearFilters}>Clear filters</Button>
			</div>
		{:else if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[920px] text-left">
					<thead>
						<tr
							class="border-b border-border bg-field text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
						>
							<th class="w-10 px-3 py-2.5">
								<Checkbox
									checked={selected.size === pageItems.length && pageItems.length > 0}
									indeterminate={selected.size > 0 && selected.size < pageItems.length}
									onCheckedChange={toggleAll}
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
					<tbody class="divide-y divide-border">
						{#each pageItems as p (p.id)}
							{@const stock = effectiveStock(p)}
							{@const st = stockStatus(stock, lowThreshold(p), p.trackInventory)}
							{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
							<tr class="transition-colors hover:bg-muted/50">
								<td class="px-3 py-3">
									<Checkbox
										checked={selected.has(p.id)}
										onCheckedChange={() => toggleSelect(p.id)}
										aria-label="Select {p.name}"
									/>
								</td>
								<td class="px-3 py-3">
									<a
										href={resolvePath(`/dashboard/products/${p.id}`)}
										class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[8px] border border-border bg-muted text-[10px] font-bold text-foreground"
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
										href={resolvePath(`/dashboard/products/${p.id}`)}
										class="block max-w-[200px] truncate text-left text-[13px] leading-tight font-medium text-foreground hover:underline"
										title={p.name}>{p.name}</a
									>
									{#if p.featured}
										<span
											class="mt-1 inline-flex rounded-full border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[9px] font-medium text-warning-text"
											>Featured</span
										>
									{/if}
								</td>
								<td class="mono max-w-[120px] truncate px-3 py-3 text-[11px] text-muted-foreground"
									>{p.sku || '—'}</td
								>
								<td class="px-3 py-3 text-[12px] text-muted-foreground">
									{admin.categories.find((c) => c.id === p.categoryId)?.name ?? '—'}
								</td>
								<td class="px-3 py-3">
									<div class="text-[12px] font-medium text-foreground">{formatIDR(p.basePrice)}</div>
									{#if p.compareAtPrice}
										<div class="text-[11px] text-muted-foreground line-through">
											{formatIDR(p.compareAtPrice)}
										</div>
									{/if}
									{#if p.hasVariants}
										<div class="text-[10px] text-muted-foreground">{p.variants.length} variants</div>
									{/if}
								</td>
								<td class="px-3 py-3"
									><StockBadge status={st} {stock} tracking={p.trackInventory} /></td
								>
								<td class="px-3 py-3"><StatusBadge status={p.status} /></td>
								<td class="px-3 py-3 text-[11px] text-muted-foreground">
									{new Date(p.updatedAt).toLocaleDateString('id-ID', {
										day: '2-digit',
										month: 'short'
									})}
								</td>
								<td class="px-3 py-3 text-right">
									<div class="flex items-center justify-end gap-1">
										<Button
											href={resolvePath(`/dashboard/products/${p.id}/edit`)}
											variant="outline"
											size="icon-sm"
											aria-label="Edit"
										>
											<PenLine class="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onclick={() => toggleStatus(p)}
											aria-label={p.status === 'archived' ? 'Reactivate' : 'Archive'}
										>
											<Archive class="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
										<div class="group/menu relative">
											<Button variant="outline" size="icon-sm" aria-label="More actions">
												<Ellipsis class="h-3.5 w-3.5 text-muted-foreground" />
											</Button>
											<div
												class="absolute top-8 right-0 z-20 hidden min-w-[160px] rounded-[10px] border border-border bg-card p-1 shadow-lg group-hover/menu:block group-focus-within/menu:block"
											>
												<Button
													variant="ghost"
													size="sm"
													class="h-auto w-full justify-start gap-2 rounded-[6px] px-3 py-2 text-[12px]"
													onclick={() => {
														void admin.duplicateProduct(p.id);
														selected.clear();
													}}
												>
													<Copy class="h-3.5 w-3.5" /> Duplicate
												</Button>
												<Button
													variant="ghost"
													size="sm"
													class="h-auto w-full justify-start gap-2 rounded-[6px] px-3 py-2 text-[12px]"
													onclick={() => (waProduct = p)}
												>
													<MessageCircle class="h-3.5 w-3.5" /> WhatsApp enquiry
												</Button>
												<Button
													variant="ghost"
													size="sm"
													class="h-auto w-full justify-start gap-2 rounded-[6px] px-3 py-2 text-[12px] text-destructive hover:bg-destructive/10 hover:text-destructive"
													onclick={() => (deleteId = p.id)}
												>
													<Trash2 class="h-3.5 w-3.5" /> Delete
												</Button>
											</div>
										</div>
									</div></td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each pageItems as p (p.id)}
					{@const stock = effectiveStock(p)}
					{@const st = stockStatus(stock, lowThreshold(p), p.trackInventory)}
					{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
					<div class="flex gap-3 p-4">
						<Checkbox
							checked={selected.has(p.id)}
							class="mt-1"
							onCheckedChange={() => toggleSelect(p.id)}
							aria-label="Select {p.name}"
						/>
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-muted text-[11px] font-bold text-foreground"
						>
							{#if primary?.url}
								<img src={primary.url} alt={primary.alt ?? p.name} class="h-full w-full object-cover" />
							{:else}
								{p.name.slice(0, 2).toUpperCase()}
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<a
								href={resolvePath(`/dashboard/products/${p.id}`)}
								class="block truncate text-left text-[13px] font-medium text-foreground">{p.name}</a
							>
							<div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<span class="mono">{p.sku || '—'}</span>
								<span class="h-1 w-1 rounded-full bg-border"></span>
								<span class="truncate"
									>{admin.categories.find((c) => c.id === p.categoryId)?.name ?? '—'}</span
								>
								<span class="h-1 w-1 rounded-full bg-border"></span>
								<span class="shrink-0">{formatIDR(p.basePrice)}</span>
							</div>
							<div class="mt-2 flex items-center gap-2">
								<StockBadge status={st} {stock} tracking={p.trackInventory} />
								<StatusBadge status={p.status} />
							</div>
						</div>
						<a
							href={resolvePath(`/dashboard/products/${p.id}/edit`)}
							class="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-border bg-card"
							aria-label="Edit"
						>
							<PenLine class="h-4 w-4 text-muted-foreground" />
						</a>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Pagination footer (inside card, ref parity) -->
		{#if !loading && filtered.length > 0}
			<div
				class="flex items-center justify-between gap-3 border-t border-border bg-field px-4 py-3 md:px-5"
			>
				<span class="text-[11px] text-muted-foreground">
					Showing <span class="font-medium text-foreground">{pageItems.length}</span> of
					<span class="font-medium text-foreground">{filtered.length}</span> • Page {clampedPage}/{totalPages}
				</span>
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon-lg"
						disabled={page <= 1}
						onclick={() => (page = Math.max(1, page - 1))}
						aria-label="Previous page"
					>
						<ChevronLeft class="h-3.5 w-3.5" />
					</Button>
					<span class="px-2 text-[11px] text-muted-foreground">{clampedPage}/{totalPages}</span>
					<Button
						variant="outline"
						size="icon-lg"
						disabled={page >= totalPages}
						onclick={() => (page = Math.min(totalPages, page + 1))}
						aria-label="Next page"
					>
						<ChevronRight class="h-3.5 w-3.5" />
					</Button>
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
		onconfirm={async () => {
			const id = deleteId!;
			await admin.deleteProducts([id]);
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
