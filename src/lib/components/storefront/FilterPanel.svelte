<script lang="ts">
	import type { Facets, FilterState } from '#lib/catalog/filters.ts';
	import { formatIDR } from '#lib/admin/data.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Check } from '@lucide/svelte';

	interface Props {
		/** Current filter state. */
		filters: FilterState;
		/** Available options with their counts. */
		facets: Facets;
		/** Called with the next state whenever a control changes. */
		onchange: (next: FilterState) => void;
	}

	let { filters, facets, onchange }: Props = $props();

	function toggle(list: string[], value: string): string[] {
		return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
	}

	function toggleCategory(value: string) {
		onchange({ ...filters, categories: toggle(filters.categories, value) });
	}

	function toggleCollection(value: string) {
		onchange({ ...filters, collections: toggle(filters.collections, value) });
	}

	function toggleColor(value: string) {
		onchange({ ...filters, colors: toggle(filters.colors, value) });
	}

	function toggleSize(value: string) {
		onchange({ ...filters, sizes: toggle(filters.sizes, value) });
	}

	function setPrice(which: 'min' | 'max', raw: string) {
		const parsed = Number.parseInt(raw.replace(/\D/g, ''), 10);
		const value = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
		onchange({
			...filters,
			minPrice: which === 'min' ? value : filters.minPrice,
			maxPrice: which === 'max' ? value : filters.maxPrice
		});
	}

	function countText(count: number): string {
		return count === 1 ? '1' : String(count);
	}
</script>

<!--
	Filter panel — the facet controls themselves.
	Shared by the desktop sidebar and the mobile bottom sheet so both
	presentations stay in sync.
-->

