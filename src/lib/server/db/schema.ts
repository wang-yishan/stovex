import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { BrandColors, BrandFonts, StoreSettings } from '#lib/admin/types.ts';

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
	material: text('material'),
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

export const productBannerImage = sqliteTable('product_banner_image', {
	id: text('id').primaryKey(),
	productId: text('product_id').notNull(),
	url: text('url').notNull().default(''),
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

/* ------------------------------------------------------------------ *
 * Shipping schema — shipment monitoring for the dashboard.
 *
 * A shipment is one delivery: recipient, courier, resi and status. Its
 * tracking timeline lives in `shipment_event`, newest event appended as
 * the courier reports progress.
 * ------------------------------------------------------------------ */

export const shipment = sqliteTable('shipment', {
	id: text('id').primaryKey(),
	orderId: text('order_id').notNull(),
	customerName: text('customer_name').notNull(),
	customerPhone: text('customer_phone').notNull().default(''),
	destination: text('destination').notNull().default(''),
	address: text('address').notNull().default(''),
	courier: text('courier').notNull().default(''),
	service: text('service').notNull().default(''),
	trackingNumber: text('tracking_number').notNull().default(''),
	status: text('status').notNull().default('pending'),
	/** JSON array of `{ id, name, qty }` line items. */
	items: text('items', { mode: 'json' })
		.$type<{ id: string; name: string; qty: number }[]>()
		.notNull()
		.default([]),
	weightKg: integer('weight_kg').notNull().default(0),
	shippingCost: integer('shipping_cost').notNull().default(0),
	orderTotal: integer('order_total').notNull().default(0),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull(),
	deliveredAt: text('delivered_at')
});

export const shipmentEvent = sqliteTable('shipment_event', {
	id: text('id').primaryKey(),
	shipmentId: text('shipment_id').notNull(),
	status: text('status').notNull(),
	label: text('label').notNull(),
	location: text('location').notNull().default(''),
	note: text('note'),
	createdAt: text('created_at').notNull()
});

/* ------------------------------------------------------------------ *
 * Notifications — in-app alerts for orders, stock, shipping and system.
 * ------------------------------------------------------------------ */

export const notification = sqliteTable('notification', {
	id: text('id').primaryKey(),
	kind: text('kind').notNull().default('system'),
	title: text('title').notNull(),
	message: text('message').notNull(),
	href: text('href'),
	read: integer('read', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').notNull()
});

/* ------------------------------------------------------------------ *
 * WhatsApp orders — captured from the storefront when a customer checks
 * out via WhatsApp. Each order carries a human code (shared in the WA
 * message) and stays `pending` until an admin verifies or cancels it.
 * ------------------------------------------------------------------ */

export const order = sqliteTable('order', {
	id: text('id').primaryKey(),
	code: text('code').notNull(),
	source: text('source').notNull().default('cart'),
	customerName: text('customer_name').notNull().default(''),
	customerNote: text('customer_note').notNull().default(''),
	total: integer('total').notNull().default(0),
	status: text('status').notNull().default('pending'),
	message: text('message').notNull().default(''),
	verifiedAt: text('verified_at'),
	adminNote: text('admin_note').notNull().default(''),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

export const orderItem = sqliteTable('order_item', {
	id: text('id').primaryKey(),
	orderId: text('order_id').notNull(),
	productId: text('product_id').notNull().default(''),
	productName: text('product_name').notNull().default(''),
	variant: text('variant'),
	sku: text('sku').notNull().default(''),
	quantity: integer('quantity').notNull().default(1),
	unitPrice: integer('unit_price').notNull().default(0),
	subtotal: integer('subtotal').notNull().default(0)
});

/* ------------------------------------------------------------------ *
 * Store settings — the singleton row that carries the brand identity
 * (name, wordmark, colours, fonts) plus the contact/social/SEO fields
 * the storefront reads. One row, id = 'default'.
 * ------------------------------------------------------------------ */

export const storeSetting = sqliteTable('store_setting', {
	id: text('id').primaryKey(),
	/* brand identity */
	brandName: text('brand_name').notNull().default(''),
	brandWordmark: text('brand_wordmark').notNull().default(''),
	brandTagline: text('brand_tagline').notNull().default(''),
	brandLogoUrl: text('brand_logo_url').notNull().default(''),
	brandFaviconUrl: text('brand_favicon_url').notNull().default(''),
	brandDomain: text('brand_domain').notNull().default(''),
	brandColors: text('brand_colors', { mode: 'json' })
		.$type<BrandColors>()
		.notNull()
		.default({} as BrandColors),
	brandFonts: text('brand_fonts', { mode: 'json' })
		.$type<BrandFonts>()
		.notNull()
		.default({} as BrandFonts),
	/* contact + channels */
	whatsappNumber: text('whatsapp_number').notNull().default(''),
	whatsappTemplate: text('whatsapp_template').notNull().default(''),
	whatsappCartTemplate: text('whatsapp_cart_template').notNull().default(''),
	footerText: text('footer_text').notNull().default(''),
	social: text('social', { mode: 'json' })
		.$type<StoreSettings['social']>()
		.notNull()
		.default({} as StoreSettings['social']),
	/** Optional profile/chat URLs (Facebook, Instagram, WhatsApp). */
	facebookUrl: text('facebook_url').notNull().default(''),
	instagramUrl: text('instagram_url').notNull().default(''),
	whatsappUrl: text('whatsapp_url').notNull().default(''),
	/** Custom media entries (logo, name, URL) for footer/other surfaces. */
	footerMediaLinks: text('footer_media_links', { mode: 'json' })
		.$type<StoreSettings['footerMediaLinks']>()
		.notNull()
		.default([] as StoreSettings['footerMediaLinks']),
	defaultSeo: text('default_seo', { mode: 'json' })
		.$type<StoreSettings['defaultSeo']>()
		.notNull()
		.default({} as StoreSettings['defaultSeo']),
	headerLinks: text('header_links', { mode: 'json' })
		.$type<StoreSettings['headerLinks']>()
		.notNull()
		.default([] as StoreSettings['headerLinks']),
	/** Cap on the number of admin accounts (pending + active). */
	maxAdmins: integer('max_admins').notNull().default(5),
	updatedAt: text('updated_at').notNull()
});

export * from './auth.schema';
