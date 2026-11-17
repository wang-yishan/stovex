import * as XLSX from 'xlsx';
import { emptyProduct, slugify, uid } from '#lib/admin/data.ts';
import type { Product } from '#lib/admin/types.ts';

/** Column definition for the import template and documentation. */
export const IMPORT_COLUMNS: { key: string; label: string; required: boolean; note: string }[] = [
	{ key: 'name', label: 'name', required: true, note: 'Product name (required).' },
	{
		key: 'slug',
		label: 'slug',
		required: false,
		note: 'URL slug. Auto-generated from name if left empty.'
	},
	{ key: 'basePrice', label: 'basePrice', required: true, note: 'Regular price in IDR (> 0).' },
	{
		key: 'compareAtPrice',
		label: 'compareAtPrice',
		required: false,
		note: 'Original/compare-at price in IDR; must be greater than basePrice when set.'
	},
	{ key: 'sku', label: 'sku', required: false, note: 'SKU / product code. Must be unique.' },
	{ key: 'stock', label: 'stock', required: false, note: 'Stock quantity (number).' },
	{
		key: 'lowStockThreshold',
		label: 'lowStockThreshold',
		required: false,
		note: 'Low-stock warning threshold (number).'
	},
	{
		key: 'category',
		label: 'category',
		required: false,
		note: 'Category id or name. Can be adjusted on the review slide.'
	},
	{ key: 'shortDescription', label: 'shortDescription', required: false, note: 'Short summary.' },
	{
		key: 'fullDescription',
		label: 'fullDescription',
		required: false,
		note: 'Full product description.'
	},
	{ key: 'material', label: 'material', required: false, note: 'Material / bahan.' },
	{
		key: 'featured',
		label: 'featured',
		required: false,
		note: 'Featured flag: true/false, yes/no, 1/0.'
	},
	{
		key: 'trackInventory',
		label: 'trackInventory',
		required: false,
		note: 'Track inventory: true/false, yes/no, 1/0 (defaults to true).'
	},
	{ key: 'seoTitle', label: 'seoTitle', required: false, note: 'SEO title.' },
	{ key: 'seoDescription', label: 'seoDescription', required: false, note: 'SEO description.' }
];

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
	// Prefer the "Products" sheet (template layout) when present.
	const preferred = workbook.SheetNames.find((n) => n.toLowerCase() === 'products');
	const sheetName = preferred ?? workbook.SheetNames[0];
	if (!sheetName) return [rowToProduct({}, 0)];
	const sheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
	if (rows.length === 0) return [rowToProduct({}, 0)];
	return rows.map((r, i) => rowToProduct(r, i));
}

/** Download a ready-to-fill XLSX template (3 example rows + column guide). */
export function downloadXlsxTemplate(): void {
	const headers = IMPORT_COLUMNS.map((c) => c.label);
	const exampleRows = [
		{
			name: 'Everyday Canvas Tote',
			slug: 'everyday-canvas-tote',
			basePrice: 890000,
			compareAtPrice: 1150000,
			sku: 'ECT-BGE-M',
			stock: 18,
			lowStockThreshold: 5,
			category: 'Tote',
			shortDescription: 'Lightweight canvas tote for daily essentials.',
			fullDescription: 'Organic canvas tote with reinforced handles and an interior pocket.',
			material: 'Organic cotton canvas',
			featured: 'yes',
			trackInventory: 'yes',
			seoTitle: 'Everyday Canvas Tote',
			seoDescription: 'Shop the Everyday Canvas Tote in organic cotton.'
		},
		{
			name: 'Mini Shoulder Bag Cream',
			slug: 'mini-shoulder-bag-cream',
			basePrice: 1240000,
			compareAtPrice: '',
			sku: 'MSB-CRM-OS',
			stock: 3,
			lowStockThreshold: 5,
			category: 'Shoulder',
			shortDescription: 'Compact shoulder bag with a chain strap.',
			fullDescription: 'Cream textured mini shoulder bag with interior card slots.',
			material: 'Textured leather',
			featured: 'no',
			trackInventory: 'yes',
			seoTitle: '',
			seoDescription: ''
		},
		{
			name: 'Crossbody Classic Black',
			slug: '',
			basePrice: 950000,
			compareAtPrice: 1100000,
			sku: 'CCB-BLK-S',
			stock: 0,
			lowStockThreshold: 3,
			category: 'Crossbody',
			shortDescription: 'Classic black crossbody for everyday use.',
			fullDescription: 'Pebbled leather crossbody with adjustable strap and zip closure.',
			material: 'Pebbled leather',
			featured: 'no',
			trackInventory: 'yes',
			seoTitle: '',
			seoDescription: ''
		}
	];

	const productSheet = XLSX.utils.json_to_sheet(
		exampleRows.map((row) => {
			const record: Record<string, unknown> = {};
			for (const h of headers) record[h] = (row as Record<string, unknown>)[h] ?? '';
			return record;
		}),
		{ header: headers }
	);

	const guideSheet = XLSX.utils.aoa_to_sheet([
		['Column', 'Required', 'Notes'],
		...IMPORT_COLUMNS.map((c) => [c.key, c.required ? 'Required' : 'Optional', c.note]),
		[],
		['How to use'],
		['1. Fill the "Products" sheet. Keep the header row unchanged.'],
		['2. Each row becomes one product. Replace or add rows as needed (3 examples provided).'],
		['3. Images are not imported — upload them later via Edit after saving.'],
		['4. Imported products are saved as drafts. Variants are configured per product in Edit.'],
		['5. Upload the completed file on the XLSX tab to review and save.']
	]);

	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, productSheet, 'Products');
	XLSX.utils.book_append_sheet(workbook, guideSheet, 'Info');
	XLSX.writeFile(workbook, 'product-import-template.xlsx');
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
