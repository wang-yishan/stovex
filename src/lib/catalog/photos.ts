/* Shared catalog imagery helpers.
   The seeded admin catalog ships without image URLs, so the storefront falls
   back to curated photography. Kept in one place so the landing page and the
   /catalog detail route always agree on which photo belongs to a product. */

import type { Product } from '#lib/admin/types.ts';

export interface CatalogImage {
	src: string;
	alt: string;
}

/** Curated fallback photography (5 frames) used when a product has no uploads. */
export const FALLBACK_PHOTOS: string[] = [
	'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85',
	'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85'
];

/** Stable hash so every product rotates through the fallback set consistently. */
function hash(text: string): number {
	let h = 0;
	for (let i = 0; i < text.length; i++) {
		h = (h * 31 + text.charCodeAt(i)) % 100000;
	}
	return h;
}

/** Primary photo for a product (uploaded image first, fallback otherwise). */
export function photoFor(product: Product, index: number): string {
	const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
	return primary?.url || FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length];
}

/**
 * Gallery frames for the product detail page.
 * Uploaded images come first, remaining slots are filled with fallback photos
 * so the gallery-first layout always has something to show.
 */
export function galleryFor(product: Product, size = 5): CatalogImage[] {
	const out: CatalogImage[] = product.images
		.filter((i) => i.url)
		.map((i) => ({ src: i.url, alt: i.alt || product.name }));

	const seed = hash(product.id);
	let step = 0;
	while (out.length < size && step < FALLBACK_PHOTOS.length * 2) {
		const src = FALLBACK_PHOTOS[(seed + step) % FALLBACK_PHOTOS.length];
		if (!out.some((o) => o.src === src)) {
			out.push({ src, alt: `${product.name} — detail ${out.length + 1}` });
		}
		step++;
	}

	return out;
}
