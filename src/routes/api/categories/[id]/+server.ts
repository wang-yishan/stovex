/* Single category routes.
   PUT    /api/categories/[id] — update
   DELETE /api/categories/[id] — delete (optionally reassigning products)  */

import { error, json } from '@sveltejs/kit';
import { deleteCategory, getCatalog, saveCategory } from '#lib/server/catalog/repository.ts';
import { slugify } from '#lib/admin/data.ts';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as {
		name?: string;
		slug?: string;
		description?: string;
	} | null;

	const catalog = await getCatalog();
	const existing = catalog.categories.find((c) => c.id === params.id);
	if (!existing) throw error(404, 'Category not found');

	const name = (body?.name ?? existing.name).trim();
	if (!name) return json({ errors: { name: 'Name required' } }, { status: 400 });

	const slug = (body?.slug ?? '').trim() || existing.slug || slugify(name);
	if (catalog.categories.some((c) => c.id !== params.id && c.slug === slug)) {
		return json({ errors: { slug: 'Slug must be unique' } }, { status: 400 });
	}

	const category = await saveCategory({
		id: params.id,
		name,
		slug,
		description: body?.description ?? existing.description
	});

	return json({ category });
};

export const DELETE: RequestHandler = async ({ params, url }) => {
	const catalog = await getCatalog();
	if (!catalog.categories.some((c) => c.id === params.id)) {
		throw error(404, 'Category not found');
	}
	const reassignTo = url.searchParams.get('reassignTo') ?? undefined;
	await deleteCategory(params.id, reassignTo);
	return json({ ok: true });
};
