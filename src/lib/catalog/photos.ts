/* Shared catalog imagery helpers.

   Every product owns its own images: the merchant uploads them in the
   dashboard (they are written to disk and stored on the product row), and the
   storefront renders exactly those frames in the detail gallery.

   Products that have no uploads yet still need something to show, so a
   curated photography pool is assigned deterministically per product — the
   same product always gets the same photos, and different product names get
   different sets. */

import type { Product } from '#lib/admin/types.ts';

export interface CatalogImage {
	src: string;
	alt: string;
}

/** Curated photography pool (33 frames) used when a product has no uploads. */
export const PHOTO_POOL: string[] = [
	'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1681747685985-a401c271156c?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1691480250099-a63081ecfcb8?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1624687943971-e86af76d57de?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1637759292654-a12cb2be085e?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1603219527847-24c87f552a77?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1705909237050-7a7625b47fac?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1746880223690-359948154c53?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1657603738389-951c374b740c?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1613482184972-f9c1022d0928?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1691480150204-66dd1eb77391?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1760624294582-5341f33f9fa4?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1777566131421-a2c0a4806fcf?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1560891958-68bb1fe7fb78?auto=format&fit=crop&w=1200&q=85',
	'https://images.unsplash.com/photo-1711548244653-72219aa9ac27?auto=format&fit=crop&w=1200&q=85'
];

/** Legacy five-frame set — the storefront landing page uses these as brand imagery. */
export const FALLBACK_PHOTOS: string[] = [
	'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85'
];

/** Stable hash so every product keeps the same photos while filters reorder. */
function hash(text: string): number {
	let h = 0;
	for (let i = 0; i < text.length; i++) {
		h = (h * 31 + text.charCodeAt(i)) % 100000;
	}
	return h;
}

/**
 * Photos assigned to a product that has no uploads of its own.
 * The offset comes from the product name, so two products never show the
 * same set, and the stride walks the pool so the frames differ from each other.
 */
function assignedPhotos(product: Product, size: number): string[] {
	const offset = hash(product.name || product.id) % PHOTO_POOL.length;
	const stride = 7; // coprime with the pool length -> no repeats while walking
	const out: string[] = [];
	for (let i = 0; i < size; i++) {
		out.push(PHOTO_POOL[(offset + i * stride) % PHOTO_POOL.length]!);
	}
	return out;
}

/** The product's own images, primary first. */
export function productImages(product: Product): CatalogImage[] {
	const withUrl = product.images.filter((i) => i.url);
	const primary = withUrl.find((i) => i.isPrimary);
	const rest = withUrl.filter((i) => i !== primary);
	return [...(primary ? [primary] : []), ...rest].map((image) => ({
		src: image.url,
		alt: image.alt || product.name
	}));
}

/**
 * Primary photo for a product (uploaded image first, assigned photo otherwise).
 * The fallback is derived from the product name rather than its position in a
 * grid, so a product keeps the same photo while filters and sorting reorder
 * the listing.
 */
export function photoFor(product: Product): string {
	const own = productImages(product);
	if (own.length > 0) return own[0]!.src;
	return assignedPhotos(product, 1)[0]!;
}

/**
 * Gallery frames for the product detail page.
 * The product's own images come first — one product can hold as many as the
 * merchant uploaded. When it has none, a distinct set is assigned per product.
 */
export function galleryFor(product: Product, size = 5): CatalogImage[] {
	const own = productImages(product);
	if (own.length > 0) return own;

	return assignedPhotos(product, size).map((src, index) => ({
		src,
		alt: `${product.name} — detail ${index + 1}`
	}));
}
