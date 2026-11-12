<script lang="ts">
	import { goto } from '$app/navigation';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SectionRenderer from '#lib/admin/components/SectionRenderer.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { effectiveStock, formatIDR, stockStatus, waLink } from '#lib/admin/data.ts';
	import { MessageCircle, PenLine, Search, ShoppingBag } from '@lucide/svelte';
	import { resolvePath } from '#lib/admin/paths.ts';

	type SortKey = 'featured' | 'name' | 'price-asc' | 'price-desc' | 'newest';

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
	let sortValue = $state('featured');
	let sort = $derived(sortValue as SortKey);

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
				if (priceBand === 'mid' && (p.basePrice < 1_000_000 || p.basePrice > 1_500_000))
					return false;
				if (priceBand === 'over' && p.basePrice <= 1_500_000) return false;
				const st = stockStatus(effectiveStock(p), p.lowStockThreshold || 5, p.trackInventory);
				if (availability === 'in' && st === 'out') return false;
				if (availability === 'out' && st !== 'out') return false;
				if (
					colour !== 'all' &&
					!p.variants.some((v) =>
						v.attributes.some((a) => a.name.toLowerCase() === 'color' && a.value === colour)
					)
				)
					return false;
				return true;
			})
			.sort((a, b) => {
				if (sort === 'name') return a.name.localeCompare(b.name);
				if (sort === 'price-asc') return a.basePrice - b.basePrice;
				if (sort === 'price-desc') return b.basePrice - a.basePrice;
				if (sort === 'newest')
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Pages & Landing Pages', href: '/dashboard/pages' },
		{ label: 'Storefront' }
	]}
	title="Storefront Preview"
	subtitle="Published page sections + live Active-product shop grid."
	mobileSubtitle="Storefront preview"
