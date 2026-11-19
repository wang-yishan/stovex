/* Bag Store Admin — global in-memory store (Svelte 5 runes module).
   Single prototype store: seeds are deterministic, mutations are user-driven.
   Note: module singleton is shared per server process under SSR; acceptable for
   this local prototype (ref parity — everything was in-memory anyway). */

import {
	SEED_CATEGORIES,
	SEED_COLLECTIONS,
	SEED_MEDIA,
	SEED_MOVEMENTS,
	SEED_PRODUCTS,
	SEED_SHIPMENTS,
	SHIPMENT_STATUS_META,
	emptyPage,
	lowThreshold,
	nowISO,
	seedPages,
	seedSettings,
	seedVersions,
	uid
} from './data';
import {
	categoryApi,
	collectionApi,
	notificationApi,
	orderApi,
	productApi,
	settingsApi,
	shipmentApi
} from './api.ts';
import type {
	AppNotification,
	Category,
	Collection,
	MediaItem,
	Order,
	OrderStatus,
	PageStatus,
	PageVersion,
	Product,
	Shipment,
	ShipmentEventInput,
	ShipmentStatus,
	StockMovement,
	StorePage,
	StoreSettings,
	ToastMsg,
	ToastType,
	AdjustStockInput
} from './types';

export type SlugKind = 'product' | 'category' | 'collection' | 'page';

/** The catalog as loaded from SQLite and mirrored into this store. */
export interface CatalogSnapshot {
	products: Product[];
	categories: Category[];
	collections: Collection[];
	movements: StockMovement[];
}

/** Human readable message for a failed API call. */
function errorMessage(cause: unknown): string {
	return cause instanceof Error ? cause.message : 'Something went wrong';
}

class AdminStore {
	products = $state<Product[]>(SEED_PRODUCTS);
	categories = $state<Category[]>(SEED_CATEGORIES);
	collections = $state<Collection[]>(SEED_COLLECTIONS);
	movements = $state<StockMovement[]>(SEED_MOVEMENTS);
	shipments = $state<Shipment[]>(SEED_SHIPMENTS);
	notifications = $state<AppNotification[]>([]);
	orders = $state<Order[]>([]);
	pages = $state<StorePage[]>(seedPages());
	pageVersions = $state<PageVersion[]>(seedVersions(seedPages()));
	media = $state<MediaItem[]>(SEED_MEDIA);
	settings = $state<StoreSettings>(seedSettings());

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

