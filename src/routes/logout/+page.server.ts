import { redirect } from '@sveltejs/kit';
import { auth } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	throw redirect(302, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		throw redirect(302, '/login');
	}
};