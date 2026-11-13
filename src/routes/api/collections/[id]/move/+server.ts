/* POST /api/collections/[id]/move — swap a collection by ±1 position. */

import { error, json } from '@sveltejs/kit';
import { moveCollection } from '#lib/server/catalog/repository.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const body = (await request.json().catch(() => null)) as { dir?: number } | null;
	const dir = body?.dir === -1 ? -1 : 1;
	await moveCollection(params.id, dir);
	return json({ ok: true });
};
