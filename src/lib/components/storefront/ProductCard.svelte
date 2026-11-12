<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus } from '#lib/admin/data.ts';
	import { cart } from '#lib/catalog/cart.svelte.ts';
	import { photoFor } from '#lib/catalog/photos.ts';
	import { productHref } from '#lib/catalog/links.ts';
	import { cardVariantLabel } from '#lib/catalog/product.ts';
	import type { Product } from '#lib/admin/types.ts';
	import { Check, Plus } from '@lucide/svelte';

	interface Props {
		product: Product;
	}

	let { product }: Props = $props();

	let out = $derived(
		stockStatus(effectiveStock(product), product.lowStockThreshold || 5, product.trackInventory) ===
			'out'
	);
	let added = $derived(cart.recent.includes(product.id));

	function categoryName(id: string): string {
		return admin.categories.find((c) => c.id === id)?.name ?? 'Essential';
	}
</script>

<!--
	Storefront product card — shared by the landing page, the catalog index and
	the "you may also like" row on the product detail page.
-->

<article class="group">
	<div class="image-zoom relative aspect-[4/5] overflow-hidden bg-[#F5F3EF]">
		<a
			href={productHref(product.slug)}
			class="block h-full w-full"
			aria-label={`Lihat ${product.name}`}
		>
			<img
				class="h-full w-full object-cover"
				src={photoFor(product)}
				alt={product.name}
				loading="lazy"
			/>
		</a>

		{#if product.featured}
			<span
				class="absolute top-3 left-3 z-10 bg-[#FBFBFA] px-2.5 py-1 text-[9px] tracking-wider uppercase"
			>
				Bestseller
			</span>
		{:else if out}
			<span
				class="absolute top-3 left-3 z-10 bg-[#242424] px-2.5 py-1 text-[9px] tracking-wider text-white uppercase"
			>
				Out of stock
			</span>
		{/if}

		<button
			type="button"
			class="add-cart absolute right-3 bottom-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#FBFBFA] text-[#242424] shadow-[0_14px_45px_rgba(36,36,36,0.07)] transition hover:bg-[#D9534F] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
			aria-label={`Tambah ${product.name} ke keranjang`}
			disabled={out}
			onclick={() => cart.add(product)}
		>
			{#if added}
				<Check class="h-4 w-4" strokeWidth={2} />
			{:else}
				<Plus class="h-4 w-4" strokeWidth={2} />
			{/if}
		</button>
	</div>

	<div class="mt-4 flex justify-between gap-2">
		<div>
			<a href={productHref(product.slug)} class="hover:text-[#D9534F]">
				<p class="text-xs font-semibold sm:text-sm">{product.name}</p>
			</a>
			<p class="mt-1 text-[10px] text-[#6B6762] sm:text-xs">
				{categoryName(product.categoryId)}{cardVariantLabel(product)
					? ` · ${cardVariantLabel(product)}`
					: ''}
			</p>
		</div>
		<div class="text-right">
			<p class="text-xs whitespace-nowrap sm:text-sm">{formatIDR(product.basePrice)}</p>
			{#if product.compareAtPrice}
				<p class="text-[10px] whitespace-nowrap text-[#636363] line-through sm:text-xs">
					{formatIDR(product.compareAtPrice)}
				</p>
			{/if}
		</div>
	</div>
</article>

<style>
	.image-zoom img {
		transition: transform 0.65s cubic-bezier(0.2, 0.7, 0.2, 1);
	}

	.image-zoom:hover img {
		transform: scale(1.045);
	}
</style>
