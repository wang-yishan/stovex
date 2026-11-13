/* File-save uploads — product images are written to disk, not referenced.

   The dashboard upload endpoint hands the raw bytes to `saveUpload()`, which
   writes them into the `uploads/` folder next to the project and returns the
   public URL the storefront serves them from. */

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'image/avif': '.avif',
	'image/svg+xml': '.svg'
};

/** Folder that holds the uploaded files. `UPLOAD_DIR` overrides the default. */
export function uploadDir(): string {
	return path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));
}

/** Public URL prefix the upload route is mounted under. */
export const UPLOAD_URL_PREFIX = '/uploads';

export interface SavedUpload {
	url: string;
	name: string;
	size: number;
	type: string;
}

/** Strip anything path-like from a user supplied filename. */
function safeBaseName(name: string): string {
	const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '-');
	return base.replace(/^-+/, '').slice(0, 80) || 'upload';
}

/**
 * Write an uploaded file to disk and return its public URL.
 * Throws when the type is not an image or the file is too large.
 */
export async function saveUpload(file: File): Promise<SavedUpload> {
	const type = (file.type || '').toLowerCase();
	const extension = ALLOWED_TYPES[type];
	if (!extension) {
		throw new Error(`Unsupported file type: ${type || 'unknown'}`);
	}
	if (file.size > MAX_UPLOAD_BYTES) {
		throw new Error('File is larger than 5MB');
	}

	const base = safeBaseName(file.name);
	const ext = path.extname(base).toLowerCase() || extension;
	const stem = base.slice(0, base.length - path.extname(base).length) || 'image';
	const name = `${Date.now()}-${randomUUID().slice(0, 8)}-${stem}${ext}`;

	const dir = uploadDir();
	await mkdir(dir, { recursive: true });
	const bytes = Buffer.from(await file.arrayBuffer());
	await writeFile(path.join(dir, name), bytes);

	return {
		url: `${UPLOAD_URL_PREFIX}/${name}`,
		name,
		size: file.size,
		type
	};
}
