import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth, googleEnabled } from '#lib/server/auth.ts';
import { findUserByIdentifier } from '#lib/server/admin-users.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = url.searchParams.get('next') || '/dashboard';
	const user = locals.user as
		{ role?: string; status?: string; emailVerified?: boolean } | undefined;

	if (user && (user.role === 'owner' || (user.role === 'admin' && user.status === 'active'))) {
		throw redirect(302, next);
	}
	if (user && user.role === 'admin' && user.status !== 'active') {
		// Already signed in but not activated: show the pending notice, don't loop.
		return { googleEnabled, next, pending: true };
	}
	return { googleEnabled, next, pending: url.searchParams.get('pending') === '1' };
};

export const actions: Actions = {
	signIn: async ({ request, url }) => {
		const formData = await request.formData();
		const identifier = (formData.get('identifier')?.toString() ?? '').trim();
		const password = formData.get('password')?.toString() ?? '';
		const next = formData.get('next')?.toString() || '/dashboard';
		// Unchecked "Remember me" → a session cookie that dies with the browser.
		const rememberMe = formData.get('remember') === 'on';

		if (!identifier || !password) {
			return fail(400, { message: 'Email/username and password are required.', identifier });
		}

		// Pending admins can authenticate, but the dashboard stays locked until
		// the owner activates them — tell them up front instead of bouncing them.
		const account = await findUserByIdentifier(identifier);
		if (account && account.role === 'admin' && account.status !== 'active') {
			return fail(403, {
				message:
					'Akun admin Anda masih menunggu aktivasi. Owner akan mengaktifkan akun ini dari daftar admin.',
				identifier
			});
		}

		try {
			if (identifier.includes('@')) {
				await auth.api.signInEmail({
					body: { email: identifier, password, rememberMe },
					headers: request.headers
				});
			} else {
				await auth.api.signInUsername({
					body: { username: identifier, password, rememberMe },
					headers: request.headers
				});
			}
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { message: err.message || 'Sign in failed.', identifier });
			}
			return fail(500, { message: 'Unexpected error. Please try again.', identifier });
		}

		throw redirect(302, next);
	},

	google: async ({ request }) => {
		if (!googleEnabled) {
			return fail(400, { message: 'Google sign-in is not configured.' });
		}
		const formData = await request.formData();
		const next = formData.get('next')?.toString() || '/dashboard';

		try {
			const res = await auth.api.signInSocial({
				body: {
					provider: 'google',
					callbackURL: next,
					errorCallbackURL: '/login'
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
			// rethrow redirects
			throw err;
		}
		return fail(400, { message: 'Could not start Google sign-in.' });
	}
};
