<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import StatusBadge from '#lib/admin/components/StatusBadge.svelte';
	import StockBadge from '#lib/admin/components/StockBadge.svelte';
	import ConfirmModal from '#lib/admin/components/ConfirmModal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus } from '#lib/admin/data.ts';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Path } from '$app/types';
	import type { PageProps } from './$types';
	import { Archive, Copy, Ellipsis, PenLine, Star, Trash2 } from '@lucide/svelte';

	let { params }: PageProps = $props();
	let product = $derived(admin.products.find((p) => p.id === params.id));

	let selectedImage = $state<string | undefined>(undefined);
	$effect(() => {
		if (!product) {
			void goto(resolve('/dashboard/products' as Path));
			return;
		}
		if (!selectedImage) {
			selectedImage = product.images.find((i) => i.isPrimary)?.id ?? product.images[0]?.id;
		}
		if (product.images.length > 0 && !product.images.some((i) => i.id === selectedImage)) {
			selectedImage = product.images.find((i) => i.isPrimary)?.id ?? product.images[0]?.id;
		}
	});

	let deleteOpen = $state(false);
	let movements = $derived(admin.movements.filter((m) => m.productId === params.id).slice(0, 5));
	let category = $derived(admin.categories.find((c) => c.id === product?.categoryId));
	let collections = $derived(admin.collections.filter((c) => product?.collectionIds.includes(c.id)));
	let stock = $derived(product ? effectiveStock(product) : 0);
	let st = $derived(product ? stockStatus(stock, product.lowStockThreshold || 5, product.trackInventory) : 'in-stock');
	let currentImage = $derived(product?.images.find((i) => i.id === selectedImage) ?? product?.images[0]);

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Products', href: '/dashboard/products' }, { label: product?.name ?? params.id }]}
	title={product?.name ?? 'Product'}
	subtitle="Product detail."
