import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { auth, googleEnabled } from '#lib/server/auth.ts';
import { db } from '#lib/server/db/index.ts';
import { user } from '#lib/server/db/auth.schema.ts';
import { canRegisterAdmin } from '#lib/server/admin-users.ts';
import { getSettings } from '#lib/server/catalog/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user as
		{ role?: string; status?: string; emailVerified?: boolean } | undefined;

	// Owner and activated admins go straight to the dashboard.
	if (user && (user.role === 'owner' || (user.role === 'admin' && user.status === 'active'))) {
		throw redirect(302, '/dashboard');
	}
	// A pending admin must wait for owner activation — send them to the login notice.
	if (user && user.role === 'admin' && user.status !== 'active') {
		throw redirect(302, '/login?pending=1');
	}
	return { googleEnabled };
};

export const actions: Actions = {
	signUp: async ({ request }) => {
		const formData = await request.formData();
		const name = (formData.get('name')?.toString() ?? '').trim();
		const username = (formData.get('username')?.toString() ?? '').trim();
		const email = (formData.get('email')?.toString() ?? '').trim();
		const password = formData.get('password')?.toString() ?? '';

		if (!name || !username || !email || !password) {
			return fail(400, {
				message: 'All fields are required.',
				name,
				username,
				email
			});
		}

		// Admin sign-ups are capped by the owner (store settings → "Max admins").
		const settings = await getSettings();
		if (!(await canRegisterAdmin(settings.maxAdmins))) {
			return fail(400, {
				message: `Kuota admin sudah penuh (maksimal ${settings.maxAdmins} admin). Hubungi owner.`,
				name,
				username,
				email
			});
		}

		try {
			await auth.api.signUpEmail({
				body: { name, username, email, password },
				headers: request.headers
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, {
					message: err.message || 'Sign up failed.',
					name,
					username,
					email
				});
			}
			return fail(500, { message: 'Unexpected error. Please try again.', name, username, email });
		}

		// Belt & braces: the account is an admin pending owner activation
		// (the defaults already do this — this survives config drift).
		try {
			await db
				.update(user)
				.set({ role: 'admin', status: 'pending', updatedAt: new Date() })
				.where(eq(user.email, email.toLowerCase()));
		} catch (cause) {
			console.error('[signup] could not mark the account as pending admin:', cause);
		}

		// No session on sign-up: the admin can sign in, but the dashboard stays
		// locked until the owner activates the account from the admin list.
		throw redirect(302, `/login?pending=1&registered=${encodeURIComponent(email)}`);
	},

	google: async ({ request }) => {
		if (!googleEnabled) {
			return fail(400, { message: 'Google sign-in is not configured.' });
		}
		try {
			const res = await auth.api.signInSocial({
				body: {
					provider: 'google',
					callbackURL: '/dashboard',
					errorCallbackURL: '/signup'
				},
				headers: request.headers
			});
			if (res?.url) {
				throw redirect(302, res.url, { external: true });
			}
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { message: err.message || 'Google sign-in failed.' });
			}
			throw err;
		}
		return fail(400, { message: 'Could not start Google sign-in.' });
	}
};
