/* Shipment CRUD over HTTP.
   GET  /api/shipments — every shipment with its timeline
   POST /api/shipments — create a shipment                                */

import { json } from '@sveltejs/kit';
import {
	getShipments,
	parseShipmentPayload,
	saveShipment,
	validateShipment
} from '#lib/server/catalog/shipping.ts';
import { getSettings } from '#lib/server/catalog/settings.ts';
import { SHIPMENT_STATUS_META, uid } from '#lib/admin/data.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const shipments = await getShipments();
	return json({ shipments });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const shipment = parseShipmentPayload(body);
	if (!shipment.id) shipment.id = uid('ship-');

	// A shipment without a timeline still starts with one entry, so the
	// detail view always has something to show.
	if (shipment.events.length === 0) {
		const { brand } = await getSettings();
		shipment.events = [
			{
				id: uid('evt-'),
				shipmentId: shipment.id,
				status: shipment.status,
				label: SHIPMENT_STATUS_META[shipment.status].eventLabel,
				location: `${brand.wordmark} Warehouse`,
				createdAt: shipment.createdAt
			}
		];
	}

	const existing = await getShipments();
	const errors = validateShipment(shipment, existing);
	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	const saved = await saveShipment(shipment);
	return json({ shipment: saved }, { status: 201 });
};
