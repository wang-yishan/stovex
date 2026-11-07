<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus, waLink } from '#lib/admin/data.ts';
	import type { PageSection, Product } from '#lib/admin/types.ts';
	import { Copy, MessageCircle, Star } from '@lucide/svelte';

	let { section }: { section: PageSection } = $props();

	let c = $derived(section.content ?? {});

	let activeProducts = $derived(admin.products.filter((p) => p.status === 'active'));

	function resolveProducts(ids: string[] | undefined): Product[] {
		if (!ids || ids.length === 0) {
			// ref fallback: Featured Active products when manual list is empty
			const featured = activeProducts.filter((p) => p.featured);
			return featured.length > 0 ? featured : activeProducts;
		}
		return ids
			.map((id) => activeProducts.find((p) => p.id === id))
			.filter((p): p is Product => Boolean(p));
	}

	function copyMsg(p: Product) {
		const el = document.createElement('textarea');
		el.value = `Halo, saya tertarik dengan ${p.name} ${formatIDR(p.basePrice)}`;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
		admin.showToast('Copied WhatsApp message', 'success');
	}

	type Benefit = { icon?: string; title?: string; description?: string };
	type Testimonial = { name?: string; text?: string; image?: string; rating?: number };

	let benefits = $derived((Array.isArray(c.items) ? c.items : []) as Benefit[]);
	let testimonials = $derived((Array.isArray(c.items) ? c.items : []) as Testimonial[]);
	let galleryImages = $derived(Array.isArray(c.images) ? (c.images as string[]) : []);
	let manualProducts = $derived(resolveProducts(c.productIds as string[] | undefined));
	let selectedCategories = $derived(
		((c.categoryIds as string[] | undefined) ?? [])
			.map((id) => admin.categories.find((x) => x.id === id))
			.filter(Boolean)
	);

	let limit = $derived(typeof c.limit === 'number' ? c.limit : 4);
	let shownProducts = $derived(
		manualProducts.slice(0, Math.max(1, limit))
	);
</script>

<!--
	@component
	Landing-page section renderer (ref Pf): live products/categories/settings,
	WhatsApp enquiry only — no cart. One component for preview + storefront.
-->

