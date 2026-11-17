import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isOperationalUser } from '#lib/server/auth-guard.ts';
import type { LayoutServerLoad } from './$types';

const isDev = (env.PROJECT_STATUS ?? 'DEV').toUpperCase() === 'DEV';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!isDev) {
		if (!locals.user) {
			throw redirect(302, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
		}

		const user = locals.user as { role?: string; status?: string };
		if (user.role === 'admin' && user.status !== 'active') {
			// Pending admin: waiting for the owner to activate the account.
			throw redirect(302, '/login?pending=1');
		}
		if (!isOperationalUser(user)) {
			throw redirect(302, '/login');
		}
	}

	return { user: locals.user ?? null };
};
