/* Bag Store Admin — seed data + pure helpers (transcribed verbatim from ref/index.html). */

import type {
	ActivityRow,
	AttributeDraft,
	Category,
	Collection,
	OrderRow,
	Product,
	ProductVariant,
	StockLevel,
	StockMovement,
	VariantAttribute
} from './types';

export const SEED_CATEGORIES: Category[] = [
	{ id: 'cat-tote', name: 'Tote', slug: 'tote', description: 'Everyday carryall totes' },
	{ id: 'cat-shoulder', name: 'Shoulder', slug: 'shoulder', description: 'Shoulder silhouettes' },
	{ id: 'cat-crossbody', name: 'Crossbody', slug: 'crossbody', description: 'Hands-free crossbody' },
	{ id: 'cat-clutch', name: 'Clutch', slug: 'clutch', description: 'Evening clutches' },
	{ id: 'cat-bucket', name: 'Bucket', slug: 'bucket', description: 'Relaxed bucket bags' }
];

export const SEED_COLLECTIONS: Collection[] = [
	{
		id: 'col-new',
		name: 'New Arrivals',
		slug: 'new-arrivals',
		description: 'Latest drops',
		productIds: ['prod-1', 'prod-2', 'prod-6'],
		order: 0
	},
	{
		id: 'col-best',
		name: 'Best Sellers',
		slug: 'best-sellers',
		description: 'Most loved',
		productIds: ['prod-1', 'prod-3', 'prod-5', 'prod-8'],
		order: 1
	}
];

/* Ref: prod-1b/var-3b omit `available` (defaults falsy there); seeds set it true for
   stocked variants so the typed model matches obvious intent. */
