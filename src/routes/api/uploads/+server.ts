/* POST /api/uploads — accepts multipart form data and writes the files to
   disk. Returns the public URLs the dashboard attaches to a product. */

import { error, json } from '@sveltejs/kit';
import { MAX_UPLOAD_BYTES, saveUpload } from '#lib/server/catalog/upload.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		throw error(400, 'Expected multipart form data');
	}

	const files = form.getAll('files').filter((entry): entry is File => entry instanceof File);
	if (files.length === 0) {
		throw error(400, 'No files uploaded');
	}

	const uploads = [];
	for (const file of files) {
		if (file.size > MAX_UPLOAD_BYTES) {
			throw error(413, `"${file.name}" is larger than 5MB`);
		}
		try {
			uploads.push(await saveUpload(file));
		} catch (cause) {
			throw error(400, cause instanceof Error ? cause.message : 'Upload failed');
		}
	}

	return json({ uploads });
};
