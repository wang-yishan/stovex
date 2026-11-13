/* POST /api/products/[id]/stock — adjust stock on a product or one of its
   variants. Stock never drops below zero and every change writes a
   traceable movement record. */

import { error, json } from '@sveltejs/kit';
import { adjustStock } from '#lib/server/catalog/repository.ts';
import type { AdjustStockInput } from '#lib/admin/types.ts';
import type { RequestHandler } from './$types';

const REASONS = ['Restock', 'Correction', 'Damaged'];

export const POST: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as Partial<AdjustStockInput> | null;
	if (!body) throw error(400, 'Expected a JSON body');

	const delta = Number(body.delta);
	if (!Number.isFinite(delta) || delta === 0) {
		throw error(400, 'Quantity change must be a non-zero number');
	}
	const reason = (body.reason ?? '') as AdjustStockInput['reason'];
	if (!REASONS.includes(reason)) {
		throw error(400, 'Reason must be Restock, Correction or Damaged');
	}

	const movement = await adjustStock({
		productId: params.id,
		variantId: body.variantId,
		delta,
		reason,
		note: body.note
	});
	if (!movement) throw error(404, 'Product not found');

	return json({ movement });
};
