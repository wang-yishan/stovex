/* The catalog lives in SQLite. Every route loads it here so the storefront
   and the dashboard render the same rows the merchant just saved. */

import { getCatalog } from '#lib/server/catalog/repository.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const catalog = await getCatalog();
	return { catalog };
};
