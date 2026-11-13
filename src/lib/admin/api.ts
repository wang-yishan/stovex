/* Thin fetch wrappers around the catalog API. The dashboard never talks to
   SQLite directly — it goes through these endpoints, which validate and
   persist the change. */

import type {
	AdjustStockInput,
	Category,
	Collection,
	Product,
	ProductStatus,
	StockMovement
} from './types.ts';

interface ErrorPayload {
	errors?: Record<string, string>;
	message?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: init?.body ? { 'content-type': 'application/json' } : undefined
	});
	const payload = (await res.json().catch(() => null)) as (ErrorPayload & T) | null;

	if (!res.ok) {
		const fields = payload?.errors ? Object.values(payload.errors) : [];
		const message =
			fields.length > 0
				? fields.join(' • ')
				: (payload?.message ?? `Request failed (${res.status})`);
		throw new Error(message);
	}

	return payload as T;
}

export const productApi = {
	save: (product: Product) =>
		request<{ product: Product }>('/api/products', {
			method: 'POST',
			body: JSON.stringify(product)
		}),
	remove: (id: string) => request<{ ok: true }>(`/api/products/${id}`, { method: 'DELETE' }),
	duplicate: (id: string) =>
		request<{ product: Product }>(`/api/products/${id}/duplicate`, { method: 'POST' }),
	setStatus: (ids: string[], status: ProductStatus) =>
		request<{ updated: string[] }>('/api/products/status', {
			method: 'POST',
			body: JSON.stringify({ ids, status })
		}),
	adjustStock: (id: string, input: AdjustStockInput) =>
		request<{ movement: StockMovement }>(`/api/products/${id}/stock`, {
			method: 'POST',
			body: JSON.stringify(input)
		})
};

export const categoryApi = {
	create: (category: Omit<Category, 'id'>) =>
		request<{ category: Category }>('/api/categories', {
			method: 'POST',
			body: JSON.stringify(category)
		}),
	update: (category: Category) =>
		request<{ category: Category }>(`/api/categories/${category.id}`, {
			method: 'PUT',
			body: JSON.stringify(category)
		}),
	remove: (id: string, reassignTo?: string) =>
		request<{ ok: true }>(
			`/api/categories/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ''}`,
			{ method: 'DELETE' }
		)
};

export const collectionApi = {
	create: (collection: Omit<Collection, 'id' | 'order'>) =>
		request<{ collection: Collection }>('/api/collections', {
			method: 'POST',
			body: JSON.stringify(collection)
		}),
	update: (collection: Collection) =>
		request<{ collection: Collection }>(`/api/collections/${collection.id}`, {
			method: 'PUT',
			body: JSON.stringify(collection)
		}),
	remove: (id: string) => request<{ ok: true }>(`/api/collections/${id}`, { method: 'DELETE' }),
	move: (id: string, dir: 1 | -1) =>
		request<{ ok: true }>(`/api/collections/${id}/move`, {
			method: 'POST',
			body: JSON.stringify({ dir })
		})
};

/** Upload image files to disk; returns the stored URLs. */
export async function uploadImages(files: File[]): Promise<{ url: string; name: string }[]> {
	if (files.length === 0) return [];
	const form = new FormData();
	for (const file of files) form.append('files', file);

	const res = await fetch('/api/uploads', { method: 'POST', body: form });
	const payload = (await res.json().catch(() => null)) as {
		uploads?: { url: string; name: string }[];
		message?: string;
	} | null;

	if (!res.ok || !payload?.uploads) {
		throw new Error(payload?.message ?? 'Upload failed');
	}
	return payload.uploads;
}
