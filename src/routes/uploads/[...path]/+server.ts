/* GET /uploads/<file> — serves the files written by the upload endpoint.
   Files live outside `static/` so they are served by this route in both dev
   and production builds. */

import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { uploadDir } from '#lib/server/catalog/upload.ts';
import type { RequestHandler } from './$types';

const CONTENT_TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.avif': 'image/avif',
	'.svg': 'image/svg+xml'
};

export const GET: RequestHandler = async ({ params }) => {
	const relative = params.path ?? '';
	const root = uploadDir();
	const target = path.resolve(root, relative);

	// Never escape the upload folder.
	if (!target.startsWith(root + path.sep)) {
		throw error(404, 'Not found');
	}

	let bytes: Buffer;
	try {
		bytes = await readFile(target);
	} catch {
		throw error(404, 'Not found');
	}

	const type = CONTENT_TYPES[path.extname(target).toLowerCase()] ?? 'application/octet-stream';

	return new Response(new Uint8Array(bytes), {
		headers: {
			'content-type': type,
			'content-length': String(bytes.byteLength),
			'cache-control': 'public, max-age=31536000, immutable'
		}
	});
};
