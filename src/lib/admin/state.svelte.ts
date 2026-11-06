/* Bag Store Admin — global in-memory store (Svelte 5 runes module).
   Single prototype store: seeds are deterministic, mutations are user-driven.
   Note: module singleton is shared per server process under SSR; acceptable for
   this local prototype (ref parity — everything was in-memory anyway). */

import { SEED_CATEGORIES, SEED_COLLECTIONS, SEED_MOVEMENTS, SEED_PRODUCTS, lowThreshold, nowISO, slugify, uid } from './data';
import type {
	Category,
	Collection,
	Product,
	ProductStatus,
	StockMovement,
	ToastMsg,
	ToastType,
	AdjustStockInput
} from './types';

export type SlugKind = 'product' | 'category' | 'collection';

class AdminStore {
	products = $state<Product[]>(SEED_PRODUCTS);
	categories = $state<Category[]>(SEED_CATEGORIES);
	collections = $state<Collection[]>(SEED_COLLECTIONS);
	movements = $state<StockMovement[]>(SEED_MOVEMENTS);

	sidebarCollapsed = $state(false);
	moreSheetOpen = $state(false);

	toast = $state<ToastMsg | null>(null);

	showToast(msg: string, type: ToastType = 'info'): void {
		this.toast = { id: uid('toast-'), msg, type: type };
	}

	clearToast(): void {
		this.toast = null;
	}

	toggleSidebar(): void {
		this.sidebarCollapsed = !this.sidebarCollapsed;
	}

	toggleMoreSheet(v?: boolean): void {
		this.moreSheetOpen = v ?? !this.moreSheetOpen;
	}

	/* --- uniqueness --- */

	slugUnique(
		slug: string,
		excludeId?: string,
		kind: SlugKind = 'product'
	): boolean {
		if (!slug) return false;
		const list =
			kind === 'product'
				? this.products
				: kind === 'category'
					? this.categories
					: this.collections;
		return !list.some((p) => p.slug === slug && p.id !== excludeId);
	}

	skuUnique(sku: string, excludeProductId?: string, excludeVariantId?: string): boolean {
		if (!sku) return true;
		const target = sku.toLowerCase();
		for (const p of this.products) {
			if (p.id !== excludeProductId && p.sku?.toLowerCase() === target) return false;
			for (const v of p.variants) {
				if (v.id !== excludeVariantId && v.sku?.toLowerCase() === target) return false;
			}
		}
		return true;
	}

	/* --- sidebar / sheet chrome --- */

	/* --- products --- */

	upsertProduct(product: Product): void {
		const i = this.products.findIndex((p) => p.id === product.id);
		if (i >= 0) {
			this.products[i] = product;
		} else {
			this.products.unshift(product);
		}
		this.showToast(product.status === 'active' ? 'Product published' : 'Product saved', 'success');
	}

	deleteProducts(ids: string[]): void {
		this.products = this.products.filter((p) => !ids.includes(p.id));
	}

	duplicateProduct(id: string): string | undefined {
		const src = this.products.find((p) => p.id === id);
		if (!src) return undefined;
		let slug = `${src.slug}-copy`;
		let n = 1;
		while (!this.slugUnique(slug)) slug = `${src.slug}-copy-${n++}`;
		const copy: Product = {
			...structuredClone($state.snapshot(src)),
			id: uid('prod-'),
			name: `${src.name} Copy`,
			slug: slug,
			status: 'draft',
			createdAt: nowISO(),
			updatedAt: nowISO(),
			sku: src.sku ? `${src.sku}-COPY` : '',
			variants: src.variants.map((v) => ({
				...structuredClone($state.snapshot(v)),
				id: uid('var-'),
				productId: '',
				sku: v.sku ? `${v.sku}-COPY` : ''
			}))
		};
		for (const v of copy.variants) v.productId = copy.id;
		this.products = [copy, ...this.products];
		this.showToast('Duplicated as draft', 'success');
		return copy.id;
	}

