/* Single shipment routes.
   GET    /api/shipments/[id] — one shipment with its timeline
   PUT    /api/shipments/[id] — update
   DELETE /api/shipments/[id] — delete                                     */

import { error, json } from '@sveltejs/kit';
import {
	deleteShipment,
	getShipments,
	parseShipmentPayload,
	saveShipment,
	validateShipment
} from '#lib/server/catalog/shipping.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const shipments = await getShipments();
	const shipment = shipments.find((s) => s.id === params.id);
	if (!shipment) throw error(404, 'Shipment not found');
	return json({ shipment });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	const incoming = parseShipmentPayload(body);
	const shipment = { ...incoming, id: params.id };

	const existing = await getShipments();
	if (!existing.some((s) => s.id === params.id)) throw error(404, 'Shipment not found');

	const errors = validateShipment(shipment, existing);
	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	const saved = await saveShipment(shipment);
	return json({ shipment: saved });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const existing = await getShipments();
	if (!existing.some((s) => s.id === params.id)) throw error(404, 'Shipment not found');
	await deleteShipment(params.id);
	return json({ ok: true });
};
