import {
	ORIGIN,
	BETTER_AUTH_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';
import { emailOTP, username } from 'better-auth/plugins';
import { hashPassword, verifyPassword } from '#lib/server/password.ts';

const googleEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	user: {
		additionalFields: {
			nickname: { type: 'string', required: false },
			phone: { type: 'string', required: false },
			address: { type: 'string', required: false },
			role: { type: 'string', required: false, defaultValue: 'admin', input: false },
			status: { type: 'string', required: false, defaultValue: 'pending', input: false }
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		/** New sign-ups are pending admins — no session until the owner activates them. */
		autoSignIn: false,
		password: {
			hash: hashPassword,
			verify: verifyPassword
		}
	},
	emailVerification: {
		autoSignInAfterVerification: true
	},
	socialProviders: googleEnabled
		? {
				google: {
					clientId: GOOGLE_CLIENT_ID!,
					clientSecret: GOOGLE_CLIENT_SECRET!
				}
			}
		: {},
	plugins: [
		username(),
		emailOTP({
			sendVerificationOnSignUp: false,
			overrideDefaultEmailVerification: true,
			otpLength: 6,
			expiresIn: 300,
			async sendVerificationOTP({ email, otp, type }) {
				// Simple dev verification: log the code instead of sending an email.
				// Replace this with a real mailer (Resend/SMTP) for production.
				console.log(`[auth] OTP for ${email} (${type}): ${otp}`);
			}
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

export { googleEnabled };
