/* Single product routes.
   GET    /api/products/[id] — one product
   PUT    /api/products/[id] — update
   DELETE /api/products/[id] — delete                                     */

import { error, json } from '@sveltejs/kit';
import { deleteProduct, getCatalog, saveProduct } from '#lib/server/catalog/repository.ts';
import { parseProductPayload, validateProduct } from '#lib/server/catalog/validate.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const catalog = await getCatalog();
	const product = catalog.products.find((p) => p.id === params.id);
	if (!product) throw error(404, 'Product not found');
	return json({ product });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	const incoming = parseProductPayload(body);
	const product = { ...incoming, id: params.id };

	const catalog = await getCatalog();
	const existing = catalog.products.find((p) => p.id === params.id);
	if (!existing) throw error(404, 'Product not found');

	const errors = validateProduct(product, catalog.products);
	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	const saved = await saveProduct({
		...product,
		createdAt: existing.createdAt,
		updatedAt: new Date().toISOString()
	});

	return json({ product: saved });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const catalog = await getCatalog();
	if (!catalog.products.some((p) => p.id === params.id)) {
		throw error(404, 'Product not found');
	}
	await deleteProduct(params.id);
	return json({ ok: true });
};
