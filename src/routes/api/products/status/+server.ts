/* POST /api/products/status — bulk publish / archive. */

import { json } from '@sveltejs/kit';
import { getCatalog, setProductsStatus } from '#lib/server/catalog/repository.ts';
import type { ProductStatus } from '#lib/admin/types.ts';
import type { RequestHandler } from './$types';

const STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as {
		ids?: string[];
		status?: ProductStatus;
	} | null;

	const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
	const status = body?.status;
	if (ids.length === 0 || !status || !STATUSES.includes(status)) {
		return json({ errors: { status: 'ids and a valid status are required' } }, { status: 400 });
	}

	const catalog = await getCatalog();
	const known = catalog.products.filter((p) => ids.includes(p.id)).map((p) => p.id);
	await setProductsStatus(known, status);

	return json({ updated: known });
};
