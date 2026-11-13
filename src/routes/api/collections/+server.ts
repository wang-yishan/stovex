/* POST /api/collections — create a collection. */

import { json } from '@sveltejs/kit';
import { getCatalog, saveCollection } from '#lib/server/catalog/repository.ts';
import { slugify, uid } from '#lib/admin/data.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as {
		name?: string;
		slug?: string;
		description?: string;
		coverImage?: string;
		productIds?: string[];
	} | null;

	const name = (body?.name ?? '').trim();
	if (!name) return json({ errors: { name: 'Name required' } }, { status: 400 });

	const slug = (body?.slug ?? '').trim() || slugify(name);
	const catalog = await getCatalog();
	if (catalog.collections.some((c) => c.slug === slug)) {
		return json({ errors: { slug: 'Slug must be unique' } }, { status: 400 });
	}

	const collection = await saveCollection({
		id: uid('col-'),
		name,
		slug,
		description: body?.description,
		coverImage: body?.coverImage,
		productIds: body?.productIds ?? [],
		order: catalog.collections.length
	});

	return json({ collection }, { status: 201 });
};
