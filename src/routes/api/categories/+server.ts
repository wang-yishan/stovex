/* POST /api/categories — create a category. */

import { json } from '@sveltejs/kit';
import { getCatalog, saveCategory } from '#lib/server/catalog/repository.ts';
import { slugify, uid } from '#lib/admin/data.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as {
		name?: string;
		slug?: string;
		description?: string;
	} | null;

	const name = (body?.name ?? '').trim();
	if (!name) return json({ errors: { name: 'Name required' } }, { status: 400 });

	const slug = (body?.slug ?? '').trim() || slugify(name);
	const catalog = await getCatalog();
	if (catalog.categories.some((c) => c.slug === slug)) {
		return json({ errors: { slug: 'Slug must be unique' } }, { status: 400 });
	}

	const category = await saveCategory({
		id: uid('cat-'),
		name,
		slug,
		description: body?.description
	});

	return json({ category }, { status: 201 });
};
