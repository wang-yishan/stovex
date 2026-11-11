/* Dashboard path helpers.

   The admin builds most of its links from runtime values (record ids, nav
   maps, crumbs), but `$app/paths`'s `resolve` is typed for literal route ids.
   Casting those values to the `Path` union made the compiler distribute the
   whole pathname union, which broke as soon as the app gained a route pair of
   a static path and a dynamic sibling.

   Resolving through the root route id keeps the same runtime behaviour — a
   leading slash is what `resolve` looks at — while staying type-safe. */

import { resolve } from '$app/paths';

/** Resolve a dashboard route path built at runtime. */
export function resolvePath(path: string): string {
	return resolve(path as '/');
}
