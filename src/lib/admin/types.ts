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
