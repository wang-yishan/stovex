import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth, googleEnabled } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user && locals.user.emailVerified) {
		throw redirect(302, '/dashboard');
	}
	if (locals.user && !locals.user.emailVerified) {
		throw redirect(302, '/verify-email');
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

		throw redirect(302, `/verify-email?email=${encodeURIComponent(email)}`);
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