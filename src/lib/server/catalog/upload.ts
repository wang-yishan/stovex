/* Vercel Blob uploads — product/brand/profile images are stored in Vercel Blob
   (not on the local filesystem) so they persist on serverless deployments.

   The dashboard upload endpoint hands the file to `saveUpload()`, which uploads
   it to Vercel Blob and returns its public URL. */

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { put } from '@vercel/blob';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'image/avif': '.avif',
	'image/svg+xml': '.svg'
};

/**
 * Legacy local upload folder (used only to serve pre-existing /uploads files
 * that were saved to disk before the move to Vercel Blob). `UPLOAD_DIR`
 * overrides the default.
 */
export function uploadDir(): string {
	return path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));
}

/** Public URL prefix for legacy locally-served uploads. */
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
 * Upload an image file to Vercel Blob and return its public URL.
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
	const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${stem}${ext}`;
	const pathname = `uploads/${filename}`;

	const storeId = process.env.WYSHANZZZ_STORE_ID;
	const blob = await put(pathname, file, {
		access: 'public',
		...(storeId ? { storeId } : {})
	});

	return {
		url: blob.url,
		name: path.basename(blob.pathname),
		size: file.size,
		type
	};
}
