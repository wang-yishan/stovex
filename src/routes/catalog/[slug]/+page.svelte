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
	import { generateOrderCode, productOrderItem, waLink, waMessage, waTextUrl } from '#lib/catalog/wa.ts';
	import { catalogHref } from '#lib/catalog/links.ts';
	import { orderApi } from '#lib/admin/api.ts';
	import StoreHeader from '#lib/components/storefront/StoreHeader.svelte';
	import StoreFooter from '#lib/components/storefront/StoreFooter.svelte';
	import ProductGallery from '#lib/components/storefront/ProductGallery.svelte';
	import ProductCard from '#lib/components/storefront/ProductCard.svelte';
	import Accordion from '#lib/components/storefront/Accordion.svelte';
	import OrderContactModal from '#lib/components/storefront/OrderContactModal.svelte';
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
	let bannerOpen = $state(true);
	let orderOpen = $state(false);
	let orderCode = $state('');

	// Feature flag: temporarily deactivate storefront reviews without removing the feature.
	const REVIEWS_ENABLED = false;

	type Review = {
		id: string;
		author: string;
		date: string;
		rating: number;
		text?: string;
		images: string[];
	};

	type ReviewFilter = 'all' | 'with-image' | 'text-only';

	const reviewFilters: { value: ReviewFilter; label: string }[] = [
		{ value: 'all', label: 'Semua' },
		{ value: 'with-image', label: 'Dengan gambar' },
		{ value: 'text-only', label: 'Teks saja' }
	];

	let reviewFilter = $state<ReviewFilter>('all');

	let reviews = $derived.by<Review[]>(() => {
		if (!product) return [];
		const photos = gallery.map((g) => g.src).filter(Boolean);
		return [
			{
				id: `${product.id}-rv-1`,
				author: 'Nadia',
				date: '12 Okt 2026',
				rating: 5,
				text: `Bahan ${product.name} terasa kokoh dan finishing-nya rapi. Warnanya sesuai foto.`,
				images: photos[0] ? [photos[0]] : []
			},
			{
				id: `${product.id}-rv-2`,
				author: 'Raka',
				date: '3 Okt 2026',
				rating: 4,
				text: 'Ukuran pas untuk kebutuhan harian, jahitan bersih. Pengiriman juga cepat.',
				images: []
			},
			{
				id: `${product.id}-rv-3`,
				author: 'Sari',
				date: '28 Sep 2026',
				rating: 5,
				text: 'Suka detailnya, nyaman dipakai seharian dan mudah dipadukan.',
				images: photos.slice(1, 3)
			},
			{
				id: `${product.id}-rv-4`,
				author: 'Dimas',
				date: '20 Sep 2026',
				rating: 4,
				images: photos[2] ? [photos[2]] : photos[0] ? [photos[0]] : []
			}
		];
	});

	let filteredReviews = $derived.by(() => {
		return reviews.filter((review) => {
			const hasText = Boolean(review.text?.trim());
			const hasImages = review.images.length > 0;
			if (reviewFilter === 'with-image') return hasImages;
			if (reviewFilter === 'text-only') return hasText && !hasImages;
			return true;
		});
	});

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
		const req = { product, variant, quantity, url: productUrl() };
		if (mode === 'ask') {
			const url = waLink(req, 'ask');
			window.open(url, '_blank', 'noopener,noreferrer');
			return;
		}
		orderCode = generateOrderCode();
		orderOpen = true;
	}

	function buyHref(name: string, note: string): string {
		if (!product) return '#';
		const req = { product, variant, quantity, url: productUrl() };
		const message = waMessage(req, 'buy', { orderCode, customerName: name, customerNote: note });
		return waTextUrl(message);
	}

	function recordBuyOrder(detail: { name: string; note: string }): void {
		if (!product) return;
		const req = { product, variant, quantity, url: productUrl() };
		const item = productOrderItem(req);
		const message = waMessage(req, 'buy', {
			orderCode,
			customerName: detail.name,
			customerNote: detail.note
		});
		void orderApi
			.create({
				code: orderCode,
				source: 'product',
				customerName: detail.name,
				customerNote: detail.note,
				items: [
					{
						productId: item.productId,
						productName: item.productName,
						variant: item.variant,
						sku: item.sku,
						quantity: item.quantity,
						unitPrice: item.unitPrice
					}
				],
				message
			})
			.catch(() => {
				/* redirect to WhatsApp already happened; recording is best-effort */
			});
		orderOpen = false;
	}

	function addToCart() {
		if (!product) return;
		cart.add(product, price, variantLabel(product, variant), skuFor(product, variant));
	}
