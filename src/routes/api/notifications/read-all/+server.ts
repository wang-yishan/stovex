import { json } from '@sveltejs/kit';
import { markAllNotificationsRead } from '#lib/server/catalog/notifications.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	await markAllNotificationsRead();
	return json({ ok: true });
};
