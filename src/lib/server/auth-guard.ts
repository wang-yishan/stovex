import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/** Require an authenticated, verified user for an API endpoint. */
export function requireUser(event: RequestEvent) {
	if (!event.locals.user) {
		throw error(401, 'Unauthorized');
	}
	return event.locals.user;
}