import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

const isDev = (env.PROJECT_STATUS ?? 'DEV').toUpperCase() === 'DEV';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!isDev) {
		if (!locals.user) {
			throw redirect(302, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
		}

		if (!locals.user.emailVerified) {
			throw redirect(302, '/verify-email');
		}
	}

	return { user: locals.user ?? null };
};