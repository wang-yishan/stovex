/* Catalog repository — the single place that reads and writes the SQLite
   catalog. Every product mutation from the dashboard goes through here so
   the storefront catalog and the admin dashboard can never drift apart. */

import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import {
	category,
	collection,
	product,
	productBannerImage,
	productImage,
	productVariant,
	stockMovement
} from '#lib/server/db/schema.ts';
import type {
	AdjustStockInput,
	Category,
	Collection,
	Product,
	ProductStatus,
	StockMovement
} from '#lib/admin/types.ts';
import {
	SEED_CATEGORIES,
	SEED_COLLECTIONS,
	SEED_MOVEMENTS,
	SEED_PRODUCTS,
	nowISO,
	slugify,
	uid
} from '#lib/admin/data.ts';

export interface CatalogData {
	products: Product[];
	categories: Category[];
	collections: Collection[];
	movements: StockMovement[];
}

/* ------------------------------- reading ------------------------------- */

function rowToImage(row: typeof productImage.$inferSelect) {
	return {
		id: row.id,
		url: row.url,
		isPrimary: row.isPrimary,
		alt: row.alt ?? undefined
	};
}

function rowToBannerImage(row: typeof productBannerImage.$inferSelect) {
	return {
		id: row.id,
		url: row.url,
		isPrimary: false,
		alt: row.alt ?? undefined
	};
}

function rowToVariant(row: typeof productVariant.$inferSelect) {
	return {
		id: row.id,
		productId: row.productId,
		name: row.name,
		attributes: row.attributes ?? [],
		sku: row.sku ?? undefined,
		priceOverride: row.priceOverride ?? undefined,
		stock: row.stock,
		available: row.available,
		lowThreshold: row.lowThreshold
	};
}

/** Read the whole catalog: products with their images, variants and links. */
export async function getCatalog(): Promise<CatalogData> {
	await ensureSeeded();
	await backfillSeedImages();

	const [
		productRows,
		imageRows,
		bannerRows,
		variantRows,
		categoryRows,
		collectionRows,
		movementRows
	] = await Promise.all([
		db.select().from(product).orderBy(asc(product.createdAt)),
		db.select().from(productImage).orderBy(asc(productImage.position)),
		db.select().from(productBannerImage).orderBy(asc(productBannerImage.position)),
		db.select().from(productVariant),
		db.select().from(category),
		db.select().from(collection).orderBy(asc(collection.order)),
		db.select().from(stockMovement).orderBy(desc(stockMovement.createdAt))
	]);

	const imagesByProduct = new Map<string, ReturnType<typeof rowToImage>[]>();
	for (const row of imageRows) {
		const list = imagesByProduct.get(row.productId) ?? [];
		list.push(rowToImage(row));
		imagesByProduct.set(row.productId, list);
	}

	const bannerImagesByProduct = new Map<string, ReturnType<typeof rowToBannerImage>[]>();
	for (const row of bannerRows) {
		const list = bannerImagesByProduct.get(row.productId) ?? [];
		list.push(rowToBannerImage(row));
		bannerImagesByProduct.set(row.productId, list);
	}

	const variantsByProduct = new Map<string, ReturnType<typeof rowToVariant>[]>();
	for (const row of variantRows) {
		const list = variantsByProduct.get(row.productId) ?? [];
		list.push(rowToVariant(row));
		variantsByProduct.set(row.productId, list);
	}

	const products: Product[] = productRows.map((row) => ({
		id: row.id,
		name: row.name,
		slug: row.slug,
		shortDescription: row.shortDescription,
		fullDescription: row.fullDescription,
		material: row.material ?? undefined,
		categoryId: row.categoryId,
		collectionIds: row.collectionIds ?? [],
		images: imagesByProduct.get(row.id) ?? [],
		bannerImages: bannerImagesByProduct.get(row.id) ?? [],
		basePrice: row.basePrice,
		compareAtPrice: row.compareAtPrice ?? undefined,
		sku: row.sku ?? undefined,
		status: row.status as ProductStatus,
		featured: row.featured,
		seoTitle: row.seoTitle ?? undefined,
		seoDescription: row.seoDescription ?? undefined,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		hasVariants: row.hasVariants,
		trackInventory: row.trackInventory,
		stock: row.stock,
		lowStockThreshold: row.lowStockThreshold,
		variants: variantsByProduct.get(row.id) ?? []
	}));

	const categories: Category[] = categoryRows.map((row) => ({
		id: row.id,
		name: row.name,
		slug: row.slug,
		description: row.description ?? undefined
	}));

	const collections: Collection[] = collectionRows.map((row) => ({
		id: row.id,
		name: row.name,
		slug: row.slug,
		description: row.description ?? undefined,
		coverImage: row.coverImage ?? undefined,
		productIds: products.filter((p) => p.collectionIds.includes(row.id)).map((p) => p.id),
		order: row.order
	}));

	const movements: StockMovement[] = movementRows.map((row) => ({
		id: row.id,
		productId: row.productId,
		variantId: row.variantId ?? undefined,
		productName: row.productName,
		variantName: row.variantName ?? undefined,
		sku: row.sku,
		type: row.type,
		quantityChange: row.quantityChange,
		previousStock: row.previousStock,
		newStock: row.newStock,
		reason: row.reason,
		createdAt: row.createdAt
	}));

	return { products, categories, collections, movements };
}

