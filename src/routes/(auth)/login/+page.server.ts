import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth, googleEnabled } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user && locals.user.emailVerified) {
		throw redirect(302, url.searchParams.get('next') || '/dashboard');
	}
	if (locals.user && !locals.user.emailVerified) {
		throw redirect(302, '/verify-email');
	}
	return {
		googleEnabled,
		next: url.searchParams.get('next') || '/dashboard'
	};
};

export const actions: Actions = {
	signIn: async ({ request, url }) => {
		const formData = await request.formData();
		const identifier = (formData.get('identifier')?.toString() ?? '').trim();
		const password = formData.get('password')?.toString() ?? '';
		const next = formData.get('next')?.toString() || '/dashboard';

		if (!identifier || !password) {
			return fail(400, { message: 'Email/username and password are required.', identifier });
		}

		try {
			if (identifier.includes('@')) {
				await auth.api.signInEmail({
					body: { email: identifier, password },
					headers: request.headers
				});
			} else {
				await auth.api.signInUsername({
					body: { username: identifier, password },
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