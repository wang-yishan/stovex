<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus } from '#lib/admin/data.ts';
	import type { Product } from '#lib/admin/types.ts';
	import { cart } from '#lib/catalog/cart.svelte.ts';
	import { FALLBACK_PHOTOS } from '#lib/catalog/photos.ts';
	import { generalWaLinkWithGreeting } from '#lib/catalog/wa.ts';
	import { catalogHref } from '#lib/catalog/links.ts';
	import StoreHeader from '#lib/components/storefront/StoreHeader.svelte';
	import StoreFooter from '#lib/components/storefront/StoreFooter.svelte';
	import ProductCard from '#lib/components/storefront/ProductCard.svelte';
	import { ArrowUpRight, MessageCircle } from '@lucide/svelte';

	/* ------------------------------------------------------------------ *
	 * Data — live in-memory catalog owned by the admin dashboard.
	 * ------------------------------------------------------------------ */

	let active = $derived(admin.products.filter((p) => p.status === 'active'));

	let activeFilter = $state('all');

	let filterPills = $derived([
		{ id: 'all', name: 'Semua' },
		...admin.categories.map((c) => ({ id: c.id, name: c.name }))
	]);

	let filtered = $derived(
		activeFilter === 'all' ? active : active.filter((p) => p.categoryId === activeFilter)
	);

	let collectionCards = $derived(
		[...admin.collections]
			.sort((a, b) => a.order - b.order)
			.map((c) => ({
				...c,
				count: c.productIds.filter((id) => active.some((p) => p.id === id)).length
			}))
	);

	/* Fallback photography — the seeded catalog ships without image URLs. */
	const FALLBACKS = FALLBACK_PHOTOS;

	function isOut(p: Product): boolean {
		const stock = effectiveStock(p);
		return stockStatus(stock, p.lowStockThreshold || 5, p.trackInventory) === 'out';
	}
</script>

<!--
	@component
	FORMA storefront landing — live in-memory catalog, WhatsApp ordering, mini cart.
-->

<svelte:head>
	<title>{admin.settings.defaultSeo.title}</title>
	<meta name="description" content={admin.settings.defaultSeo.description} />
	<meta name="theme-color" content="#fbfbfa" />
</svelte:head>

