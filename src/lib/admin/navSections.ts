/**
 * @fileoverview Dashboard sidebar navigation model (sections, labels, Lucide icons).
 *
 * `navIdFromPath()` maps the current dashboard URL to the active nav id. Product
 * detail/edit/new routes resolve to the `products` id so the sidebar keeps the
 * Products item highlighted.
 */
import type { Component } from 'svelte';
import {
	Images,
	Layers,
	LayoutDashboard,
	Menu,
	Package,
	PanelsTopLeft,
	Palette,
	PlugZap,
	Settings,
	Shapes,
	ShieldCheck,
	ShoppingCart,
	Truck,
	Users,
	Warehouse,
	Megaphone
} from '@lucide/svelte';

export type NavId =
	| 'overview'
	| 'products'
	| 'categories'
	| 'collections'
	| 'inventory'
	| 'orders'
	| 'shipping'
	| 'customers'
	| 'pages'
	| 'media'
	| 'promotions'
	| 'navigation'
	| 'brand'
	| 'integrations'
	| 'users-perms';

export interface NavItem {
	id: NavId;
	label: string;
	icon: Component;
}

export interface NavSection {
	label: string;
	items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
	{ label: 'GENERAL', items: [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }] },
	{
		label: 'CATALOG',
		items: [
			{ id: 'products', label: 'Products', icon: Package },
			{ id: 'categories', label: 'Categories', icon: Shapes },
			{ id: 'collections', label: 'Collections', icon: Layers },
			{ id: 'inventory', label: 'Inventory', icon: Warehouse }
		]
	},
	{
		label: 'SALES',
		items: [
			{ id: 'orders', label: 'Orders', icon: ShoppingCart },
			{ id: 'shipping', label: 'Shipping', icon: Truck },
			{ id: 'customers', label: 'Customers', icon: Users }
		]
	},
	{
		label: 'CONTENT',
		items: [
			{ id: 'pages', label: 'Pages & Landing Pages', icon: PanelsTopLeft },
			{ id: 'media', label: 'Media Library', icon: Images },
			{ id: 'promotions', label: 'Promotions', icon: Megaphone },
			{ id: 'navigation', label: 'Navigation', icon: Menu }
		]
	},
	{
		label: 'SYSTEM',
		items: [
			{ id: 'brand', label: 'Brand & Store Settings', icon: Palette },
			{ id: 'integrations', label: 'Integrations', icon: PlugZap },
			{ id: 'users-perms', label: 'Users & Permissions', icon: ShieldCheck }
		]
	}
];

export const ROUTE_BY_NAV_ID: Record<NavId, string> = {
	overview: '/dashboard',
	products: '/dashboard/products',
	categories: '/dashboard/categories',
	collections: '/dashboard/collections',
	inventory: '/dashboard/inventory',
	orders: '/dashboard/orders',
	shipping: '/dashboard/shipping',
	customers: '/dashboard/customers',
	pages: '/dashboard/pages',
	media: '/dashboard/media',
	promotions: '/dashboard/promotions',
	navigation: '/dashboard/navigation',
	brand: '/dashboard/brand',
	integrations: '/dashboard/integrations',
	'users-perms': '/dashboard/users-perms'
};

const KNOWN_SLUGS: Record<string, NavId> = {
	products: 'products',
	categories: 'categories',
	collections: 'collections',
	inventory: 'inventory',
	orders: 'orders',
	shipping: 'shipping',
	customers: 'customers',
	pages: 'pages',
	media: 'media',
	promotions: 'promotions',
	navigation: 'navigation',
	brand: 'brand',
	integrations: 'integrations',
	'users-perms': 'users-perms'
};

/** Maps an href to a nav id; product detail/edit/new routes keep the `products` prefix
    mapping (ref: `o.startsWith('products')`). Non-dashboard paths resolve to overview. */
export function navIdFromPath(pathname: string): NavId {
	const rest = pathname.startsWith('/dashboard')
		? pathname === '/dashboard'
			? '/'
			: pathname.slice('/dashboard'.length)
		: pathname;
	if (rest === '/' || rest === '') return 'overview';
	const slug = rest.split('/').filter(Boolean)[0] ?? '';
	return KNOWN_SLUGS[slug] ?? 'overview';
}

export const DASHBOARD_ROOT = '/dashboard';
