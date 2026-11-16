/* Bag Store Admin — shared types (converted from ref/index.html). */

export type ProductStatus = 'active' | 'draft' | 'archived';
export type StockLevel = 'in-stock' | 'low' | 'out';
export type ToastType = 'info' | 'success' | 'error';

export interface ProductImage {
	id: string;
	url: string;
	isPrimary: boolean;
	alt?: string;
}

export interface VariantAttribute {
	name: string;
	value: string;
}

export interface ProductVariant {
	id: string;
	productId: string;
	name: string;
	attributes: VariantAttribute[];
	sku?: string;
	priceOverride?: number;
	stock: number;
	available: boolean;
	lowThreshold: number;
}

export interface Product {
	id: string;
	name: string;
	slug: string;
	shortDescription: string;
	fullDescription: string;
	/** Customer-facing fabric / material note, e.g. "Organic cotton canvas". */
	material?: string;
	categoryId: string;
	collectionIds: string[];
	images: ProductImage[];
	/** Detail/explanation banners uploaded by seller, shown on the product page. */
	bannerImages: ProductImage[];
	basePrice: number;
	compareAtPrice?: number;
	sku?: string;
	status: ProductStatus;
	featured: boolean;
	seoTitle?: string;
	seoDescription?: string;
	createdAt: string;
	updatedAt: string;
	hasVariants: boolean;
	trackInventory: boolean;
	stock: number;
	lowStockThreshold: number;
	variants: ProductVariant[];
}

export interface Category {
	id: string;
	name: string;
	slug: string;
	description?: string;
}

export interface Collection {
	id: string;
	name: string;
	slug: string;
	description?: string;
	coverImage?: string;
	productIds: string[];
	order: number;
}

export interface StockMovement {
	id: string;
	productId: string;
	variantId?: string;
	productName: string;
	variantName?: string;
	sku: string;
	type: string;
	quantityChange: number;
	previousStock: number;
	newStock: number;
	reason: string;
	createdAt: string;
}

export interface ToastMsg {
	id: string;
	msg: string;
	type: ToastType;
}

/* --- Notifications --- */

export type NotificationKind = 'order' | 'product' | 'shipping' | 'system';

export interface AppNotification {
	id: string;
	kind: NotificationKind;
	title: string;
	message: string;
	href?: string;
	read: boolean;
	createdAt: string;
}

/* --- Shipping module --- */

export type ShipmentStatus =
	| 'pending'
	| 'packed'
	| 'shipped'
	| 'in_transit'
	| 'out_for_delivery'
	| 'delivered'
	| 'exception'
	| 'returned';

export interface ShipmentItem {
	id: string;
	name: string;
	qty: number;
}

/** One entry in a shipment's tracking timeline. */
export interface ShipmentEvent {
	id: string;
	shipmentId: string;
	status: ShipmentStatus;
	label: string;
	location: string;
	note?: string;
	createdAt: string;
}

export interface Shipment {
	id: string;
	orderId: string;
	customerName: string;
	customerPhone: string;
	/** City + province, e.g. "Jakarta Selatan, DKI Jakarta". */
	destination: string;
	address: string;
	courier: string;
	service: string;
	/** Resi / tracking number. */
	trackingNumber: string;
	status: ShipmentStatus;
	items: ShipmentItem[];
	weightKg: number;
	shippingCost: number;
	orderTotal: number;
	createdAt: string;
	updatedAt: string;
	deliveredAt: string | null;
	events: ShipmentEvent[];
}

export interface ShipmentStatusInput {
	status: ShipmentStatus;
	note?: string;
}

export interface ShipmentEventInput {
	status: ShipmentStatus;
	label: string;
	location: string;
	note?: string;
}

/** ProductForm local attribute-builder row. */
export interface AttributeDraft {
	id: string;
	name: string;
	values: string[];
}

/* --- WhatsApp orders (monitoring + verification) --- */

export type OrderStatus = 'pending' | 'verified' | 'cancelled';
export type OrderSource = 'product' | 'cart';

export interface OrderItem {
	productId: string;
	productName: string;
	/** Variant label, e.g. "Black / M". */
	variant?: string;
	sku: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
}

export interface Order {
	id: string;
	/** Human code shared with the customer in WhatsApp, e.g. WA-1116-0042. */
	code: string;
	source: OrderSource;
	customerName: string;
	customerNote: string;
	items: OrderItem[];
	total: number;
	status: OrderStatus;
	/** Snapshot of the WhatsApp message sent for this order. */
	message: string;
	verifiedAt: string | null;
	/** Internal admin note (filled on verify/cancel). */
	adminNote: string;
	createdAt: string;
	updatedAt: string;
}

