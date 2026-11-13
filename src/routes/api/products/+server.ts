/* Product CRUD over HTTP.
   GET  /api/products — the whole catalog (used by the dashboard cache)
   POST /api/products — create a product                                */

import { json } from '@sveltejs/kit';
import { getCatalog, saveProduct } from '#lib/server/catalog/repository.ts';
import { parseProductPayload, validateProduct } from '#lib/server/catalog/validate.ts';
import { uid } from '#lib/admin/data.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const catalog = await getCatalog();
	return json({ products: catalog.products });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const product = parseProductPayload(body);
	if (!product.id) product.id = uid('prod-');

	const catalog = await getCatalog();
	const errors = validateProduct(product, catalog.products);
	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	const existing = catalog.products.find((p) => p.id === product.id);
	const saved = await saveProduct({
		...product,
		createdAt: existing?.createdAt ?? product.createdAt,
		updatedAt: new Date().toISOString()
	});

	return json({ product: saved }, { status: existing ? 200 : 201 });
};
