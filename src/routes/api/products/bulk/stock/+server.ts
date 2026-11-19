/* POST /api/products/bulk/stock — adjust stock on several products/variants.
   Body: { adjustments: [{ productId, variantId?, delta, reason, note? }] } */

import { json } from '@sveltejs/kit';
import { adjustStocks, getCatalog } from '#lib/server/catalog/repository.ts';
import type { AdjustStockInput } from '#lib/admin/types.ts';
import type { RequestHandler } from './$types';

const REASONS: readonly string[] = ['Restock', 'Correction', 'Damaged'];

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const list = Array.isArray(body) ? body : (body as { adjustments?: unknown } | null)?.adjustments;
	if (!Array.isArray(list) || list.length === 0) {
		return json(
			{ errors: { adjustments: 'Expected a non-empty "adjustments" array' } },
			{ status: 400 }
		);
	}

	const catalog = await getCatalog();
	const errors: Record<string, Record<string, string>> = {};
	const adjustments: AdjustStockInput[] = [];
	list.forEach((item, index) => {
		const adj = (item ?? {}) as Partial<AdjustStockInput>;
		const delta = Number(adj.delta);
		const errs: Record<string, string> = {};
		if (!Number.isFinite(delta) || delta === 0) {
			errs.delta = 'Quantity change must be a non-zero number';
		}
		if (typeof adj.reason !== 'string' || !REASONS.includes(adj.reason)) {
			errs.reason = 'Reason must be Restock, Correction or Damaged';
		}
		const product = catalog.products.find((p) => p.id === adj.productId);
		if (!product) {
			errs.productId = 'Product not found';
		}
		if (Object.keys(errs).length > 0) {
			errors[String(index)] = errs;
		} else if (product) {
			adjustments.push({
				productId: product.id,
				delta,
				reason: adj.reason as AdjustStockInput['reason'],
				note: adj.note
			});
		}
	});
	if (Object.keys(errors).length > 0) return json({ errors }, { status: 400 });

	const movements = await adjustStocks(adjustments);
	return json({ movements });
};