>
	{#snippet actions()}
		{#if selectedPage}
			<Button
				variant="outline"
				class="px-4"
				onclick={() => void goto(resolvePath(`/dashboard/pages/${selectedPage!.id}/edit`))}
			>
				<PenLine class="h-4 w-4 shrink-0" /> Edit page
			</Button>
		{/if}
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-0 py-0 md:px-0">
	<!-- header -->
	<div class="border-b border-border bg-card">
		<div class="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-4 md:px-6 lg:px-8">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#111]">
				<ShoppingBag class="h-4 w-4 text-white" strokeWidth={1.5} />
			</div>
			<span class="text-[14px] font-bold tracking-[0.08em]">{admin.settings.logo}</span>
			<nav class="ml-4 hidden gap-4 md:flex">
				{#each admin.settings.headerLinks as link (link.id)}
					<a href={link.href} class="text-[12px] text-muted-foreground hover:text-foreground"
						>{link.label}</a
					>
				{/each}
			</nav>
			<div class="ml-auto flex items-center gap-2">
				<NativeSelect shape="pill" size="sm" class="px-3 pr-7 text-[11px]" bind:value={pageId}>
					{#each admin.pages as p (p.id)}
						<option value={p.id}>{p.title} • {p.status}{p.isHomepage ? ' • Homepage' : ''}</option>
					{/each}
				</NativeSelect>
				<Button
					href={`https://wa.me/${admin.settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
					target="_blank"
					rel="noopener"
					size="sm"
					class="h-8 gap-1.5 px-3"
				>
					<MessageCircle class="h-3.5 w-3.5" /> WhatsApp
				</Button>
			</div>
		</div>
		<div class="mx-auto flex max-w-[1280px] flex-wrap gap-1.5 px-4 pb-3 md:px-6 lg:px-8">
			{#each admin.categories as cat (cat.id)}
				<Button
					variant={categoryId === cat.id ? 'default' : 'outline'}
					size="xs"
					class="h-7 px-3"
					onclick={() => (categoryId = categoryId === cat.id ? 'all' : cat.id)}
				>
					{cat.name}
				</Button>
			{/each}
			<Button
				variant={categoryId === 'all' ? 'default' : 'outline'}
				size="xs"
				class="h-7 px-3"
				onclick={() => (categoryId = 'all')}
			>
				All categories
			</Button>
		</div>
	</div>

	<div class="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 lg:px-8">
		{#if selectedPage}
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h1 class="text-[22px] font-semibold">{selectedPage.title}</h1>
					<p class="mt-0.5 text-[11px] text-muted-foreground">
						{selectedPage.status === 'published'
							? 'Published page — live content from Active products'
							: 'Draft preview — not published yet'}
					</p>
				</div>
				<span class="rounded-full border border-border bg-card px-2 py-1 text-[11px]"
					>/{selectedPage.slug}</span
				>
			</div>
			<div class="mb-10 space-y-8">
				{#each sortedSections as s (s.id)}
					<SectionRenderer section={s} />
				{/each}
			</div>
		{:else}
			<p class="text-[13px] text-muted-foreground">No page selected.</p>
		{/if}

		<!-- shop -->
		<div id="shop" class="mb-4 rounded-[12px] border border-border bg-card p-3 md:p-4">
			<div class="flex flex-col gap-2 lg:flex-row">
				<div class="relative flex-1">
					<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						shape="pill"
						size="md"
						class="pr-3 pl-9"
						bind:value={search}
						placeholder="Search bags…"
					/>
				</div>
				<div class="flex flex-wrap gap-2">
					<NativeSelect shape="pill" size="sm" class="h-9 px-3 pr-7" bind:value={priceBand}>
						<option value="all">All prices</option>
						<option value="under1">Under Rp 1.000.000</option>
						<option value="mid">Rp 1.000.000 – 1.500.000</option>
						<option value="over">Over Rp 1.500.000</option>
					</NativeSelect>
					<NativeSelect shape="pill" size="sm" class="h-9 px-3 pr-7" bind:value={availability}>
						<option value="all">All availability</option>
						<option value="in">In stock</option>
						<option value="out">Out of stock</option>
					</NativeSelect>
					<NativeSelect shape="pill" size="sm" class="h-9 px-3 pr-7" bind:value={colour}>
						<option value="all">All colours</option>
						{#each colours as c (c)}
							<option value={c}>{c}</option>
						{/each}
					</NativeSelect>
					<NativeSelect shape="pill" size="sm" class="h-9 px-3 pr-7" bind:value={sortValue}>
						<option value="featured">Sort: Featured</option>
						<option value="name">Sort: Name</option>
						<option value="price-asc">Sort: Price low → high</option>
						<option value="price-desc">Sort: Price high → low</option>
						<option value="newest">Sort: Newest</option>
					</NativeSelect>
				</div>
			</div>
			<p class="mt-2 text-[11px] text-muted-foreground">
				No cart or checkout here — enquire on WhatsApp. Showing <b>{shop.length}</b> of {active.length}
				Active products.
			</p>
		</div>

		<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each shop as p (p.id)}
				{@const primary = p.images.find((i) => i.isPrimary) ?? p.images[0]}
				{@const stock = effectiveStock(p)}
				{@const st = stockStatus(stock, p.lowStockThreshold || 5, p.trackInventory)}
				<article class="flex flex-col overflow-hidden rounded-[12px] border border-border bg-card">
					<div class="flex aspect-[4/3] items-center justify-center overflow-hidden bg-accent">
						{#if primary?.url}
							<img
								src={primary.url}
								alt={primary.alt ?? p.name}
								class="h-full w-full object-cover"
							/>
						{:else}
							<span class="text-[20px] font-bold text-muted-foreground"
								>{p.name.slice(0, 2).toUpperCase()}</span
							>
						{/if}
					</div>
					<div class="flex flex-1 flex-col gap-1 p-3">
						<h3 class="text-[12px] leading-tight font-medium">{p.name}</h3>
						<div class="text-[13px] font-semibold">{formatIDR(p.basePrice)}</div>
						<p class="text-[11px] {st === 'out' ? 'text-destructive' : 'text-success-text'}">
							{st === 'out' ? 'Out of stock' : `In stock (${stock})`}
						</p>
						<Button
							href={waLink(admin.settings, p)}
							target="_blank"
							rel="noopener"
							class="mt-auto w-full text-[11px]"
						>
							<MessageCircle class="h-3.5 w-3.5 shrink-0" /> WhatsApp
						</Button>
					</div>
				</article>
			{/each}
			{#if shop.length === 0}
				<div class="col-span-full rounded-[12px] border border-border bg-card p-10 text-center">
					<p class="text-[13px] font-medium">No bags match these filters</p>
					<p class="mt-1 text-[12px] text-muted-foreground">
						Try another category, price, colour or availability.
					</p>
					<Button
						variant="outline"
						size="xs"
						class="mt-4 px-4 text-[12px]"
						onclick={() => {
							search = '';
							categoryId = 'all';
							priceBand = 'all';
							availability = 'all';
							colour = 'all';
						}}
					>
						Clear filters
					</Button>
				</div>
			{/if}
		</div>

		<footer
			class="mt-10 flex flex-col justify-between gap-3 rounded-[12px] border border-border bg-card p-5 md:flex-row"
		>
			<div>
				<div class="text-[13px] font-bold tracking-[0.08em]">{admin.settings.logo}</div>
				<p class="mt-1 max-w-[480px] text-[12px] text-muted-foreground">
					{admin.settings.footerText}
				</p>
			</div>
			<div class="space-y-1 text-[12px] text-muted-foreground">
				<div>Instagram {admin.settings.social.instagram}</div>
				<div>Facebook {admin.settings.social.facebook}</div>
				<div>TikTok {admin.settings.social.tiktok}</div>
				<a
					href={`https://wa.me/${admin.settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-1 font-medium text-foreground"
					><MessageCircle class="h-3.5 w-3.5" /> WhatsApp {admin.settings.whatsappNumber}</a
				>
			</div>
		</footer>
	</div>
</div>
