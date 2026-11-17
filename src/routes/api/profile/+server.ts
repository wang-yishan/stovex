/* PUT /api/profile — update the signed-in user's own profile fields
   (name, nickname, phone, address, photo).

   The email is intentionally not updatable here: Better Auth requires a
   verification flow for email changes, which is out of scope for this
   simple self-service profile screen. */

import { error, json } from '@sveltejs/kit';
import { auth } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, event, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = (await request.json().catch(() => null)) as {
		nickname?: string | null;
		name?: string | null;
		phone?: string | null;
		address?: string | null;
		image?: string | null;
	} | null;

	const name = (body?.name ?? '').trim();
	if (!name) {
		return json({ errors: { name: 'Name is required.' } }, { status: 400 });
	}

	try {
		await auth.api.updateUser({
			headers: event.request.headers,
			body: {
				name,
				nickname: body?.nickname?.trim() ?? '',
				phone: body?.phone?.trim() ?? '',
				address: body?.address?.trim() ?? '',
				image: body?.image?.trim() ?? ''
			}
		});
	} catch (cause) {
		return json(
			{ message: cause instanceof Error ? cause.message : 'Failed to update the profile.' },
			{ status: 400 }
		);
	}

	return json({ status: true });
};