	setProductsStatus(ids: string[], status: 'active' | 'archived'): void {
		this.products = this.products.map((p) =>
			ids.includes(p.id) ? { ...p, status: status, updatedAt: nowISO() } : p
		);
	}

	archiveProduct(id: string): void {
		this.products = this.products.map((p) =>
			p.id === id ? { ...p, status: 'archived' as ProductStatus, updatedAt: nowISO() } : p
		);
	}

	/* --- inventory --- */

	/** Clamps target stock at 0; appends a traceable movement record (newest first). */
	adjustStock(input: AdjustStockInput): void {
		const { productId, variantId, delta, reason, note } = input;
		const product = this.products.find((p) => p.id === productId);
		if (!product) return;
		let previousStock: number;
		let newStock: number;
		let variantName: string | undefined;
		let sku: string;
		if (variantId) {
			const variant = product.variants.find((v) => v.id === variantId);
			if (!variant) return;
			previousStock = variant.stock;
			newStock = Math.max(0, previousStock + delta);
			variant.stock = newStock;
			variantName = variant.name;
			sku = variant.sku || product.sku || '';
		} else {
			previousStock = product.stock;
			newStock = Math.max(0, previousStock + delta);
			product.stock = newStock;
			sku = product.sku || '';
		}
		product.updatedAt = nowISO();
		const movement: StockMovement = {
			id: uid('mov-'),
			productId: productId,
			variantId: variantId,
			productName: product.name,
			variantName: variantName,
			sku: sku,
			type: reason.toLowerCase(),
			quantityChange: delta,
			previousStock: previousStock,
			newStock: newStock,
			reason: note ? `${reason} - ${note}` : reason,
			createdAt: nowISO()
		};
		this.movements = [movement, ...this.movements];
	}

	/* --- categories --- */

	createCategory(draft: Omit<Category, 'id'>): Category {
		const category: Category = {
			id: uid('cat-'),
			name: draft.name,
			slug: draft.slug || slugify(draft.name),
			description: draft.description
		};
		this.categories = [...this.categories, category];
		return category;
	}

	updateCategory(draft: Category): void {
		this.categories = this.categories.map((c) => (c.id === draft.id ? draft : c));
	}

	deleteCategory(id: string, reassignTo?: string): void {
		if (reassignTo) {
			this.products = this.products.map((p) => (p.categoryId === id ? { ...p, categoryId: reassignTo } : p));
		}
		this.categories = this.categories.filter((c) => c.id !== id);
	}

	/* --- collections --- */

	createCollection(draft: Omit<Collection, 'id' | 'order'>): Collection {
		const collection: Collection = {
			id: uid('col-'),
			name: draft.name,
			slug: draft.slug || slugify(draft.name),
			description: draft.description,
			coverImage: draft.coverImage,
			productIds: draft.productIds ?? [],
			order: this.collections.length
		};
		this.collections = [...this.collections, collection];
		return collection;
	}

	updateCollection(draft: Collection): void {
		this.collections = this.collections.map((c) => (c.id === draft.id ? draft : c));
	}

	deleteCollection(id: string): void {
		this.collections = this.collections.filter((c) => c.id !== id);
		// ref leaves dangling product.collectionIds; we strip them to keep invariants honest.
		this.products = this.products.map((p) => ({
			...p,
			collectionIds: p.collectionIds.filter((cid) => cid !== id)
		}));
	}

	/** Swap a collection by ±1 position (clamped) then re-index `order` fields. */
	moveCollection(id: string, dir: 1 | -1): void {
		const i = this.collections.findIndex((c) => c.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= this.collections.length) return;
		const next = [...this.collections];
		const [moved] = next.splice(i, 1);
		next.splice(j, 0, moved!);
		this.collections = next.map((c, k) => ({ ...c, order: k }));
	}

	/* --- misc helpers used by pages --- */

	productLowThreshold(p: Product): number {
		return lowThreshold(p);
	}
}

export const admin = new AdminStore();
