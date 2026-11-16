/* WhatsApp order API.
   GET  /api/orders — list orders for the dashboard
   POST /api/orders — create a pending order (called by storefront before wa.me) */

import { json } from '@sveltejs/kit';
import { createOrder, getOrders, parseOrderInput, validateOrderInput } from '#lib/server/catalog/orders.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const orders = await getOrders();
	return json({ orders });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const input = parseOrderInput(body);
	const errors = validateOrderInput(input);
	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	const order = await createOrder(input);
	return json({ order }, { status: 201 });
};