<div class="space-y-8">
	<!-- Category -->
	{#if facets.categories.length > 0}
		<section>
			<h3 class="mb-3 text-[10px] tracking-[0.18em] text-brand-muted uppercase">Kategori</h3>
			<ul class="space-y-1">
				{#each facets.categories as option (option.value)}
					<li>
						<button
							type="button"
							class="flex w-full items-center justify-between gap-3 py-1.5 text-left text-[13px] transition hover:text-brand-accent"
							aria-pressed={filters.categories.includes(option.value)}
							onclick={() => toggleCategory(option.value)}
						>
							<span class="flex items-center gap-2.5">
								<span
									class="flex h-4 w-4 items-center justify-center border transition {filters.categories.includes(
										option.value
									)
										? 'border-brand-ink bg-brand-ink text-white'
										: 'border-[#C9C6BD] bg-transparent'}"
								>
									{#if filters.categories.includes(option.value)}
										<Check class="h-3 w-3" strokeWidth={2.5} />
									{/if}
								</span>
								<span class:line-through={option.count === 0} class="opacity-50">
									{option.label}
								</span>
							</span>
							<span class="text-[11px] text-[#636363] tabular-nums">{countText(option.count)}</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- Collection -->
	{#if facets.collections.length > 0}
		<section>
			<h3 class="mb-3 text-[10px] tracking-[0.18em] text-brand-muted uppercase">Koleksi</h3>
			<ul class="space-y-1">
				{#each facets.collections as option (option.value)}
					<li>
						<button
							type="button"
							class="flex w-full items-center justify-between gap-3 py-1.5 text-left text-[13px] transition hover:text-brand-accent"
							aria-pressed={filters.collections.includes(option.value)}
							onclick={() => toggleCollection(option.value)}
						>
							<span class="flex items-center gap-2.5">
								<span
									class="flex h-4 w-4 items-center justify-center border transition {filters.collections.includes(
										option.value
									)
										? 'border-brand-ink bg-brand-ink text-white'
										: 'border-[#C9C6BD] bg-transparent'}"
								>
									{#if filters.collections.includes(option.value)}
										<Check class="h-3 w-3" strokeWidth={2.5} />
									{/if}
								</span>
								<span class:line-through={option.count === 0} class="opacity-50">
									{option.label}
								</span>
							</span>
							<span class="text-[11px] text-[#636363] tabular-nums">{countText(option.count)}</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- Colour -->
	{#if facets.colors.length > 0}
		<section>
			<h3 class="mb-3 text-[10px] tracking-[0.18em] text-brand-muted uppercase">Warna</h3>
			<div class="flex flex-wrap gap-2">
				{#each facets.colors as option (option.value)}
					{@const active = filters.colors.includes(option.value)}
					<button
						type="button"
						class="flex items-center gap-2 border px-3 py-2 text-[12px] transition {active
							? 'border-brand-ink bg-brand-ink text-white'
							: 'border-brand-border bg-transparent hover:border-brand-ink'}"
						aria-pressed={active}
						onclick={() => toggleColor(option.value)}
					>
						<span
							class="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
							style={`background:${option.swatch}`}
						></span>
						{option.label}
						<span class="text-[10px] tabular-nums opacity-60">{countText(option.count)}</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Size -->
	{#if facets.sizes.length > 0}
		<section>
			<h3 class="mb-3 text-[10px] tracking-[0.18em] text-brand-muted uppercase">Ukuran</h3>
			<div class="flex flex-wrap gap-2">
				{#each facets.sizes as option (option.value)}
					{@const active = filters.sizes.includes(option.value)}
					<button
						type="button"
						class="border px-4 py-2 text-[12px] transition {active
							? 'border-brand-ink bg-brand-ink text-white'
							: 'border-brand-border bg-transparent hover:border-brand-ink'}"
						aria-pressed={active}
						onclick={() => toggleSize(option.value)}
					>
						{option.label}
						<span class="ml-1 text-[10px] tabular-nums opacity-60">{countText(option.count)}</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Price -->
	<section>
		<h3 class="mb-3 text-[10px] tracking-[0.18em] text-brand-muted uppercase">Rentang harga</h3>
		<div class="flex items-center gap-2">
			<label class="flex-1">
				<span class="sr-only">Harga minimum</span>
				<Input
					type="text"
					inputmode="numeric"
					placeholder="Min"
					value={filters.minPrice !== null ? formatIDR(filters.minPrice) : ''}
					class="w-full bg-transparent px-3 py-2.5 text-[12px]"
					onchange={(e) => setPrice('min', e.currentTarget.value)}
				/>
			</label>
			<span class="text-[#636363]" aria-hidden="true">—</span>
			<label class="flex-1">
				<span class="sr-only">Harga maksimum</span>
				<Input
					type="text"
					inputmode="numeric"
					placeholder="Maks"
					value={filters.maxPrice !== null ? formatIDR(filters.maxPrice) : ''}
					class="w-full bg-transparent px-3 py-2.5 text-[12px]"
					onchange={(e) => setPrice('max', e.currentTarget.value)}
				/>>
			</label>
		</div>
	</section>

	<!-- Availability -->
	<section>
		<h3 class="mb-3 text-[10px] tracking-[0.18em] text-brand-muted uppercase">Ketersediaan</h3>
		<ul class="space-y-1">
			<li>
				<button
					type="button"
					class="flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] transition hover:text-brand-accent"
					aria-pressed={filters.inStock}
					onclick={() => onchange({ ...filters, inStock: !filters.inStock })}
				>
					<span
						class="flex h-4 w-4 items-center justify-center border transition {filters.inStock
							? 'border-brand-ink bg-brand-ink text-white'
							: 'border-[#C9C6BD] bg-transparent'}"
					>
						{#if filters.inStock}
							<Check class="h-3 w-3" strokeWidth={2.5} />
						{/if}
					</span>
					Stok tersedia
				</button>
			</li>
			<li>
				<button
					type="button"
					class="flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] transition hover:text-brand-accent"
					aria-pressed={filters.onSale}
					onclick={() => onchange({ ...filters, onSale: !filters.onSale })}
				>
					<span
						class="flex h-4 w-4 items-center justify-center border transition {filters.onSale
							? 'border-brand-ink bg-brand-ink text-white'
							: 'border-[#C9C6BD] bg-transparent'}"
					>
						{#if filters.onSale}
							<Check class="h-3 w-3" strokeWidth={2.5} />
						{/if}
					</span>
					Sedang diskon
				</button>
			</li>
			<li>
				<button
					type="button"
					class="flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] transition hover:text-brand-accent"
					aria-pressed={filters.featuredOnly}
					onclick={() => onchange({ ...filters, featuredOnly: !filters.featuredOnly })}
				>
					<span
						class="flex h-4 w-4 items-center justify-center border transition {filters.featuredOnly
							? 'border-brand-ink bg-brand-ink text-white'
							: 'border-[#C9C6BD] bg-transparent'}"
					>
						{#if filters.featuredOnly}
							<Check class="h-3 w-3" strokeWidth={2.5} />
						{/if}
					</span>
					Pilihan kami
				</button>
			</li>
		</ul>
	</section>
</div>