/* ------------------------------- writing ------------------------------- */

type ProductRow = typeof product.$inferInsert;

/** Insert or update a product together with its images and variants. */
export async function saveProduct(input: Product): Promise<Product> {
	const row: ProductRow = {
		id: input.id,
		name: input.name,
		slug: input.slug,
		shortDescription: input.shortDescription ?? '',
		fullDescription: input.fullDescription ?? '',
		material: input.material || null,
		categoryId: input.categoryId ?? '',
		collectionIds: input.collectionIds ?? [],
		basePrice: input.basePrice,
		compareAtPrice: input.compareAtPrice ?? null,
		sku: input.sku || null,
		status: input.status,
		featured: input.featured,
		seoTitle: input.seoTitle || null,
		seoDescription: input.seoDescription || null,
		createdAt: input.createdAt || nowISO(),
		updatedAt: input.updatedAt || nowISO(),
		hasVariants: input.hasVariants,
		trackInventory: input.trackInventory,
		stock: input.stock,
		lowStockThreshold: input.lowStockThreshold
	};

	await db.transaction(async (tx) => {
		await tx.insert(product).values(row).onConflictDoUpdate({ target: product.id, set: row });

		await tx.delete(productImage).where(eq(productImage.productId, input.id));
		await tx.delete(productBannerImage).where(eq(productBannerImage.productId, input.id));
		await tx.delete(productVariant).where(eq(productVariant.productId, input.id));

		if (input.images.length > 0) {
			await tx.insert(productImage).values(
				input.images.map((image, index) => ({
					id: image.id,
					productId: input.id,
					url: image.url ?? '',
					isPrimary: image.isPrimary,
					alt: image.alt ?? null,
					position: index
				}))
			);
		}

		if (input.bannerImages.length > 0) {
			await tx.insert(productBannerImage).values(
				input.bannerImages.map((image, index) => ({
					id: image.id,
					productId: input.id,
					url: image.url ?? '',
					alt: image.alt ?? null,
					position: index
				}))
			);
		}

		if (input.variants.length > 0) {
			await tx.insert(productVariant).values(
				input.variants.map((variant) => ({
					id: variant.id,
					productId: input.id,
					name: variant.name,
					attributes: variant.attributes ?? [],
					sku: variant.sku || null,
					priceOverride: variant.priceOverride ?? null,
					stock: variant.stock,
					available: variant.available,
					lowThreshold: variant.lowThreshold
				}))
			);
		}
	});

	return input;
}

/** Remove a product and everything hanging off it. */
export async function deleteProduct(id: string): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(productImage).where(eq(productImage.productId, id));
		await tx.delete(productBannerImage).where(eq(productBannerImage.productId, id));
		await tx.delete(productVariant).where(eq(productVariant.productId, id));
		await tx.delete(product).where(eq(product.id, id));
	});
}

/** Copy a product (and its images/variants) into a new draft. */
export async function duplicateProduct(id: string): Promise<Product | null> {
	const catalog = await getCatalog();
	const src = catalog.products.find((p) => p.id === id);
	if (!src) return null;

	let slug = `${src.slug}-copy`;
	let n = 1;
	while (catalog.products.some((p) => p.slug === slug)) slug = `${src.slug}-copy-${n++}`;

	const copy: Product = {
		...structuredClone(src),
		id: uid('prod-'),
		name: `${src.name} Copy`,
		slug,
		status: 'draft',
		createdAt: nowISO(),
		updatedAt: nowISO(),
		sku: src.sku ? `${src.sku}-COPY` : '',
		images: src.images.map((image) => ({ ...image, id: uid('img-') })),
		bannerImages: (src.bannerImages ?? []).map((image) => ({ ...image, id: uid('ban-') })),
		variants: src.variants.map((variant) => ({
			...structuredClone(variant),
			id: uid('var-'),
			sku: variant.sku ? `${variant.sku}-COPY` : variant.sku
		}))
	};

	await saveProduct(copy);
	return copy;
}

