<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { catalogHref } from '#lib/catalog/links.ts';
	import {
		activeFilterCount,
		buildFacets,
		describeFilters,
		filtersToParams,
		parseFilters,
		selectProducts,
		SORT_OPTIONS,
		type FilterState
	} from '#lib/catalog/filters.ts';
	import StoreHeader from '#lib/components/storefront/StoreHeader.svelte';
	import StoreFooter from '#lib/components/storefront/StoreFooter.svelte';
	import ProductCard from '#lib/components/storefront/ProductCard.svelte';
	import FilterPanel from '#lib/components/storefront/FilterPanel.svelte';
	import FilterSheet from '#lib/components/storefront/FilterSheet.svelte';
	import { ArrowUpRight, Search, SlidersHorizontal, X } from '@lucide/svelte';

	/* ------------------------------------------------------------------ *
	 * Filter state lives in the URL, so a filtered catalog can be shared
	 * and the browser's back button walks through filter changes.
	 * ------------------------------------------------------------------ */

	let ctx = $derived({ categories: admin.categories, collections: admin.collections });
	let products = $derived(admin.products.filter((p) => p.status === 'active'));

	/** Filter state as written in the URL. */
	let urlFilters = $derived(parseFilters(page.url.searchParams));

	/** The state the UI starts with. */
	const initialFilters = parseFilters(page.url.searchParams);

	/**
	 * The state the UI renders.
	 *
	 * `goto` is asynchronous, so two quick clicks would otherwise both build
	 * on the same stale URL and the second would drop the first. Keeping an
	 * optimistic copy means every click builds on the previous one.
	 */
	let filters = $state<FilterState>(initialFilters);

	/**
	 * The last state we wrote to the URL.
	 *
	 * Plain (non-reactive) on purpose: it lets the effect below tell our own
	 * writes apart from navigation the shopper triggered, such as the browser
	 * back button.
	 */
	let lastWritten = initialFilters;

	// Adopt URL changes that we did not cause — the browser's back and
	// forward buttons, or a link opened in the same tab.
	$effect(() => {
		const next = urlFilters;
		if (sameFilters(next, lastWritten)) return;
		lastWritten = next;
		filters = next;
		searchText = next.q;
	});

	let results = $derived(selectProducts(products, filters, ctx));
	let facets = $derived(buildFacets(products, filters, ctx));
	let chips = $derived(describeFilters(filters, ctx));
	let filterCount = $derived(activeFilterCount(filters));

	let sheetOpen = $state(false);

	/* --- search box: local value, synced to the URL when debounced --- */

	let searchText = $state(initialFilters.q);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		return () => clearTimeout(searchTimer);
	});

	/* ------------------------------- writing ------------------------------- */

	/** Write the given state to the URL. */
	function push(next: FilterState, opts: { replace?: boolean } = {}) {
		filters = next;
		lastWritten = next;
		const params = filtersToParams(next);
		const query = params.toString();
		const path = catalogHref();
		void goto(query ? `${path}?${query}` : path, {
			replace: opts.replace ?? false,
			reset: false
		});
	}

	/**
	 * Apply a change. The pending search text is folded in so a facet change
	 * never discards what the shopper is still typing.
	 */
	function update(partial: Partial<FilterState>, opts: { replace?: boolean } = {}) {
		push({ ...filters, q: searchText, ...partial }, opts);
	}

	function onSearchInput(value: string) {
		searchText = value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			// The URL may already carry this query (a facet was applied while
			// the shopper was typing) — nothing to write then.
			if (filters.q === value) return;
			push({ ...filters, q: value }, { replace: true });
		}, 250);
	}

	function removeChip(chip: (typeof chips)[number]) {
		const next = chip.clear({ ...filters, q: searchText });
		searchText = next.q;
		push(next);
	}

	function resetAll() {
		searchText = '';
		push({
			...filters,
			q: '',
			categories: [],
			collections: [],
			colors: [],
			sizes: [],
			minPrice: null,
			maxPrice: null,
			inStock: false,
			onSale: false,
			featuredOnly: false
		});
	}

	function toggleCategory(id: string) {
		const next = filters.categories.includes(id)
			? filters.categories.filter((c) => c !== id)
			: [...filters.categories, id];
		update({ categories: next });
	}

	/** Whether two filter states are equivalent. */
	function sameFilters(a: FilterState, b: FilterState): boolean {
		return filtersToParams(a).toString() === filtersToParams(b).toString();
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

	<main class="mx-auto max-w-[1400px] px-5 pt-8 pb-16 sm:px-8 sm:pt-12 lg:px-12 lg:pb-24">
		<!-- Intro -->
		<div class="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="mb-3 text-[10px] font-semibold tracking-[0.22em] text-[#D9534F] uppercase">
					The full line
				</p>
				<h1 class="font-display text-4xl tracking-tight sm:text-5xl">
					Katalog<span class="text-[#D9534F]">.</span>
				</h1>
				<p class="mt-3 max-w-md text-sm text-[#6B6762]">
					Semua bentuk yang kami buat, satu per satu. Saring sesuai kebutuhanmu.
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

		<!-- Search + filter toolbar -->
		<div
			class="sticky top-[76px] z-30 -mx-5 mb-5 border-b border-[#EAE8E4] bg-[#FBFBFA]/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"
		>
			<div class="flex items-center gap-2">
				<div class="relative min-w-0 flex-1">
					<Search
						class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#636363]"
						strokeWidth={1.6}
					/>
					<Input
						type="search"
						value={searchText}
						placeholder="Cari tas, warna, atau kategori…"
						aria-label="Cari produk"
						size="lg"
						class="w-full bg-transparent pr-3 pl-10"
						oninput={(e) => onSearchInput(e.currentTarget.value)}
					/>
				</div>

				<button
					type="button"
					class="relative flex h-11 shrink-0 items-center gap-2 border border-[#242424] bg-[#242424] px-4 text-[11px] tracking-[0.12em] text-white uppercase transition hover:bg-[#D9534F] lg:hidden"
					aria-expanded={sheetOpen}
					onclick={() => (sheetOpen = true)}
				>
					<SlidersHorizontal class="h-4 w-4" strokeWidth={1.6} />
					<span class="hidden sm:inline">Filter</span>
					{#if filterCount > 0}
						<span
							class="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] text-[#242424] tabular-nums"
						>
							{filterCount}
						</span>
					{/if}
				</button>
			</div>

			<!-- Quick category shortcuts -->
			{#if facets.categories.length > 0}
				<div class="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
					{#each facets.categories as option (option.value)}
						<button
							type="button"
							class="shrink-0 rounded-full border px-4 py-2 text-[11px] transition {filters.categories.includes(
								option.value
							)
								? 'border-[#242424] bg-[#242424] text-white'
								: 'border-[#EAE8E4] bg-white hover:border-[#242424]'}"
							aria-pressed={filters.categories.includes(option.value)}
							onclick={() => toggleCategory(option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
			<!-- Desktop sidebar -->
			<aside class="hidden lg:block">
				<div class="sticky top-[170px] max-h-[calc(100vh-190px)] overflow-y-auto pr-2 pb-8">
					<div class="mb-6 flex items-center justify-between border-b border-[#EAE8E4] pb-4">
						<h2 class="text-[11px] tracking-[0.18em] uppercase">Filter</h2>
						{#if filterCount > 0}
							<button
								type="button"
								class="text-[11px] text-[#6B6762] underline underline-offset-4 transition hover:text-[#D9534F]"
								onclick={resetAll}
							>
								Reset
							</button>
						{/if}
					</div>
					<FilterPanel {filters} {facets} onchange={update} />
				</div>
			</aside>

			<div class="min-w-0">
				<!-- Result count + sort -->
				<div class="mb-5 flex items-center justify-between gap-4">
					<p class="text-[11px] tracking-[0.1em] text-[#6B6762] uppercase">
						{results.length} produk
					</p>

					<label class="flex items-center gap-2">
						<span class="text-[11px] tracking-[0.1em] text-[#6B6762] uppercase">Urut</span>
						<NativeSelect
							value={filters.sort}
							aria-label="Urutkan produk"
							size="sm"
							class="bg-transparent"
							onchange={(e) => update({ sort: e.currentTarget.value as FilterState['sort'] })}
						>
							{#each SORT_OPTIONS as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</NativeSelect>
					</label>
				</div>

				<!-- Active filters -->
				{#if chips.length > 0}
					<div class="mb-6 flex flex-wrap items-center gap-2">
						{#each chips as chip (chip.key)}
							<button
								type="button"
								class="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#242424] px-3 py-1.5 text-[11px] text-white transition hover:bg-[#D9534F]"
								onclick={() => removeChip(chip)}
							>
								{chip.label}
								<X class="h-3 w-3" strokeWidth={2} />
							</button>
						{/each}
						<button
							type="button"
							class="px-2 py-1.5 text-[11px] text-[#6B6762] underline underline-offset-4 transition hover:text-[#D9534F]"
							onclick={resetAll}
						>
							Hapus semua
						</button>
					</div>
				{/if}

				<!-- Results -->
				{#if results.length === 0}
					<div class="border border-[#EAE8E4] px-6 py-16 text-center">
						<p class="font-display text-2xl">
							Tidak ada yang cocok<span class="text-[#D9534F]">.</span>
						</p>
						<p class="mx-auto mt-3 max-w-sm text-sm text-[#6B6762]">
							Coba longgarkan filtermu, atau tanya langsung ke tim kami — kami bantu carikan yang
							tepat.
						</p>
						<div class="mt-7 flex flex-wrap items-center justify-center gap-3">
							<button
								type="button"
								class="bg-[#242424] px-5 py-3 text-[10px] tracking-[0.16em] text-white uppercase transition hover:bg-[#D9534F]"
								onclick={resetAll}
							>
								Hapus semua filter
							</button>
							<a
								href="/#kontak"
								class="border border-[#C9C6BD] px-5 py-3 text-[10px] tracking-[0.16em] uppercase transition hover:border-[#242424]"
							>
								Tanya via WhatsApp
							</a>
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 md:grid-cols-3">
						{#each results as p (p.id)}
							<ProductCard product={p} />
						{/each}
					</div>
				{/if}

				<p class="mt-10 text-center text-[10px] text-[#6B6762]">
					*Katalog, harga, dan foto mengikuti data yang aktif di dashboard.
				</p>
			</div>
		</div>
	</main>

	<!-- Mobile filter sheet -->
	<FilterSheet open={sheetOpen} onclose={() => (sheetOpen = false)}>
		<FilterPanel {filters} {facets} onchange={update} />

		{#snippet footer()}
			<div class="flex items-center justify-between gap-3">
				<button
					type="button"
					class="px-1 py-3 text-[11px] tracking-[0.12em] text-[#6B6762] uppercase underline underline-offset-4 transition hover:text-[#D9534F] disabled:opacity-40"
					disabled={filterCount === 0}
					onclick={resetAll}
				>
					Reset
				</button>
				<button
					type="button"
					class="flex-1 bg-[#242424] px-5 py-4 text-[10px] tracking-[0.16em] text-white uppercase transition hover:bg-[#D9534F]"
					onclick={() => (sheetOpen = false)}
				>
					Tampilkan {results.length} produk
				</button>
			</div>
		{/snippet}
	</FilterSheet>

	<StoreFooter base="/" />
</div>
