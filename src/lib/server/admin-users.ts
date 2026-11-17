/* Admin account repository — the owner-facing list of admin accounts.

   Self-registered users land as `role='admin'`, `status='pending'` and stay
   blocked from the dashboard until the owner activates them ("Aktifkan Akun").
   The owner is provisioned directly and is always active. */

import { asc, count, eq, inArray, or } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/auth.schema.ts';

export type AdminStatus = 'pending' | 'active';

export interface AdminAccount {
	id: string;
	name: string;
	email: string;
	username: string | null;
	nickname: string | null;
	image: string | null;
	role: string;
	status: string;
	emailVerified: boolean;
	createdAt: Date | null;
}

export interface AdminRoster {
	owner: AdminAccount | null;
	admins: AdminAccount[];
	/** Admin accounts still waiting for owner activation. */
	pendingCount: number;
	/** Admin accounts already activated. */
	activeCount: number;
	/** Maximum number of admin accounts allowed (from store settings). */
	maxAdmins: number;
	/** Free slots left for new admin sign-ups. */
	slotsLeft: number;
}

const ACCOUNT_COLUMNS = {
	id: user.id,
	name: user.name,
	email: user.email,
	username: user.username,
	nickname: user.nickname,
	image: user.image,
	role: user.role,
	status: user.status,
	emailVerified: user.emailVerified,
	createdAt: user.createdAt
};

function rowToAccount(row: {
	id: string;
	name: string;
	email: string;
	username: string | null;
	nickname: string | null;
	image: string | null;
	role: string;
	status: string;
	emailVerified: boolean;
	createdAt: Date | null;
}): AdminAccount {
	return row;
}

/** Every owner/admin account, newest first. */
export async function listAdminAccounts(): Promise<{
	owner: AdminAccount | null;
	admins: AdminAccount[];
}> {
	const rows = await db
		.select(ACCOUNT_COLUMNS)
		.from(user)
		.where(inArray(user.role, ['owner', 'admin']))
		.orderBy(asc(user.createdAt));

	const owner = rows.find((r) => r.role === 'owner') ?? null;
	const admins = rows.filter((r) => r.role === 'admin').map(rowToAccount);
	return { owner, admins };
}

/** Build the roster with counts against the configured cap. */
export async function getAdminRoster(maxAdmins: number): Promise<AdminRoster> {
	const { owner, admins } = await listAdminAccounts();
	const pendingCount = admins.filter((a) => a.status === 'pending').length;
	const activeCount = admins.filter((a) => a.status === 'active').length;
	const cap = Math.max(0, Math.floor(maxAdmins) || 0);
	return {
		owner,
		admins,
		pendingCount,
		activeCount,
		maxAdmins: cap,
		slotsLeft: Math.max(0, cap - admins.length)
	};
}

/** Whether another admin sign-up fits under the cap (pending + active count). */
export async function canRegisterAdmin(maxAdmins: number): Promise<boolean> {
	const [row] = await db.select({ value: count() }).from(user).where(eq(user.role, 'admin'));
	return (row?.value ?? 0) < Math.max(0, Math.floor(maxAdmins) || 0);
}

/** Look a user up by email or username — used by the login gate. */
export async function findUserByIdentifier(identifier: string): Promise<AdminAccount | null> {
	const value = identifier.trim().toLowerCase();
	if (!value) return null;
	const [row] = await db
		.select(ACCOUNT_COLUMNS)
		.from(user)
		.where(or(eq(user.email, value), eq(user.username, value)))
		.limit(1);
	return row ? rowToAccount(row) : null;
}

/**
 * Activate or deactivate an admin account (owner action only).
 * Returns the updated account, or null when the id does not exist / is the owner.
 */
export async function setAdminStatus(
	userId: string,
	status: AdminStatus
): Promise<AdminAccount | null> {
	const [target] = await db.select(ACCOUNT_COLUMNS).from(user).where(eq(user.id, userId)).limit(1);
	if (!target || target.role !== 'admin') return null;

	await db.update(user).set({ status, updatedAt: new Date() }).where(eq(user.id, userId));
	const [updated] = await db.select(ACCOUNT_COLUMNS).from(user).where(eq(user.id, userId)).limit(1);
	return updated ? rowToAccount(updated) : null;
}
