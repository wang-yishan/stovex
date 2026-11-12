<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus, waLink } from '#lib/admin/data.ts';
	import type { PageSection, Product } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
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
	let shownProducts = $derived(manualProducts.slice(0, Math.max(1, limit)));
</script>

<!--
	@component
	Landing-page section renderer (ref Pf): live products/categories/settings,
	WhatsApp enquiry only — no cart. One component for preview + storefront.
-->

{#if section.visible}
	{#if section.type === 'hero'}
		<section
			class="overflow-hidden rounded-[12px] border bg-white"
			style="border-color: var(--border);"
		>
			<div
				class="flex flex-col gap-4 p-5 md:p-8 {c.align === 'center'
					? 'items-center text-center'
					: c.align === 'right'
						? 'items-end text-right'
						: 'items-start'}"
			>
				{#if c.image}
					<img
						src={c.image as string}
						alt=""
						class="max-h-[320px] w-full rounded-[10px] object-cover"
					/>
				{/if}
				<h2
					class="text-[24px] leading-tight font-semibold tracking-tight text-[#242424] md:text-[30px]"
				>
					{c.headline ?? 'Hero'}
				</h2>
				{#if c.description}
					<p class="max-w-[560px] text-[14px] leading-relaxed text-[#5A5A5A]">{c.description}</p>
				{/if}
				{#if c.ctaLabel}
					<a
						href={(c.ctaHref as string) || '#shop'}
						class="inline-flex h-10 items-center rounded-full bg-[#343434] px-5 text-[12px] font-medium text-white transition hover:bg-[#242424]"
						>{c.ctaLabel}</a
					>
				{/if}
			</div>
		</section>
	{:else if section.type === 'featured-products' || section.type === 'collection-grid'}
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'Featured bags'}</h3>
			{#if shownProducts.length === 0}
				<p class="mt-2 text-[12px] text-[#5A5A5A]">
					No Active products yet. Publish a product to fill this section.
				</p>
			{:else}
				<div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
					{#each shownProducts as p (p.id)}
						{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
						{@const stock = effectiveStock(p)}
						{@const st = stockStatus(stock, p.lowStockThreshold || 5, p.trackInventory)}
						<article
							class="flex flex-col overflow-hidden rounded-[10px] border"
							style="border-color: var(--border);"
						>
							<div
								class="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#F0F0EF]"
							>
								{#if primary?.url}
									<img
										src={primary.url}
										alt={primary.alt ?? p.name}
										class="h-full w-full object-cover"
									/>
								{:else}
									<span class="text-[20px] font-bold text-[#636363]"
										>{p.name.slice(0, 2).toUpperCase()}</span
									>
								{/if}
							</div>
							<div class="flex flex-1 flex-col gap-1 p-3">
								<h4 class="text-[13px] leading-tight font-medium">{p.name}</h4>
								<div class="text-[13px] font-semibold">{formatIDR(p.basePrice)}</div>
								{#if p.compareAtPrice}
									<div class="text-[11px] text-[#636363] line-through">
										{formatIDR(p.compareAtPrice)}
									</div>
								{/if}
								<p class="text-[11px] {st === 'out' ? 'text-[#A33A37]' : 'text-[#1A7A52]'}">
									{st === 'out' ? 'Out of stock' : `In stock (${stock})`}
								</p>
								<div class="mt-auto flex flex-col gap-1.5 pt-2 min-[420px]:flex-row">
									<a
										href={waLink(admin.settings, p)}
										target="_blank"
										rel="noopener"
										class="flex h-10 w-full min-w-0 items-center justify-center gap-1 rounded-full bg-[#343434] text-[11px] font-medium whitespace-nowrap text-white min-[420px]:h-8 min-[420px]:flex-1"
									>
										<MessageCircle class="h-3.5 w-3.5 shrink-0" /> WhatsApp
									</a>
									<Button
										variant="outline"
										size="default"
										class="w-full px-3 text-[11px] whitespace-nowrap min-[420px]:w-auto"
										onclick={() => copyMsg(p)}
									>
										Copy
									</Button>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>
	{:else if section.type === 'categories'}
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'Shop by category'}</h3>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each selectedCategories as cat (cat!.id)}
					{@const count = activeProducts.filter((p) => p.categoryId === cat!.id).length}
					<span
						class="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[12px] font-medium"
						style="border-color: var(--border);"
					>
						{cat!.name} <span class="text-[#5A5A5A]">({count})</span>
					</span>
				{/each}
			</div>
		</section>
	{:else if section.type === 'promo-banner'}
		<section
			class="overflow-hidden rounded-[12px] border bg-[#242424] text-white"
			style="border-color: var(--border);"
		>
			<div class="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center md:p-8">
				<div>
					<h3 class="text-[20px] leading-tight font-semibold">{c.heading ?? ''}</h3>
					{#if c.description}
						<p class="mt-1 max-w-[480px] text-[13px] text-white/70">{c.description}</p>
					{/if}
				</div>
				{#if c.ctaLabel}
					<a
						href={(c.ctaHref as string) || '#shop'}
						class="inline-flex h-10 shrink-0 items-center rounded-full bg-white px-5 text-[12px] font-medium text-[#242424]"
						>{c.ctaLabel}</a
					>
				{/if}
			</div>
		</section>
	{:else if section.type === 'rich-text'}
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<div
				class="flex flex-col gap-3 {c.align === 'center'
					? 'items-center text-center'
					: c.align === 'right'
						? 'items-end text-right'
						: 'items-start'}"
			>
				<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? ''}</h3>
				{#if c.text}
					<p class="max-w-[640px] text-[13px] leading-relaxed text-[#5A5A5A]">{c.text}</p>
				{/if}
				{#if c.image}
					<img
						src={c.image as string}
						alt=""
						class="max-h-[280px] w-full rounded-[10px] object-cover"
					/>
				{/if}
			</div>
		</section>
	{:else if section.type === 'cta'}
		<section
			class="rounded-[12px] border bg-[#F0FAF6] p-5 text-center md:p-8"
			style="border-color: #C7EBDB;"
		>
			<h3 class="text-[20px] font-semibold text-[#242424]">{c.heading ?? ''}</h3>
			{#if c.text}
				<p class="mx-auto mt-2 max-w-[520px] text-[13px] text-[#5A5A5A]">{c.text}</p>
			{/if}
			{#if c.label}
				<a
					href="https://wa.me/{admin.settings.whatsappNumber.replace(/[^0-9]/g, '')}"
					target="_blank"
					rel="noopener"
					class="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#242424] px-5 text-[12px] font-medium text-white"
				>
					<MessageCircle class="h-4 w-4" />
					{c.label}
				</a>
			{/if}
		</section>
	{:else if section.type === 'benefits'}
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'Why Bag Store'}</h3>
			<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
				{#each benefits as b, i (i)}
					<div class="rounded-[10px] border p-3" style="border-color: var(--border);">
						<div class="text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">
							{b.icon ?? 'Benefit'}
						</div>
						<div class="mt-1 text-[13px] font-medium">{b.title ?? ''}</div>
						<p class="mt-1 text-[12px] text-[#5A5A5A]">{b.description ?? ''}</p>
					</div>
				{/each}
			</div>
		</section>
	{:else if section.type === 'gallery'}
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">{c.heading ?? 'In the wild'}</h3>
			<div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
				{#each galleryImages as src, i (i)}
					<div
						class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[10px] border bg-[#F5F5F4]"
						style="border-color: var(--border);"
					>
						{#if src}
							<img {src} alt="" class="h-full w-full object-cover" />
						{:else}
							<span class="text-[11px] text-[#636363]">Image {i + 1}</span>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{:else if section.type === 'testimonials'}
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<h3 class="text-[16px] font-semibold text-[#242424]">
				{c.heading ?? 'Loved by everyday carriers'}
			</h3>
			<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#each testimonials as t, i (i)}
					<figure class="rounded-[10px] border p-3" style="border-color: var(--border);">
						<div class="flex items-center gap-1 text-[#D69A35]">
							{#each Array.from({ length: t.rating ?? 5 }) as _, s (s)}
								<Star class="h-3.5 w-3.5" fill="#D69A35" />
							{/each}
						</div>
						<blockquote class="mt-2 text-[13px] leading-relaxed text-[#242424]">
							“{t.text ?? ''}”
						</blockquote>
						<figcaption class="mt-2 text-[12px] text-[#5A5A5A]">{t.name ?? ''}</figcaption>
					</figure>
				{/each}
			</div>
		</section>
	{/if}
{/if}