export const SEED_PRODUCTS: Product[] = [
	{
		id: 'prod-1',
		name: 'Everyday Canvas Tote',
		slug: 'everyday-canvas-tote',
		shortDescription: 'Lightweight canvas tote for daily essentials.',
		fullDescription:
			'Made from organic canvas with reinforced handles. Interior pocket and magnetic closure. Fits laptop up to 14". Designed for minimal daily carry.',
		categoryId: 'cat-tote',
		collectionIds: ['col-best', 'col-new'],
		images: [
			{ id: 'img1', url: '', isPrimary: true, alt: 'Tote beige' },
			{ id: 'img1b', url: '', isPrimary: false }
		],
		basePrice: 890000,
		compareAtPrice: 1150000,
		sku: 'ECT-BGE-M',
		status: 'active',
		featured: true,
		seoTitle: 'Everyday Canvas Tote - Organic Cotton',
		seoDescription: 'Shop everyday canvas tote, organic cotton, minimal design.',
		createdAt: '2024-11-10T08:00:00Z',
		updatedAt: '2024-11-18T10:00:00Z',
		hasVariants: true,
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 5,
		variants: [
			{
				id: 'var-1a',
				productId: 'prod-1',
				name: 'Beige / M',
				attributes: [
					{ name: 'Color', value: 'Beige' },
					{ name: 'Size', value: 'M' }
				],
				sku: 'ECT-BGE-M',
				stock: 18,
				available: true,
				lowThreshold: 5
			},
			{
				id: 'var-1b',
				productId: 'prod-1',
				name: 'Beige / L',
				attributes: [
					{ name: 'Color', value: 'Beige' },
					{ name: 'Size', value: 'L' }
				],
				sku: 'ECT-BGE-L',
				stock: 6,
				available: true,
				lowThreshold: 5
			},
			{
				id: 'var-1c',
				productId: 'prod-1',
				name: 'Black / M',
				attributes: [
					{ name: 'Color', value: 'Black' },
					{ name: 'Size', value: 'M' }
				],
				sku: 'ECT-BLK-M',
				stock: 0,
				available: false,
				lowThreshold: 5
			}
		]
	},
	{
		id: 'prod-2',
		name: 'Mini Shoulder Bag Cream',
		slug: 'mini-shoulder-bag-cream',
		shortDescription: 'Compact shoulder bag with chain strap.',
		fullDescription: 'Cream textured leather mini shoulder, chain strap, interior card slots.',
		categoryId: 'cat-shoulder',
		collectionIds: ['col-new'],
		images: [{ id: 'img2', url: '', isPrimary: true }],
		basePrice: 1240000,
		sku: 'MSB-CRM-OS',
		status: 'active',
		featured: true,
		seoTitle: 'Mini Shoulder Bag Cream',
		seoDescription: 'Cream mini shoulder',
		createdAt: '2024-11-12T08:00:00Z',
		updatedAt: '2024-11-18T09:00:00Z',
		hasVariants: false,
		trackInventory: true,
		stock: 3,
		lowStockThreshold: 5,
		variants: []
	},
	{
		id: 'prod-3',
		name: 'Crossbody Classic Black',
		slug: 'crossbody-classic-black',
		shortDescription: 'Classic black crossbody, everyday use.',
		fullDescription: 'Black pebbled leather, adjustable strap, zip closure.',
		categoryId: 'cat-crossbody',
		collectionIds: ['col-best'],
		images: [{ id: 'img3', url: '', isPrimary: true }],
		basePrice: 950000,
		compareAtPrice: 1100000,
		sku: 'CCB-BLK-S',
		status: 'active',
		featured: false,
		seoTitle: 'Crossbody Classic Black',
		seoDescription: 'Classic black crossbody',
		createdAt: '2024-11-09T08:00:00Z',
		updatedAt: '2024-11-17T14:00:00Z',
		hasVariants: true,
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 3,
		variants: [
			{
				id: 'var-3a',
				productId: 'prod-3',
				name: 'Black / S',
				attributes: [
					{ name: 'Color', value: 'Black' },
					{ name: 'Size', value: 'S' }
				],
				sku: 'CCB-BLK-S',
				stock: 0,
				available: false,
				lowThreshold: 3
			},
			{
				id: 'var-3b',
				productId: 'prod-3',
				name: 'Black / M',
				attributes: [
					{ name: 'Color', value: 'Black' },
					{ name: 'Size', value: 'M' }
				],
				sku: 'CCB-BLK-M',
				stock: 2,
				available: true,
				lowThreshold: 3
			}
		]
	},
	{
		id: 'prod-4',
		name: 'Canvas Shopper Beige',
		slug: 'canvas-shopper-beige',
		shortDescription: 'Oversized shopper in natural beige.',
		fullDescription: 'Oversized canvas shopper, natural beige, open top.',
		categoryId: 'cat-tote',
		collectionIds: [],
		images: [{ id: 'img4', url: '', isPrimary: true }],
		basePrice: 650000,
		sku: 'CSB-BGE-L',
		status: 'active',
		featured: false,
		seoTitle: 'Canvas Shopper Beige',
		seoDescription: 'Beige canvas shopper',
		createdAt: '2024-11-08T08:00:00Z',
		updatedAt: '2024-11-16T10:00:00Z',
		hasVariants: false,
		trackInventory: true,
		stock: 42,
		lowStockThreshold: 8,
		variants: []
	},
	{
		id: 'prod-5',
		name: 'Leather Clutch Noir',
		slug: 'leather-clutch-noir',
		shortDescription: 'Slim leather clutch for evenings.',
		fullDescription: 'Noir lambskin clutch, slim profile, magnetic closure.',
		categoryId: 'cat-clutch',
		collectionIds: ['col-best'],
		images: [{ id: 'img5', url: '', isPrimary: true }],
		basePrice: 1500000,
		compareAtPrice: 1800000,
		sku: 'LCN-BLK-OS',
		status: 'active',
		featured: true,
		seoTitle: 'Leather Clutch Noir',
		seoDescription: 'Leather clutch noir',
		createdAt: '2024-11-07T08:00:00Z',
		updatedAt: '2024-11-15T12:00:00Z',
		hasVariants: false,
		trackInventory: true,
		stock: 12,
		lowStockThreshold: 3,
		variants: []
	},
	{
		id: 'prod-6',
		name: 'Woven Bucket Bag Tan',
		slug: 'woven-bucket-bag-tan',
		shortDescription: 'Handwoven bucket with drawstring.',
		fullDescription: 'Tan rattan woven bucket, cotton lining, drawstring closure.',
		categoryId: 'cat-bucket',
		collectionIds: ['col-new'],
		images: [{ id: 'img6', url: '', isPrimary: true }],
		basePrice: 1100000,
		sku: 'WBB-TAN-L',
		status: 'active',
		featured: false,
		seoTitle: 'Woven Bucket Bag Tan',
		seoDescription: 'Woven bucket tan',
		createdAt: '2024-11-06T08:00:00Z',
		updatedAt: '2024-11-14T16:00:00Z',
		hasVariants: false,
		trackInventory: true,
		stock: 6,
		lowStockThreshold: 5,
		variants: []
	},
	{
		id: 'prod-7',
		name: 'Sling Bag Minimal Gray',
		slug: 'sling-bag-minimal-gray',
		shortDescription: 'Minimal sling, gray nylon.',
		fullDescription: 'Gray nylon sling, water resistant, minimal branding.',
		categoryId: 'cat-crossbody',
		collectionIds: [],
		images: [{ id: 'img7', url: '', isPrimary: true }],
		basePrice: 780000,
		sku: 'SBM-GRY-S',
		status: 'draft',
		featured: false,
		seoTitle: 'Sling Bag Minimal Gray',
		seoDescription: 'Gray sling bag',
		createdAt: '2024-11-05T08:00:00Z',
		updatedAt: '2024-11-13T10:00:00Z',
		hasVariants: false,
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 5,
		variants: []
	},
	{
		id: 'prod-8',
		name: 'Structured Satchel Cream',
		slug: 'structured-satchel-cream',
		shortDescription: 'Structured satchel with top handles.',
		fullDescription: 'Cream structured satchel, top handles and detachable strap.',
		categoryId: 'cat-shoulder',
		collectionIds: ['col-best'],
		images: [{ id: 'img8', url: '', isPrimary: true }],
		basePrice: 1350000,
		sku: 'SSC-CRM-M',
		status: 'archived',
		featured: false,
		seoTitle: 'Structured Satchel Cream',
		seoDescription: 'Cream satchel',
		createdAt: '2024-11-04T08:00:00Z',
		updatedAt: '2024-11-12T09:00:00Z',
		hasVariants: false,
		trackInventory: false,
		stock: 19,
		lowStockThreshold: 5,
		variants: []
	}
];

