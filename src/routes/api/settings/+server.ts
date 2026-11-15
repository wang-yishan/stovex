/* Store settings over HTTP.
   GET  /api/settings — the saved brand + contact settings
   PUT  /api/settings — merge a patch into the saved settings            */

import { json } from '@sveltejs/kit';
import { getSettings, parseSettingsPatch, saveSettings } from '#lib/server/catalog/settings.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const settings = await getSettings();
	return json({ settings });
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const current = await getSettings();
	const { patch, errors } = parseSettingsPatch(body, current);

	if (Object.keys(errors).length > 0) {
		return json({ errors }, { status: 400 });
	}

	try {
		const settings = await saveSettings(patch);
		return json({ settings });
	} catch (cause) {
		// Most likely the `store_setting` table has not been created yet.
		console.error('[api/settings] save failed:', cause);
		return json(
			{
				message:
					'Could not save the settings — the store_setting table is missing. Run `bun run db:push`.'
			},
			{ status: 503 }
		);
	}
};
