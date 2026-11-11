<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, stockStatus } from '#lib/admin/data.ts';
	import type { Product } from '#lib/admin/types.ts';
	import StoreHeader from '#lib/components/storefront/StoreHeader.svelte';
	import StoreFooter from '#lib/components/storefront/StoreFooter.svelte';
	import ProductCard from '#lib/components/storefront/ProductCard.svelte';
	import { ArrowUpRight } from '@lucide/svelte';

	let activeFilter = $state('all');

	let active = $derived(admin.products.filter((p) => p.status === 'active'));

	let filterPills = $derived([
		{ id: 'all', name: 'Semua' },
		...admin.categories.map((c) => ({ id: c.id, name: c.name }))
	]);

	let filtered = $derived(
		activeFilter === 'all' ? active : active.filter((p) => p.categoryId === activeFilter)
	);

	function isOut(p: Product): boolean {
		const stock = effectiveStock(p);
		return stockStatus(stock, p.lowStockThreshold || 5, p.trackInventory) === 'out';
	}
</script>

<svelte:head>
	<title>Katalog — {admin.settings.logo}</title>
	<meta
		name="description"
		content="Katalog lengkap {admin.settings
			.logo}: everyday tote, shoulder bag, crossbody, clutch dan bucket bag."
	/>
</svelte:head>

<div class="forma-root min-h-screen w-full bg-[#FBFBFA] text-[#242424]">
	<StoreHeader base="/" />

	<main class="mx-auto max-w-[1400px] px-5 pt-10 pb-16 sm:px-8 sm:pt-14 lg:px-12 lg:pb-24">
		<div class="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="mb-3 text-[10px] font-semibold tracking-[0.22em] text-[#D9534F] uppercase">
					The full line
				</p>
				<h1 class="font-display text-4xl tracking-tight sm:text-5xl">
					Katalog<span class="text-[#D9534F]">.</span>
				</h1>
				<p class="mt-3 max-w-md text-sm text-[#77736E]">
					Semua bentuk yang kami buat, satu per satu. Pilih kategori untuk menyaring daftar ini.
				</p>
			</div>
			<a
				href="/#koleksi"
				class="self-start border-b border-[#242424]/40 pb-1 text-xs hover:border-[#D9534F] hover:text-[#D9534F] sm:self-auto"
			>
				Kembali ke beranda
				<ArrowUpRight class="inline h-3.5 w-3.5 align-[-2px]" strokeWidth={1.6} />
			</a>
		</div>

		<div class="mb-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter kategori">
			{#each filterPills as pill (pill.id)}
				<button
					type="button"
					class="shrink-0 rounded-full border border-[#EAE8E4] px-5 py-2.5 text-xs transition hover:border-[#242424] {activeFilter ===
					pill.id
						? 'border-[#242424] bg-[#242424] text-white'
						: 'bg-transparent text-[#242424]'}"
					onclick={() => (activeFilter = pill.id)}
				>
					{pill.name}
				</button>
			{/each}
		</div>

		{#if filtered.length === 0}
			<p class="py-16 text-center text-sm text-[#77736E]">
				Belum ada produk pada kategori ini. Silakan cek kembali nanti.
			</p>
		{:else}
			<div class="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
				{#each filtered as p, i (p.id)}
					<ProductCard product={p} index={i} />
				{/each}
			</div>
		{/if}

		<p class="mt-10 text-center text-[10px] text-[#77736E]">
			*Katalog, harga, dan foto mengikuti data yang aktif di dashboard.
		</p>
	</main>

	<StoreFooter base="/" />
</div>
