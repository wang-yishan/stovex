import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Role/status helpers shared by the hooks guard and the API guards.
 *
 * - `owner`  → full authority (settings, admin management, everything).
 * - `admin`  → store operational access (products, orders, inventory,
 *   shipping) but only once the owner has activated the account.
 * - `admin` + `pending` → no dashboard/API access at all until activation.
 */

type RoleUser = { role?: string; status?: string } | undefined | null;

export function isOwner(user: RoleUser): boolean {
	return user?.role === 'owner';
}

export function isActiveAdmin(user: RoleUser): boolean {
	return user?.role === 'admin' && user?.status === 'active';
}

/** Owner or an activated admin — can use the dashboard and operational APIs. */
export function isOperationalUser(user: RoleUser): boolean {
	return isOwner(user) || isActiveAdmin(user);
}

/** Require owner-only access (settings, admin management). */
export function requireOwner(event: RequestEvent) {
	const user = event.locals.user as ({ role?: string } & typeof event.locals.user) | undefined;
	if (!isOwner(user)) {
		throw error(401, 'Unauthorized');
	}
	return event.locals.user!;
}

/** Require owner or an active admin (operational store APIs). */
export function requireOperationalUser(event: RequestEvent) {
	const user = event.locals.user as ({ role?: string } & typeof event.locals.user) | undefined;
	if (!isOperationalUser(user)) {
		throw error(401, 'Unauthorized');
	}
	return event.locals.user!;
}

/** Kept for existing callers — owner-only. */
export const requireUser = requireOwner;