>
	{#snippet badge()}
		{#if product}
			<StatusBadge status={product.status} />
			{#if product.featured}
				<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8E6] border text-[#8A6A24] shrink-0" style="border-color: #F3D9A0;">Featured</span>
			{/if}
		{/if}
	{/snippet}
	{#snippet actions()}
		{#if product}
			<a
				href={resolve(`/dashboard/products/${product.id}/edit` as Path)}
				class="h-10 sm:h-8 rounded-full bg-[#343434] text-white px-4 text-[12px] font-medium flex items-center gap-1.5 hover:bg-[#242424] transition"
			>
				<PenLine class="h-4 w-4 shrink-0" /> Edit
			</a>
			<div class="relative group">
				<button type="button" class="h-10 w-10 sm:h-8 sm:w-8 rounded-full border bg-white flex items-center justify-center shrink-0" style="border-color: var(--border);" aria-label="More actions"><Ellipsis class="h-4 w-4 text-[#777]" /></button>
				<div class="hidden group-hover:block absolute right-0 top-9 z-20 bg-white border rounded-[10px] shadow-lg p-1 min-w-[160px]" style="border-color: var(--border);">
					<button type="button" class="w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#F8F8F7] rounded-[6px] flex items-center gap-2" onclick={() => admin.duplicateProduct(product.id)}>
						<Copy class="h-4 w-4 shrink-0" /> Duplicate
					</button>
					<button type="button" class="w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#F8F8F7] rounded-[6px] flex items-center gap-2" onclick={() => admin.archiveProduct(product.id)}>
						<Archive class="h-4 w-4 shrink-0" /> Archive
					</button>
					<button type="button" class="w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#FFF0F0] text-[#A33A37] rounded-[6px] flex items-center gap-2" onclick={() => (deleteOpen = true)}>
						<Trash2 class="h-4 w-4 shrink-0" /> Delete
					</button>
				</div>
			</div>
		{/if}
	{/snippet}
</Topbar>

{#if product}
	<div class="mx-auto max-w-[1280px] w-full px-4 py-4 sm:py-6 pb-[96px] md:pb-6">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<div class="lg:col-span-7 space-y-4">
				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<div class="aspect-[4/3] rounded-[10px] bg-[#F5F5F4] border overflow-hidden flex items-center justify-center" style="border-color: var(--border);">
						{#if currentImage?.url}
							<img src={currentImage.url} alt={currentImage.alt ?? product.name} class="h-full w-full object-cover" />
						{:else}
							<span class="text-[24px] font-bold">{product.name.slice(0, 2).toUpperCase()}</span>
						{/if}
					</div>
					<div class="flex gap-2 mt-3 overflow-x-auto">
						{#each product.images as img (img.id)}
							<button
								type="button"
								onclick={() => (selectedImage = img.id)}
								class="h-14 w-14 rounded-[8px] border shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold relative {selectedImage === img.id ? 'ring-2 ring-[#242424] border-[#242424]' : 'bg-[#F5F5F4]'}"
								style="border-color: {selectedImage === img.id ? '#242424' : 'var(--border)'}"
								aria-label="Select image"
							>
								{#if img.url}
									<img src={img.url} alt={img.alt ?? product.name} class="h-full w-full object-cover" />
								{:else}
									{img.id.slice(0, 3)}
								{/if}
								{#if img.isPrimary}
									<Star class="absolute h-3 w-3 text-[#D69A35]" fill="#D69A35" />
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<h3 class="text-[13px] font-semibold mb-2">Description</h3>
					<p class="text-[12px] text-[#777]">{product.shortDescription}</p>
					<p class="text-[13px] mt-3 leading-relaxed">{product.fullDescription}</p>
				</div>

				{#if product.hasVariants}
					<div class="bg-white border rounded-[12px] overflow-hidden" style="border-color: var(--border);">
						<div class="px-4 py-3 border-b" style="border-color: var(--border);">
							<h3 class="text-[13px] font-semibold">Variants ({product.variants.length})</h3>
						</div>
						<div class="overflow-x-auto">
							<table class="w-full text-left">
								<thead>
									<tr class="bg-[#FBFBFA] border-b text-[10px] font-semibold tracking-[0.08em] uppercase text-[#999]" style="border-color: var(--border);">
										<th class="px-4 py-2">Name</th>
										<th class="px-4 py-2">SKU</th>
										<th class="px-4 py-2">Price</th>
										<th class="px-4 py-2">Stock</th>
										<th class="px-4 py-2">Avail</th>
									</tr>
								</thead>
								<tbody class="divide-y" style="border-color: var(--border);">
									{#each product.variants as v (v.id)}
										<tr>
											<td class="px-4 py-2 text-[12px]">{v.name}</td>
											<td class="px-4 py-2 mono text-[11px]">{v.sku || '—'}</td>
											<td class="px-4 py-2 text-[12px]">{v.priceOverride ? formatIDR(v.priceOverride) : formatIDR(product.basePrice)}</td>
											<td class="px-4 py-2 text-[12px]">{v.stock}</td>
											<td class="px-4 py-2">
												{#if v.available}
													<span class="text-[11px] text-[#269B65]">Yes</span>
												{:else}
													<span class="text-[11px] text-[#999]">No</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<h3 class="text-[13px] font-semibold mb-2">Inventory movements — last 5</h3>
					{#if movements.length === 0}
						<p class="text-[11px] text-[#777]">No movements yet.</p>
					{:else}
						<div class="space-y-2">
							{#each movements as m (m.id)}
								<div class="flex items-center justify-between text-[11px] border rounded-[8px] p-2 bg-[#FBFBFA]" style="border-color: var(--border);">
									<div>
										<span class="font-medium">{m.productName}</span>
										{#if m.variantName}<span class="text-[#777]">/ {m.variantName}</span>{/if}
										<span class="mono text-[#777]">• {m.sku}</span>
									</div>
									<div class="flex items-center gap-2">
										<span class={m.quantityChange >= 0 ? 'text-[#269B65]' : 'text-[#D9534F]'}>
											{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
										</span>
										<span class="text-[#777]">{fmtDate(m.createdAt)}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="lg:col-span-5 space-y-4">
				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777]">Pricing &amp; Inventory</h3>
					<div class="mt-3 space-y-2 text-[13px]">
						<div class="flex justify-between"><span class="text-[#777]">Base price</span><span class="font-medium">{formatIDR(product.basePrice)}</span></div>
						{#if product.compareAtPrice}
							<div class="flex justify-between"><span class="text-[#777]">Compare-at</span><span class="line-through text-[#999]">{formatIDR(product.compareAtPrice)}</span></div>
						{/if}
						{#if product.hasVariants}
							<div class="flex justify-between">
								<span class="text-[#777]">Variant range</span>
								<span class="font-medium">{formatIDR(Math.min(...product.variants.map((v) => v.priceOverride || product.basePrice)))} — {formatIDR(Math.max(...product.variants.map((v) => v.priceOverride || product.basePrice)))}</span>
							</div>
						{/if}
						<div class="flex justify-between"><span class="text-[#777]">SKU</span><span class="mono text-[11px]">{product.sku || '—'}</span></div>
						<div class="flex justify-between items-center"><span class="text-[#777]">Stock</span><StockBadge status={st} stock={stock} tracking={product.trackInventory} /></div>
						{#if !product.trackInventory}
							<p class="text-[11px] text-[#777] bg-[#FBFBFA] border rounded-[6px] p-2 mt-2" style="border-color: var(--border);">Stock not tracked — hide misleading quantities with note.</p>
						{/if}
					</div>
				</div>

				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777]">Organization</h3>
					<div class="mt-3 space-y-2 text-[12px]">
						<div class="flex justify-between"><span class="text-[#777]">Category</span><span class="px-2 py-0.5 rounded-full bg-[#F5F5F4] border text-[11px]" style="border-color: var(--border);">{category?.name || '—'}</span></div>
						<div>
							<span class="text-[#777] text-[11px]">Collections</span>
							<div class="flex flex-wrap gap-1 mt-1">
								{#if collections.length === 0}
									<span class="text-[11px] text-[#999]">None</span>
								{:else}
									{#each collections as c (c.id)}
										<span class="px-2 py-0.5 rounded-full bg-[#F0FAF6] border text-[11px] text-[#1A7A52]" style="border-color: #C7EBDB;">{c.name}</span>
									{/each}
								{/if}
							</div>
						</div>
						<div class="flex justify-between"><span class="text-[#777]">Featured</span><span>{product.featured ? 'Yes' : 'No'}</span></div>
					</div>
				</div>

				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777]">Publishing &amp; SEO</h3>
					<div class="mt-3 space-y-2 text-[12px]">
						<div class="flex justify-between"><span class="text-[#777]">Status</span><StatusBadge status={product.status} /></div>
						<div><span class="text-[#777] text-[11px]">SEO Title</span><p class="text-[12px] mt-0.5">{product.seoTitle || '—'}</p></div>
						<div><span class="text-[#777] text-[11px]">SEO Description</span><p class="text-[12px] mt-0.5">{product.seoDescription || '—'}</p></div>
						<div class="flex justify-between text-[11px] text-[#999] pt-2 border-t" style="border-color: var(--border);">
							<span>Created {fmtDate(product.createdAt)}</span>
							<span>Updated {fmtDate(product.updatedAt)}</span>
						</div>
					</div>
				</div>

				<div class="bg-[#FFFDF3] border rounded-[12px] p-3" style="border-color: #F0D99E;">
					<p class="text-[11px] text-[#8A6A24]">Deletion respects order references (show archive suggestion). Archived not in storefront. Draft not in storefront.</p>
				</div>
			</div>
		</div>
	</div>

	{#if deleteOpen}
		<ConfirmModal
			title="Delete product?"
			body="Product detail should provide correct name/variant/price/availability for WhatsApp message (no cart/payment). If order references exist, prefer archiving."
			confirmLabel="Delete"
			danger
			requireArm
			onconfirm={() => { admin.deleteProducts([product.id]); admin.showToast('Product deleted', 'success'); void goto(resolve('/dashboard/products' as Path)); }}
			oncancel={() => (deleteOpen = false)}
		/>
	{/if}
{:else}
	<div class="mx-auto max-w-[1280px] w-full px-4 py-6 text-[13px] text-[#777]">Product not found.</div>
{/if}
