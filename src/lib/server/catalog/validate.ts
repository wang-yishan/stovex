/* Server-side validation for the product CRUD. The dashboard form validates
   too, but the API is the real boundary — anything that reaches SQLite has
   passed through these rules. */

import type { Product, ProductStatus, ProductVariant } from '#lib/admin/types.ts';

const STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];

function str(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown, fallback = false): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

/** Coerce an untrusted JSON body into a well-formed product. */
export function parseProductPayload(body: unknown): Product {
	const raw = (body ?? {}) as Record<string, unknown>;
	const variants: ProductVariant[] = Array.isArray(raw.variants)
		? raw.variants.map((item) => {
				const v = (item ?? {}) as Record<string, unknown>;
				return {
					id: str(v.id),
					productId: str(v.productId),
					name: str(v.name),
					attributes: Array.isArray(v.attributes)
						? (v.attributes as { name?: string; value?: string }[])
								.filter((a) => a && typeof a === 'object')
								.map((a) => ({ name: str(a.name), value: str(a.value) }))
						: [],
					sku: v.sku ? str(v.sku) : undefined,
					priceOverride:
						v.priceOverride === undefined || v.priceOverride === null
							? undefined
							: num(v.priceOverride),
					stock: num(v.stock),
					available: bool(v.available, true),
					lowThreshold: num(v.lowThreshold, 5)
				};
			})
		: [];

	const images = Array.isArray(raw.images)
		? raw.images.map((item) => {
				const i = (item ?? {}) as Record<string, unknown>;
				return {
					id: str(i.id),
					url: str(i.url),
					isPrimary: bool(i.isPrimary),
					alt: i.alt ? str(i.alt) : undefined
				};
			})
		: [];

	const status = STATUSES.includes(raw.status as ProductStatus)
		? (raw.status as ProductStatus)
		: 'draft';

	return {
		id: str(raw.id),
		name: str(raw.name),
		slug: str(raw.slug),
		shortDescription: str(raw.shortDescription),
		fullDescription: str(raw.fullDescription),
		material: raw.material ? str(raw.material) : undefined,
		categoryId: str(raw.categoryId),
		collectionIds: Array.isArray(raw.collectionIds)
			? (raw.collectionIds as unknown[]).map((id) => str(id)).filter(Boolean)
			: [],
		images,
		basePrice: num(raw.basePrice),
		compareAtPrice:
			raw.compareAtPrice === undefined || raw.compareAtPrice === null
				? undefined
				: num(raw.compareAtPrice),
		sku: raw.sku ? str(raw.sku) : undefined,
		status,
		featured: bool(raw.featured),
		seoTitle: raw.seoTitle ? str(raw.seoTitle) : undefined,
		seoDescription: raw.seoDescription ? str(raw.seoDescription) : undefined,
		createdAt: str(raw.createdAt) || new Date().toISOString(),
		updatedAt: str(raw.updatedAt) || new Date().toISOString(),
		hasVariants: bool(raw.hasVariants),
		trackInventory: bool(raw.trackInventory, true),
		stock: num(raw.stock),
		lowStockThreshold: num(raw.lowStockThreshold, 5),
		variants
	};
}

/**
 * Field errors for a product. `existing` is every product currently stored
 * and is used for the slug/SKU uniqueness rules.
 */
export function validateProduct(input: Product, existing: Product[]): Record<string, string> {
	const errors: Record<string, string> = {};

	if (!input.name.trim()) errors.name = 'Name required';

	const slug = input.slug.trim();
	if (!slug) errors.slug = 'Slug required';
	else if (existing.some((p) => p.id !== input.id && p.slug === slug))
		errors.slug = 'Slug must be unique';

	if (!(input.basePrice > 0)) errors.basePrice = 'Price must be positive';
	if (input.compareAtPrice !== undefined && input.compareAtPrice <= input.basePrice)
		errors.compareAtPrice = 'Compare-at must be > regular price';

	const skuTaken = (sku: string, ownerProductId: string, ownerVariantId?: string): boolean => {
		const target = sku.toLowerCase();
		for (const p of existing) {
			if (p.id !== ownerProductId && p.sku?.toLowerCase() === target) return true;
			for (const v of p.variants) {
				if (v.id !== ownerVariantId && v.sku?.toLowerCase() === target) return true;
			}
		}
		return false;
	};

	if (input.sku && skuTaken(input.sku, input.id)) errors.sku = 'SKU must be unique';
	if (input.trackInventory && input.stock < 0) errors.stock = 'Inventory never negative';
	if (input.lowStockThreshold < 0) errors.lowStockThreshold = 'Threshold cannot be negative';

	if (input.hasVariants) {
		if (input.variants.length === 0) errors.variants = 'Generate variants before publishing';
		for (const v of input.variants) {
			if (v.stock < 0) errors[`var-${v.id}-stock`] = 'Stock cannot be negative';
			if (v.sku && skuTaken(v.sku, input.id, v.id)) errors[`var-${v.id}-sku`] = 'SKU duplicate';
		}
	}

	if (input.status === 'active') {
		if (input.images.length === 0) errors.images = 'Primary image required to publish';
		else if (!input.images.some((i) => i.isPrimary)) errors.images = 'Select primary image';
	}

	return errors;
}
