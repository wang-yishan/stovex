import { building } from '$app/env';
import { env } from '$env/dynamic/private';
import { auth } from '#lib/server/auth.ts';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { type Handle, sequence } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { error, redirect } from '@sveltejs/kit';
import { isOperationalUser, isOwner } from '#lib/server/auth-guard.ts';

const isDev = (env.PROJECT_STATUS ?? 'DEV').toUpperCase() === 'DEV';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
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

	// Sections of the API only the owner may touch (settings + admin management).
	const ownerOnlyApi =
		pathname.startsWith('/api/settings') || pathname.startsWith('/api/admin-users');

	// In development, skip auth guards so the dashboard/APIs stay accessible.
	if (!isDev) {
		// Protect the dashboard: owner or an activated admin.
		if (pathname.startsWith('/dashboard')) {
			if (!event.locals.user) {
				throw redirect(302, `/login?next=${encodeURIComponent(pathname + search)}`);
			}
			const user = event.locals.user as { role?: string; status?: string };
			if (user.role === 'admin' && user.status !== 'active') {
				// Pending (or suspended) admin: signed in, but not activated yet.
				throw redirect(302, '/login?pending=1');
			}
			if (!isOperationalUser(user)) {
				throw redirect(302, '/login');
			}
		}

		// Protect admin APIs.
		if (pathname.startsWith('/api/')) {
			if (ownerOnlyApi) {
				if (!isOwner(event.locals.user)) throw error(401, 'Unauthorized');
			} else if (!isOperationalUser(event.locals.user)) {
				throw error(401, 'Unauthorized');
			}
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = sequence(handleParaglide, handleBetterAuth);
