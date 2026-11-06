<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import {
		formatIDR,
		effectiveStock,
		stockStatus
	} from '#lib/admin/data.ts';
	import {
		ShoppingBag,
		MessageCircle,
		Copy,
		ArrowRight,
		LayoutDashboard
	} from '@lucide/svelte';

	let { products, collections, categories } = admin;

	let active = $derived(
		products.filter((p) => p.status === 'active')
	);

	let featured = $derived(
		[...active]
			.sort((a, b) => {
				if (a.featured !== b.featured) return a.featured ? -1 : 1;
				return b.updatedAt.localeCompare(a.updatedAt);
			})
			.slice(0, 8)
	);

	let collectionCards = $derived(
		[...collections]
			.sort((a, b) => a.order - b.order)
			.map((c) => ({
				...c,
				count: c.productIds.filter((id) =>
					active.some((p) => p.id === id)
				).length
			}))
	);

	let categoryPills = $derived(
		categories.map((c) => ({
			...c,
			count: active.filter((p) => p.categoryId === c.id).length
		}))
	);

	function copyMsg(name: string, sku: string | undefined, price: number, compareAt?: number) {
		let msg = `Halo, saya tertarik dengan ${name} ${formatIDR(price)}`;
		if (compareAt) msg += ` (was ${formatIDR(compareAt)})`;
		if (sku) msg += `\nSKU: ${sku}`;
		const el = document.createElement('textarea');
		el.value = msg;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	}

	function waLink(name: string, sku: string | undefined, price: number, compareAt?: number, stock = 0) {
		const avail = stock > 0 ? `In stock (${stock})` : 'Out of stock';
		let msg =
			`Halo, saya tertarik dengan produk:\n${name}\n` +
			`Harga: ${formatIDR(price)}` +
			(compareAt ? ` (was ${formatIDR(compareAt)})` : '') +
			`\nSKU: ${sku ?? '-'}` +
			`\nAvailability: ${avail}\n`;
		return 'https://wa.me/?text=' + encodeURIComponent(msg.trim());
	}
</script>

<!--
	@component
	Storefront landing — reads live in-memory catalog, WhatsApp-enquiry CTAs, no cart.
-->

<svelte:head>
	<title>Bag Store — Everyday bags, honestly made</title>
</svelte:head>

<div
	class="store-root min-h-screen w-full flex flex-col"
	style="background: var(--bg);"
