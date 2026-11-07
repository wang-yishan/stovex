/* Bag Store Admin — nav model + /dashboard path mapping (converted from ref/index.html). */

import type { Component } from 'svelte';
import {
	Images,
	Layers,
	LayoutDashboard,
	Megaphone,
	Menu,
	Package,
	PanelsTopLeft,
	Settings,
	Shapes,
	ShieldCheck,
	ShoppingCart,
	Users,
	Warehouse
} from '@lucide/svelte';

export type NavId =
	| 'overview'
	| 'products'
	| 'categories'
	| 'collections'
	| 'inventory'
	| 'orders'
	| 'customers'
	| 'pages'
	| 'media'
	| 'promotions'
	| 'navigation'
	| 'store-settings'
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
			{ id: 'store-settings', label: 'Store Settings', icon: Settings },
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
	customers: '/dashboard/customers',
	pages: '/dashboard/pages',
	media: '/dashboard/media',
	promotions: '/dashboard/promotions',
	navigation: '/dashboard/navigation',
	'store-settings': '/dashboard/store-settings',
	'users-perms': '/dashboard/users-perms'
};

const KNOWN_SLUGS: Record<string, NavId> = {
	products: 'products',
	categories: 'categories',
	collections: 'collections',
	inventory: 'inventory',
	orders: 'orders',
	customers: 'customers',
	pages: 'pages',
	media: 'media',
	promotions: 'promotions',
	navigation: 'navigation',
	'store-settings': 'store-settings',
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
