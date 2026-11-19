/* POST /api/products/bulk/duplicate — copy several products as new drafts.
   Body: { ids: string[] } → { products, duplicated } (201) */

import { json } from '@sveltejs/kit';
import { duplicateProducts } from '#lib/server/catalog/repository.ts';
import { idsFromBody } from '#lib/server/catalog/bulk.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const ids = idsFromBody(body);
	if (ids.length === 0) {
		return json({ errors: { ids: 'Expected a non-empty "ids" array' } }, { status: 400 });
	}
	const products = await duplicateProducts(ids);
	return json({ products, duplicated: products.map((p) => p.id) }, { status: 201 });
};
