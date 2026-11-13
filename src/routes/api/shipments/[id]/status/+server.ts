/* POST /api/shipments/[id]/status — move a shipment to a new status.
   Appends a tracking event so the timeline records the change. */

import { error, json } from '@sveltejs/kit';
import { setShipmentStatus } from '#lib/server/catalog/shipping.ts';
import { SHIPMENT_STATUSES } from '#lib/admin/data.ts';
import type { ShipmentStatus } from '#lib/admin/types.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as {
		status?: string;
		location?: string;
		label?: string;
		note?: string;
	} | null;

	const status = body?.status as ShipmentStatus | undefined;
	if (!status || !SHIPMENT_STATUSES.includes(status)) {
		return json({ errors: { status: 'Unknown shipment status' } }, { status: 400 });
	}

	try {
		const result = await setShipmentStatus(params.id, status, {
			location: body?.location,
			label: body?.label,
			note: body?.note
		});
		return json(result);
	} catch (cause) {
		if (cause instanceof Error && cause.message === 'Shipment not found') {
			throw error(404, 'Shipment not found');
		}
		throw cause;
	}
};