/* Overview-only seed row types. */

export interface OrderRow {
	id: string;
	customer: string;
	date: string;
	total: string;
	status: string;
	statusTone: 'amber' | 'neutral';
}

export interface ActivityRow {
	time: string;
	title: string;
	entity: string;
	dot: string;
}

export interface AdjustStockInput {
	productId: string;
	variantId?: string;
	delta: number;
	reason: 'Restock' | 'Correction' | 'Damaged';
	note?: string;
}

/* --- Pages & Landing Pages (converted from ref: Uy / L2 / X2 / Pf / G2) --- */

export type PageStatus = 'draft' | 'published' | 'archived';
export type PageKind = 'homepage' | 'campaign';

export type SectionType =
	| 'hero'
	| 'featured-products'
	| 'categories'
	| 'promo-banner'
	| 'collection-grid'
	| 'rich-text'
	| 'cta'
	| 'benefits'
	| 'gallery'
	| 'testimonials';

export type SectionContent = Record<string, unknown>;

export interface PageSection {
	id: string;
	type: SectionType;
	label: string;
	order: number;
	visible: boolean;
	layout: string;
	content: {
		image?: string;
		headline?: string;
		description?: string;
		ctaLabel?: string;
		ctaHref?: string;
		align?: string;
		heading?: string;
		text?: string;
		limit?: number;
		orderMode?: string;
		variation?: string;
		productIds?: string[];
		categoryIds?: string[];
		label?: string;
		useWhatsApp?: boolean;
		items?: unknown[];
		images?: string[];
		[key: string]: unknown;
	};
}

export interface PageSeo {
	title: string;
	description: string;
	image: string;
	canonical: string;
}

export interface StorePage {
	id: string;
	title: string;
	slug: string;
	type: PageKind;
	status: PageStatus;
	sections: PageSection[];
	seo: PageSeo;
	updatedAt: string;
	publishedAt: string | null;
	isHomepage: boolean;
}

export interface PageVersion {
	id: string;
	pageId: string;
	ver: number;
	title: string;
	sections: PageSection[];
	publishedAt: string;
}

export interface MediaItem {
	id: string;
	name: string;
	url: string;
	type: string;
	size: number;
	createdAt: string;
	alt: string;
}

/**
 * The storefront brand fonts. Every family listed here ships with the
 * project (@fontsource-variable), so the merchant can pick a face without
 * any font loading work at runtime.
 */
export type BrandFontKey = 'playfair' | 'dm-sans' | 'inter' | 'geist' | 'mono';

/** The brand palette. Every value is a `#rrggbb` hex colour. */
export interface BrandColors {
	/** Accent — links, dots, highlights, CTA hovers. */
	accent: string;
	/** Primary ink — headings and body copy. */
	ink: string;
	/** Page surface — the storefront background. */
	surface: string;
	/** Hairlines — dividers, card and input borders. */
	border: string;
	/** Muted copy — secondary text and captions. */
	muted: string;
}

export interface BrandFonts {
	/** Face used for display headings (`font-display`). */
	display: BrandFontKey;
	/** Face used for body copy. */
	body: BrandFontKey;
}

/** Everything that makes the storefront look and read like this brand. */
export interface BrandIdentity {
	/** Full store name — copy, SEO, WhatsApp greetings. */
	name: string;
	/** The wordmark shown in the header/footer, e.g. `BAG STORE`. */
	wordmark: string;
	/** One-line brand promise, e.g. "Minimal bags, made to last". */
	tagline: string;
	/** Uploaded logo image. Empty → the wordmark text is used. */
	logoUrl: string;
	/** Uploaded favicon. Empty → the bundled default is used. */
	faviconUrl: string;
	/** Public host of the store, used for share/product links. */
	domain: string;
	colors: BrandColors;
	fonts: BrandFonts;
}

export interface StoreSettings {
	brand: BrandIdentity;
	whatsappNumber: string;
	whatsappTemplate: string;
	/** Message template for cart/checkout WhatsApp. */
	whatsappCartTemplate: string;
	headerLinks: { id: string; label: string; href: string }[];
	footerText: string;
	social: { instagram: string; facebook: string; tiktok: string };
	/** Optional profile/chat URLs shown in the storefront (footer and other surfaces). */
	facebookUrl: string;
	instagramUrl: string;
	whatsappUrl: string;
	/** Custom media entries (logo, name, URL) for the footer and other surfaces. */
	footerMediaLinks: { id: string; logoUrl: string; name: string; url: string }[];
	defaultSeo: { title: string; description: string; image: string };
}
