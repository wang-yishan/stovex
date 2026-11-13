/* POST /api/shipments/[id]/events — append a tracking event.
   When the event carries a new status, the shipment status follows. */

import { error, json } from '@sveltejs/kit';
import { addShipmentEvent } from '#lib/server/catalog/shipping.ts';
import { SHIPMENT_STATUSES } from '#lib/admin/data.ts';
import type { ShipmentStatus } from '#lib/admin/types.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as {
		status?: string;
		label?: string;
		location?: string;
		note?: string;
	} | null;

	const status = body?.status as ShipmentStatus | undefined;
	if (!status || !SHIPMENT_STATUSES.includes(status)) {
		return json({ errors: { status: 'Unknown shipment status' } }, { status: 400 });
	}
	if (!body?.label?.trim()) {
		return json({ errors: { label: 'Event description required' } }, { status: 400 });
	}

	try {
		const result = await addShipmentEvent(params.id, {
			status,
			label: body.label,
			location: body.location ?? '',
			note: body.note
		});
		return json(result);
	} catch (cause) {
		if (cause instanceof Error && cause.message === 'Shipment not found') {
			throw error(404, 'Shipment not found');
		}
		throw cause;
	}
};