>
	<!-- Top bar -->
	<header
		class="sticky top-0 z-40 bg-[#F8F8F7]/80 backdrop-blur-xl border-b"
		style="border-color: var(--border); padding-top: var(--safe-area-inset-top);"
	>
		<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 h-[64px] flex items-center justify-between">
			<a href="#" class="flex items-center gap-2.5">
				<div class="h-8 w-8 bg-[#111] rounded-[6px] flex items-center justify-center">
					<ShoppingBag className="h-4 w-4 text-white" strokeWidth={1.5} />
				</div>
				<div>
					<div class="text-[13px] font-bold tracking-[0.08em] leading-none text-[#242424]">
						BAG STORE
					</div>
					<div class="text-[9px] text-[#777] tracking-wide mt-0.5">Storefront</div>
				</div>
			</a>
			<a
				href="/dashboard"
				class="h-8 rounded-full border bg-white px-4 text-[12px] font-medium flex items-center gap-1.5 hover:border-[#242424] transition"
				style="border-color: var(--border);"
			>
				<LayoutDashboard className="h-4 w-4" />
				<span class="hidden sm:inline">Admin dashboard</span>
			</a>
		</div>
	</header>

	<!-- Hero -->
	<section
		id="hero"
		class="bg-[#F8F8F7] border-b"
		style="border-color: var(--border);"
	>
		<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-10 md:py-14">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
				<div>
					<span class="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#999]">
						BAG STORE — NEW SEASON
					</span>
					<h1 class="text-[32px] md:text-[40px] font-semibold tracking-tight text-[#242424] leading-tight mt-3">
						Everyday bags, honestly&nbsp;made.
					</h1>
					<p class="text-[14px] text-[#777] mt-3 max-w-[420px] leading-relaxed">
						IDR pricing • WhatsApp enquiries • No cart, no checkout.
					</p>
					<div class="flex gap-2 mt-6">
						<a
							href="#catalog"
							class="h-9 rounded-full bg-[#343434] text-white px-5 text-[12px] font-medium flex items-center gap-1.5 hover:bg-[#242424] transition"
						>
							Browse bags
							<ArrowRight className="h-3.5 w-3.5" />
						</a>
						<a
							href="/dashboard"
							class="h-9 rounded-full border bg-white px-5 text-[12px] font-medium flex items-center hover:border-[#242424] transition"
							style="border-color: var(--border);"
						>
							Open dashboard
						</a>
					</div>
				</div>
				<div class="hidden lg:grid grid-cols-3 gap-3">
					{#each featured.slice(0, 3) as p (p.id)}
						{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
						<div
							class="aspect-[3/4] rounded-[10px] border flex items-center justify-center overflow-hidden bg-[#F0F0EF]"
							style="border-color: var(--border);"
						>
							{#if primary?.url}
								<img
									src={primary.url}
									alt={primary.alt ?? p.name}
									class="h-full w-full object-cover"
								/>
							{:else}
								<span class="text-[20px] font-bold text-[#999]">
									{p.name.slice(0, 2).toUpperCase()}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Featured bags -->
	<section id="catalog" class="py-10 md:py-12">
		<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8">
			<div class="flex items-baseline justify-between mb-4">
				<h2 class="text-[18px] font-semibold tracking-tight text-[#242424]">
					Featured bags
				</h2>
				<span class="text-[12px] text-[#777]">{active.length} in store</span>
			</div>

			{#if featured.length === 0}
				<p class="text-[13px] text-[#777]">No active products yet — open the dashboard to publish one.</p>
			{:else}
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
					{#each featured as p (p.id)}
						{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
						{@const stock = effectiveStock(p)}
						{@const st = stockStatus(stock, p.lowStockThreshold || 5, p.trackInventory)}
						{@const compare = p.compareAtPrice}
						<article
							class="bg-white border rounded-[12px] overflow-hidden flex flex-col"
							style="border-color: var(--border);"
						>
							<div class="relative">
								<div
									class="aspect-[4/3] bg-[#F0F0EF] flex items-center justify-center overflow-hidden"
								>
									{#if primary?.url}
										<img
											src={primary.url}
											alt={primary.alt ?? p.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										<span class="text-[24px] font-bold text-[#999]">
											{p.name.slice(0, 2).toUpperCase()}
										</span>
									{/if}
								</div>
								{#if p.featured}
									<span
										class="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full bg-[#FFF8E6] border text-[#8A6A24] font-medium"
										style="border-color: #F3D9A0;"
									>
										Featured
									</span>
								{/if}
								{#if st === 'out'}
									<span
										class="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-[#FFF0F0] border text-[#A33A37] font-medium"
										style="border-color: #F2C2C0;"
									>
										Out of stock
									</span>
								{/if}
							</div>
							<div class="p-3 flex flex-col gap-1 flex-1">
								<h3 class="text-[13px] font-medium text-[#242424] leading-tight">
									{p.name}
								</h3>
								{#if p.shortDescription}
									<p class="text-[11px] text-[#777] line-clamp-2">{p.shortDescription}</p>
								{/if}
								<div class="flex items-baseline gap-1.5">
									<span class="text-[13px] font-semibold text-[#242424]">
										{formatIDR(p.basePrice)}
									</span>
									{#if compare}
										<span class="text-[10px] text-[#999] line-through">
											{formatIDR(compare)}
										</span>
									{/if}
								</div>
								<div class="flex gap-1.5 mt-auto pt-2">
									<a
										href={waLink(p.name, p.sku, p.basePrice, p.compareAtPrice, stock)}
										target="_blank"
										rel="noopener"
										class="flex-1 h-8 rounded-full bg-[#343434] text-white text-[11px] font-medium flex items-center justify-center gap-1.5 hover:bg-[#242424] transition"
									>
										<MessageCircle className="h-3.5 w-3.5" />
										Enquire via WhatsApp
									</a>
									<button
										type="button"
										class="h-8 w-8 rounded-full border bg-white flex items-center justify-center hover:border-[#242424] transition"
										style="border-color: var(--border);"
										onclick={() => copyMsg(p.name, p.sku, p.basePrice, p.compareAtPrice)}
										aria-label="Copy WhatsApp message"
									>
										<Copy className="h-3.5 w-3.5 text-[#777]" />
									</button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Collections -->
	{#if collectionCards.length > 0}
		<section class="py-8 md:py-10">
			<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8">
				<h2 class="text-[18px] font-semibold tracking-tight text-[#242424] mb-4">
					Shop by collection
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each collectionCards as c (c.id)}
						<div
							class="bg-white border rounded-[12px] p-4 flex items-center gap-3"
							style="border-color: var(--border);"
						>
							<div class="h-12 w-12 rounded-[8px] bg-[#F0F0EF] border flex items-center justify-center shrink-0" style="border-color: var(--border);">
								<span class="text-[10px] font-bold text-[#999]">
									{c.name.slice(0, 2).toUpperCase()}
								</span>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="text-[13px] font-medium text-[#242424]">{c.name}</h3>
								{#if c.description}
									<p class="text-[11px] text-[#777] truncate">{c.description}</p>
								{/if}
								<p class="text-[11px] text-[#777] mt-1">
									{c.count} active {c.count === 1 ? 'product' : 'products'}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Categories -->
	{#if categoryPills.length > 0}
		<section class="py-8 md:py-10">
			<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8">
				<h2 class="text-[18px] font-semibold tracking-tight text-[#242424] mb-4">
					Browse by category
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each categoryPills as c (c.id)}
						<span
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white text-[12px] font-medium"
							style="border-color: var(--border);"
						>
							{c.name}
							<span class="text-[#777]">({c.count})</span>
						</span>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Trusted strip -->
	<section class="py-8 md:py-10 bg-white border-t" style="border-color: var(--border);">
		<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<h3 class="text-[13px] font-medium text-[#242424]">Live inventory</h3>
					<p class="text-[11px] text-[#777] mt-1">
						Reflects live dashboard stock in real time.
					</p>
				</div>
				<div>
					<h3 class="text-[13px] font-medium text-[#242424]">Movement-logged stock</h3>
					<p class="text-[11px] text-[#777] mt-1">
						Every adjustment is traceable.
					</p>
				</div>
				<div>
					<h3 class="text-[13px] font-medium text-[#242424]">Enquiry-first sales</h3>
					<p class="text-[11px] text-[#777] mt-1">
						No cart, no checkout — direct WhatsApp inquiries.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="py-8 md:py-10 border-t" style="border-color: var(--border);">
		<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
			<div class="flex items-center gap-2.5">
				<div class="h-7 w-7 bg-[#111] rounded-[6px] flex items-center justify-center">
					<ShoppingBag className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
				</div>
				<div>
					<div class="text-[12px] font-bold tracking-[0.08em] text-[#242424]">BAG STORE</div>
					<div class="text-[10px] text-[#777]">Everyday bags, honestly made.</div>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<a href="/dashboard" class="text-[12px] text-[#777] hover:text-[#242424]">
					Admin dashboard
				</a>
				<span class="text-[11px] text-[#999]">In-memory demo catalog</span>
			</div>
		</div>
	</footer>
</div>
