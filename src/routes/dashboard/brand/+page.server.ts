import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Brand & Store Settings is owner-only: active admins are scoped to store
 * operations (products, orders, inventory) and must not read or edit it.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user as { role?: string; status?: string } | undefined;
	if (user?.role !== 'owner') {
		throw redirect(302, '/dashboard');
	}
};