	slugUnique(slug: string, excludeId?: string, kind: SlugKind = 'product'): boolean {
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

	/**
	 * Replace the cached catalog with what SQLite holds. Called by the root
	 * layout on every load so the dashboard and the storefront always read
	 * the same rows.
	 */
	hydrateCatalog(data: CatalogSnapshot): void {
		this.products = data.products;
		this.categories = data.categories;
		this.collections = data.collections;
		this.movements = data.movements;
	}

	/** Persist a product, then mirror the saved row into the local cache. */
	async upsertProduct(product: Product): Promise<Product | null> {
		try {
			const { product: saved } = await productApi.save(product);
			const i = this.products.findIndex((p) => p.id === saved.id);
			if (i >= 0) this.products[i] = saved;
			else this.products = [saved, ...this.products];
			this.showToast(saved.status === 'active' ? 'Product published' : 'Product saved', 'success');
			return saved;
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return null;
		}
	}

	async deleteProducts(ids: string[]): Promise<void> {
		try {
			const { deleted } = await productApi.bulkDelete(ids);
			this.products = this.products.filter((p) => !deleted.includes(p.id));
			this.showToast(`${deleted.length} product${deleted.length === 1 ? '' : 's'} deleted`, 'success');
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/** Create several products in one call; returns the saved rows. */
	async bulkCreateProducts(products: Product[]): Promise<Product[]> {
		try {
			const { products: created } = await productApi.bulkCreate(products);
			this.products = [...created, ...this.products];
			this.showToast(`${created.length} product${created.length === 1 ? '' : 's'} added`, 'success');
			return created;
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return [];
		}
	}

	/** Partial-update several products in one call; mirrors saved rows into the cache. */
	async bulkUpdateProducts(updates: Product[]): Promise<void> {
		try {
			const { products } = await productApi.bulkUpdate(updates);
			this.products = this.products.map((p) => products.find((saved) => saved.id === p.id) ?? p);
			const n = products.length;
			this.showToast(`${n} product${n === 1 ? '' : 's'} updated`, 'success');
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/** Copy several products into new drafts. */
	async bulkDuplicateProducts(ids: string[]): Promise<string[]> {
		try {
			const { products } = await productApi.bulkDuplicate(ids);
			this.products = [...products, ...this.products];
			const n = products.length;
			this.showToast(`${n} product${n === 1 ? '' : 's'} duplicated`, 'success');
			return products.map((p) => p.id);
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return [];
		}
	}

	/** Adjust stock on several products/variants; mirrors the movements. */
	async bulkAdjustStocks(adjustments: AdjustStockInput[]): Promise<void> {
		try {
			const { movements } = await productApi.bulkAdjustStock(adjustments);
			const byProduct = new Map<string, StockMovement[]>();
			for (const movement of movements) {
				const list = byProduct.get(movement.productId) ?? [];
				list.push(movement);
				byProduct.set(movement.productId, list);
			}
			this.products = this.products.map((p) => {
				const productMovements = byProduct.get(p.id);
				if (!productMovements) return p;
				let stock = p.stock;
				const variantStocks = new Map<string, number>();
				for (const v of p.variants) variantStocks.set(v.id, v.stock);
				for (const movement of productMovements) {
					if (movement.variantId) variantStocks.set(movement.variantId, movement.newStock);
					else stock = movement.newStock;
				}
				return {
					...p,
					stock,
					updatedAt: productMovements[productMovements.length - 1]?.createdAt ?? p.updatedAt,
					variants: p.variants.map((v) => ({ ...v, stock: variantStocks.get(v.id) ?? v.stock }))
				};
			});
			this.movements = [...movements, ...this.movements];
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	async duplicateProduct(id: string): Promise<string | undefined> {
		try {
			const { product } = await productApi.duplicate(id);
			this.products = [product, ...this.products];
			this.showToast('Duplicated as draft', 'success');
			return product.id;
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return undefined;
		}
	}

	async setProductsStatus(ids: string[], status: 'active' | 'archived'): Promise<void> {
		try {
			await productApi.setStatus(ids, status);
			this.products = this.products.map((p) =>
				ids.includes(p.id) ? { ...p, status: status, updatedAt: nowISO() } : p
			);
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	async archiveProduct(id: string): Promise<void> {
		await this.setProductsStatus([id], 'archived');
	}

	/* --- inventory --- */

	/**
	 * Clamps target stock at 0 and appends a traceable movement record
	 * (newest first). The change is written to SQLite first.
	 */
	async adjustStock(input: AdjustStockInput): Promise<void> {
		try {
			const { movement } = await productApi.adjustStock(input.productId, input);
			this.products = this.products.map((p) => {
				if (p.id !== input.productId) return p;
				if (input.variantId) {
					return {
						...p,
						updatedAt: movement.createdAt,
						variants: p.variants.map((v) =>
							v.id === input.variantId ? { ...v, stock: movement.newStock } : v
						)
					};
				}
				return { ...p, updatedAt: movement.createdAt, stock: movement.newStock };
			});
			this.movements = [movement, ...this.movements];
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/* --- categories --- */

	async createCategory(draft: Omit<Category, 'id'>): Promise<Category | null> {
		try {
			const { category } = await categoryApi.create(draft);
			this.categories = [...this.categories, category];
			return category;
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return null;
		}
	}

	async updateCategory(draft: Category): Promise<void> {
		try {
			const { category } = await categoryApi.update(draft);
			this.categories = this.categories.map((c) => (c.id === category.id ? category : c));
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	async deleteCategory(id: string, reassignTo?: string): Promise<void> {
		try {
			await categoryApi.remove(id, reassignTo);
			this.categories = this.categories.filter((c) => c.id !== id);
			if (reassignTo) {
				this.products = this.products.map((p) =>
					p.categoryId === id ? { ...p, categoryId: reassignTo } : p
				);
			}
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/* --- collections --- */

	async createCollection(draft: Omit<Collection, 'id' | 'order'>): Promise<Collection | null> {
		try {
			const { collection } = await collectionApi.create(draft);
			this.collections = [...this.collections, collection];
			return collection;
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return null;
		}
	}

	async updateCollection(draft: Collection): Promise<void> {
		try {
			const { collection } = await collectionApi.update(draft);
			this.collections = this.collections.map((c) => (c.id === collection.id ? collection : c));
			this.products = this.products.map((p) => ({
				...p,
				collectionIds: p.collectionIds.filter((cid) => cid !== collection.id)
			}));
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	async deleteCollection(id: string): Promise<void> {
		try {
			await collectionApi.remove(id);
			this.collections = this.collections.filter((c) => c.id !== id);
			// ref leaves dangling product.collectionIds; we strip them to keep invariants honest.
			this.products = this.products.map((p) => ({
				...p,
				collectionIds: p.collectionIds.filter((cid) => cid !== id)
			}));
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/** Swap a collection by ±1 position (clamped) then re-index `order` fields. */
	async moveCollection(id: string, dir: 1 | -1): Promise<void> {
		try {
			await collectionApi.move(id, dir);
			const next = [...this.collections];
			const i = next.findIndex((c) => c.id === id);
			const j = i + dir;
			if (i < 0 || j < 0 || j >= next.length) return;
			const [moved] = next.splice(i, 1);
			next.splice(j, 0, moved!);
			this.collections = next.map((c, k) => ({ ...c, order: k }));
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/* --- notifications --- */

	/** Replace cached notifications with what SQLite holds. */
	hydrateNotifications(data: AppNotification[]): void {
		this.notifications = data;
	}

	/** Replace cached orders with what SQLite holds. */
	hydrateOrders(data: Order[]): void {
		this.orders = data;
	}

	async markNotificationRead(id: string): Promise<void> {
		try {
			const { notification } = await notificationApi.markRead(id);
			this.notifications = this.notifications.map((n) => (n.id === id ? notification : n));
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	async markAllNotificationsRead(): Promise<void> {
		try {
			await notificationApi.markAllRead();
			this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	async deleteNotification(id: string): Promise<void> {
		try {
			await notificationApi.remove(id);
			this.notifications = this.notifications.filter((n) => n.id !== id);
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/* --- orders --- */

	async setOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
		try {
			const { order } = await orderApi.setStatus(id, status, note);
			this.orders = this.orders.map((o) => (o.id === id ? order : o));
			const label =
				status === 'verified' ? 'Pesanan diverifikasi' : status === 'cancelled' ? 'Pesanan dibatalkan' : 'Status diperbarui';
			this.showToast(label, status === 'cancelled' ? 'info' : 'success');
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/* --- shipping --- */

	/** Replace the cached shipments with what SQLite holds. */
	hydrateShipments(data: Shipment[]): void {
		this.shipments = data;
	}

	/** Persist a shipment (create or update), then mirror it into the cache. */
	async upsertShipment(shipment: Shipment): Promise<Shipment | null> {
		try {
			const isNew = !this.shipments.some((s) => s.id === shipment.id);
			const { shipment: saved } = isNew
				? await shipmentApi.save(shipment)
				: await shipmentApi.update(shipment);
			const i = this.shipments.findIndex((s) => s.id === saved.id);
			if (i >= 0) this.shipments[i] = saved;
			else this.shipments = [saved, ...this.shipments];
			this.showToast(isNew ? 'Shipment created' : 'Shipment updated', 'success');
			return saved;
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return null;
		}
	}

	async deleteShipment(id: string): Promise<void> {
		try {
			await shipmentApi.remove(id);
			this.shipments = this.shipments.filter((s) => s.id !== id);
			this.showToast('Shipment deleted', 'success');
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/** Move a shipment to a new status and record it on the timeline. */
	async setShipmentStatus(
		id: string,
		status: ShipmentStatus,
		detail?: { location?: string; label?: string; note?: string }
	): Promise<void> {
		try {
			const { shipment } = await shipmentApi.setStatus(id, status, detail);
			this.shipments = this.shipments.map((s) => (s.id === id ? shipment : s));
			this.showToast(`Shipment ${SHIPMENT_STATUS_META[status].label}`, 'success');
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
	}

	/** Append a tracking event; the status follows when it changes. */
	async addShipmentEvent(id: string, input: ShipmentEventInput): Promise<void> {
		try {
			const { shipment } = await shipmentApi.addEvent(id, input);
			this.shipments = this.shipments.map((s) => (s.id === id ? shipment : s));
			this.showToast('Tracking updated', 'success');
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
		}
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
			publishedAt: action === 'publish' ? nowISO() : snapshot.publishedAt
		};
		if (!next.seo.canonical) next.seo.canonical = `/${next.slug}`;
		const exists = this.pages.some((p) => p.id === next.id);
		if (next.isHomepage) {
			this.pages = this.pages.map((p) => (p.id === next.id ? next : { ...p, isHomepage: false }));
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
			action === 'archive' ? 'info' : 'success'
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

	/**
	 * Replace the cached settings with what SQLite holds. Called by the root
	 * layout on every load so the storefront and the dashboard read the same
	 * brand values the merchant saved.
	 *
	 * `$state.snapshot` (not `structuredClone`) — the caller may hand us the
	 * reactive `admin.settings` proxy, which cannot be cloned.
	 */
	hydrateSettings(data: StoreSettings): void {
		this.settings = $state.snapshot(data) as StoreSettings;
	}

	/**
	 * Persist a settings patch, then mirror the saved row into the cache.
	 * The cache only updates once the server confirms, like every other
	 * mutation in this store.
	 */
	async saveSettings(patch: Partial<StoreSettings>): Promise<boolean> {
		try {
			const { settings } = await settingsApi.save(patch);
			this.settings = $state.snapshot(settings) as StoreSettings;
			this.showToast('Brand settings saved', 'success');
			return true;
		} catch (cause) {
			this.showToast(errorMessage(cause), 'error');
			return false;
		}
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
		if (
			this.settings.brand.logoUrl === item.url ||
			this.settings.brand.faviconUrl === item.url ||
			this.settings.defaultSeo.image === item.url ||
			(this.settings.footerMediaLinks ?? []).some((link) => link.logoUrl === item.url)
		)
			used.push('Store settings');
		return [...new Set(used)];
	}
}

export const admin = new AdminStore();
