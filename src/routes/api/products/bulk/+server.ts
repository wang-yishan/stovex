/* Bulk product writes — several products in one request:
   POST   /api/products/bulk — create products
   PUT    /api/products/bulk — partial-update products
   DELETE /api/products/bulk — delete products                                */

import { json } from '@sveltejs/kit';
import { deleteProducts, getCatalog, saveProducts } from '#lib/server/catalog/repository.ts';
import { mergeProductPatch, validateProduct } from '#lib/server/catalog/validate.ts';
import { idsFromBody, productsFromBody } from '#lib/server/catalog/bulk.ts';
import { nowISO } from '#lib/admin/data.ts';
import type { Product } from '#lib/admin/types.ts';
import type { RequestHandler } from './$types';

type BulkErrors = Record<string, Record<string, string> | string>;

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const products = productsFromBody(body);
	if (products.length === 0) {
		return json({ errors: { products: 'Expected at least one product' } }, { status: 400 });
	}

	const catalog = await getCatalog();
	const known: Product[] = [...catalog.products];
	const errors: BulkErrors = {};
	const seen = new Set<string>();
	products.forEach((product, index) => {
		if (seen.has(product.id)) {
			errors[String(index)] = { id: 'Duplicate product id in the request' };
		}
		seen.add(product.id);
		const fieldErrors = validateProduct(product, known);
		known.push(product);
		if (Object.keys(fieldErrors).length > 0) {
			errors[String(index)] = fieldErrors;
		}
	});
	if (Object.keys(errors).length > 0) return json({ errors }, { status: 400 });

	const saved = await saveProducts(products);
	return json({ products: saved, created: saved.length }, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const catalog = await getCatalog();

	const list = Array.isArray(body) ? body : (body as { updates?: unknown } | null)?.updates;
	if (!Array.isArray(list)) {
		return json({ errors: { updates: 'Expected an "updates" array' } }, { status: 400 });
	}
	const updates: Product[] = [];
	const errors: BulkErrors = {};
	list.forEach((item, index) => {
		const existing = catalog.products.find((p) => p.id === (item as { id?: unknown })?.id);
		if (!existing) {
			errors[String(index)] = { id: 'Product not found' };
			return;
		}
		const merged = mergeProductPatch(existing, item);
		const fieldErrors = validateProduct(merged, catalog.products);
		if (Object.keys(fieldErrors).length > 0) {
			errors[String(index)] = fieldErrors;
		} else {
			updates.push({ ...merged, updatedAt: nowISO() });
		}
	});
	if (Object.keys(errors).length > 0) return json({ errors }, { status: 400 });

	const saved = await saveProducts(updates);
	return json({ products: saved });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const ids = idsFromBody(body);
	if (ids.length === 0) {
		return json({ errors: { ids: 'Expected a non-empty "ids" array' } }, { status: 400 });
	}
	const deleted = await deleteProducts(ids);
	return json({ deleted });
};
