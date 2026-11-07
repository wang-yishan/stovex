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
	categoryId: string;
	collectionIds: string[];
	images: ProductImage[];
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

/** ProductForm local attribute-builder row. */
export interface AttributeDraft {
	id: string;
	name: string;
	values: string[];
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

export type SectionContent =
	| Record<string, unknown>;

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

export interface StoreSettings {
	logo: string;
	whatsappNumber: string;
	whatsappTemplate: string;
	headerLinks: { id: string; label: string; href: string }[];
	footerText: string;
	social: { instagram: string; facebook: string; tiktok: string };
	defaultSeo: { title: string; description: string; image: string };
}
