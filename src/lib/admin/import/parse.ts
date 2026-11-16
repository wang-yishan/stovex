import * as XLSX from 'xlsx';
import { emptyProduct, slugify, uid } from '#lib/admin/data.ts';
import type { Product } from '#lib/admin/types.ts';

/** Normalise a header/cell key for matching (case/space/punctuation-insensitive). */
function normKey(key: string): string {
	return key
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '');
}

/** Pick the first present, non-empty value from a row by trying aliases. */
function pick(row: Record<string, unknown>, aliases: string[]): unknown {
	const entries = Object.entries(row);
	for (const alias of aliases) {
		const needle = normKey(alias);
		for (const [k, v] of entries) {
			if (normKey(k) === needle && v !== undefined && v !== null && String(v).trim() !== '') {
				return v;
			}
		}
	}
	return undefined;
}

function toStr(value: unknown): string {
	if (value === undefined || value === null) return '';
	return String(value).trim();
}

function toNum(value: unknown): number {
	if (value === undefined || value === null || value === '') return 0;
	if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
	// Strip common currency formatting (Rp, dots/commas as thousand sep, spaces).
	const cleaned = String(value)
		.replace(/[^0-9,.-]/g, '')
		.replace(/\.(?=\d{3}(\D|$))/g, '')
		.replace(/,/g, '');
	const n = Number(cleaned);
	return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function toBool(value: unknown): boolean | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'boolean') return value;
	const s = String(value).trim().toLowerCase();
	if (['true', 'yes', 'y', '1'].includes(s)) return true;
	if (['false', 'no', 'n', '0'].includes(s)) return false;
	return undefined;
}

/** Map a single raw row/object into a partial Product draft. Never throws. */
export function rowToProduct(row: Record<string, unknown>, index = 0): Product {
	const base = emptyProduct();
	const name = toStr(pick(row, ['name', 'title', 'productname', 'product_name', 'nama']));
	const slugRaw = toStr(pick(row, ['slug', 'url', 'handle']));

	const basePrice = toNum(
		pick(row, ['baseprice', 'base_price', 'price', 'regularprice', 'regular_price', 'harga'])
	);
	const compare = toNum(
		pick(row, ['compareatprice', 'compare_at_price', 'compareat', 'compare_at', 'originalprice', 'harga_coret'])
	);
	const stock = toNum(pick(row, ['stock', 'stockquantity', 'stock_quantity', 'qty', 'quantity', 'stok']));
	const low = toNum(
		pick(row, ['lowstockthreshold', 'low_stock_threshold', 'lowstock', 'threshold'])
	);
	const featured = toBool(pick(row, ['featured', 'isfeatured', 'is_featured']));
	const track = toBool(pick(row, ['trackinventory', 'track_inventory', 'track']));

	// Category: accept an id or a name; if it looks like a name we keep it in
	// categoryId as-is so the merchant can fix/select it on the slide (no rejection).
	const category = toStr(pick(row, ['categoryid', 'category_id', 'category', 'kategori']));

	return {
		...base,
		// Keep a stable unique id per draft row.
		id: base.id || uid('prod-'),
		name,
		slug: slugify(slugRaw || name),
		shortDescription: toStr(pick(row, ['shortdescription', 'short_description', 'summary', 'excerpt'])),
		fullDescription: toStr(pick(row, ['fulldescription', 'full_description', 'description', 'deskripsi'])),
		material: toStr(pick(row, ['material', 'bahan'])) || undefined,
		categoryId: category,
		collectionIds: [],
		images: [],
		bannerImages: [],
		basePrice,
		compareAtPrice: compare > 0 ? compare : undefined,
		sku: toStr(pick(row, ['sku', 'code', 'productcode'])) || undefined,
		status: 'draft',
		featured: featured ?? false,
		seoTitle: toStr(pick(row, ['seotitle', 'seo_title'])) || undefined,
		seoDescription: toStr(pick(row, ['seodescription', 'seo_description'])) || undefined,
		hasVariants: false,
		trackInventory: track ?? true,
		stock,
		lowStockThreshold: low > 0 ? low : base.lowStockThreshold,
		variants: [],
		// Nudge slug uniqueness for blank-name rows so they don't all collide.
		...(name ? {} : { slug: `${base.slug || 'product'}-${index + 1}` })
	};
}

function asRows(data: unknown): Record<string, unknown>[] {
	if (Array.isArray(data)) {
		return data.map((item) =>
			item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
		);
	}
	if (data && typeof data === 'object') return [data as Record<string, unknown>];
	// Never reject: unparsable input becomes a single empty slide.
	return [{}];
}

/** Parse a .xlsx/.xls/.csv file into product drafts (client-side). */
export async function parseXlsx(file: File): Promise<Product[]> {
	const buffer = await file.arrayBuffer();
	const workbook = XLSX.read(buffer, { type: 'array' });
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) return [rowToProduct({}, 0)];
	const sheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
	if (rows.length === 0) return [rowToProduct({}, 0)];
	return rows.map((r, i) => rowToProduct(r, i));
}

/** Parse JSON text (single object or array) into product drafts. */
export function parseJson(text: string): Product[] {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		// Never reject: invalid JSON yields an empty pre-filled slide.
		return [rowToProduct({}, 0)];
	}
	const rows = asRows(data);
	return (rows.length === 0 ? [{}] : rows).map((r, i) => rowToProduct(r, i));
}
