/* The catalog, orders, shipments, notifications and settings live in SQLite.
   Every route loads them here so the storefront and the dashboard render the
   same rows the merchant just saved.

   Resilient loading: each source is fetched independently so one failing
   repository does not blank the whole app. Failed payloads are `null` and
   the matching flag in `loadErrors` is set; the client hydrates only what
   loaded and surfaces a "some data failed" banner. `+error.svelte` remains
   the last-resort guard for total failures. */

import { getCatalog } from '#lib/server/catalog/repository.ts';
import { getNotifications } from '#lib/server/catalog/notifications.ts';
import { getOrders } from '#lib/server/catalog/orders.ts';
import { getSettings } from '#lib/server/catalog/settings.ts';
import { getShipments } from '#lib/server/catalog/shipping.ts';
import { seedSettings } from '#lib/admin/data.ts';
import type { LayoutServerLoad } from './$types';

async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; ok: boolean }> {
	try {
		return { data: await fn(), ok: true };
	} catch {
		return { data: null, ok: false };
	}
}

export const load: LayoutServerLoad = async () => {
	const [catalog, shipments, notifications, settings, orders] = await Promise.all([
		safe(getCatalog),
		safe(getShipments),
		safe(getNotifications),
		safe(getSettings),
		safe(getOrders)
	]);

	// Settings already falls back to seeds inside getSettings(); if it still
	// fails, supply the seed brand so the storefront can render.
	const resolvedSettings = settings.data ?? seedSettings();

	return {
		catalog: catalog.data,
		shipments: shipments.data,
		notifications: notifications.data,
		settings: resolvedSettings,
		orders: orders.data,
		loadErrors: {
			catalog: !catalog.ok,
			shipments: !shipments.ok,
			notifications: !notifications.ok,
			settings: !settings.ok,
			orders: !orders.ok
		}
	};
};