export const SEED_MOVEMENTS: StockMovement[] = [
	{
		id: 'mov-1',
		productId: 'prod-1',
		productName: 'Everyday Canvas Tote',
		variantName: 'Beige / M',
		sku: 'ECT-BGE-M',
		type: 'restock',
		quantityChange: 10,
		previousStock: 8,
		newStock: 18,
		reason: 'Restock',
		createdAt: '2024-11-18T10:30:00Z'
	},
	{
		id: 'mov-2',
		productId: 'prod-2',
		productName: 'Mini Shoulder Bag Cream',
		sku: 'MSB-CRM-OS',
		type: 'sale',
		quantityChange: -1,
		previousStock: 4,
		newStock: 3,
		reason: 'Correction',
		createdAt: '2024-11-18T09:00:00Z'
	},
	{
		id: 'mov-3',
		productId: 'prod-3',
		variantId: 'var-3a',
		productName: 'Crossbody Classic Black',
		variantName: 'Black / S',
		sku: 'CCB-BLK-S',
		type: 'damaged',
		quantityChange: -2,
		previousStock: 2,
		newStock: 0,
		reason: 'Damaged',
		createdAt: '2024-11-17T15:00:00Z'
	}
];

/* Static Overview-only dataset (orders module not implemented per ref). */
export const SEED_ORDERS: OrderRow[] = [
	{
		id: '#1023',
		customer: 'Sarah W.',
		date: 'Nov 18, 10:21 AM',
		total: 'Rp 3.720.000',
		status: 'Awaiting confirmation',
		statusTone: 'amber'
	},
	{
		id: '#1022',
		customer: 'James L.',
		date: 'Nov 18, 09:14 AM',
		total: 'Rp 1.680.000',
		status: 'New inquiry',
		statusTone: 'neutral'
	},
	{
		id: '#1021',
		customer: 'Mina K.',
		date: 'Nov 17, 04:42 PM',
		total: 'Rp 1.335.000',
		status: 'Awaiting confirmation',
		statusTone: 'amber'
	},
	{
		id: '#1020',
		customer: 'Alex P.',
		date: 'Nov 17, 01:05 PM',
		total: 'Rp 4.800.000',
		status: 'New inquiry',
		statusTone: 'neutral'
	}
];

