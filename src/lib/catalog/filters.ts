/* Catalog filtering, faceting and search.
   Pure functions over the admin product list so the storefront catalog page
   and its filter UI share one implementation.

   The URL is the single source of truth: filter state is parsed out of the
   query string and serialised back into it, which keeps shared links and the
   browser back button working. */

import type { Category, Collection, Product } from '#lib/admin/types.ts';
import { effectiveStock, formatIDR, stockStatus } from '#lib/admin/data.ts';
import { swatchFor, variantAttribute } from './product.ts';

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export interface FilterState {
	/** Free-text query. */
	q: string;
	/** Category ids. */
	categories: string[];
	/** Collection ids. */
	collections: string[];
	/** Colour attribute values, e.g. "Beige". */
	colors: string[];
	/** Size attribute values, e.g. "M". */
	sizes: string[];
	/** Lowest price (IDR) a product may have. */
	minPrice: number | null;
	/** Highest price (IDR) a product may have. */
	maxPrice: number | null;
	/** Only products that can be ordered right now. */
	inStock: boolean;
	/** Only products on sale. */
	onSale: boolean;
	/** Only products flagged as featured in the dashboard. */
	featuredOnly: boolean;
	sort: SortKey;
}

export interface FacetOption {
	value: string;
	label: string;
	/** How many products match once this option is added. */
	count: number;
	/** Hex swatch for colour options. */
	swatch: string | null;
}

export interface Facets {
	categories: FacetOption[];
	collections: FacetOption[];
	colors: FacetOption[];
	sizes: FacetOption[];
}

export interface CatalogContext {
	categories: Category[];
	collections: Collection[];
}

/** A removable summary of one active filter. */
export interface FilterChip {
	key: string;
	label: string;
	/** Returns the state with this filter removed. */
	clear: (state: FilterState) => FilterState;
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
	{ value: 'featured', label: 'Pilihan kami' },
	{ value: 'newest', label: 'Terbaru' },
	{ value: 'price-asc', label: 'Harga terendah' },
	{ value: 'price-desc', label: 'Harga tertinggi' },
	{ value: 'name', label: 'Nama A–Z' }
];

export const DEFAULT_FILTERS: FilterState = {
	q: '',
	categories: [],
	collections: [],
	colors: [],
	sizes: [],
	minPrice: null,
	maxPrice: null,
	inStock: false,
	onSale: false,
	featuredOnly: false,
	sort: 'featured'
};

/* ------------------------------ parsing ------------------------------ */

function parseSort(value: string | null): SortKey {
	const found = SORT_OPTIONS.find((o) => o.value === value);
	return found ? found.value : 'featured';
}

