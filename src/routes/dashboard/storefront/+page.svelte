<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SectionRenderer from '#lib/admin/components/SectionRenderer.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus, waLink } from '#lib/admin/data.ts';
	import { MessageCircle, PenLine, Search, ShoppingBag } from '@lucide/svelte';

	// Default: published homepage, else first published, else first page.
	const defaultId =
		admin.pages.find((p) => p.isHomepage && p.status === 'published')?.id ??
		admin.pages.find((p) => p.status === 'published')?.id ??
		admin.pages[0]?.id ??
		'';

	let pageId = $state(defaultId);

	// Filters (ref G2 shop grid)
	let search = $state('');
	let categoryId = $state('all');
	let priceBand = $state('all');
	let availability = $state('all');
	let colour = $state('all');
	let sort = $state<'featured' | 'name' | 'price-asc' | 'price-desc' | 'newest'>('featured');

	let selectedPage = $derived(admin.pages.find((p) => p.id === pageId) ?? admin.pages[0]);
	let sortedSections = $derived(
		selectedPage ? [...selectedPage.sections].sort((a, b) => a.order - b.order) : []
	);
	let active = $derived(admin.products.filter((p) => p.status === 'active'));

	let colours = $derived([
		...new Set(
			active.flatMap((p) =>
				p.variants.flatMap((v) =>
					v.attributes.filter((a) => a.name.toLowerCase() === 'color').map((a) => a.value)
				)
			)
		)
	]);

	let shop = $derived(
		active
			.filter((p) => {
				if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
				if (categoryId !== 'all' && p.categoryId !== categoryId) return false;
				if (priceBand === 'under1' && p.basePrice >= 1_000_000) return false;
				if (priceBand === 'mid' && (p.basePrice < 1_000_000 || p.basePrice > 1_500_000)) return false;
				if (priceBand === 'over' && p.basePrice <= 1_500_000) return false;
				const st = stockStatus(effectiveStock(p), p.lowStockThreshold || 5, p.trackInventory);
				if (availability === 'in' && st === 'out') return false;
				if (availability === 'out' && st !== 'out') return false;
				if (colour !== 'all' && !p.variants.some((v) => v.attributes.some((a) => a.name.toLowerCase() === 'color' && a.value === colour))) return false;
				return true;
			})
			.sort((a, b) => {
				if (sort === 'name') return a.name.localeCompare(b.name);
				if (sort === 'price-asc') return a.basePrice - b.basePrice;
				if (sort === 'price-desc') return b.basePrice - a.basePrice;
				if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
			})
	);
</script>

<!--
	@component
	Storefront preview (ref G2): page picker + rendered sections + filtered
	active-product shop grid. Read-only; edit jumps into the page editor.
-->

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pages & Landing Pages', href: '/dashboard/pages' }, { label: 'Storefront' }]}
	title="Storefront Preview"
	subtitle="Published page sections + live Active-product shop grid."
	mobileSubtitle="Storefront preview"