</script>

<svelte:head>
	<title
		>{product
			? `${product.name} — ${admin.settings.brand.name}`
			: `Produk tidak ditemukan — ${admin.settings.brand.name}`}</title
	>
	<meta
		name="description"
		content={product?.seoDescription ||
			product?.shortDescription ||
			admin.settings.defaultSeo.description}
	/>
	<meta name="theme-color" content="#FBFBFA" />
</svelte:head>

<div class="forma-root min-h-screen w-full bg-brand-surface text-brand-ink">
	<StoreHeader base="/" />

	{#if !product}
		<main class="mx-auto max-w-[1400px] px-5 py-24 text-center sm:px-8 lg:px-12">
			<h1 class="font-display text-4xl">
				Produk tidak ditemukan<span class="text-brand-accent">.</span>
			</h1>
			<p class="mt-4 text-sm text-brand-muted">
				Tautan ini mungkin sudah berubah atau produknya sudah tidak dipublikasikan.
			</p>
			<a
				href={catalogHref()}
				class="mt-8 inline-flex items-center gap-2 bg-brand-ink px-6 py-4 text-xs tracking-[0.12em] text-white uppercase transition hover:bg-brand-accent"
			>
				Lihat katalog
				<ArrowUpRight class="h-4 w-4" strokeWidth={1.6} />
			</a>
		</main>
	{:else}
		<main class="mx-auto max-w-[1400px] px-5 pt-6 pb-28 sm:px-8 sm:pt-8 lg:px-12 lg:pb-24">
			<!-- Breadcrumb -->
			<nav
				class="flex items-center gap-2 text-[10px] tracking-[0.12em] text-brand-muted uppercase"
				aria-label="Breadcrumb"
			>
				<a href="/" class="hover:text-brand-ink">Beranda</a>
				<span aria-hidden="true">/</span>
				<a href={catalogHref()} class="hover:text-brand-ink">Katalog</a>
				{#if category}
					<span aria-hidden="true">/</span>
					<a href={catalogHref()} class="hover:text-brand-ink">{category.name}</a>
				{/if}
				<span aria-hidden="true">/</span>
				<span class="text-brand-ink">{product.name}</span>
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
							<p class="text-[10px] tracking-[0.18em] text-brand-muted uppercase">
								{admin.settings.brand.name}{collections.length ? ` / ${collections[0]}` : ''}
							</p>
							<button
								type="button"
								class="-mt-1 p-1 text-brand-muted transition hover:text-brand-accent"
								aria-label={wished ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
								aria-pressed={wished}
								onclick={() => (wished = !wished)}
							>
								<Heart class="h-5 w-5" strokeWidth={1.6} fill={wished ? 'currentColor' : 'none'} />
							</button>
						</div>

						<h1 class="mt-3 font-display text-[34px] leading-[1.12] sm:text-[42px]">
							{product.name}
						</h1>

						<p class="mt-4 max-w-md text-sm leading-7 text-brand-muted">
							{product.shortDescription}
						</p>

						<div class="mt-6 flex items-baseline gap-3">
							<span class="text-[15px] tracking-wide">{formatIDR(price)}</span>
							{#if product.compareAtPrice}
								<span class="text-[12px] text-[#636363] line-through"
									>{formatIDR(product.compareAtPrice)}</span
								>
							{/if}
						</div>

						<div class="my-6 h-px bg-brand-border"></div>

						<!-- Colour -->
						{#if colors.length > 0}
							<div class="mb-6">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-[10px] tracking-[0.16em] uppercase">Warna</span>
									<span class="text-[11px] text-brand-muted">{activeColor}</span>
								</div>
								<div class="flex items-center gap-3">
									{#each colors as color (color.value)}
										<button
											type="button"
											class="h-7 w-7 rounded-full border-2 border-brand-surface outline-1 outline-transparent transition duration-200 {activeColor ===
											color.value
												? 'outline-brand-ink'
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
										<span class="text-[10px] text-brand-muted underline underline-offset-4">
											{sizes[0].value}
										</span>
									{/if}
								</div>
								<div class="flex flex-wrap gap-2">
									{#each sizes as size (size.value)}
										<button
											type="button"
											class="border px-5 py-3 text-[11px] transition {activeSize === size.value
												? 'border-brand-ink bg-brand-ink text-white'
												: 'border-[#D9D6CE] hover:border-brand-ink'}"
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
									: 'bg-brand-accent'}"
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
							<div class="flex items-center border border-brand-border">
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
								class="w-full bg-brand-ink px-5 py-[17px] text-[10px] tracking-[0.18em] text-white uppercase transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-40"
								disabled={!available}
								onclick={() => openWhatsApp('buy')}
							>
								Beli via WhatsApp
							</button>
							<button
								type="button"
								class="w-full border border-[#C9C6BD] px-5 py-4 text-[10px] tracking-[0.16em] uppercase transition hover:border-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
								disabled={!available}
								onclick={() => addToCart()}
							>
								Tambah ke keranjang
							</button>
							<button
								type="button"
								class="flex w-full items-center justify-center gap-2 border border-[#C9C6BD] px-5 py-4 text-[10px] tracking-[0.16em] uppercase transition hover:border-brand-ink"
								onclick={() => openWhatsApp('ask')}
							>
								<MessageCircle class="h-3.5 w-3.5" strokeWidth={1.6} />
								Tanya produk ini
							</button>
						</div>

						<p class="mt-4 text-[10px] leading-5 text-brand-muted">
							Pesanan dibuka di WhatsApp. Ketersediaan dan pengiriman dikonfirmasi oleh tim kami.
						</p>

						<div class="my-7 h-px bg-brand-border"></div>

						<dl class="flex flex-col gap-3 text-[11px] text-[#5F5E57]">
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
			<section class="mt-16 border-t border-brand-border pt-10 sm:mt-24 sm:pt-14">
				<div class="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
					<div>
						<p class="text-[10px] tracking-[0.18em] text-brand-muted uppercase">The details</p>
						<h2 class="mt-3 font-display text-[30px] leading-tight sm:text-[36px]">
							Dirancang untuk dipakai setiap hari.
						</h2>
					</div>
					<div class="max-w-2xl">
						<p class="text-[13px] leading-7 text-[#68675F]">{product.fullDescription}</p>
					</div>
				</div>
			</section>

			<!-- Specifications -->
			<section class="mt-16 sm:mt-24 lg:max-w-4xl">
				{#if (product.bannerImages?.length ?? 0) > 0}
					<div class="border-t border-b border-brand-border">
						<button
							type="button"
							class="flex w-full items-center justify-between gap-4 py-5 text-left"
							aria-expanded={bannerOpen}
							onclick={() => (bannerOpen = !bannerOpen)}
						>
							<span class="text-[10px] tracking-[0.16em] uppercase">Banner Produk</span>
							<svg
								class="h-4 w-4 shrink-0 transition-transform duration-200 {bannerOpen
									? 'rotate-180'
									: ''}"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m6 9 6 6 6-6" />
							</svg>
						</button>
						{#if bannerOpen}
							<div class="pb-6">
								<div class="relative left-1/2 w-screen -translate-x-1/2">
									<div class="space-y-0">
										{#each product.bannerImages ?? [] as img, i (img.id)}
											<div class="w-full bg-[#F5F3EF]">
												{#if img.url}
													<img
														src={img.url}
														alt={img.alt ?? `${product.name} detail ${i + 1}`}
														class="block h-auto w-full"
														loading="lazy"
													/>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							</div>
						{/if}
					</div>
					<div class="[&>div]:border-t-0">
						<Accordion
							items={[
								{
									id: 'spec',
									title: 'Spesifikasi produk',
									facts: [
								{ label: 'Bahan', value: product.material?.trim() || '—' },
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
							title: 'Pengiriman',
							paragraphs: [
								'Detail pengiriman dan estimasi tiba dikonfirmasikan oleh tim kami melalui WhatsApp setelah pesanan masuk.',
								'Gratis ongkir untuk pembelian di atas Rp750.000. Pengiriman ke seluruh Indonesia.'
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
					</div>
				{:else}
					<Accordion
						items={[
							{
								id: 'spec',
								title: 'Spesifikasi produk',
								facts: [
									{ label: 'Bahan', value: product.material?.trim() || '—' },
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
								title: 'Pengiriman',
								paragraphs: [
									'Detail pengiriman dan estimasi tiba dikonfirmasikan oleh tim kami melalui WhatsApp setelah pesanan masuk.',
									'Gratis ongkir untuk pembelian di atas Rp750.000. Pengiriman ke seluruh Indonesia.'
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
				{/if}
			</section>

			{#if REVIEWS_ENABLED}
				<!-- Reviews -->
				<section class="mt-16 border-t border-brand-border pt-10 sm:mt-24 sm:pt-14 lg:max-w-4xl">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p class="text-[10px] tracking-[0.18em] text-brand-muted uppercase">Ulasan</p>
							<h2 class="mt-2 font-display text-[28px] leading-tight sm:text-[34px]">
								Apa kata pembeli
							</h2>
						</div>
						<div class="flex flex-wrap gap-2" role="group" aria-label="Filter ulasan">
							{#each reviewFilters as filter (filter.value)}
								<button
									type="button"
									class="border px-3 py-2 text-[10px] tracking-[0.12em] uppercase transition {reviewFilter ===
									filter.value
										? 'border-brand-ink bg-brand-ink text-white'
										: 'border-[#D9D6CE] text-brand-ink hover:border-brand-ink'}"
									aria-pressed={reviewFilter === filter.value}
									onclick={() => (reviewFilter = filter.value)}
								>
									{filter.label}
								</button>
							{/each}
						</div>
					</div>

					{#if filteredReviews.length === 0}
						<p class="mt-8 text-[13px] leading-7 text-[#68675F]">
							Belum ada ulasan untuk filter ini.
						</p>
					{:else}
						<ul class="mt-8 space-y-4">
							{#each filteredReviews as review (review.id)}
								<li class="border border-brand-border bg-white p-5 sm:p-6">
									<div class="flex items-start justify-between gap-4">
										<div>
											<p class="text-[12px] font-medium text-brand-ink">{review.author}</p>
											<p class="mt-1 text-[10px] tracking-[0.08em] text-brand-muted uppercase">
												{review.date}
											</p>
										</div>
										<div class="flex items-center gap-0.5 text-brand-ink" aria-label={`Rating ${review.rating} dari 5`}>
											{#each Array.from({ length: 5 }) as _, i (i)}
												<span class="text-[11px]">{i < review.rating ? '★' : '☆'}</span>
											{/each}
										</div>
									</div>
									{#if review.text}
										<p class="mt-4 text-[13px] leading-7 text-[#68675F]">{review.text}</p>
									{/if}
									{#if review.images.length > 0}
										<div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
											{#each review.images as image, i (image + i)}
												<img
													src={image}
													alt={`Foto ulasan ${review.author} ${i + 1}`}
													class="aspect-square w-full bg-[#F5F3EF] object-cover"
													loading="lazy"
												/>
											{/each}
										</div>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/if}

			<!-- Recommendations -->
			{#if related.length > 0}
				<section class="mt-16 sm:mt-24">
					<div class="mb-7 flex items-end justify-between">
						<div>
							<p class="text-[10px] tracking-[0.18em] text-brand-muted uppercase">Discover more</p>
							<h2 class="mt-2 font-display text-[28px] sm:text-[34px]">Mungkin juga kamu suka</h2>
						</div>
						<a
							href={catalogHref()}
							class="hidden border-b border-[#AAA69C] pb-1 text-[10px] tracking-[0.14em] uppercase hover:border-brand-ink sm:inline"
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
			class="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-brand-surface/95 px-4 py-3 backdrop-blur lg:hidden"
		>
			<div class="mx-auto flex max-w-xl items-center justify-between gap-4">
				<div class="min-w-0">
					<p class="truncate text-[9px] tracking-[0.12em] text-brand-muted uppercase">
						{product.name}
					</p>
					<p class="mt-1 text-[13px]">{formatIDR(price)}</p>
				</div>
				<button
					type="button"
					class="shrink-0 bg-brand-ink px-5 py-4 text-[9px] tracking-[0.15em] text-white uppercase transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:opacity-40"
					disabled={!available}
					onclick={() => openWhatsApp('buy')}
				>
					Beli via WhatsApp
				</button>
			</div>
		</div>

		{#if orderOpen}
			<OrderContactModal
				open={orderOpen}
				orderCode={orderCode}
				title="Beli via WhatsApp"
				description="Isi nama dan catatan. Pesanan akan dikirim ke WhatsApp beserta kode pesanan."
				getHref={buyHref}
				onProceed={recordBuyOrder}
				onClose={() => {
					orderOpen = false;
				}}
			/>
		{/if}
	{/if}

	<StoreFooter base="/" />
</div>