/** Bulk status change (publish / archive). */
export async function setProductsStatus(ids: string[], status: ProductStatus): Promise<void> {
	if (ids.length === 0) return;
	await db.update(product).set({ status, updatedAt: nowISO() }).where(inArray(product.id, ids));
}

/**
 * Adjust stock on a product or one of its variants. Stock never goes below
 * zero and every change leaves a traceable movement record.
 */
export async function adjustStock(input: AdjustStockInput): Promise<StockMovement | null> {
	const catalog = await getCatalog();
	const target = catalog.products.find((p) => p.id === input.productId);
	if (!target) return null;

	const previousStock = input.variantId
		? (target.variants.find((v) => v.id === input.variantId)?.stock ?? 0)
		: target.stock;
	const newStock = Math.max(0, previousStock + input.delta);

	const variant = input.variantId
		? target.variants.find((v) => v.id === input.variantId)
		: undefined;

	const movement: StockMovement = {
		id: uid('mov-'),
		productId: target.id,
		variantId: input.variantId,
		productName: target.name,
		variantName: variant?.name,
		sku: variant?.sku || target.sku || '',
		type: input.reason.toLowerCase(),
		quantityChange: input.delta,
		previousStock,
		newStock,
		reason: input.note ? `${input.reason} - ${input.note}` : input.reason,
		createdAt: nowISO()
	};

	await db.transaction(async (tx) => {
		if (variant) {
			await tx
				.update(productVariant)
				.set({ stock: newStock })
				.where(eq(productVariant.id, variant.id));
		} else {
			await tx.update(product).set({ stock: newStock }).where(eq(product.id, target.id));
		}
		await tx.update(product).set({ updatedAt: nowISO() }).where(eq(product.id, target.id));
		await tx.insert(stockMovement).values({
			id: movement.id,
			productId: movement.productId,
			variantId: movement.variantId ?? null,
			productName: movement.productName,
			variantName: movement.variantName ?? null,
			sku: movement.sku,
			type: movement.type,
			quantityChange: movement.quantityChange,
			previousStock: movement.previousStock,
			newStock: movement.newStock,
			reason: movement.reason,
			createdAt: movement.createdAt
		});
	});

	return movement;
}

/* --------------------------- categories/collections --------------------------- */

export async function saveCategory(input: Category): Promise<Category> {
	const row = {
		id: input.id,
		name: input.name,
		slug: input.slug || slugify(input.name),
		description: input.description ?? null
	};
	await db.insert(category).values(row).onConflictDoUpdate({ target: category.id, set: row });
	return { ...input, slug: row.slug };
}

/** Delete a category, optionally reassigning its products to another one. */
export async function deleteCategory(id: string, reassignTo?: string): Promise<void> {
	await db.transaction(async (tx) => {
		if (reassignTo) {
			await tx.update(product).set({ categoryId: reassignTo }).where(eq(product.categoryId, id));
		}
		await tx.delete(category).where(eq(category.id, id));
	});
}

export async function saveCollection(input: Collection): Promise<Collection> {
	const row = {
		id: input.id,
		name: input.name,
		slug: input.slug || slugify(input.name),
		description: input.description ?? null,
		coverImage: input.coverImage ?? null,
		order: input.order
	};
	await db.insert(collection).values(row).onConflictDoUpdate({ target: collection.id, set: row });

	// Membership lives on the product rows, so sync both directions.
	const wanted = new Set(input.productIds ?? []);
	const rows = await db.select().from(product);
	for (const row of rows) {
		const ids = row.collectionIds ?? [];
		const has = ids.includes(input.id);
		if (has === wanted.has(row.id)) continue;
		const next = has ? ids.filter((cid) => cid !== input.id) : [...ids, input.id];
		await db.update(product).set({ collectionIds: next }).where(eq(product.id, row.id));
	}
	return { ...input, slug: row.slug };
}

export async function deleteCollection(id: string): Promise<void> {
	await db.transaction(async (tx) => {
		const rows = await tx.select().from(product);
		for (const row of rows) {
			const ids = row.collectionIds ?? [];
			if (!ids.includes(id)) continue;
			await tx
				.update(product)
				.set({ collectionIds: ids.filter((cid) => cid !== id) })
				.where(eq(product.id, row.id));
		}
		await tx.delete(collection).where(eq(collection.id, id));
	});
}

