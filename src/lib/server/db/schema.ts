import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

/* ------------------------------------------------------------------ *
 * Catalog schema — the product CRUD that backs the storefront catalog.
 *
 * Everything the dashboard edits (products, their images, their
 * variants) is persisted here so the storefront renders the same data
 * the merchant just saved.
 * ------------------------------------------------------------------ */

export const category = sqliteTable('category', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	description: text('description')
});

export const collection = sqliteTable('collection', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	description: text('description'),
	coverImage: text('cover_image'),
	order: integer('order').notNull().default(0)
});

export const product = sqliteTable('product', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull(),
	shortDescription: text('short_description').notNull().default(''),
	fullDescription: text('full_description').notNull().default(''),
	categoryId: text('category_id').notNull().default(''),
	/** JSON array of collection ids. */
	collectionIds: text('collection_ids', { mode: 'json' }).$type<string[]>().notNull().default([]),
	basePrice: integer('base_price').notNull().default(0),
	compareAtPrice: integer('compare_at_price'),
	sku: text('sku'),
	status: text('status').notNull().default('draft'),
	featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
	seoTitle: text('seo_title'),
	seoDescription: text('seo_description'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull(),
	hasVariants: integer('has_variants', { mode: 'boolean' }).notNull().default(false),
	trackInventory: integer('track_inventory', { mode: 'boolean' }).notNull().default(true),
	stock: integer('stock').notNull().default(0),
	lowStockThreshold: integer('low_stock_threshold').notNull().default(5)
});

export const productImage = sqliteTable('product_image', {
	id: text('id').primaryKey(),
	productId: text('product_id').notNull(),
	url: text('url').notNull().default(''),
	isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
	alt: text('alt'),
	position: integer('position').notNull().default(0)
});

export const productVariant = sqliteTable('product_variant', {
	id: text('id').primaryKey(),
	productId: text('product_id').notNull(),
	name: text('name').notNull(),
	/** JSON array of `{ name, value }` attribute pairs. */
	attributes: text('attributes', { mode: 'json' })
		.$type<{ name: string; value: string }[]>()
		.notNull()
		.default([]),
	sku: text('sku'),
	priceOverride: integer('price_override'),
	stock: integer('stock').notNull().default(0),
	available: integer('available', { mode: 'boolean' }).notNull().default(true),
	lowThreshold: integer('low_threshold').notNull().default(5)
});

export const stockMovement = sqliteTable('stock_movement', {
	id: text('id').primaryKey(),
	productId: text('product_id').notNull(),
	variantId: text('variant_id'),
	productName: text('product_name').notNull(),
	variantName: text('variant_name'),
	sku: text('sku').notNull().default(''),
	type: text('type').notNull(),
	quantityChange: integer('quantity_change').notNull(),
	previousStock: integer('previous_stock').notNull(),
	newStock: integer('new_stock').notNull(),
	reason: text('reason').notNull().default(''),
	createdAt: text('created_at').notNull()
});

export * from './auth.schema';