function parsePrice(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Read filter state out of a query string. */
export function parseFilters(params: {
	get(name: string): string | null;
	getAll(name: string): string[];
}): FilterState {
	return {
		q: params.get('q') ?? '',
		categories: params.getAll('cat'),
		collections: params.getAll('col'),
		colors: params.getAll('color'),
		sizes: params.getAll('size'),
		minPrice: parsePrice(params.get('min')),
		maxPrice: parsePrice(params.get('max')),
		inStock: params.get('stock') === '1',
		onSale: params.get('sale') === '1',
		featuredOnly: params.get('featured') === '1',
		sort: parseSort(params.get('sort'))
	};
}

/** Serialise filter state back into a query string. Defaults are omitted. */
export function filtersToParams(state: FilterState): URLSearchParams {
	const params = new URLSearchParams();
	if (state.q.trim()) params.set('q', state.q.trim());
	for (const id of state.categories) params.append('cat', id);
	for (const id of state.collections) params.append('col', id);
	for (const value of state.colors) params.append('color', value);
	for (const value of state.sizes) params.append('size', value);
	if (state.minPrice !== null) params.set('min', String(state.minPrice));
	if (state.maxPrice !== null) params.set('max', String(state.maxPrice));
	if (state.inStock) params.set('stock', '1');
	if (state.onSale) params.set('sale', '1');
	if (state.featuredOnly) params.set('featured', '1');
	if (state.sort !== 'featured') params.set('sort', state.sort);
	return params;
}

/** Number of filters the shopper has applied (search text excluded). */
export function activeFilterCount(state: FilterState): number {
	return (
		state.categories.length +
		state.collections.length +
		state.colors.length +
		state.sizes.length +
		(state.minPrice !== null || state.maxPrice !== null ? 1 : 0) +
		(state.inStock ? 1 : 0) +
		(state.onSale ? 1 : 0) +
		(state.featuredOnly ? 1 : 0)
	);
}

/* ------------------------------- matching ------------------------------ */

function normalize(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

function sameValue(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase();
}

/** Everything a product can be searched by, flattened into one string. */
function searchHaystack(product: Product, ctx: CatalogContext): string {
	const category = ctx.categories.find((c) => c.id === product.categoryId)?.name ?? '';
	const collections = ctx.collections
		.filter((c) => product.collectionIds.includes(c.id))
		.map((c) => c.name)
		.join(' ');
	return normalize(
		[
			product.name,
			product.shortDescription,
			product.fullDescription,
			product.sku ?? '',
			product.seoTitle ?? '',
			product.seoDescription ?? '',
			category,
			collections
		].join(' ')
	);
}

/** Every whitespace-separated term of the query must appear somewhere. */
export function matchesSearch(product: Product, query: string, ctx: CatalogContext): boolean {
	const terms = normalize(query).split(/\s+/).filter(Boolean);
	if (terms.length === 0) return true;
	const haystack = searchHaystack(product, ctx);
	return terms.every((term) => haystack.includes(term));
}

/**
 * Whether the product has a variant matching every selected colour and size.
 * An empty selection means "any", so a product with no variants at all only
 * matches when neither colour nor size is selected.
 */
function matchesAxes(product: Product, colors: string[], sizes: string[]): boolean {
	if (colors.length === 0 && sizes.length === 0) return true;
	return product.variants.some((variant) => {
		const color = variantAttribute(variant, 'Color');
		const size = variantAttribute(variant, 'Size');
		if (colors.length > 0) {
			if (!color || !colors.some((c) => sameValue(c, color))) return false;
		}
		if (sizes.length > 0) {
			if (!size || !sizes.some((s) => sameValue(s, size))) return false;
		}
		return true;
	});
}

/** Lowest price a shopper can actually pay for this product. */
export function priceFloor(product: Product): number {
	if (!product.hasVariants || product.variants.length === 0) return product.basePrice;
	let lowest = product.basePrice;
	for (const variant of product.variants) {
		const price = variant.priceOverride ?? product.basePrice;
		if (price < lowest) lowest = price;
	}
	return lowest;
}

/** Whether the product can be ordered right now. */
export function isInStock(product: Product): boolean {
	const status = stockStatus(
		effectiveStock(product),
		product.lowStockThreshold || 5,
		product.trackInventory
	);
	return status !== 'out';
}

/** Whether the product carries a real markdown. */
export function isOnSale(product: Product): boolean {
	return product.compareAtPrice !== undefined && product.compareAtPrice > product.basePrice;
}

/* -------------------------------- facets -------------------------------- */

/**
 * The dimensions a product can be filtered on. One can be left out at a time
 * so facet counts can be computed the way shoppers expect: the count for an
 * option shows how many products would remain if that option were added,
 * with every other filter still applied.
 */
type Dimension =
	| 'search'
	| 'category'
	| 'collection'
	| 'color'
	| 'size'
	| 'price'
	| 'inStock'
	| 'onSale'
	| 'featured';

/** Products matching every filter except the given dimension. */
function baseSet(
	products: Product[],
	state: FilterState,
	ctx: CatalogContext,
	exclude?: Dimension
): Product[] {
	return products.filter((product) => {
		if (exclude !== 'search' && state.q.trim() && !matchesSearch(product, state.q, ctx)) {
			return false;
		}
		if (
			exclude !== 'category' &&
			state.categories.length > 0 &&
			!state.categories.includes(product.categoryId)
		) {
			return false;
		}
		if (
			exclude !== 'collection' &&
			state.collections.length > 0 &&
			!product.collectionIds.some((id) => state.collections.includes(id))
		) {
			return false;
		}
		const colors = exclude === 'color' ? [] : state.colors;
		const sizes = exclude === 'size' ? [] : state.sizes;
		if (!matchesAxes(product, colors, sizes)) return false;
		if (exclude !== 'price') {
			const floor = priceFloor(product);
			if (state.minPrice !== null && floor < state.minPrice) return false;
			if (state.maxPrice !== null && floor > state.maxPrice) return false;
		}
		if (exclude !== 'inStock' && state.inStock && !isInStock(product)) return false;
		if (exclude !== 'onSale' && state.onSale && !isOnSale(product)) return false;
		if (exclude !== 'featured' && state.featuredOnly && !product.featured) return false;
		return true;
	});
}

function axisValues(products: Product[], axis: 'Color' | 'Size'): string[] {
	const seen: string[] = [];
	for (const product of products) {
		for (const variant of product.variants) {
			const value = variantAttribute(variant, axis);
			if (value && !seen.some((v) => sameValue(v, value))) seen.push(value);
		}
	}
	return seen;
}

/**
 * Option lists with counts. Each facet's counts are computed against the
 * products that match every *other* filter, so a shopper can see what an
 * option would add before picking it.
 */
export function buildFacets(products: Product[], state: FilterState, ctx: CatalogContext): Facets {
	const withoutCategory = baseSet(products, state, ctx, 'category');
	const withoutCollection = baseSet(products, state, ctx, 'collection');
	const withoutColor = baseSet(products, state, ctx, 'color');
	const withoutSize = baseSet(products, state, ctx, 'size');

	const categories = ctx.categories
		.filter((category) => withoutCategory.some((product) => product.categoryId === category.id))
		.map((category) => ({
			value: category.id,
			label: category.name,
			count: withoutCategory.filter((product) => product.categoryId === category.id).length,
			swatch: null
		}));

	const collections = ctx.collections
		.filter((collection) =>
			withoutCollection.some((product) => product.collectionIds.includes(collection.id))
		)
		.map((collection) => ({
			value: collection.id,
			label: collection.name,
			count: withoutCollection.filter((product) => product.collectionIds.includes(collection.id))
				.length,
			swatch: null
		}));

	const colors = axisValues(products, 'Color')
		.map((value) => ({
			value,
			label: value,
			count: withoutColor.filter((product) => matchesAxes(product, [value], state.sizes)).length,
			swatch: swatchFor(value)
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	const sizes = axisValues(products, 'Size')
		.map((value) => ({
			value,
			label: value,
			count: withoutSize.filter((product) => matchesAxes(product, state.colors, [value])).length,
			swatch: null
		}))
		.sort((a, b) => a.label.localeCompare(b.label));

	return { categories, collections, colors, sizes };
}

/* -------------------------------- sorting -------------------------------- */

function sortProducts(products: Product[], sort: SortKey): Product[] {
	const sorted = [...products];
	switch (sort) {
		case 'price-asc':
			sorted.sort((a, b) => priceFloor(a) - priceFloor(b));
			break;
		case 'price-desc':
			sorted.sort((a, b) => priceFloor(b) - priceFloor(a));
			break;
		case 'name':
			sorted.sort((a, b) => a.name.localeCompare(b.name, 'id'));
			break;
		case 'newest':
			sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			break;
		default:
			sorted.sort((a, b) => {
				if (a.featured !== b.featured) return a.featured ? -1 : 1;
				return b.createdAt.localeCompare(a.createdAt);
			});
	}
	return sorted;
}

/** Apply every filter, then sort. */
export function selectProducts(
	products: Product[],
	state: FilterState,
	ctx: CatalogContext
): Product[] {
	return sortProducts(baseSet(products, state, ctx), state.sort);
}

/* --------------------------------- chips --------------------------------- */

function without(list: string[], value: string): string[] {
	return list.filter((item) => !sameValue(item, value));
}

/** Human-readable, removable summary of every active filter. */
export function describeFilters(state: FilterState, ctx: CatalogContext): FilterChip[] {
	const chips: FilterChip[] = [];

	if (state.q.trim()) {
		chips.push({
			key: 'q',
			label: `“${state.q.trim()}”`,
			clear: (s) => ({ ...s, q: '' })
		});
	}

	for (const id of state.categories) {
		const label = ctx.categories.find((c) => c.id === id)?.name ?? id;
		chips.push({
			key: `cat:${id}`,
			label,
			clear: (s) => ({ ...s, categories: s.categories.filter((c) => c !== id) })
		});
	}

	for (const id of state.collections) {
		const label = ctx.collections.find((c) => c.id === id)?.name ?? id;
		chips.push({
			key: `col:${id}`,
			label,
			clear: (s) => ({ ...s, collections: s.collections.filter((c) => c !== id) })
		});
	}

	for (const value of state.colors) {
		chips.push({
			key: `color:${value}`,
			label: value,
			clear: (s) => ({ ...s, colors: without(s.colors, value) })
		});
	}

	for (const value of state.sizes) {
		chips.push({
			key: `size:${value}`,
			label: value,
			clear: (s) => ({ ...s, sizes: without(s.sizes, value) })
		});
	}

	if (state.minPrice !== null || state.maxPrice !== null) {
		const min = state.minPrice !== null ? formatIDR(state.minPrice) : 'Rp0';
		const max = state.maxPrice !== null ? formatIDR(state.maxPrice) : 'tak terbatas';
		chips.push({
			key: 'price',
			label: `${min} – ${max}`,
			clear: (s) => ({ ...s, minPrice: null, maxPrice: null })
		});
	}

	if (state.inStock) {
		chips.push({
			key: 'stock',
			label: 'Stok tersedia',
			clear: (s) => ({ ...s, inStock: false })
		});
	}

	if (state.onSale) {
		chips.push({
			key: 'sale',
			label: 'Sedang diskon',
			clear: (s) => ({ ...s, onSale: false })
		});
	}

	if (state.featuredOnly) {
		chips.push({
			key: 'featured',
			label: 'Pilihan kami',
			clear: (s) => ({ ...s, featuredOnly: false })
		});
	}

	return chips;
}
