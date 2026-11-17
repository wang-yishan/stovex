import { redirect } from '@sveltejs/kit';
import { getSettings } from '#lib/server/catalog/settings.ts';
import { getAdminRoster, type AdminAccount, type AdminRoster } from '#lib/server/admin-users.ts';
import type { PageServerLoad } from './$types';

interface AdminAccountView {
	id: string;
	name: string;
	email: string;
	username: string | null;
	nickname: string | null;
	image: string | null;
	role: string;
	status: string;
	emailVerified: boolean;
	createdAt: string | null;
}

function toView(account: AdminAccount): AdminAccountView {
	return {
		id: account.id,
		name: account.name,
		email: account.email,
		username: account.username,
		nickname: account.nickname,
		image: account.image,
		role: account.role,
		status: account.status,
		emailVerified: account.emailVerified,
		createdAt: account.createdAt ? account.createdAt.toISOString() : null
	};
}

/**
 * Owner-only: only the owner activates admins and sees the roster. Active
 * admins are scoped to store operations and are sent back to the dashboard.
 */
export const load: PageServerLoad = async (event) => {
	const user = event.locals.user as { role?: string; status?: string } | undefined;
	if (user?.role !== 'owner') {
		throw redirect(302, '/dashboard');
	}

	const settings = await getSettings();
	const roster: AdminRoster = await getAdminRoster(settings.maxAdmins);

	return {
		maxAdmins: settings.maxAdmins,
		owner: roster.owner ? toView(roster.owner) : null,
		admins: roster.admins.map(toView)
	};
};
