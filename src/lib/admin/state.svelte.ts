/* Bag Store Admin — global in-memory store (Svelte 5 runes module).
   Single prototype store: seeds are deterministic, mutations are user-driven.
   Note: module singleton is shared per server process under SSR; acceptable for
   this local prototype (ref parity — everything was in-memory anyway). */

import { SEED_CATEGORIES, SEED_COLLECTIONS, SEED_MEDIA, SEED_MOVEMENTS, SEED_PRODUCTS, SEED_SETTINGS, emptyPage, lowThreshold, nowISO, seedPages, seedVersions, slugify, uid } from './data';
import type {
	Category,
	Collection,
	MediaItem,
	PageStatus,
	PageVersion,
	Product,
	ProductStatus,
	StockMovement,
	StorePage,
	StoreSettings,
	ToastMsg,
	ToastType,
	AdjustStockInput
} from './types';

export type SlugKind = 'product' | 'category' | 'collection' | 'page';

class AdminStore {
	products = $state<Product[]>(SEED_PRODUCTS);
	categories = $state<Category[]>(SEED_CATEGORIES);
	collections = $state<Collection[]>(SEED_COLLECTIONS);
	movements = $state<StockMovement[]>(SEED_MOVEMENTS);
	pages = $state<StorePage[]>(seedPages());
	pageVersions = $state<PageVersion[]>(seedVersions(seedPages()));
	media = $state<MediaItem[]>(SEED_MEDIA);
	settings = $state<StoreSettings>(structuredClone(SEED_SETTINGS));

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
					: kind === 'page'
						? this.pages
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

	pageSlugUnique(slug: string, excludeId?: string): boolean {
		return this.slugUnique(slug, excludeId, 'page');
	}

	/* --- pages & landing pages (ref: Pe / wr / Vt / Q) --- */

	/** Save with lifecycle action. Publish snapshots a version; homepage unsets others. */
	savePage(page: StorePage, action: 'draft' | 'publish' | 'archive' = 'draft'): void {
		const snapshot: StorePage = structuredClone($state.snapshot(page) as StorePage);
		const next: StorePage = {
			...snapshot,
			updatedAt: nowISO(),
			status: action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft',
			publishedAt:
				action === 'publish'
					? nowISO()
					: snapshot.publishedAt
		};
		if (!next.seo.canonical) next.seo.canonical = `/${next.slug}`;
		const exists = this.pages.some((p) => p.id === next.id);
		if (next.isHomepage) {
			this.pages = this.pages.map((p) =>
				p.id === next.id ? next : { ...p, isHomepage: false }
			);
		} else if (!exists) {
			this.pages = [next, ...this.pages];
		} else {
			this.pages = this.pages.map((p) => (p.id === next.id ? next : p));
		}
		if (action === 'publish') {
			const maxVer = this.pageVersions
				.filter((v) => v.pageId === next.id)
				.reduce((m, v) => Math.max(m, v.ver), 0);
			this.pageVersions = [
				{
					id: uid('ver-'),
					pageId: next.id,
					ver: maxVer + 1,
					title: next.title,
					sections: structuredClone(next.sections),
					publishedAt: next.publishedAt ?? nowISO()
				},
				...this.pageVersions
			];
		}
		this.showToast(
			action === 'publish'
				? 'Page published — version created'
				: action === 'archive'
					? 'Page archived'
					: 'Draft saved',
			'action' === 'archive' ? 'info' : 'success'
		);
	}

	duplicatePage(id: string): string | undefined {
		const src = this.pages.find((p) => p.id === id);
		if (!src) return undefined;
		let slug = `${src.slug}-copy`;
		let n = 1;
		while (!this.pageSlugUnique(slug)) slug = `${src.slug}-copy-${n++}`;
		const copy: StorePage = {
			...structuredClone($state.snapshot(src) as StorePage),
			id: uid('page-'),
			title: `${src.title} Copy`,
			slug,
			status: 'draft',
			isHomepage: false,
			publishedAt: null,
			updatedAt: nowISO()
		};
		this.pages = [copy, ...this.pages];
		this.showToast('Page duplicated as draft', 'success');
		return copy.id;
	}

	deletePage(id: string): void {
		this.pages = this.pages.filter((p) => p.id !== id);
		this.showToast('Page deleted', 'success');
	}

	setHomepage(id: string): void {
		this.pages = this.pages.map((p) => ({ ...p, isHomepage: p.id === id }));
		this.showToast('Homepage updated', 'success');
	}

	archivePage(id: string): void {
		this.pages = this.pages.map((p) =>
			p.id === id ? { ...p, status: 'archived' as PageStatus, updatedAt: nowISO() } : p
		);
		this.showToast('Page archived', 'success');
	}

	restoreVersion(versionId: string): void {
		const v = this.pageVersions.find((x) => x.id === versionId);
		if (!v) return;
		this.pages = this.pages.map((p) =>
			p.id === v.pageId
				? {
						...p,
						title: v.title,
						sections: structuredClone(v.sections),
						updatedAt: nowISO()
					}
				: p
		);
		this.showToast(`Restored version ${v.ver} as draft content`, 'success');
	}

	/** New blank page draft (editor create mode). */
	newPage(): StorePage {
		return emptyPage();
	}

	/* --- media / settings (minimal, powers page editor selects + storefront) --- */

	saveSettings(next: StoreSettings): void {
		this.settings = structuredClone($state.snapshot(next) as StoreSettings);
		this.showToast('Settings saved (this session)', 'success');
	}

	addMedia(items: MediaItem[]): void {
		this.media = [...items, ...this.media];
	}

	updateMediaAlt(id: string, alt: string): void {
		this.media = this.media.map((m) => (m.id === id ? { ...m, alt } : m));
	}

	deleteMedia(id: string): void {
		this.media = this.media.filter((m) => m.id !== id);
	}

	mediaUsedIn(item: MediaItem): string[] {
		if (!item.url) return [];
		const used: string[] = [];
		for (const page of this.pages) {
			if (JSON.stringify(page).includes(item.url)) used.push(page.title);
		}
		if (this.settings.logo === item.url || this.settings.defaultSeo.image === item.url)
			used.push('Store settings');
		return [...new Set(used)];
	}
}

export const admin = new AdminStore();
