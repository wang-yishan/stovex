<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import StatusBadge from '#lib/admin/components/StatusBadge.svelte';
	import StockBadge from '#lib/admin/components/StockBadge.svelte';
	import ConfirmModal from '#lib/admin/components/ConfirmModal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus } from '#lib/admin/data.ts';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { Archive, Copy, Ellipsis, PenLine, Star, Trash2 } from '@lucide/svelte';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Button } from '#lib/components/ui/button/index.ts';

	let { params }: PageProps = $props();
	let product = $derived(admin.products.find((p) => p.id === params.id));

	let selectedImage = $state<string | undefined>(undefined);
	$effect(() => {
		if (!product) {
			void goto(resolve('/dashboard/products'));
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
	let collections = $derived(
		admin.collections.filter((c) => product?.collectionIds.includes(c.id))
	);
	let stock = $derived(product ? effectiveStock(product) : 0);
	let st = $derived(
		product
			? stockStatus(stock, product.lowStockThreshold || 5, product.trackInventory)
			: 'in-stock'
	);
	let currentImage = $derived(
		product?.images.find((i) => i.id === selectedImage) ?? product?.images[0]
	);

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
	}
</script>

<Topbar
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Products', href: '/dashboard/products' },
		{ label: product?.name ?? params.id }
	]}
	title={product?.name ?? 'Product'}
	subtitle="Product detail."
