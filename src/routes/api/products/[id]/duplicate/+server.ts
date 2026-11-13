/* POST /api/products/[id]/duplicate — copy a product into a new draft. */

import { error, json } from '@sveltejs/kit';
import { duplicateProduct } from '#lib/server/catalog/repository.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const copy = await duplicateProduct(params.id);
	if (!copy) throw error(404, 'Product not found');
	return json({ product: copy }, { status: 201 });
};