{#if section.visible}
	{#if section.type === 'hero'}
		<section class="bg-white border rounded-[12px] overflow-hidden" style="border-color: var(--border);">
			<div class="p-5 md:p-8 flex flex-col gap-4 {c.align === 'center' ? 'items-center text-center' : c.align === 'right' ? 'items-end text-right' : 'items-start'}">
				{#if c.image}
					<img src={c.image as string} alt="" class="w-full rounded-[10px] object-cover max-h-[320px]" />
				{/if}
				<h2 class="text-[24px] md:text-[30px] font-semibold tracking-tight text-[#242424] leading-tight">{c.headline ?? 'Hero'}</h2>
				{#if c.description}
					<p class="text-[14px] text-[#777] max-w-[560px] leading-relaxed">{c.description}</p>
				{/if}
				{#if c.ctaLabel}
					<a href={(c.ctaHref as string) || '#shop'} class="h-10 px-5 rounded-full bg-[#343434] text-white text-[12px] font-medium inline-flex items-center hover:bg-[#242424] transition">{c.ctaLabel}</a>
				{/if}
			</div>
		</section>
	{:else if section.type === 'featured-products' || section.type === 'collection-grid'}
		<section class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'Featured bags'}</h3>
			{#if shownProducts.length === 0}
				<p class="text-[12px] text-[#777] mt-2">No Active products yet. Publish a product to fill this section.</p>
			{:else}
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
					{#each shownProducts as p (p.id)}
						{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
						{@const stock = effectiveStock(p)}
						{@const st = stockStatus(stock, p.lowStockThreshold || 5, p.trackInventory)}
						<article class="border rounded-[10px] overflow-hidden flex flex-col" style="border-color: var(--border);">
							<div class="aspect-[4/3] bg-[#F0F0EF] flex items-center justify-center overflow-hidden">
								{#if primary?.url}
									<img src={primary.url} alt={primary.alt ?? p.name} class="h-full w-full object-cover" />
								{:else}
									<span class="text-[20px] font-bold text-[#999]">{p.name.slice(0, 2).toUpperCase()}</span>
								{/if}
							</div>
							<div class="p-3 flex flex-col gap-1 flex-1">
								<h4 class="text-[13px] font-medium leading-tight">{p.name}</h4>
								<div class="text-[13px] font-semibold">{formatIDR(p.basePrice)}</div>
								{#if p.compareAtPrice}
									<div class="text-[11px] line-through text-[#999]">{formatIDR(p.compareAtPrice)}</div>
								{/if}
								<p class="text-[11px] {st === 'out' ? 'text-[#A33A37]' : 'text-[#1A7A52]'}">{st === 'out' ? 'Out of stock' : `In stock (${stock})`}</p>
								<div class="flex flex-col min-[420px]:flex-row gap-1.5 mt-auto pt-2">
									<a href={waLink(admin.settings, p)} target="_blank" rel="noopener" class="w-full min-[420px]:flex-1 min-w-0 h-10 min-[420px]:h-8 rounded-full bg-[#343434] text-white text-[11px] font-medium flex items-center justify-center gap-1 whitespace-nowrap">
										<MessageCircle class="h-3.5 w-3.5 shrink-0" /> WhatsApp
									</a>
									<button type="button" class="w-full min-[420px]:w-auto h-10 min-[420px]:h-8 px-3 rounded-full border bg-white text-[11px] font-medium whitespace-nowrap" style="border-color: var(--border);" onclick={() => copyMsg(p)}>Copy</button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	{:else if section.type === 'categories'}
		<section class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'Shop by category'}</h3>
			<div class="flex flex-wrap gap-2 mt-4">
				{#each selectedCategories as cat (cat!.id)}
					{@const count = activeProducts.filter((p) => p.categoryId === cat!.id).length}
					<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white text-[12px] font-medium" style="border-color: var(--border);">
						{cat!.name} <span class="text-[#777]">({count})</span>
					</span>
				{/each}
			</div>
		</section>
	{:else if section.type === 'promo-banner'}
		<section class="rounded-[12px] overflow-hidden border bg-[#242424] text-white" style="border-color: var(--border);">
			<div class="p-5 md:p-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
				<div>
					<h3 class="text-[20px] font-semibold leading-tight">{c.heading ?? ''}</h3>
					{#if c.description}
						<p class="text-[13px] text-white/70 mt-1 max-w-[480px]">{c.description}</p>
					{/if}
				</div>
				{#if c.ctaLabel}
					<a href={(c.ctaHref as string) || '#shop'} class="h-10 px-5 rounded-full bg-white text-[#242424] text-[12px] font-medium inline-flex items-center shrink-0">{c.ctaLabel}</a>
				{/if}
			</div>
		</section>
	{:else if section.type === 'rich-text'}
		<section class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
			<div class="flex flex-col gap-3 {c.align === 'center' ? 'items-center text-center' : c.align === 'right' ? 'items-end text-right' : 'items-start'}">
				<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? ''}</h3>
				{#if c.text}
					<p class="text-[13px] text-[#5A5A5A] leading-relaxed max-w-[640px]">{c.text}</p>
				{/if}
				{#if c.image}
					<img src={c.image as string} alt="" class="w-full rounded-[10px] object-cover max-h-[280px]" />
				{/if}
			</div>
		</section>
	{:else if section.type === 'cta'}
		<section class="bg-[#F0FAF6] border rounded-[12px] p-5 md:p-8 text-center" style="border-color: #C7EBDB;">
			<h3 class="text-[20px] font-semibold text-[#242424]">{c.heading ?? ''}</h3>
			{#if c.text}
				<p class="text-[13px] text-[#777] mt-2 max-w-[520px] mx-auto">{c.text}</p>
			{/if}
			{#if c.label}
				<a href="https://wa.me/{admin.settings.whatsappNumber.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" class="mt-4 h-10 px-5 rounded-full bg-[#242424] text-white text-[12px] font-medium inline-flex items-center gap-1.5">
					<MessageCircle class="h-4 w-4" /> {c.label}
				</a>
			{/if}
		</section>
	{:else if section.type === 'benefits'}
		<section class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'Why Bag Store'}</h3>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
				{#each benefits as b, i (i)}
					<div class="border rounded-[10px] p-3" style="border-color: var(--border);">
						<div class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">{b.icon ?? 'Benefit'}</div>
						<div class="text-[13px] font-medium mt-1">{b.title ?? ''}</div>
						<p class="text-[12px] text-[#777] mt-1">{b.description ?? ''}</p>
					</div>
				{/each}
			</div>
		</section>
	{:else if section.type === 'gallery'}
		<section class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'In the wild'}</h3>
			<div class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
				{#each galleryImages as src, i (i)}
					<div class="aspect-[4/3] rounded-[10px] bg-[#F5F5F4] border overflow-hidden flex items-center justify-center" style="border-color: var(--border);">
						{#if src}
							<img {src} alt="" class="h-full w-full object-cover" />
						{:else}
							<span class="text-[11px] text-[#999]">Image {i + 1}</span>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{:else if section.type === 'testimonials'}
		<section class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'Loved by everyday carriers'}</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
				{#each testimonials as t, i (i)}
					<figure class="border rounded-[10px] p-3" style="border-color: var(--border);">
						<div class="flex items-center gap-1 text-[#D69A35]">
							{#each Array.from({ length: t.rating ?? 5 }) as _, s (s)}
								<Star class="h-3.5 w-3.5" fill="#D69A35" />
							{/each}
						</div>
						<blockquote class="text-[13px] text-[#242424] mt-2 leading-relaxed">“{t.text ?? ''}”</blockquote>
						<figcaption class="text-[12px] text-[#777] mt-2">{t.name ?? ''}</figcaption>
					</figure>
				{/each}
			</div>
		</section>
	{/if}
{/if}