>
	{#snippet badge()}
		{#if product}
			<StatusBadge status={product.status} />
			{#if product.featured}
				<span
					class="shrink-0 rounded-full border bg-[#FFF8E6] px-2 py-0.5 text-[10px] text-[#8A6A24]"
					style="border-color: #F3D9A0;">Featured</span
				>
			{/if}
		{/if}
	{/snippet}
	{#snippet actions()}
		{#if product}
			<Button href={resolvePath(`/dashboard/products/${product.id}/edit`)}>
				<PenLine class="h-4 w-4 shrink-0" /> Edit
			</Button>
			<div class="group relative">
				<Button variant="outline" size="icon" aria-label="More actions"
					><Ellipsis class="h-4 w-4 text-muted-foreground" /></Button
				>
				<div
					class="absolute top-9 right-0 z-20 hidden min-w-[160px] rounded-[10px] border border-border bg-card p-1 shadow-lg group-hover:block"
				>
					<Button
						variant="ghost"
						class="h-auto w-full justify-start rounded-[6px] px-3 py-2.5 text-[13px]"
						onclick={() => admin.duplicateProduct(product.id)}
					>
						<Copy class="h-4 w-4 shrink-0" /> Duplicate
					</Button>
					<Button
						variant="ghost"
						class="h-auto w-full justify-start rounded-[6px] px-3 py-2.5 text-[13px]"
						onclick={() => admin.archiveProduct(product.id)}
					>
						<Archive class="h-4 w-4 shrink-0" /> Archive
					</Button>
					<Button
						variant="ghost"
						class="h-auto w-full justify-start rounded-[6px] px-3 py-2.5 text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
						onclick={() => (deleteOpen = true)}
					>
						<Trash2 class="h-4 w-4 shrink-0" /> Delete
					</Button>
				</div>
			</div>
		{/if}
	{/snippet}
</Topbar>

{#if product}
	<div class="mx-auto w-full max-w-[1280px] px-4 py-4 pb-[96px] sm:py-6 md:pb-6">
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
			<div class="space-y-4 lg:col-span-7">
				<div class="rounded-[12px] border border-border bg-card p-4">
					<div
						class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[10px] border border-border bg-muted"
					>
						{#if currentImage?.url}
							<img
								src={currentImage.url}
								alt={currentImage.alt ?? product.name}
								class="h-full w-full object-cover"
							/>
						{:else}
							<span class="text-[24px] font-bold">{product.name.slice(0, 2).toUpperCase()}</span>
						{/if}
					</div>
					<div class="mt-3 flex gap-2 overflow-x-auto">
						{#each product.images as img (img.id)}
							<Button
								variant="outline"
								size="icon-xl"
								onclick={() => (selectedImage = img.id)}
								class="relative size-14 overflow-hidden rounded-[8px] p-0 text-[10px] font-bold sm:size-14 {selectedImage ===
								img.id
									? 'border-ring ring-2 ring-ring'
									: 'bg-muted'}"
								aria-label="Select image"
							>
								{#if img.url}
									<img
										src={img.url}
										alt={img.alt ?? product.name}
										class="h-full w-full object-cover"
									/>
								{:else}
									{img.id.slice(0, 3)}
								{/if}
								{#if img.isPrimary}
									<Star class="absolute h-3 w-3 text-[#D69A35]" fill="#D69A35" />
								{/if}
							</Button>
						{/each}
					</div>
				</div>

				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="mb-2 text-[13px] font-semibold">Description</h3>
					<p class="text-[12px] text-muted-foreground">{product.shortDescription}</p>
					<p class="mt-3 text-[13px] leading-relaxed">{product.fullDescription}</p>
				</div>

				{#if product.hasVariants}
					<div class="overflow-hidden rounded-[12px] border border-border bg-card">
						<div class="border-b border-border px-4 py-3">
							<h3 class="text-[13px] font-semibold">Variants ({product.variants.length})</h3>
						</div>
						<div class="overflow-x-auto">
							<table class="w-full text-left">
								<thead>
									<tr
										class="border-b border-border bg-field text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
									>
										<th class="px-4 py-2">Name</th>
										<th class="px-4 py-2">SKU</th>
										<th class="px-4 py-2">Price</th>
										<th class="px-4 py-2">Stock</th>
										<th class="px-4 py-2">Avail</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each product.variants as v (v.id)}
										<tr>
											<td class="px-4 py-2 text-[12px]">{v.name}</td>
											<td class="mono px-4 py-2 text-[11px]">{v.sku || '—'}</td>
											<td class="px-4 py-2 text-[12px]"
												>{v.priceOverride
													? formatIDR(v.priceOverride)
													: formatIDR(product.basePrice)}</td
											>
											<td class="px-4 py-2 text-[12px]">{v.stock}</td>
											<td class="px-4 py-2">
												{#if v.available}
													<span class="text-[11px] text-[#269B65]">Yes</span>
												{:else}
													<span class="text-[11px] text-muted-foreground">No</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="mb-2 text-[13px] font-semibold">Inventory movements — last 5</h3>
					{#if movements.length === 0}
						<p class="text-[11px] text-muted-foreground">No movements yet.</p>
					{:else}
						<div class="space-y-2">
							{#each movements as m (m.id)}
								<div
									class="flex items-center justify-between rounded-[8px] border border-border bg-field p-2 text-[11px]"
								>
									<div>
										<span class="font-medium">{m.productName}</span>
										{#if m.variantName}<span class="text-muted-foreground">/ {m.variantName}</span
											>{/if}
										<span class="mono text-muted-foreground">• {m.sku}</span>
									</div>
									<div class="flex items-center gap-2">
										<span class={m.quantityChange >= 0 ? 'text-[#269B65]' : 'text-destructive'}>
											{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
										</span>
										<span class="text-muted-foreground">{fmtDate(m.createdAt)}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-4 lg:col-span-5">
				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						Pricing &amp; Inventory
					</h3>
					<div class="mt-3 space-y-2 text-[13px]">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Base price</span><span class="font-medium"
								>{formatIDR(product.basePrice)}</span
							>
						</div>
						{#if product.compareAtPrice}
							<div class="flex justify-between">
								<span class="text-muted-foreground">Compare-at</span><span
									class="text-muted-foreground line-through"
									>{formatIDR(product.compareAtPrice)}</span
								>
							</div>
						{/if}
						{#if product.hasVariants}
							<div class="flex justify-between">
								<span class="text-muted-foreground">Variant range</span>
								<span class="font-medium"
									>{formatIDR(
										Math.min(...product.variants.map((v) => v.priceOverride || product.basePrice))
									)} — {formatIDR(
										Math.max(...product.variants.map((v) => v.priceOverride || product.basePrice))
									)}</span
								>
							</div>
						{/if}
						<div class="flex justify-between">
							<span class="text-muted-foreground">SKU</span><span class="mono text-[11px]"
								>{product.sku || '—'}</span
							>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Stock</span><StockBadge
								status={st}
								{stock}
								tracking={product.trackInventory}
							/>
						</div>
						{#if !product.trackInventory}
							<p
								class="mt-2 rounded-[6px] border border-border bg-field p-2 text-[11px] text-muted-foreground"
							>
								Stock not tracked — hide misleading quantities with note.
							</p>
						{/if}
					</div>
				</div>

				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						Organization
					</h3>
					<div class="mt-3 space-y-2 text-[12px]">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Category</span><span
								class="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px]"
								>{category?.name || '—'}</span
							>
						</div>
						<div>
							<span class="text-[11px] text-muted-foreground">Collections</span>
							<div class="mt-1 flex flex-wrap gap-1">
								{#if collections.length === 0}
									<span class="text-[11px] text-muted-foreground">None</span>
								{:else}
									{#each collections as c (c.id)}
										<span
											class="rounded-full border bg-[#F0FAF6] px-2 py-0.5 text-[11px] text-[#1A7A52]"
											style="border-color: #C7EBDB;">{c.name}</span
										>
									{/each}
								{/if}
							</div>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Featured</span><span
								>{product.featured ? 'Yes' : 'No'}</span
							>
						</div>
					</div>
				</div>

				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						Publishing &amp; SEO
					</h3>
					<div class="mt-3 space-y-2 text-[12px]">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Status</span><StatusBadge
								status={product.status}
							/>
						</div>
						<div>
							<span class="text-[11px] text-muted-foreground">SEO Title</span>
							<p class="mt-0.5 text-[12px]">{product.seoTitle || '—'}</p>
						</div>
						<div>
							<span class="text-[11px] text-muted-foreground">SEO Description</span>
							<p class="mt-0.5 text-[12px]">{product.seoDescription || '—'}</p>
						</div>
						<div
							class="flex justify-between border-t border-border pt-2 text-[11px] text-muted-foreground"
						>
							<span>Created {fmtDate(product.createdAt)}</span>
							<span>Updated {fmtDate(product.updatedAt)}</span>
						</div>
					</div>
				</div>

				<div class="rounded-[12px] border bg-[#FFFDF3] p-3" style="border-color: #F0D99E;">
					<p class="text-[11px] text-[#8A6A24]">
						Deletion respects order references (show archive suggestion). Archived not in
						storefront. Draft not in storefront.
					</p>
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
			onconfirm={() => {
				admin.deleteProducts([product.id]);
				admin.showToast('Product deleted', 'success');
				void goto(resolve('/dashboard/products'));
			}}
			oncancel={() => (deleteOpen = false)}
		/>
	{/if}
{:else}
	<div class="mx-auto w-full max-w-[1280px] px-4 py-6 text-[13px] text-muted-foreground">
		Product not found.
	</div>
{/if}
