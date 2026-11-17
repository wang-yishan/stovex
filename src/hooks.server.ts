import { building } from '$app/env';
import { env } from '$env/dynamic/private';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { type Handle, sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { error, redirect } from '@sveltejs/kit';

const isDev = (env.PROJECT_STATUS ?? 'DEV').toUpperCase() === 'DEV';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', getTextDirection(locale))
			}
		);
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const { pathname, search } = event.url;

	// Let Better Auth handle its own routes (/api/auth/*).
	if (pathname.startsWith('/api/auth')) {
		return svelteKitHandler({ event, resolve, auth, building });
	}

	// In development, skip auth guards so the dashboard/APIs stay accessible.
	if (!isDev) {
		// Protect the dashboard: require a signed-in, verified user.
		if (pathname.startsWith('/dashboard')) {
			if (!event.locals.user) {
				throw redirect(302, `/login?next=${encodeURIComponent(pathname + search)}`);
			}
			if (!event.locals.user.emailVerified) {
				throw redirect(302, '/verify-email');
			}
		}

		// Protect admin APIs.
		if (pathname.startsWith('/api/')) {
			if (!event.locals.user) {
				throw error(401, 'Unauthorized');
			}
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleParaglide, handleBetterAuth);
