/* The catalog, shipments and notifications live in SQLite. Every route
   loads them here so the storefront and the dashboard render the same
   rows the merchant just saved. */

import { getCatalog } from '#lib/server/catalog/repository.ts';
import { getNotifications } from '#lib/server/catalog/notifications.ts';
import { getShipments } from '#lib/server/catalog/shipping.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const [catalog, shipments, notifications] = await Promise.all([
		getCatalog(),
		getShipments(),
		getNotifications()
	]);
	return { catalog, shipments, notifications };
};
