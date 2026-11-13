import { error, json } from '@sveltejs/kit';
import { deleteNotification, markNotificationRead } from '#lib/server/catalog/notifications.ts';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as { read?: boolean } | null;
	if (body?.read !== true) {
		throw error(400, 'Only marking a notification as read is supported');
	}
	const notification = await markNotificationRead(params.id);
	if (!notification) throw error(404, 'Notification not found');
	return json({ notification });
};

export const DELETE: RequestHandler = async ({ params }) => {
	await deleteNotification(params.id);
	return json({ ok: true });
};
