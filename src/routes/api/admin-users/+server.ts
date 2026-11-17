/* Admin account management (owner-only).
   GET  /api/admin-users — the admin roster + cap stats
   POST /api/admin-users — activate / deactivate an admin ("Aktifkan Akun")  */

import { json } from '@sveltejs/kit';
import { getSettings } from '#lib/server/catalog/settings.ts';
import { getAdminRoster, setAdminStatus, type AdminStatus } from '#lib/server/admin-users.ts';
import { requireOwner } from '#lib/server/auth-guard.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	requireOwner(event);
	const settings = await getSettings();
	const roster = await getAdminRoster(settings.maxAdmins);
	return json({ roster, maxAdmins: settings.maxAdmins });
};

export const POST: RequestHandler = async (event) => {
	requireOwner(event);

	const body = (await event.request.json().catch(() => null)) as {
		userId?: string;
		action?: string;
	} | null;

	const userId = typeof body?.userId === 'string' ? body.userId : '';
	const action = body?.action;
	if (!userId || (action !== 'activate' && action !== 'deactivate')) {
		return json(
			{ message: 'userId and action (activate|deactivate) are required.' },
			{ status: 400 }
		);
	}

	const status: AdminStatus = action === 'activate' ? 'active' : 'pending';
	const updated = await setAdminStatus(userId, status);
	if (!updated) {
		return json(
			{
				message: 'Account not found, or it is not an admin account (the owner cannot be changed).'
			},
			{ status: 404 }
		);
	}

	const settings = await getSettings();
	const roster = await getAdminRoster(settings.maxAdmins);
	return json({ user: updated, roster, maxAdmins: settings.maxAdmins });
};
