import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user?.emailVerified) {
		throw redirect(302, '/dashboard');
	}
	const email = url.searchParams.get('email') || locals.user?.email || '';
	return { email };
};

export const actions: Actions = {
	verify: async ({ request }) => {
		const formData = await request.formData();
		const email = (formData.get('email')?.toString() ?? '').trim();
		const otp = (formData.get('otp')?.toString() ?? '').trim();

		if (!email || !otp) {
			return fail(400, { message: 'Email and verification code are required.', email });
		}

		try {
			await auth.api.verifyEmailOTP({
				body: { email, otp },
				headers: request.headers
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { message: err.message || 'Invalid or expired code.', email });
			}
			return fail(500, { message: 'Unexpected error. Please try again.', email });
		}

		throw redirect(302, '/dashboard');
	},

	resend: async ({ request }) => {
		const formData = await request.formData();
		const email = (formData.get('email')?.toString() ?? '').trim();

		if (!email) {
			return fail(400, { message: 'Email is required to resend the code.', email });
		}

		try {
			await auth.api.sendVerificationOTP({
				body: { email, type: 'email-verification' },
				headers: request.headers
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { message: err.message || 'Could not resend the code.', email });
			}
			return fail(500, { message: 'Unexpected error. Please try again.', email });
		}

		return { email, sent: true };
	}
};