/* Single collection routes.
   PUT    /api/collections/[id] — update
   DELETE /api/collections/[id] — delete                                  */

import { error, json } from '@sveltejs/kit';
import { deleteCollection, getCatalog, saveCollection } from '#lib/server/catalog/repository.ts';
import { slugify } from '#lib/admin/data.ts';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as {
		name?: string;
		slug?: string;
		description?: string;
		coverImage?: string;
		productIds?: string[];
	} | null;

	const catalog = await getCatalog();
	const existing = catalog.collections.find((c) => c.id === params.id);
	if (!existing) throw error(404, 'Collection not found');

	const name = (body?.name ?? existing.name).trim();
	if (!name) return json({ errors: { name: 'Name required' } }, { status: 400 });

	const slug = (body?.slug ?? '').trim() || existing.slug || slugify(name);
	if (catalog.collections.some((c) => c.id !== params.id && c.slug === slug)) {
		return json({ errors: { slug: 'Slug must be unique' } }, { status: 400 });
	}

	const collection = await saveCollection({
		id: params.id,
		name,
		slug,
		description: body?.description ?? existing.description,
		coverImage: body?.coverImage ?? existing.coverImage,
		productIds: body?.productIds ?? existing.productIds,
		order: existing.order
	});

	return json({ collection });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const catalog = await getCatalog();
	if (!catalog.collections.some((c) => c.id === params.id)) {
		throw error(404, 'Collection not found');
	}
	await deleteCollection(params.id);
	return json({ ok: true });
};
