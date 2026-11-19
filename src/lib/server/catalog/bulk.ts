/* Shared parsing helpers for the bulk product endpoints. */

import { uid } from '#lib/admin/data.ts';
import type { Product } from '#lib/admin/types.ts';
import { parseProductPayload } from '#lib/server/catalog/validate.ts';

/** Accept `ids` (or a bare array) from an untrusted body. */
export function idsFromBody(body: unknown): string[] {
	const list = Array.isArray(body) ? body : (body as { ids?: unknown } | null)?.ids;
	if (!Array.isArray(list)) return [];
	return list.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/** Accept `products` (or a bare array) from an untrusted body. */
export function productsFromBody(body: unknown): Product[] {
	const list = Array.isArray(body) ? body : (body as { products?: unknown } | null)?.products;
	if (!Array.isArray(list)) return [];
	const products: Product[] = [];
	for (const item of list) {
		const product = parseProductPayload(item);
		if (!product.id) product.id = uid('prod-');
		products.push(product);
	}
	return products;
}
