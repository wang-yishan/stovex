/* Notification repository — reads/writes in-app notifications in SQLite. */

import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { notification } from '#lib/server/db/schema.ts';
import { SEED_NOTIFICATIONS, nowISO, uid } from '#lib/admin/data.ts';
import type { AppNotification, NotificationKind } from '#lib/admin/types.ts';

const KINDS: NotificationKind[] = ['order', 'product', 'shipping', 'system'];

function kindOf(value: unknown): NotificationKind {
	return KINDS.includes(value as NotificationKind) ? (value as NotificationKind) : 'system';
}

function rowToNotification(row: typeof notification.$inferSelect): AppNotification {
	return {
		id: row.id,
		kind: kindOf(row.kind),
		title: row.title,
		message: row.message,
		href: row.href ?? undefined,
		read: row.read,
		createdAt: row.createdAt
	};
}

export async function getNotifications(): Promise<AppNotification[]> {
	await ensureSeeded();
	const rows = await db.select().from(notification).orderBy(desc(notification.createdAt));
	return rows.map(rowToNotification);
}

export async function markNotificationRead(id: string): Promise<AppNotification | null> {
	const rows = await db.select().from(notification).where(eq(notification.id, id)).limit(1);
	const row = rows[0];
	if (!row) return null;
	await db.update(notification).set({ read: true }).where(eq(notification.id, id));
	return { ...rowToNotification(row), read: true };
}

export async function markAllNotificationsRead(): Promise<void> {
	await db.update(notification).set({ read: true });
}

export async function createNotification(
	input: Partial<AppNotification> & Pick<AppNotification, 'title' | 'message'>
): Promise<AppNotification> {
	const item: AppNotification = {
		id: input.id || uid('notif-'),
		kind: kindOf(input.kind),
		title: input.title,
		message: input.message,
		href: input.href ?? undefined,
		read: input.read ?? false,
		createdAt: input.createdAt || nowISO()
	};
	await db.insert(notification).values({
		id: item.id,
		kind: item.kind,
		title: item.title,
		message: item.message,
		href: item.href ?? null,
		read: item.read,
		createdAt: item.createdAt
	});
	return item;
}

export async function deleteNotification(id: string): Promise<void> {
	await db.delete(notification).where(eq(notification.id, id));
}

export async function ensureSeeded(): Promise<void> {
	const existing = await db.select({ id: notification.id }).from(notification).limit(1);
	if (existing.length > 0) return;

	await db.insert(notification).values(
		SEED_NOTIFICATIONS.map((n) => ({
			id: n.id,
			kind: n.kind,
			title: n.title,
			message: n.message,
			href: n.href ?? null,
			read: n.read,
			createdAt: n.createdAt
		}))
	);
}
