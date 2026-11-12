<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { formatIDR } from '#lib/admin/data.ts';
	import { cart } from '#lib/catalog/cart.svelte.ts';
	import { galleryFor } from '#lib/catalog/photos.ts';
	import {
		colorOptions,
		findVariant,
		isAvailable,
		priceFor,
		sizeOptionsFor,
		skuFor,
		stockFor,
		variantLabel
	} from '#lib/catalog/product.ts';
	import { waLink } from '#lib/catalog/wa.ts';
	import { catalogHref } from '#lib/catalog/links.ts';
	import StoreHeader from '#lib/components/storefront/StoreHeader.svelte';
	import StoreFooter from '#lib/components/storefront/StoreFooter.svelte';
	import ProductGallery from '#lib/components/storefront/ProductGallery.svelte';
	import ProductCard from '#lib/components/storefront/ProductCard.svelte';
	import Accordion from '#lib/components/storefront/Accordion.svelte';
	import type { PageProps } from './$types';
	import { ArrowUpRight, Heart, MessageCircle, Minus, Plus } from '@lucide/svelte';

	let { params }: PageProps = $props();

	let product = $derived(
		admin.products.find((p) => p.slug === params.slug && p.status === 'active')
	);

	let gallery = $derived(product ? galleryFor(product) : []);

	let colors = $derived(product ? colorOptions(product) : []);

	let selectedColor = $state<string | null>(null);
	let selectedSize = $state<string | null>(null);

	// The effective selection: what the shopper sees highlighted, falling back
	// to the first option of each axis until something is picked.
	let activeColor = $derived(selectedColor ?? colors[0]?.value ?? null);
	let sizes = $derived(product ? sizeOptionsFor(product, activeColor) : []);
	let activeSize = $derived(selectedSize ?? sizes[0]?.value ?? null);

	// The exact variant for the current selection — undefined when the
	// colour/size combination does not exist in the catalog.
	let variant = $derived(product ? findVariant(product, activeColor, activeSize) : undefined);

	let price = $derived(product ? priceFor(product, variant) : 0);
	let stock = $derived(product ? stockFor(product, variant) : 0);
	let available = $derived(product ? isAvailable(product, variant) : false);
	let quantity = $state(1);

	let maxQuantity = $derived(
		product && Number.isFinite(stock) ? Math.max(1, Math.min(stock, 20)) : 20
	);

	let lowStock = $derived(
		product && Number.isFinite(stock) && stock > 0 && stock <= (product.lowStockThreshold || 5)
	);

	let category = $derived(
		product ? admin.categories.find((c) => c.id === product.categoryId) : undefined
	);

	let collections = $derived(
		product
			? admin.collections.filter((c) => product.collectionIds.includes(c.id)).map((c) => c.name)
			: []
	);

	let related = $derived.by(() => {
		if (!product) return [];
		const others = admin.products.filter((p) => p.status === 'active' && p.id !== product.id);
		const sameCategory = others.filter((p) => p.categoryId === product.categoryId);
		const rest = others.filter((p) => p.categoryId !== product.categoryId);
		return [...sameCategory, ...rest].slice(0, 4);
	});

	let wished = $state(false);

	function selectColor(value: string) {
		selectedColor = selectedColor === value ? null : value;
		// The size list depends on the colour, so drop a now-invalid size.
		selectedSize = null;
		quantity = 1;
	}

	function selectSize(value: string) {
		selectedSize = selectedSize === value ? null : value;
		quantity = 1;
	}

	function productUrl(): string {
		return `${window.location.origin}${catalogHref()}/${params.slug}`;
	}

	function openWhatsApp(mode: 'buy' | 'ask') {
		if (!product) return;
		const url = waLink({ product, variant, quantity, url: productUrl() }, mode);
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	function addToCart() {
		if (!product) return;
		cart.add(product, price, variantLabel(product, variant));
	}
</script>

<svelte:head>
	<title
		>{product
			? `${product.name} — ${admin.settings.logo}`
			: `Produk tidak ditemukan — ${admin.settings.logo}`}</title
	>
	<meta
		name="description"
		content={product?.seoDescription ||
			product?.shortDescription ||
			admin.settings.defaultSeo.description}
	/>
	<meta name="theme-color" content="#FBFBFA" />
</svelte:head>

<div class="forma-root min-h-screen w-full bg-[#FBFBFA] text-[#242424]">
	<StoreHeader base="/" />

	{#if !product}
		<main class="mx-auto max-w-[1400px] px-5 py-24 text-center sm:px-8 lg:px-12">
			<h1 class="font-display text-4xl">
				Produk tidak ditemukan<span class="text-[#D9534F]">.</span>
			</h1>
			<p class="mt-4 text-sm text-[#6B6762]">
				Tautan ini mungkin sudah berubah atau produknya sudah tidak dipublikasikan.
			</p>
			<a
				href={catalogHref()}
				class="mt-8 inline-flex items-center gap-2 bg-[#242424] px-6 py-4 text-xs tracking-[0.12em] text-white uppercase transition hover:bg-[#D9534F]"
			>
				Lihat katalog
				<ArrowUpRight class="h-4 w-4" strokeWidth={1.6} />
			</a>
		</main>
	{:else}
		<main class="mx-auto max-w-[1400px] px-5 pt-6 pb-28 sm:px-8 sm:pt-8 lg:px-12 lg:pb-24">
			<!-- Breadcrumb -->
			<nav
				class="flex items-center gap-2 text-[10px] tracking-[0.12em] text-[#6B6762] uppercase"
				aria-label="Breadcrumb"
			>
				<a href="/" class="hover:text-[#242424]">Beranda</a>
				<span aria-hidden="true">/</span>
				<a href={catalogHref()} class="hover:text-[#242424]">Katalog</a>
				{#if category}
					<span aria-hidden="true">/</span>
					<a href={catalogHref()} class="hover:text-[#242424]">{category.name}</a>
				{/if}
				<span aria-hidden="true">/</span>
				<span class="text-[#242424]">{product.name}</span>
			</nav>

			<!-- Gallery + buy column -->
			<section
				class="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.85fr)] lg:gap-12"
			>
				<div class="lg:sticky lg:top-[100px]">
					<ProductGallery
						images={gallery}
						name={product.name}
						badge={product.featured ? 'Produk pilihan' : null}
					/>
				</div>

				<aside>
					<div class="lg:sticky lg:top-[100px]">
						<div class="flex items-start justify-between gap-4">
							<p class="text-[10px] tracking-[0.18em] text-[#6B6762] uppercase">
								{admin.settings.logo}{collections.length ? ` / ${collections[0]}` : ''}
							</p>
							<button
								type="button"
								class="-mt-1 p-1 text-[#6B6762] transition hover:text-[#D9534F]"
								aria-label={wished ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
								aria-pressed={wished}
								onclick={() => (wished = !wished)}
							>
								<Heart class="h-5 w-5" strokeWidth={1.6} fill={wished ? 'currentColor' : 'none'} />
							</button>
						</div>

						<h1 class="font-display mt-3 text-[34px] leading-[1.12] sm:text-[42px]">
							{product.name}
						</h1>

						<p class="mt-4 max-w-md text-sm leading-7 text-[#6B6762]">{product.shortDescription}</p>

						<div class="mt-6 flex items-baseline gap-3">
							<span class="text-[15px] tracking-wide">{formatIDR(price)}</span>
							{#if product.compareAtPrice}
								<span class="text-[12px] text-[#636363] line-through"
									>{formatIDR(product.compareAtPrice)}</span
								>
							{/if}
						</div>

						<div class="my-6 h-px bg-[#EAE8E4]"></div>

						<!-- Colour -->
						{#if colors.length > 0}
							<div class="mb-6">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-[10px] tracking-[0.16em] uppercase">Warna</span>
									<span class="text-[11px] text-[#6B6762]">{activeColor}</span>
								</div>
								<div class="flex items-center gap-3">
									{#each colors as color (color.value)}
										<button
											type="button"
											class="h-7 w-7 rounded-full border-2 border-[#FBFBFA] outline-1 outline-transparent transition duration-200 {activeColor ===
											color.value
												? 'outline-[#242424]'
												: 'outline-transparent hover:outline-[#999]'}"
											style={`background:${color.swatch}`}
											aria-label={`Warna ${color.value}`}
											aria-pressed={activeColor === color.value}
											onclick={() => selectColor(color.value)}
										></button>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Size -->
						{#if sizes.length > 0}
							<div class="mb-6">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-[10px] tracking-[0.16em] uppercase">Ukuran</span>
									{#if sizes.length === 1}
										<span class="text-[10px] text-[#6B6762] underline underline-offset-4">
											{sizes[0].value}
										</span>
									{/if}
								</div>
								<div class="flex flex-wrap gap-2">
									{#each sizes as size (size.value)}
										<button
											type="button"
											class="border px-5 py-3 text-[11px] transition {activeSize === size.value
												? 'border-[#242424] bg-[#242424] text-white'
												: 'border-[#D9D6CE] hover:border-[#242424]'}"
											aria-pressed={activeSize === size.value}
											onclick={() => selectSize(size.value)}
										>
											{size.value}
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Availability -->
						<div class="mb-5 flex items-center gap-2 text-[11px]">
							<span
								class="h-1.5 w-1.5 rounded-full {available
									? lowStock
										? 'bg-[#D69A35]'
										: 'bg-[#269B65]'
									: 'bg-[#D9534F]'}"
							></span>
							<span class="text-[#5F5E57]">
								{#if !available}
									Stok habis untuk pilihan ini
								{:else if !product.trackInventory || !Number.isFinite(stock)}
									Tersedia — kirim via WhatsApp
								{:else if lowStock}
									Stok menipis · sisa {stock} unit
								{:else}
									Tersedia · {stock} unit
								{/if}
							</span>
						</div>

						<!-- Quantity -->
						<div class="mb-5 flex items-center justify-between">
							<span class="text-[10px] tracking-[0.16em] uppercase">Jumlah</span>
							<div class="flex items-center border border-[#EAE8E4]">
								<button
									type="button"
									class="flex h-10 w-10 items-center justify-center text-lg transition hover:bg-[#F5F3EF] disabled:opacity-40"
									aria-label="Kurangi jumlah"
									disabled={quantity <= 1}
									onclick={() => (quantity = Math.max(1, quantity - 1))}
								>
									<Minus class="h-3.5 w-3.5" strokeWidth={1.8} />
								</button>
								<span class="w-9 text-center text-[12px]">{quantity}</span>
								<button
									type="button"
									class="flex h-10 w-10 items-center justify-center text-lg transition hover:bg-[#F5F3EF] disabled:opacity-40"
									aria-label="Tambah jumlah"
									disabled={quantity >= maxQuantity}
									onclick={() => (quantity = Math.min(maxQuantity, quantity + 1))}
								>
									<Plus class="h-3.5 w-3.5" strokeWidth={1.8} />
								</button>
							</div>
						</div>

						<div class="space-y-2">
							<button
								type="button"
								class="w-full bg-[#242424] px-5 py-[17px] text-[10px] tracking-[0.18em] text-white uppercase transition hover:bg-[#D9534F] disabled:cursor-not-allowed disabled:opacity-40"
								disabled={!available}
								onclick={() => openWhatsApp('buy')}
							>
								Beli via WhatsApp
							</button>
							<button
								type="button"
								class="w-full border border-[#C9C6BD] px-5 py-4 text-[10px] tracking-[0.16em] uppercase transition hover:border-[#242424] disabled:cursor-not-allowed disabled:opacity-40"
								disabled={!available}
								onclick={() => addToCart()}
							>
								Tambah ke keranjang
							</button>
							<button
								type="button"
								class="flex w-full items-center justify-center gap-2 border border-[#C9C6BD] px-5 py-4 text-[10px] tracking-[0.16em] uppercase transition hover:border-[#242424]"
								onclick={() => openWhatsApp('ask')}
							>
								<MessageCircle class="h-3.5 w-3.5" strokeWidth={1.6} />
								Tanya produk ini
							</button>
						</div>

						<p class="mt-4 text-[10px] leading-5 text-[#6B6762]">
							Pesanan dibuka di WhatsApp. Ketersediaan dan pengiriman dikonfirmasi oleh tim kami.
						</p>

						<div class="my-7 h-px bg-[#EAE8E4]"></div>

						<dl class="flex flex-col gap-3 text-[11px] text-[#5F5E57]">
							<div class="flex justify-between gap-4">
								<dt>Kode produk</dt>
								<dd class="tracking-wide">{skuFor(product, variant)}</dd>
							</div>
							{#if category}
								<div class="flex justify-between gap-4">
									<dt>Kategori</dt>
									<dd>{category.name}</dd>
								</div>
							{/if}
							{#if collections.length > 0}
								<div class="flex justify-between gap-4">
									<dt>Koleksi</dt>
									<dd>{collections.join(', ')}</dd>
								</div>
							{/if}
							<div class="flex justify-between gap-4">
								<dt>Stok</dt>
								<dd>
									{product.trackInventory && Number.isFinite(stock)
										? `${stock} unit`
										: 'On request'}
								</dd>
							</div>
						</dl>
					</div>
				</aside>
			</section>

			<!-- Editorial -->
			<section class="mt-16 border-t border-[#EAE8E4] pt-10 sm:mt-24 sm:pt-14">
				<div class="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
					<div>
						<p class="text-[10px] tracking-[0.18em] text-[#6B6762] uppercase">The details</p>
						<h2 class="font-display mt-3 text-[30px] leading-tight sm:text-[36px]">
							Dirancang untuk dipakai setiap hari.
						</h2>
					</div>
					<div class="max-w-2xl">
						<p class="text-[13px] leading-7 text-[#68675F]">{product.fullDescription}</p>
					</div>
				</div>
			</section>

			<!-- Detail strip -->
			<section class="mt-12 grid grid-cols-2 gap-2 sm:mt-16 sm:grid-cols-4 sm:gap-3">
				{#each gallery.slice(0, 4) as image, i (image.src + i)}
					<img
						class="aspect-[4/5] w-full bg-[#F5F3EF] object-cover"
						src={image.src}
						alt={image.alt}
						loading="lazy"
					/>
				{/each}
			</section>

			<!-- Specifications -->
			<section class="mt-16 sm:mt-24 lg:max-w-4xl">
				<Accordion
					items={[
						{
							id: 'spec',
							title: 'Spesifikasi produk',
							facts: [
								{ label: 'Kode produk', value: skuFor(product, variant) },
								{ label: 'Kategori', value: category?.name ?? '—' },
								{
									label: 'Warna',
									value: colors.length > 0 ? colors.map((c) => c.value).join(', ') : '—'
								},
								{
									label: 'Ukuran',
									value: sizes.length > 0 ? sizes.map((s) => s.value).join(', ') : 'One Size'
								},
								{ label: 'Varian', value: variantLabel(product, variant) },
								{
									label: 'Stok',
									value:
										product.trackInventory && Number.isFinite(stock)
											? `${stock} unit`
											: 'On request'
								}
							]
						},
						{
							id: 'shipping',
							title: 'Pengiriman & pengiriman',
							paragraphs: [
								'Detail pengiriman dan estimasi tiba dikonfirmasikan oleh tim kami melalui WhatsApp setelah pesanan masuk.'
							]
						},
						{
							id: 'care',
							title: 'Perawatan produk',
							paragraphs: [
								'Simpan di tempat kering, jauh dari paparan langsung matahari dan cairan. Bersihkan dengan kain lembap yang lembut.'
							]
						},
						{
							id: 'returns',
							title: 'Retur & penukaran',
							paragraphs: [
								'Hubungi tim toko untuk kebijakan retur dan penukaran yang berlaku pada produk ini.'
							]
						}
					]}
				/>
			</section>

			<!-- Recommendations -->
			{#if related.length > 0}
				<section class="mt-16 sm:mt-24">
					<div class="mb-7 flex items-end justify-between">
						<div>
							<p class="text-[10px] tracking-[0.18em] text-[#6B6762] uppercase">Discover more</p>
							<h2 class="font-display mt-2 text-[28px] sm:text-[34px]">Mungkin juga kamu suka</h2>
						</div>
						<a
							href={catalogHref()}
							class="hidden border-b border-[#AAA69C] pb-1 text-[10px] tracking-[0.14em] uppercase hover:border-[#242424] sm:inline"
						>
							Lihat semua produk
							<ArrowUpRight class="inline h-3 w-3 align-[-1px]" strokeWidth={1.6} />
						</a>
					</div>
					<div class="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
						{#each related as p (p.id)}
							<ProductCard product={p} />
						{/each}
					</div>
				</section>
			{/if}
		</main>

		<!-- Mobile sticky bar -->
		<div
			class="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAE8E4] bg-[#FBFBFA]/95 px-4 py-3 backdrop-blur lg:hidden"
		>
			<div class="mx-auto flex max-w-xl items-center justify-between gap-4">
				<div class="min-w-0">
					<p class="truncate text-[9px] tracking-[0.12em] text-[#6B6762] uppercase">
						{product.name}
					</p>
					<p class="mt-1 text-[13px]">{formatIDR(price)}</p>
				</div>
				<button
					type="button"
					class="shrink-0 bg-[#242424] px-5 py-4 text-[9px] tracking-[0.15em] text-white uppercase transition hover:bg-[#D9534F] disabled:cursor-not-allowed disabled:opacity-40"
					disabled={!available}
					onclick={() => openWhatsApp('buy')}
				>
					Beli via WhatsApp
				</button>
			</div>
		</div>
	{/if}

	<StoreFooter base="/" />
</div>