>
	{#snippet actions()}
		{#if selectedPage}
			<button type="button" onclick={() => void goto(resolve(`/dashboard/pages/${selectedPage!.id}/edit` as Path))} class="h-10 sm:h-8 rounded-full border bg-white px-4 text-[12px] font-medium flex items-center gap-1.5 hover:border-[#242424] transition" style="border-color: var(--border);">
				<PenLine class="h-4 w-4 shrink-0" /> Edit page
			</button>
		{/if}
	{/snippet}
</Topbar>

<div class="mx-auto max-w-[1280px] w-full px-0 md:px-0 py-0">
	<!-- header -->
	<div class="bg-white border-b" style="border-color: var(--border);">
		<div class="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-3">
			<div class="h-8 w-8 bg-[#111] rounded-[6px] flex items-center justify-center shrink-0">
				<ShoppingBag class="h-4 w-4 text-white" strokeWidth={1.5} />
			</div>
			<span class="text-[14px] font-bold tracking-[0.08em]">{admin.settings.logo}</span>
			<nav class="hidden md:flex gap-4 ml-4">
				{#each admin.settings.headerLinks as link (link.id)}
					<a href={link.href} class="text-[12px] text-[#5A5A5A] hover:text-[#242424]">{link.label}</a>
				{/each}
			</nav>
			<div class="ml-auto flex items-center gap-2">
				<select value={pageId} onchange={(e) => (pageId = (e.currentTarget as HTMLSelectElement).value)} class="h-8 rounded-full border bg-white px-3 text-[11px]" style="border-color: var(--border);">
					{#each admin.pages as p (p.id)}
						<option value={p.id}>{p.title} • {p.status}{p.isHomepage ? ' • Homepage' : ''}</option>
					{/each}
				</select>
				<a href={`https://wa.me/${admin.settings.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener" class="h-8 px-3 rounded-full bg-[#242424] text-white text-[11px] font-medium flex items-center gap-1.5">
					<MessageCircle class="h-3.5 w-3.5" /> WhatsApp
				</a>
			</div>
		</div>
		<div class="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8 pb-3 flex flex-wrap gap-1.5">
			{#each admin.categories as cat (cat.id)}
				<button type="button" onclick={() => (categoryId = categoryId === cat.id ? 'all' : cat.id)} class="h-7 px-3 rounded-full border text-[11px] {categoryId === cat.id ? 'bg-[#242424] text-white border-[#242424]' : 'bg-white'}" style="border-color: var(--border);">{cat.name}</button>
			{/each}
			<button type="button" onclick={() => (categoryId = 'all')} class="h-7 px-3 rounded-full border text-[11px] {categoryId === 'all' ? 'bg-[#242424] text-white border-[#242424]' : 'bg-white'}" style="border-color: var(--border);">All categories</button>
		</div>
	</div>

	<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-6">
		{#if selectedPage}
			<div class="flex items-center justify-between mb-6">
				<div>
					<h1 class="text-[22px] font-semibold">{selectedPage.title}</h1>
					<p class="text-[11px] text-[#777] mt-0.5">{selectedPage.status === 'published' ? 'Published page — live content from Active products' : 'Draft preview — not published yet'}</p>
				</div>
				<span class="text-[11px] px-2 py-1 rounded-full border bg-white" style="border-color: var(--border);">/{selectedPage.slug}</span>
			</div>
			<div class="space-y-8 mb-10">
				{#each sortedSections as s (s.id)}
					<SectionRenderer section={s} />
				{/each}
			</div>
		{:else}
			<p class="text-[13px] text-[#777]">No page selected.</p>
		{/if}

		<!-- shop -->
		<div id="shop" class="bg-white border rounded-[12px] p-3 md:p-4 mb-4" style="border-color: var(--border);">
			<div class="flex flex-col lg:flex-row gap-2">
				<div class="flex-1 relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
					<input value={search} oninput={(e) => (search = (e.currentTarget as HTMLInputElement).value)} placeholder="Search bags…" class="w-full h-9 pl-9 pr-3 rounded-full border bg-[#FBFBFA] text-[13px] focus:outline-none focus:border-[#242424]" style="border-color: var(--border);" />
				</div>
				<div class="flex flex-wrap gap-2">
					<select value={priceBand} onchange={(e) => (priceBand = (e.currentTarget as HTMLSelectElement).value)} class="h-9 rounded-full border bg-white px-3 text-[12px]" style="border-color: var(--border);">
						<option value="all">All prices</option>
						<option value="under1">Under Rp 1.000.000</option>
						<option value="mid">Rp 1.000.000 – 1.500.000</option>
						<option value="over">Over Rp 1.500.000</option>
					</select>
					<select value={availability} onchange={(e) => (availability = (e.currentTarget as HTMLSelectElement).value)} class="h-9 rounded-full border bg-white px-3 text-[12px]" style="border-color: var(--border);">
						<option value="all">All availability</option>
						<option value="in">In stock</option>
						<option value="out">Out of stock</option>
					</select>
					<select value={colour} onchange={(e) => (colour = (e.currentTarget as HTMLSelectElement).value)} class="h-9 rounded-full border bg-white px-3 text-[12px]" style="border-color: var(--border);">
						<option value="all">All colours</option>
						{#each colours as c (c)}
							<option value={c}>{c}</option>
						{/each}
					</select>
					<select value={sort} onchange={(e) => (sort = (e.currentTarget as HTMLSelectElement).value as typeof sort)} class="h-9 rounded-full border bg-white px-3 text-[12px]" style="border-color: var(--border);">
						<option value="featured">Sort: Featured</option>
						<option value="name">Sort: Name</option>
						<option value="price-asc">Sort: Price low → high</option>
						<option value="price-desc">Sort: Price high → low</option>
						<option value="newest">Sort: Newest</option>
					</select>
				</div>
			</div>
			<p class="text-[11px] text-[#777] mt-2">No cart or checkout here — enquire on WhatsApp. Showing <b>{shop.length}</b> of {active.length} Active products.</p>
		</div>

		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
			{#each shop as p (p.id)}
				{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
				{@const stock = effectiveStock(p)}
				{@const st = stockStatus(stock, p.lowStockThreshold || 5, p.trackInventory)}
				<article class="bg-white border rounded-[12px] overflow-hidden flex flex-col" style="border-color: var(--border);">
					<div class="aspect-[4/3] bg-[#F0F0EF] flex items-center justify-center overflow-hidden">
						{#if primary?.url}
							<img src={primary.url} alt={primary.alt ?? p.name} class="h-full w-full object-cover" />
						{:else}
							<span class="text-[20px] font-bold text-[#999]">{p.name.slice(0, 2).toUpperCase()}</span>
						{/if}
					</div>
					<div class="p-3 flex flex-col gap-1 flex-1">
						<h3 class="text-[12px] font-medium leading-tight">{p.name}</h3>
						<div class="text-[13px] font-semibold">{formatIDR(p.basePrice)}</div>
						<p class="text-[11px] {st === 'out' ? 'text-[#A33A37]' : 'text-[#1A7A52]'}">{st === 'out' ? 'Out of stock' : `In stock (${stock})`}</p>
						<a href={waLink(admin.settings, p)} target="_blank" rel="noopener" class="mt-auto h-10 sm:h-8 rounded-full bg-[#343434] text-white text-[11px] font-medium flex items-center justify-center gap-1 whitespace-nowrap"><MessageCircle class="h-3.5 w-3.5 shrink-0" /> WhatsApp</a>
					</div>
				</article>
			{/each}
			{#if shop.length === 0}
				<div class="col-span-full bg-white border rounded-[12px] p-10 text-center" style="border-color: var(--border);">
					<p class="text-[13px] font-medium">No bags match these filters</p>
					<p class="text-[12px] text-[#777] mt-1">Try another category, price, colour or availability.</p>
					<button type="button" onclick={() => { search = ''; categoryId = 'all'; priceBand = 'all'; availability = 'all'; colour = 'all'; }} class="mt-4 h-8 rounded-full border bg-white px-4 text-[12px] font-medium" style="border-color: var(--border);">Clear filters</button>
				</div>
			{/if}
		</div>

		<footer class="mt-10 bg-white border rounded-[12px] p-5 flex flex-col md:flex-row gap-3 justify-between" style="border-color: var(--border);">
			<div>
				<div class="text-[13px] font-bold tracking-[0.08em]">{admin.settings.logo}</div>
				<p class="text-[12px] text-[#777] mt-1 max-w-[480px]">{admin.settings.footerText}</p>
			</div>
			<div class="text-[12px] text-[#777] space-y-1">
				<div>Instagram {admin.settings.social.instagram}</div>
				<div>Facebook {admin.settings.social.facebook}</div>
				<div>TikTok {admin.settings.social.tiktok}</div>
				<a href={`https://wa.me/${admin.settings.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-[#242424] font-medium"><MessageCircle class="h-3.5 w-3.5" /> WhatsApp {admin.settings.whatsappNumber}</a>
			</div>
		</footer>
	</div>
</div>
