import { json } from '@sveltejs/kit';
import { getNotifications } from '#lib/server/catalog/notifications.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ notifications: await getNotifications() });
};