export const SEED_ACTIVITY: ActivityRow[] = [
	{ time: '2m ago', title: 'New checkout inquiry', entity: '#1023', dot: 'bg-[#D69A35]' },
	{ time: '18m ago', title: 'Order confirmed', entity: '#1019', dot: 'bg-[#269B65]' },
	{ time: '1h ago', title: 'Stock adjustment', entity: 'Tote Bag / Beige', dot: 'bg-[#777777]' },
	{ time: '3h ago', title: 'Product published', entity: 'Mini Shoulder', dot: 'bg-[#242424]' },
	{ time: '5h ago', title: 'Landing page published', entity: 'Summer Edit', dot: 'bg-[#242424]' },
	{ time: '7h ago', title: 'Order cancelled', entity: '#1018', dot: 'bg-[#D9534F]' }
];

/* ----------------------- pure helpers ----------------------- */

export function slugify(s: string): string {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
}

export function formatIDR(n: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(n);
}

export function nowISO(): string {
	return new Date().toISOString();
}

export function uid(prefix = ''): string {
	return prefix + Math.random().toString(36).slice(2, 9);
}

/** Effective stock: product-level when tracking off, else sum of variant stock. */
export function effectiveStock(p: Product): number {
	if (!p.trackInventory) return p.stock;
	if (p.hasVariants) return p.variants.reduce((n, v) => n + v.stock, 0);
	return p.stock;
}

export function lowThreshold(p: Product): number {
	return p.lowStockThreshold || 5;
}

export function stockStatus(stock: number, threshold: number, tracking: boolean): StockLevel {
	if (!tracking) return 'in-stock';
	if (stock <= 0) return 'out';
	if (stock <= threshold) return 'low';
	return 'in-stock';
}

/** Cartesian product of attribute drafts → variant names ("Value / Value") + attributes. */
export function generateCombinations(
	attrs: AttributeDraft[]
): { name: string; attributes: VariantAttribute[] }[] {
	if (attrs.length === 0) return [];
	const out: { name: string; attributes: VariantAttribute[] }[] = [];
	const walk = (i: number, acc: VariantAttribute[]): void => {
		if (i === attrs.length) {
			out.push({ name: acc.map((a) => a.value).join(' / '), attributes: [...acc] });
			return;
		}
		for (const value of attrs[i]!.values) {
			acc.push({ name: attrs[i]!.name, value: value });
			walk(i + 1, acc);
			acc.pop();
		}
	};
	walk(0, []);
	return out;
}

/** Empty product factory for create mode (same defaults as ref form). */
export function emptyProduct(): Product {
	return {
		id: uid('prod-'),
		name: '',
		slug: '',
		shortDescription: '',
		fullDescription: '',
		categoryId: '',
		collectionIds: [],
		images: [],
		basePrice: 0,
		compareAtPrice: undefined,
		sku: '',
		status: 'draft',
		featured: false,
		seoTitle: '',
		seoDescription: '',
		createdAt: nowISO(),
		updatedAt: nowISO(),
		hasVariants: false,
		variants: [],
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 5
	};
}

/** Variant-style product type guard nicety (keeps callers honest). */
export const isProductVariant = (v: unknown): v is ProductVariant =>
	typeof v === 'object' && v !== null && 'lowThreshold' in v;
