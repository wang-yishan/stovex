/* Catalog view-model helpers shared by the storefront and the /catalog routes.
   The admin catalog models variants with free-form attributes (Color / Size),
   so the storefront derives its option axes from the variants themselves. */

import type { Product, ProductVariant } from '#lib/admin/types.ts';

export interface CatalogOption {
	value: string;
	/** Hex swatch for colour options (null for size options). */
	swatch: string | null;
}

const COLOR_SWATCHES: Record<string, string> = {
	beige: '#c8b79d',
	black: '#292927',
	cream: '#efe7d8',
	chestnut: '#805b43',
	gray: '#8b8b88',
	grey: '#8b8b88',
	tan: '#b98d5e',
	brown: '#6f4a30',
	navy: '#26364f',
	olive: '#6b6b4f',
	sand: '#d9c9ae',
	white: '#f4f2ec',
	noir: '#1b1b1a',
	red: '#a33a37',
	blue: '#33506f',
	green: '#5c7355'
};

function swatchFor(value: string): string {
	return COLOR_SWATCHES[value.trim().toLowerCase()] ?? '#c9c5bb';
}

function axisValues(product: Product, axis: 'Color' | 'Size'): string[] {
	const values: string[] = [];
	for (const variant of product.variants) {
		const found = variant.attributes?.find((a) => a.name.toLowerCase() === axis.toLowerCase());
		if (found?.value && !values.includes(found.value)) values.push(found.value);
	}
	return values;
}

/** Colour options available for a product (empty when it has no variants). */
export function colorOptions(product: Product): CatalogOption[] {
	return axisValues(product, 'Color').map((value) => ({ value, swatch: swatchFor(value) }));
}

/** Size options available for a product (empty when it has no variants). */
export function sizeOptions(product: Product): CatalogOption[] {
	return axisValues(product, 'Size').map((value) => ({ value, swatch: null }));
}

/** Value of a variant attribute, matched case-insensitively. */
export function variantAttribute(
	variant: ProductVariant | undefined,
	axis: 'Color' | 'Size'
): string | undefined {
	return variant?.attributes?.find((a) => a.name.toLowerCase() === axis.toLowerCase())?.value;
}

/** Sizes that exist for a given colour (all sizes when no colour is picked). */
export function sizeOptionsFor(product: Product, color: string | null): CatalogOption[] {
	return sizeOptions(product).filter((size) =>
		product.variants.some((v) => {
			if (color && variantAttribute(v, 'Color') !== color) return false;
			return variantAttribute(v, 'Size') === size.value;
		})
	);
}

/** Find the variant matching a colour + size selection, if any. */
export function findVariant(
	product: Product,
	color: string | null,
	size: string | null
): ProductVariant | undefined {
	if (!product.hasVariants || product.variants.length === 0) return undefined;
	return product.variants.find((variant) => {
		const c = variantAttribute(variant, 'Color');
		const s = variantAttribute(variant, 'Size');
		if (color && c !== color) return false;
		if (size && s !== size) return false;
		return true;
	});
}

/** Effective price for a selection (variant override wins over base price). */
export function priceFor(product: Product, variant?: ProductVariant): number {
	return variant?.priceOverride ?? product.basePrice;
}

/** Effective stock for a selection. */
export function stockFor(product: Product, variant?: ProductVariant): number {
	if (!product.trackInventory) return Number.POSITIVE_INFINITY;
	if (variant) return variant.stock;
	// No matching variant means the combination does not exist.
	if (product.hasVariants) return 0;
	return product.stock;
}

/** Whether the current selection can be ordered. */
export function isAvailable(product: Product, variant?: ProductVariant): boolean {
	if (!product.trackInventory) return true;
	// A product with variants but no matching variant means the chosen
	// colour/size combination does not exist.
	if (!variant) return !product.hasVariants && product.stock > 0;
	return variant.available && variant.stock > 0;
}

/** SKU shown in the detail meta rows. */
export function skuFor(product: Product, variant?: ProductVariant): string {
	return variant?.sku || product.sku || '—';
}

/** Human-readable variant label ("Beige / M"). */
export function variantLabel(product: Product, variant?: ProductVariant): string {
	if (variant) return variant.name;
	if (product.variants.length === 0) return 'One Size';
	return '—';
}

/** Label for a product card: the first in-stock variant, or the product itself. */
export function cardVariantLabel(product: Product): string {
	if (product.variants.length === 0) return '';
	const v = product.variants.find((x) => x.available) ?? product.variants[0];
	return v?.name ?? '';
}
