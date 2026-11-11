/* Storefront links — resolved through $app/paths so base paths and route ids
   stay in one place. */

import { resolve } from '$app/paths';

/** Product detail page for a slug. */
export function productHref(slug: string): string {
	return resolve('/catalog/[slug]', { slug });
}

/** Catalog index. */
export function catalogHref(): string {
	return resolve('/catalog');
}