<div class="forma-root min-h-screen w-full bg-brand-surface text-brand-ink">
	<StoreHeader />

	<main id="top">
		<!-- Hero -->
		<section class="mx-auto max-w-[1400px] px-5 pt-7 sm:px-8 sm:pt-10 lg:px-12">
			<div
				class="relative grid min-h-[540px] overflow-hidden bg-[#F5F3EF] sm:min-h-[610px] lg:grid-cols-[0.92fr_1.08fr]"
			>
				<div
					class="relative z-10 flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16 xl:px-20"
				>
					<p
						class="mb-6 text-[10px] font-semibold tracking-[0.24em] text-brand-accent uppercase sm:text-xs"
					>
						The art of carrying well
					</p>
					<h1
						class="max-w-xl font-display text-[44px] leading-[1.08] tracking-[-0.035em] sm:text-6xl xl:text-[72px]"
					>
						Membawa gaya,<br /><em class="font-medium text-brand-accent">menjalani hari.</em>
					</h1>
					<p class="mt-7 max-w-md text-sm leading-7 text-brand-muted sm:text-base">
						Tas pilihan dengan desain yang tenang, detail yang dipikirkan, dan karakter yang
						bertahan melampaui tren.
					</p>
					<div class="mt-9 flex flex-wrap items-center gap-5">
						<a
							href="#koleksi"
							class="inline-flex items-center gap-4 bg-brand-ink px-6 py-4 text-xs tracking-[0.12em] text-white uppercase transition hover:bg-brand-accent"
						>
							Jelajahi koleksi
							<ArrowUpRight class="h-4 w-4" strokeWidth={1.6} />
						</a>
						<a
							href="#cerita"
							class="border-b border-brand-ink/40 pb-1 text-xs tracking-wide transition hover:border-brand-accent hover:text-brand-accent"
						>
							Kenali {admin.settings.brand.name}
						</a>
					</div>
					<div class="mt-14 flex max-w-md items-center gap-8 border-t border-black/10 pt-6">
						<div>
							<p class="font-display text-2xl">01</p>
							<p class="mt-1 text-[10px] tracking-wider text-brand-muted uppercase">
								Thoughtful design
							</p>
						</div>
						<div>
							<p class="font-display text-2xl">02</p>
							<p class="mt-1 text-[10px] tracking-wider text-brand-muted uppercase">
								Everyday function
							</p>
						</div>
						<div>
							<p class="font-display text-2xl">03</p>
							<p class="mt-1 text-[10px] tracking-wider text-brand-muted uppercase">
								Timeless style
							</p>
						</div>
					</div>
				</div>
				<div class="relative min-h-[360px] overflow-hidden lg:min-h-full">
					<img
						class="absolute inset-0 h-full w-full object-cover"
						src={FALLBACKS[3]}
						alt="Tas kulit berwarna netral dengan desain elegan"
					/>
					<div
						class="absolute right-6 bottom-6 max-w-[210px] bg-brand-surface/95 px-5 py-4 sm:right-9 sm:bottom-9"
					>
						<p class="text-[9px] tracking-[0.2em] text-brand-muted uppercase">Curated essentials</p>
						<p class="mt-1 font-display text-xl">Less, but better.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Trust strip -->
		<section class="mx-auto max-w-[1400px] px-5 py-9 sm:px-8 sm:py-12 lg:px-12">
			<div
				class="grid grid-cols-2 gap-x-4 gap-y-6 border-b border-brand-border pb-9 md:grid-cols-4"
			>
				<div class="flex items-center gap-3">
					<span class="text-xl text-[#D69A35]">✳</span>
					<div>
						<p class="text-xs font-semibold">Pilihan terkurasi</p>
						<p class="mt-1 text-[11px] text-brand-muted">Gaya yang relevan setiap hari</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xl text-[#D69A35]">◇</span>
					<div>
						<p class="text-xs font-semibold">Detail fungsional</p>
						<p class="mt-1 text-[11px] text-brand-muted">Dirancang untuk digunakan</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xl text-[#D69A35]">↗</span>
					<div>
						<p class="text-xs font-semibold">Belanja mudah</p>
						<p class="mt-1 text-[11px] text-brand-muted">Pesan langsung via WhatsApp</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<span class="text-xl text-[#D69A35]">♡</span>
					<div>
						<p class="text-xs font-semibold">Layanan personal</p>
						<p class="mt-1 text-[11px] text-brand-muted">Kami siap membantu pilihanmu</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Collections -->
		<section id="koleksi" class="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
			<div class="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p class="mb-3 text-[10px] font-semibold tracking-[0.22em] text-brand-accent uppercase">
						Find your everyday piece
					</p>
					<h2 class="font-display text-4xl tracking-tight sm:text-5xl">
						Koleksi pilihan<span class="text-brand-accent">.</span>
					</h2>
					<p class="mt-3 text-sm text-brand-muted">
						Temukan bentuk yang paling sesuai dengan ritme harimu.
					</p>
				</div>
				<div class="flex flex-col items-start gap-3 sm:items-end">
					<a
						href="#pilihan"
						class="self-start border-b border-brand-ink/40 pb-1 text-xs hover:border-brand-accent hover:text-brand-accent sm:self-auto"
					>
						Lihat panduan memilih
						<ArrowUpRight class="inline h-3.5 w-3.5 align-[-2px]" strokeWidth={1.6} />
					</a>
					<a
						href={catalogHref()}
						class="self-start border-b border-brand-ink/40 pb-1 text-xs hover:border-brand-accent hover:text-brand-accent sm:self-auto"
					>
						Lihat katalog lengkap
						<ArrowUpRight class="inline h-3.5 w-3.5 align-[-2px]" strokeWidth={1.6} />
					</a>
				</div>
			</div>

			<div class="mb-7 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter kategori">
				{#each filterPills as pill (pill.id)}
					<button
						type="button"
						class="shrink-0 rounded-full border border-brand-border px-5 py-2.5 text-xs transition hover:border-brand-ink {activeFilter ===
						pill.id
							? 'border-brand-ink bg-brand-ink text-white'
							: 'bg-transparent text-brand-ink'}"
						onclick={() => (activeFilter = pill.id)}
					>
						{pill.name}
					</button>
				{/each}
			</div>

			{#if filtered.length === 0}
				<p class="py-10 text-center text-sm text-brand-muted">
					Belum ada produk pada kategori ini. Silakan cek kembali nanti.
				</p>
			{:else}
				<div class="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-4">
					{#each filtered as p (p.id)}
						<ProductCard product={p} />
					{/each}
				</div>
			{/if}
			<p class="mt-8 text-center text-[10px] text-brand-muted">
				*Katalog, harga, dan foto mengikuti data yang aktif di dashboard.
			</p>
		</section>

		<!-- Editorial split -->
		<section id="cerita" class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
			<div class="grid bg-[#F2F0EC] lg:grid-cols-2">
				<div class="min-h-[360px] overflow-hidden sm:min-h-[500px]">
					<img
						class="h-full w-full object-cover"
						src={FALLBACKS[4]}
						alt="Detail tas dengan material dan bentuk yang elegan"
						loading="lazy"
					/>
				</div>
				<div class="flex flex-col justify-center px-8 py-12 sm:px-14 lg:px-16 xl:px-20">
					<p class="mb-5 text-[10px] font-semibold tracking-[0.22em] text-brand-accent uppercase">
						Our point of view
					</p>
					<h2 class="font-display text-4xl leading-[1.12] sm:text-5xl">
						Bukan sekadar<br />pelengkap penampilan.
					</h2>
					<p class="mt-6 max-w-lg text-sm leading-7 text-brand-muted">
						Kami percaya tas yang baik seharusnya terasa tepat—mudah dipadukan, nyaman digunakan,
						dan cukup istimewa untuk menemani banyak cerita. Karena itu, setiap pilihan di {admin
							.settings.brand.name}
						mengutamakan siluet yang bersih dan fungsi sehari-hari.
					</p>
					<a
						href="#koleksi"
						class="mt-8 inline-flex items-center gap-4 self-start border-b border-brand-ink/40 pb-3 text-xs tracking-[0.12em] uppercase transition hover:border-brand-accent hover:text-brand-accent"
					>
						Temukan koleksimu
						<ArrowUpRight class="h-4 w-4" strokeWidth={1.6} />
					</a>
				</div>
			</div>
		</section>

		<!-- Collection editorial cards -->
		<section id="pilihan" class="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
			<div class="mx-auto mb-10 max-w-xl text-center">
				<p class="mb-3 text-[10px] font-semibold tracking-[0.22em] text-brand-accent uppercase">
					Made for your rhythm
				</p>
				<h2 class="font-display text-4xl sm:text-5xl">Satu tas, banyak cerita.</h2>
				<p class="mt-4 text-sm leading-6 text-brand-muted">
					Mulai dari hari kerja yang padat hingga akhir pekan yang santai.
				</p>
			</div>

			{#if collectionCards.length > 0}
				<div class="grid gap-4 sm:gap-5 md:grid-cols-3">
					{#each collectionCards as c, i (c.id)}
						<a
							href="#koleksi"
							class="group relative h-[330px] overflow-hidden bg-[#F5F3EF] sm:h-[410px]"
						>
							<img
								class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
								src={c.coverImage || FALLBACKS[(i + 1) % FALLBACKS.length]}
								alt={c.name}
								loading="lazy"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
							></div>
							<div class="absolute bottom-6 left-6 text-white">
								<p class="text-[9px] tracking-[0.2em] uppercase">
									0{i + 1} / {c.count}
									{c.count === 1 ? 'item' : 'items'}
								</p>
								<h3 class="mt-1 font-display text-2xl">{c.name}</h3>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="grid gap-4 sm:gap-5 md:grid-cols-3">
					{#each [{ k: '01 / Everyday', t: 'Daily essentials' }, { k: '02 / Workday', t: 'Work, reimagined' }, { k: '03 / Weekend', t: 'Off-duty mood' }] as card, i (card.t)}
						<a
							href="#koleksi"
							class="group relative h-[330px] overflow-hidden bg-[#F5F3EF] sm:h-[410px]"
						>
							<img
								class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
								src={FALLBACKS[(i + 1) % FALLBACKS.length]}
								alt={card.t}
								loading="lazy"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
							></div>
							<div class="absolute bottom-6 left-6 text-white">
								<p class="text-[9px] tracking-[0.2em] uppercase">{card.k}</p>
								<h3 class="mt-1 font-display text-2xl">{card.t}</h3>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- CTA -->
		<section class="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
			<div
				class="relative overflow-hidden bg-brand-ink px-7 py-14 text-center text-white sm:px-14 sm:py-16"
			>
				<div class="absolute -top-20 -right-10 h-64 w-64 rounded-full border border-white/10"></div>
				<div
					class="absolute -bottom-36 -left-12 h-80 w-80 rounded-full border border-white/10"
				></div>
				<p class="relative text-[10px] font-semibold tracking-[0.24em] text-[#D69A35] uppercase">
					A better everyday starts here
				</p>
				<h2 class="relative mt-4 font-display text-4xl sm:text-5xl">
					Temukan tas yang terasa seperti kamu.
				</h2>
				<p class="relative mt-4 text-sm text-white/60">
					Butuh bantuan memilih? Ceritakan kebutuhanmu kepada tim kami.
				</p>
				<a
					href={generalWaLinkWithGreeting('saya ingin bertanya tentang koleksi tas.')}
					target="_blank"
					rel="noopener"
					class="relative mt-8 inline-flex items-center gap-2 bg-brand-surface px-7 py-4 text-xs tracking-[0.12em] text-brand-ink uppercase transition hover:bg-brand-accent hover:text-white"
				>
					<MessageCircle class="h-4 w-4" strokeWidth={1.6} />
					Hubungi via WhatsApp
				</a>
			</div>
		</section>
	</main>

	<StoreFooter base="" />
</div>