/** Swap a collection by ±1 position, then re-index the `order` column. */
export async function moveCollection(id: string, dir: 1 | -1): Promise<void> {
	const rows = await db.select().from(collection).orderBy(asc(collection.order));
	const i = rows.findIndex((c) => c.id === id);
	const j = i + dir;
	if (i < 0 || j < 0 || j >= rows.length) return;
	const next = [...rows];
	const [moved] = next.splice(i, 1);
	next.splice(j, 0, moved!);
	await db.transaction(async (tx) => {
		for (const [index, row] of next.entries()) {
			await tx.update(collection).set({ order: index }).where(eq(collection.id, row.id));
		}
	});
}

/* --------------------------------- seeding --------------------------------- */

/**
 * Give the seeded products their own photography.
 *
 * Only products that still carry the prototype's placeholder images are
 * touched: a product whose images already have a URL (i.e. the merchant
 * uploaded real files) is left completely alone.
 */
export async function backfillSeedImages(): Promise<void> {
	const seeded = await db
		.select({ id: product.id })
		.from(product)
		.where(
			inArray(
				product.id,
				SEED_PRODUCTS.map((p) => p.id)
			)
		);
	if (seeded.length === 0) return;

	const rows = await db.select().from(productImage);
	for (const seed of SEED_PRODUCTS) {
		const own = rows.filter((row) => row.productId === seed.id);
		if (own.length === 0) continue;
		// Every image already has a URL — the merchant owns these, leave them.
		if (own.some((row) => row.url)) continue;

		await db.transaction(async (tx) => {
			await tx.delete(productImage).where(eq(productImage.productId, seed.id));
			await tx.insert(productImage).values(
				seed.images.map((image, index) => ({
					id: image.id,
					productId: seed.id,
					url: image.url ?? '',
					isPrimary: image.isPrimary,
					alt: image.alt ?? null,
					position: index
				}))
			);
		});
	}
}

/**
 * Populate an empty database with the prototype catalog so the storefront has
 * something to show on a fresh checkout. Runs at most once — afterwards the
 * merchant's own data wins.
 */
export async function ensureSeeded(): Promise<void> {
	const existing = await db.select({ id: product.id }).from(product).limit(1);
	if (existing.length > 0) return;

	await db.transaction(async (tx) => {
		await tx.insert(category).values(
			SEED_CATEGORIES.map((c) => ({
				id: c.id,
				name: c.name,
				slug: c.slug,
				description: c.description ?? null
			}))
		);
		await tx.insert(collection).values(
			SEED_COLLECTIONS.map((c) => ({
				id: c.id,
				name: c.name,
				slug: c.slug,
				description: c.description ?? null,
				coverImage: c.coverImage ?? null,
				order: c.order
			}))
		);
		for (const p of SEED_PRODUCTS) {
			await tx.insert(product).values({
				id: p.id,
				name: p.name,
				slug: p.slug,
				shortDescription: p.shortDescription,
				fullDescription: p.fullDescription,
				categoryId: p.categoryId,
				collectionIds: p.collectionIds,
				basePrice: p.basePrice,
				compareAtPrice: p.compareAtPrice ?? null,
				sku: p.sku || null,
				status: p.status,
				featured: p.featured,
				seoTitle: p.seoTitle || null,
				seoDescription: p.seoDescription || null,
				createdAt: p.createdAt,
				updatedAt: p.updatedAt,
				hasVariants: p.hasVariants,
				trackInventory: p.trackInventory,
				stock: p.stock,
				lowStockThreshold: p.lowStockThreshold
			});
			if (p.images.length > 0) {
				await tx.insert(productImage).values(
					p.images.map((image, index) => ({
						id: image.id,
						productId: p.id,
						url: image.url ?? '',
						isPrimary: image.isPrimary,
						alt: image.alt ?? null,
						position: index
					}))
				);
			}
			if (p.variants.length > 0) {
				await tx.insert(productVariant).values(
					p.variants.map((variant) => ({
						id: variant.id,
						productId: p.id,
						name: variant.name,
						attributes: variant.attributes,
						sku: variant.sku || null,
						priceOverride: variant.priceOverride ?? null,
						stock: variant.stock,
						available: variant.available,
						lowThreshold: variant.lowThreshold
					}))
				);
			}
		}
		if (SEED_MOVEMENTS.length > 0) {
			await tx.insert(stockMovement).values(
				SEED_MOVEMENTS.map((m) => ({
					id: m.id,
					productId: m.productId,
					variantId: m.variantId ?? null,
					productName: m.productName,
					variantName: m.variantName ?? null,
					sku: m.sku,
					type: m.type,
					quantityChange: m.quantityChange,
					previousStock: m.previousStock,
					newStock: m.newStock,
					reason: m.reason,
					createdAt: m.createdAt
				}))
			);
		}
	});
}
