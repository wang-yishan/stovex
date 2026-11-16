/* POST /api/orders/[id]/status — verify or cancel a pending order. */

import { error, json } from '@sveltejs/kit';
import { setOrderStatus } from '#lib/server/catalog/orders.ts';
import type { OrderStatus } from '#lib/admin/types.ts';
import type { RequestHandler } from './$types';

const STATUSES: OrderStatus[] = ['pending', 'verified', 'cancelled'];

export const POST: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as {
		status?: string;
		note?: string;
	} | null;

	const status = body?.status as OrderStatus | undefined;
	if (!status || !STATUSES.includes(status)) {
		return json({ errors: { status: 'Unknown order status' } }, { status: 400 });
	}

	const order = await setOrderStatus(params.id, status, body?.note);
	if (!order) throw error(404, 'Order not found');
	return json({ order });
};
