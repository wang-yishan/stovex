/* Bag Store Admin — seed data + pure helpers (transcribed verbatim from ref/index.html). */

import type {
	ActivityRow,
	AttributeDraft,
	Category,
	Collection,
	MediaItem,
	OrderRow,
	PageSection,
	Product,
	ProductVariant,
	SectionType,
	StockLevel,
	StockMovement,
	StorePage,
	StoreSettings,
	PageVersion,
	VariantAttribute,
	Shipment,
	ShipmentStatus
} from './types';

export const SEED_CATEGORIES: Category[] = [
	{ id: 'cat-tote', name: 'Tote', slug: 'tote', description: 'Everyday carryall totes' },
	{ id: 'cat-shoulder', name: 'Shoulder', slug: 'shoulder', description: 'Shoulder silhouettes' },
	{
		id: 'cat-crossbody',
		name: 'Crossbody',
		slug: 'crossbody',
		description: 'Hands-free crossbody'
	},
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
		material: 'Organic cotton canvas',
		categoryId: 'cat-tote',
		collectionIds: ['col-best', 'col-new'],
		images: [
			{
				id: 'img1a',
				url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Tote beige depan'
			},
			{
				id: 'img1b',
				url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Tote beige samping'
			},
			{
				id: 'img1c',
				url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Detail strap tas'
			}
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
		material: 'Cream textured leather',
		categoryId: 'cat-shoulder',
		collectionIds: ['col-new'],
		images: [
			{
				id: 'img2a',
				url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Shoulder bag cream'
			},
			{
				id: 'img2b',
				url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Tali rantai detail'
			},
			{
				id: 'img2c',
				url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Warna cream'
			}
		],
		basePrice: 1240000,
		sku: 'MSB-CRM-OS',
		status: 'active',
		featured: true,
		seoTitle: 'Mini Shoulder Bag Cream',
		seoDescription: 'Cream mini shoulder',
		createdAt: '2024-11-12T08:00:00Z',
		updatedAt: '2024-11-18T09:00:00Z',
		hasVariants: true,
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 5,
		variants: [
			{
				id: 'var-2a',
				productId: 'prod-2',
				name: 'Cream / One Size',
				attributes: [
					{ name: 'Color', value: 'Cream' },
					{ name: 'Size', value: 'One Size' }
				],
				sku: 'MSB-CRM-OS',
				stock: 3,
				available: true,
				lowThreshold: 5
			}
		]
	},
	{
		id: 'prod-3',
		name: 'Crossbody Classic Black',
		slug: 'crossbody-classic-black',
		shortDescription: 'Classic black crossbody, everyday use.',
		fullDescription: 'Black pebbled leather, adjustable strap, zip closure.',
		material: 'Black pebbled leather',
		categoryId: 'cat-crossbody',
		collectionIds: ['col-best'],
		images: [
			{
				id: 'img3a',
				url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Crossbody black depan'
			},
			{
				id: 'img3b',
				url: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Crossbody black detail'
			},
			{
				id: 'img3c',
				url: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Tas hitam'
			}
		],
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
		material: 'Natural beige canvas',
		categoryId: 'cat-tote',
		collectionIds: [],
		images: [
			{
				id: 'img4a',
				url: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Shopper kanvas beige'
			},
			{
				id: 'img4b',
				url: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Shopper sisi'
			},
			{
				id: 'img4c',
				url: 'https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Detail kanvas'
			}
		],
		basePrice: 650000,
		sku: 'CSB-BGE-L',
		status: 'active',
		featured: false,
		seoTitle: 'Canvas Shopper Beige',
		seoDescription: 'Beige canvas shopper',
		createdAt: '2024-11-08T08:00:00Z',
		updatedAt: '2024-11-16T10:00:00Z',
		hasVariants: true,
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 8,
		variants: [
			{
				id: 'var-4a',
				productId: 'prod-4',
				name: 'Beige / L',
				attributes: [
					{ name: 'Color', value: 'Beige' },
					{ name: 'Size', value: 'L' }
				],
				sku: 'CSB-BGE-L',
				stock: 42,
				available: true,
				lowThreshold: 8
			}
		]
	},
	{
		id: 'prod-5',
		name: 'Leather Clutch Noir',
		slug: 'leather-clutch-noir',
		shortDescription: 'Slim leather clutch for evenings.',
		fullDescription: 'Noir lambskin clutch, slim profile, magnetic closure.',
		material: 'Noir lambskin',
		categoryId: 'cat-clutch',
		collectionIds: ['col-best'],
		images: [
			{
				id: 'img5a',
				url: 'https://images.unsplash.com/photo-1624687943971-e86af76d57de?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Clutch noir depan'
			},
			{
				id: 'img5b',
				url: 'https://images.unsplash.com/photo-1637759292654-a12cb2be085e?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Clutch noir detail'
			},
			{
				id: 'img5c',
				url: 'https://images.unsplash.com/photo-1603219527847-24c87f552a77?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Kulit clutch'
			}
		],
		basePrice: 1500000,
		compareAtPrice: 1800000,
		sku: 'LCN-BLK-OS',
		status: 'active',
		featured: true,
		seoTitle: 'Leather Clutch Noir',
		seoDescription: 'Leather clutch noir',
		createdAt: '2024-11-07T08:00:00Z',
		updatedAt: '2024-11-15T12:00:00Z',
		hasVariants: true,
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 3,
		variants: [
			{
				id: 'var-5a',
				productId: 'prod-5',
				name: 'Noir / One Size',
				attributes: [
					{ name: 'Color', value: 'Noir' },
					{ name: 'Size', value: 'One Size' }
				],
				sku: 'LCN-BLK-OS',
				stock: 12,
				available: true,
				lowThreshold: 3
			}
		]
	},
	{
		id: 'prod-6',
		name: 'Woven Bucket Bag Tan',
		slug: 'woven-bucket-bag-tan',
		shortDescription: 'Handwoven bucket with drawstring.',
		fullDescription: 'Tan rattan woven bucket, cotton lining, drawstring closure.',
		material: 'Tan rattan with cotton lining',
		categoryId: 'cat-bucket',
		collectionIds: ['col-new'],
		images: [
			{
				id: 'img6a',
				url: 'https://images.unsplash.com/photo-1681747685985-a401c271156c?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Bucket bag tan anyaman'
			},
			{
				id: 'img6b',
				url: 'https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Bucket bag detail'
			},
			{
				id: 'img6c',
				url: 'https://images.unsplash.com/photo-1560891958-68bb1fe7fb78?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Anyaman rotan'
			}
		],
		basePrice: 1100000,
		sku: 'WBB-TAN-L',
		status: 'active',
		featured: false,
		seoTitle: 'Woven Bucket Bag Tan',
		seoDescription: 'Woven bucket tan',
		createdAt: '2024-11-06T08:00:00Z',
		updatedAt: '2024-11-14T16:00:00Z',
		hasVariants: true,
		trackInventory: true,
		stock: 0,
		lowStockThreshold: 5,
		variants: [
			{
				id: 'var-6a',
				productId: 'prod-6',
				name: 'Tan / L',
				attributes: [
					{ name: 'Color', value: 'Tan' },
					{ name: 'Size', value: 'L' }
				],
				sku: 'WBB-TAN-L',
				stock: 6,
				available: true,
				lowThreshold: 5
			}
		]
	},
	{
		id: 'prod-7',
		name: 'Sling Bag Minimal Gray',
		slug: 'sling-bag-minimal-gray',
		shortDescription: 'Minimal sling, gray nylon.',
		fullDescription: 'Gray nylon sling, water resistant, minimal branding.',
		material: 'Gray nylon',
		categoryId: 'cat-crossbody',
		collectionIds: [],
		images: [
			{
				id: 'img7a',
				url: 'https://images.unsplash.com/photo-1711548244653-72219aa9ac27?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Sling abu-abu'
			},
			{
				id: 'img7b',
				url: 'https://images.unsplash.com/photo-1705909237050-7a7625b47fac?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Sling detail'
			},
			{
				id: 'img7c',
				url: 'https://images.unsplash.com/photo-1657603738389-951c374b740c?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Nylon sling'
			}
		],
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
		material: 'Cream leather',
		categoryId: 'cat-shoulder',
		collectionIds: ['col-best'],
		images: [
			{
				id: 'img8a',
				url: 'https://images.unsplash.com/photo-1746880223690-359948154c53?auto=format&fit=crop&w=1200&q=85',
				isPrimary: true,
				alt: 'Satchel cream depan'
			},
			{
				id: 'img8b',
				url: 'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Satchel cream samping'
			},
			{
				id: 'img8c',
				url: 'https://images.unsplash.com/photo-1613482184972-f9c1022d0928?auto=format&fit=crop&w=1200&q=85',
				isPrimary: false,
				alt: 'Handles satchel'
			}
		],
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

/* --------------------------- notifications --------------------------- */

export const SEED_NOTIFICATIONS: import('./types.ts').AppNotification[] = [
	{
		id: 'notif-1',
		kind: 'order',
		title: 'New checkout inquiry',
		message: 'Order #1023 from Sarah W. is awaiting confirmation.',
		href: '/dashboard/shipping',
		read: false,
		createdAt: '2024-11-18T10:19:00Z'
	},
	{
		id: 'notif-2',
		kind: 'shipping',
		title: 'Shipment out for delivery',
		message: 'Order #1022 (James L.) is with the courier in Bandung.',
		href: '/dashboard/shipping/ship-2',
		read: false,
		createdAt: '2024-11-18T07:15:00Z'
	},
	{
		id: 'notif-3',
		kind: 'product',
		title: 'Low stock alert',
		message: 'Mini Shoulder Bag Cream has only 3 units left.',
		href: '/dashboard/products',
		read: false,
		createdAt: '2024-11-18T09:00:00Z'
	},
	{
		id: 'notif-4',
		kind: 'shipping',
		title: 'Delivery exception',
		message: 'Order #1020 (Alex P.) could not be delivered — address not found.',
		href: '/dashboard/shipping/ship-4',
		read: false,
		createdAt: '2024-11-18T06:50:00Z'
	},
	{
		id: 'notif-5',
		kind: 'order',
		title: 'Order confirmed',
		message: 'Order #1019 has been confirmed and is ready to pack.',
		href: '/dashboard/shipping',
		read: true,
		createdAt: '2024-11-18T08:00:00Z'
	},
	{
		id: 'notif-6',
		kind: 'system',
		title: 'Product published',
		message: 'Mini Shoulder is now live in the storefront.',
		href: '/dashboard/products',
		read: true,
		createdAt: '2024-11-18T05:00:00Z'
	},
	{
		id: 'notif-7',
		kind: 'shipping',
		title: 'Shipment delivered',
		message: 'Order #1017 (Clara D.) was delivered in Semarang.',
		href: '/dashboard/shipping/ship-7',
		read: true,
		createdAt: '2024-11-17T13:45:00Z'
	},
	{
		id: 'notif-8',
		kind: 'order',
		title: 'New checkout inquiry',
		message: 'Order #1016 from Dimas A. is pending packing.',
		href: '/dashboard/shipping',
		read: false,
		createdAt: '2024-11-18T09:55:00Z'
	},
	{
		id: 'notif-9',
		kind: 'product',
		title: 'Stock adjusted',
		message: 'Everyday Canvas Tote (Beige / M) restocked by 10 units.',
		href: '/dashboard/products',
		read: true,
		createdAt: '2024-11-18T10:35:00Z'
	},
	{
		id: 'notif-10',
		kind: 'system',
		title: 'Weekly summary ready',
		message: 'Store activity summary for this week is available to review.',
		href: '/dashboard',
		read: false,
		createdAt: '2024-11-18T06:00:00Z'
	},
	{
		id: 'notif-11',
		kind: 'shipping',
		title: 'Shipment in transit',
		message: 'Order #1023 (Sarah W.) has departed the sorting facility.',
		href: '/dashboard/shipping/ship-1',
		read: false,
		createdAt: '2024-11-18T11:10:00Z'
	},
	{
		id: 'notif-12',
		kind: 'product',
		title: 'Product archived',
		message: 'Structured Satchel Cream was moved to archived.',
		href: '/dashboard/products',
		read: true,
		createdAt: '2024-11-17T09:20:00Z'
	},
	{
		id: 'notif-13',
		kind: 'order',
		title: 'Payment reminder',
		message: 'Order #1020 is awaiting updated delivery details from the customer.',
		href: '/dashboard/shipping',
		read: false,
		createdAt: '2024-11-18T04:30:00Z'
	},
	{
		id: 'notif-14',
		kind: 'shipping',
		title: 'Return received',
		message: 'Order #1018 (Budi S.) was returned to the warehouse.',
		href: '/dashboard/shipping/ship-6',
		read: true,
		createdAt: '2024-11-17T17:00:00Z'
	},
	{
		id: 'notif-15',
		kind: 'system',
		title: 'Settings updated',
		message: 'Store contact and WhatsApp template changes were saved.',
		href: '/dashboard/settings',
		read: true,
		createdAt: '2024-11-17T08:10:00Z'
	},
	{
		id: 'notif-16',
		kind: 'product',
		title: 'Low stock alert',
		message: 'Crossbody Classic Black (Black / M) is running low with 2 units left.',
		href: '/dashboard/products',
		read: false,
		createdAt: '2024-11-17T15:10:00Z'
	},
	{
		id: 'notif-17',
		kind: 'order',
		title: 'Order packed',
		message: 'Order #1021 (Mina K.) has been packed and is ready for handoff.',
		href: '/dashboard/shipping',
		read: true,
		createdAt: '2024-11-16T11:00:00Z'
	},
	{
		id: 'notif-18',
		kind: 'shipping',
		title: 'Shipment created',
		message: 'A new shipment was created for Order #1016 (Dimas A.).',
		href: '/dashboard/shipping/ship-8',
		read: false,
		createdAt: '2024-11-18T09:52:00Z'
	},
	{
		id: 'notif-19',
		kind: 'product',
		title: 'New product draft',
		message: 'Sling Bag Minimal Gray is saved as a draft and not yet published.',
		href: '/dashboard/products',
		read: true,
		createdAt: '2024-11-16T14:40:00Z'
	},
	{
		id: 'notif-20',
		kind: 'system',
		title: 'Maintenance window',
		message: 'Scheduled maintenance is planned tonight at 11:00 PM.',
		href: '/dashboard',
		read: false,
		createdAt: '2024-11-18T03:00:00Z'
	}
];

/* ------------------------------ shipping ------------------------------ */

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
	'pending',
	'packed',
	'shipped',
	'in_transit',
	'out_for_delivery',
	'delivered',
	'exception',
	'returned'
];

export type ShipmentTone = 'neutral' | 'accent' | 'warning' | 'success' | 'danger';

export const SHIPMENT_STATUS_META: Record<
	ShipmentStatus,
	{ label: string; eventLabel: string; tone: ShipmentTone }
> = {
	pending: { label: 'Pending', eventLabel: 'Order received', tone: 'neutral' },
	packed: { label: 'Packed', eventLabel: 'Package packed', tone: 'neutral' },
	shipped: { label: 'Shipped', eventLabel: 'Handed to courier', tone: 'accent' },
	in_transit: { label: 'In Transit', eventLabel: 'In transit', tone: 'accent' },
	out_for_delivery: {
		label: 'Out for Delivery',
		eventLabel: 'Out for delivery',
		tone: 'warning'
	},
	delivered: { label: 'Delivered', eventLabel: 'Delivered to recipient', tone: 'success' },
	exception: { label: 'Exception', eventLabel: 'Delivery exception', tone: 'danger' },
	returned: { label: 'Returned', eventLabel: 'Returned to sender', tone: 'danger' }
};

/** Happy-path order used to suggest the next status. */
export const SHIPMENT_FLOW: ShipmentStatus[] = [
	'pending',
	'packed',
	'shipped',
	'in_transit',
	'out_for_delivery',
	'delivered'
];

export function nextShipmentStatus(status: ShipmentStatus): ShipmentStatus | null {
	const i = SHIPMENT_FLOW.indexOf(status);
	return i < 0 || i === SHIPMENT_FLOW.length - 1 ? null : SHIPMENT_FLOW[i + 1]!;
}

export const COURIERS = [
	'JNE',
	'J&T Express',
	'SiCepat',
	'AnterAja',
	'POS Indonesia',
	'GoSend',
	'GrabExpress'
];

export const COURIER_SERVICES: Record<string, string[]> = {
	JNE: ['REG', 'YES', 'OKE', 'JTR'],
	'J&T Express': ['REG', 'Express', 'Same Day'],
	SiCepat: ['BEST', 'REG', 'Cargo'],
	AnterAja: ['REG', 'Same Day', 'Next Day'],
	'POS Indonesia': ['Paket Kilat', 'Express', 'Biasa'],
	GoSend: ['Same Day', 'Instant', 'Cargo'],
	GrabExpress: ['Same Day', 'Instant', 'Cargo']
};

export const SEED_SHIPMENTS: Shipment[] = [
	{
		id: 'ship-1',
		orderId: '#1023',
		customerName: 'Sarah Wulandari',
		customerPhone: '0812-3456-7890',
		destination: 'Jakarta Selatan, DKI Jakarta',
		address: 'Jl. Bango III No. 4, Pondok Indah',
		courier: 'JNE',
		service: 'REG',
		trackingNumber: 'JNE-88412301',
		status: 'in_transit',
		items: [
			{ id: 'itm-1a', name: 'Everyday Canvas Tote — Beige / M', qty: 1 },
			{ id: 'itm-1b', name: 'Mini Shoulder Bag Cream', qty: 1 }
		],
		weightKg: 1.2,
		shippingCost: 28000,
		orderTotal: 3720000,
		createdAt: '2024-11-16T09:12:00Z',
		updatedAt: '2024-11-18T08:40:00Z',
		deliveredAt: null,
		events: [
			{
				id: 'evt-1a',
				shipmentId: 'ship-1',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-16T09:12:00Z'
			},
			{
				id: 'evt-1b',
				shipmentId: 'ship-1',
				status: 'packed',
				label: 'Package packed',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T10:05:00Z'
			},
			{
				id: 'evt-1c',
				shipmentId: 'ship-1',
				status: 'shipped',
				label: 'Handed to JNE',
				location: 'Jakarta Pusat',
				createdAt: '2024-11-17T16:20:00Z'
			},
			{
				id: 'evt-1d',
				shipmentId: 'ship-1',
				status: 'in_transit',
				label: 'Arrived at sorting center',
				location: 'Jakarta Selatan',
				createdAt: '2024-11-18T08:40:00Z'
			}
		]
	},
	{
		id: 'ship-2',
		orderId: '#1022',
		customerName: 'James Limanto',
		customerPhone: '0813-9988-1122',
		destination: 'Bandung, Jawa Barat',
		address: 'Jl. Setiabudi No. 88, Cihampelas',
		courier: 'J&T Express',
		service: 'Express',
		trackingNumber: 'JT-99283741',
		status: 'out_for_delivery',
		items: [{ id: 'itm-2a', name: 'Woven Bucket Bag Tan', qty: 1 }],
		weightKg: 0.8,
		shippingCost: 22000,
		orderTotal: 1680000,
		createdAt: '2024-11-17T09:14:00Z',
		updatedAt: '2024-11-18T07:15:00Z',
		deliveredAt: null,
		events: [
			{
				id: 'evt-2a',
				shipmentId: 'ship-2',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T09:14:00Z'
			},
			{
				id: 'evt-2b',
				shipmentId: 'ship-2',
				status: 'packed',
				label: 'Package packed',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T13:40:00Z'
			},
			{
				id: 'evt-2c',
				shipmentId: 'ship-2',
				status: 'shipped',
				label: 'Handed to J&T Express',
				location: 'Bandung',
				createdAt: '2024-11-17T18:05:00Z'
			},
			{
				id: 'evt-2d',
				shipmentId: 'ship-2',
				status: 'out_for_delivery',
				label: 'With courier — arrive today',
				location: 'Bandung',
				createdAt: '2024-11-18T07:15:00Z'
			}
		]
	},
	{
		id: 'ship-3',
		orderId: '#1021',
		customerName: 'Mina Kusuma',
		customerPhone: '0857-1122-3344',
		destination: 'Surabaya, Jawa Timur',
		address: 'Jl. Raya Darmo No. 12',
		courier: 'SiCepat',
		service: 'BEST',
		trackingNumber: 'SCP-55667788',
		status: 'delivered',
		items: [
			{ id: 'itm-3a', name: 'Leather Clutch Noir', qty: 1 },
			{ id: 'itm-3b', name: 'Structured Satchel Cream', qty: 1 }
		],
		weightKg: 1.5,
		shippingCost: 30000,
		orderTotal: 1335000,
		createdAt: '2024-11-15T14:42:00Z',
		updatedAt: '2024-11-17T11:30:00Z',
		deliveredAt: '2024-11-17T11:30:00Z',
		events: [
			{
				id: 'evt-3a',
				shipmentId: 'ship-3',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-15T14:42:00Z'
			},
			{
				id: 'evt-3b',
				shipmentId: 'ship-3',
				status: 'shipped',
				label: 'Handed to SiCepat',
				location: 'Surabaya',
				createdAt: '2024-11-16T09:00:00Z'
			},
			{
				id: 'evt-3c',
				shipmentId: 'ship-3',
				status: 'in_transit',
				label: 'In transit',
				location: 'Surabaya',
				createdAt: '2024-11-16T20:10:00Z'
			},
			{
				id: 'evt-3d',
				shipmentId: 'ship-3',
				status: 'delivered',
				label: 'Delivered to recipient',
				location: 'Surabaya',
				createdAt: '2024-11-17T11:30:00Z'
			}
		]
	},
	{
		id: 'ship-4',
		orderId: '#1020',
		customerName: 'Alex Pratama',
		customerPhone: '0811-5566-7788',
		destination: 'Yogyakarta',
		address: 'Jl. Magelang KM 5, Sleman',
		courier: 'AnterAja',
		service: 'REG',
		trackingNumber: 'ANT-33445566',
		status: 'exception',
		items: [{ id: 'itm-4a', name: 'Canvas Shopper Beige', qty: 2 }],
		weightKg: 1.8,
		shippingCost: 25000,
		orderTotal: 4800000,
		createdAt: '2024-11-16T13:05:00Z',
		updatedAt: '2024-11-18T06:50:00Z',
		deliveredAt: null,
		events: [
			{
				id: 'evt-4a',
				shipmentId: 'ship-4',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-16T13:05:00Z'
			},
			{
				id: 'evt-4b',
				shipmentId: 'ship-4',
				status: 'shipped',
				label: 'Handed to AnterAja',
				location: 'Yogyakarta',
				createdAt: '2024-11-17T08:30:00Z'
			},
			{
				id: 'evt-4c',
				shipmentId: 'ship-4',
				status: 'exception',
				label: 'Recipient address not found',
				location: 'Sleman',
				note: 'Courier will retry once more tomorrow',
				createdAt: '2024-11-18T06:50:00Z'
			}
		]
	},
	{
		id: 'ship-5',
		orderId: '#1019',
		customerName: 'Rani Puspita',
		customerPhone: '0878-2233-4455',
		destination: 'Denpasar, Bali',
		address: 'Jl. Sunset Road No. 99, Kuta',
		courier: 'JNE',
		service: 'OKE',
		trackingNumber: 'JNE-77120945',
		status: 'in_transit',
		items: [{ id: 'itm-5a', name: 'Crossbody Classic Black — Black / S', qty: 1 }],
		weightKg: 1.0,
		shippingCost: 35000,
		orderTotal: 2450000,
		createdAt: '2024-11-17T10:20:00Z',
		updatedAt: '2024-11-18T05:30:00Z',
		deliveredAt: null,
		events: [
			{
				id: 'evt-5a',
				shipmentId: 'ship-5',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T10:20:00Z'
			},
			{
				id: 'evt-5b',
				shipmentId: 'ship-5',
				status: 'packed',
				label: 'Package packed',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T15:00:00Z'
			},
			{
				id: 'evt-5c',
				shipmentId: 'ship-5',
				status: 'shipped',
				label: 'Handed to JNE',
				location: 'Denpasar',
				createdAt: '2024-11-18T01:10:00Z'
			},
			{
				id: 'evt-5d',
				shipmentId: 'ship-5',
				status: 'in_transit',
				label: 'Departed transit hub',
				location: 'Denpasar',
				createdAt: '2024-11-18T05:30:00Z'
			}
		]
	},
	{
		id: 'ship-6',
		orderId: '#1018',
		customerName: 'Budi Santoso',
		customerPhone: '0812-7788-9900',
		destination: 'Medan, Sumatera Utara',
		address: 'Jl. Gatot Subroto No. 21',
		courier: 'POS Indonesia',
		service: 'Paket Kilat',
		trackingNumber: 'POS-20918374',
		status: 'returned',
		items: [{ id: 'itm-6a', name: 'Sling Bag Minimal Gray', qty: 1 }],
		weightKg: 0.7,
		shippingCost: 40000,
		orderTotal: 1890000,
		createdAt: '2024-11-14T11:00:00Z',
		updatedAt: '2024-11-17T16:45:00Z',
		deliveredAt: null,
		events: [
			{
				id: 'evt-6a',
				shipmentId: 'ship-6',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-14T11:00:00Z'
			},
			{
				id: 'evt-6b',
				shipmentId: 'ship-6',
				status: 'shipped',
				label: 'Handed to POS Indonesia',
				location: 'Medan',
				createdAt: '2024-11-15T09:20:00Z'
			},
			{
				id: 'evt-6c',
				shipmentId: 'ship-6',
				status: 'exception',
				label: 'Recipient refused the package',
				location: 'Medan',
				createdAt: '2024-11-16T14:00:00Z'
			},
			{
				id: 'evt-6d',
				shipmentId: 'ship-6',
				status: 'returned',
				label: 'Returned to sender',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T16:45:00Z'
			}
		]
	},
	{
		id: 'ship-7',
		orderId: '#1017',
		customerName: 'Clara Dewi',
		customerPhone: '0856-3344-5566',
		destination: 'Semarang, Jawa Tengah',
		address: 'Jl. Pandanaran No. 5, Candi',
		courier: 'GoSend',
		service: 'Same Day',
		trackingNumber: 'GS-66778899',
		status: 'delivered',
		items: [{ id: 'itm-7a', name: 'Mini Shoulder Bag Cream', qty: 1 }],
		weightKg: 0.9,
		shippingCost: 20000,
		orderTotal: 1240000,
		createdAt: '2024-11-17T08:05:00Z',
		updatedAt: '2024-11-17T13:40:00Z',
		deliveredAt: '2024-11-17T13:40:00Z',
		events: [
			{
				id: 'evt-7a',
				shipmentId: 'ship-7',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T08:05:00Z'
			},
			{
				id: 'evt-7b',
				shipmentId: 'ship-7',
				status: 'packed',
				label: 'Package packed',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-17T09:30:00Z'
			},
			{
				id: 'evt-7c',
				shipmentId: 'ship-7',
				status: 'shipped',
				label: 'Handed to GoSend',
				location: 'Semarang',
				createdAt: '2024-11-17T10:15:00Z'
			},
			{
				id: 'evt-7d',
				shipmentId: 'ship-7',
				status: 'delivered',
				label: 'Delivered to recipient',
				location: 'Semarang',
				createdAt: '2024-11-17T13:40:00Z'
			}
		]
	},
	{
		id: 'ship-8',
		orderId: '#1016',
		customerName: 'Dimas Anggara',
		customerPhone: '0813-4455-6677',
		destination: 'Makassar, Sulawesi Selatan',
		address: 'Jl. A.P. Pettarani No. 18, Panakkukang',
		courier: 'GrabExpress',
		service: 'Same Day',
		trackingNumber: 'GX-11223344',
		status: 'pending',
		items: [
			{ id: 'itm-8a', name: 'Everyday Canvas Tote — Black / M', qty: 1 },
			{ id: 'itm-8b', name: 'Leather Clutch Noir', qty: 1 }
		],
		weightKg: 1.4,
		shippingCost: 45000,
		orderTotal: 2150000,
		createdAt: '2024-11-18T09:50:00Z',
		updatedAt: '2024-11-18T09:50:00Z',
		deliveredAt: null,
		events: [
			{
				id: 'evt-8a',
				shipmentId: 'ship-8',
				status: 'pending',
				label: 'Order received',
				location: 'BAG STORE Warehouse',
				createdAt: '2024-11-18T09:50:00Z'
			}
		]
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

/* --- Pages & Landing Pages seeds (transcribed from ref: Ne / Yy / w2 / S2) --- */

export const SECTION_TYPES: { type: SectionType; label: string; desc: string }[] = [
	{ type: 'hero', label: 'Hero', desc: 'Image, headline, description, CTA' },
	{ type: 'featured-products', label: 'Featured Products', desc: 'Manual Active products' },
	{ type: 'categories', label: 'Categories', desc: 'Selected category tiles' },
	{ type: 'promo-banner', label: 'Promo Banner', desc: 'Image, heading, CTA' },
	{ type: 'collection-grid', label: 'Collection Grid', desc: 'Manual products, limit, variation' },
	{ type: 'rich-text', label: 'Rich Text', desc: 'Heading, text, image, align' },
	{ type: 'cta', label: 'CTA', desc: 'Heading, text, WhatsApp label' },
	{ type: 'benefits', label: 'Benefits', desc: 'Icon, title, description items' },
	{ type: 'gallery', label: 'Gallery', desc: 'Images, order, layout' },
	{ type: 'testimonials', label: 'Testimonials', desc: 'Name, text, image, rating' }
];

const SECTION_DEFAULTS: Record<string, Record<string, unknown>> = {
	hero: {
		image: '',
		headline: 'Bags for everyday, made to last',
		description: 'Minimal silhouettes in honest materials.',
		ctaLabel: 'Shop the collection',
		ctaHref: '#shop',
		align: 'left'
	},
	'featured-products': {
		heading: 'Featured bags',
		limit: 4,
		orderMode: 'manual',
		productIds: ['prod-1', 'prod-2', 'prod-5']
	},
	categories: {
		heading: 'Shop by category',
		categoryIds: ['cat-tote', 'cat-shoulder', 'cat-crossbody']
	},
	'promo-banner': {
		image: '',
		heading: 'The Summer Edit — up to 20% off',
		ctaLabel: 'Explore the edit',
		ctaHref: '#shop'
	},
	'collection-grid': {
		heading: 'New arrivals',
		limit: 6,
		variation: 'grid',
		productIds: ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6']
	},
	'rich-text': {
		heading: 'Made slowly, carried daily',
		text: 'We design bags that stay useful long after the season changes. Fewer pieces, better materials, honest construction.',
		image: '',
		align: 'left'
	},
	cta: {
		heading: 'Not sure which bag fits you?',
		text: 'Tell us what you carry every day and we will suggest the right size.',
		label: 'Chat on WhatsApp',
		useWhatsApp: true
	},
	benefits: {
		heading: 'Why Bag Store',
		items: [
			{
				icon: 'Shield',
				title: 'Quality checked',
				description: 'Every bag is inspected before it ships.'
			},
			{
				icon: 'Truck',
				title: 'Fast delivery',
				description: 'Carefully packed and shipped in 1–2 days.'
			},
			{
				icon: 'Refresh',
				title: 'Easy enquiries',
				description: 'Ask on WhatsApp before you decide.'
			}
		]
	},
	gallery: { heading: 'In the wild', layout: 'grid', images: ['', '', ''] },
	testimonials: {
		heading: 'Loved by everyday carriers',
		items: [
			{ name: 'Ayu', text: 'The tote fits my laptop and still looks neat.', image: '', rating: 5 },
			{ name: 'Raka', text: 'Simple, sturdy, and easy to carry all day.', image: '', rating: 5 }
		]
	}
};

export function newSection(type: SectionType, order: number): PageSection {
	const def = SECTION_TYPES.find((s) => s.type === type);
	return {
		id: uid('sec-'),
		type,
		label: def?.label ?? type,
		order,
		visible: true,
		layout: type === 'gallery' ? 'grid' : 'standard',
		content: structuredClone(SECTION_DEFAULTS[type] ?? {})
	};
}

export function seedSection(
	type: SectionType,
	order: number,
	overrides?: Record<string, unknown>
): PageSection {
	const s = newSection(type, order);
	s.content = { ...s.content, ...(overrides ?? {}) };
	return s;
}

export const SEED_MEDIA: MediaItem[] = [
	{
		id: 'med-1',
		name: 'hero-tote.jpg',
		url: '',
		type: 'image/jpeg',
		size: 184000,
		createdAt: '2024-11-10T08:00:00Z',
		alt: 'Hero tote'
	},
	{
		id: 'med-2',
		name: 'summer-edit.jpg',
		url: '',
		type: 'image/jpeg',
		size: 212000,
		createdAt: '2024-11-12T08:00:00Z',
		alt: 'Summer edit'
	},
	{
		id: 'med-3',
		name: 'atelier.jpg',
		url: '',
		type: 'image/jpeg',
		size: 156000,
		createdAt: '2024-11-13T08:00:00Z',
		alt: 'Atelier'
	},
	{
		id: 'med-4',
		name: 'gallery-look.jpg',
		url: '',
		type: 'image/jpeg',
		size: 98000,
		createdAt: '2024-11-14T08:00:00Z',
		alt: 'Gallery look'
	}
];

export const SEED_SETTINGS: StoreSettings = {
	logo: 'BAG STORE',
	whatsappNumber: '6281234567890',
	whatsappTemplate:
		'Halo, saya tertarik dengan {{productName}} {{variant}} (SKU: {{sku}}) — {{price}}. {{url}}',
	headerLinks: [
		{ id: 'hl-1', label: 'Shop', href: '#shop' },
		{ id: 'hl-2', label: 'Categories', href: '#categories' },
		{ id: 'hl-3', label: 'About', href: '#about' }
	],
	footerText: 'BAG STORE — Minimal bags, made to last. Enquiries via WhatsApp.',
	social: { instagram: '@bagstore', facebook: 'bagstore', tiktok: '@bagstore' },
	defaultSeo: {
		title: 'Bag Store — Minimal bags, made to last',
		description: 'Everyday totes, shoulder bags and crossbodies in honest materials.',
		image: ''
	}
};

export function seedPages(): StorePage[] {
	const homeSections = [
		seedSection('hero', 0, { headline: 'Carry less, carry better' }),
		seedSection('featured-products', 1),
		seedSection('categories', 2),
		seedSection('rich-text', 3),
		seedSection('cta', 4),
		seedSection('benefits', 5)
	];
	const summerSections = [
		seedSection('promo-banner', 0, { heading: 'The Summer Edit is here' }),
		seedSection('collection-grid', 1, { heading: 'Summer picks' }),
		seedSection('testimonials', 2)
	];
	return [
		{
			id: 'page-home',
			title: 'Homepage',
			slug: 'home',
			type: 'homepage',
			status: 'published',
			sections: homeSections,
			seo: {
				title: 'Bag Store — Minimal bags, made to last',
				description: 'Everyday totes, shoulder bags and crossbodies in honest materials.',
				image: '',
				canonical: '/home'
			},
			updatedAt: '2024-11-18T10:00:00Z',
			publishedAt: '2024-11-18T10:00:00Z',
			isHomepage: true
		},
		{
			id: 'page-summer',
			title: 'Summer Edit',
			slug: 'summer-edit',
			type: 'campaign',
			status: 'draft',
			sections: summerSections,
			seo: {
				title: 'Summer Edit — Bag Store',
				description: 'Light, everyday bags for the season.',
				image: '',
				canonical: '/summer-edit'
			},
			updatedAt: '2024-11-17T14:00:00Z',
			publishedAt: null,
			isHomepage: false
		}
	];
}

export function seedVersions(pages: StorePage[]): PageVersion[] {
	const home = pages.find((p) => p.id === 'page-home');
	if (!home) return [];
	return [
		{
			id: 'ver-1',
			pageId: 'page-home',
			ver: 1,
			title: home.title,
			sections: structuredClone(home.sections),
			publishedAt: home.publishedAt ?? '2024-11-18T10:00:00Z'
		}
	];
}

export function emptyPage(): StorePage {
	return {
		id: uid('page-'),
		title: '',
		slug: '',
		type: 'campaign',
		status: 'draft',
		sections: [newSection('hero', 0)],
		seo: { title: '', description: '', image: '', canonical: '' },
		updatedAt: nowISO(),
		publishedAt: null,
		isHomepage: false
	};
}

/** WhatsApp message builder (ref Jy / O2). */
export function waMessage(
	settings: StoreSettings,
	product: Product,
	variant?: ProductVariant
): string {
	const price = formatIDR(variant?.priceOverride ?? product.basePrice);
	return settings.whatsappTemplate
		.replaceAll('{{productName}}', product.name)
		.replaceAll('{{variant}}', variant ? variant.name : '')
		.replaceAll('{{sku}}', variant?.sku || product.sku || '-')
		.replaceAll('{{price}}', price)
		.replaceAll('{{url}}', `https://bagstore.example/products/${product.slug}`);
}

export function waLink(
	settings: StoreSettings,
	product: Product,
	variant?: ProductVariant
): string {
	const digits = settings.whatsappNumber.replace(/[^0-9]/g, '');
	return `https://wa.me/${digits}?text=${encodeURIComponent(waMessage(settings, product, variant))}`;
}

/** Variant-style product type guard nicety (keeps callers honest). */
export const isProductVariant = (v: unknown): v is ProductVariant =>
	typeof v === 'object' && v !== null && 'lowThreshold' in v;
