<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { ROUTE_BY_NAV_ID, navIdFromPath } from '#lib/admin/navSections.ts';
	import { LayoutDashboard, Menu, Package, ShoppingCart } from '@lucide/svelte';

	const TABS = [
		{ id: 'overview', label: 'Overview', icon: LayoutDashboard },
		{ id: 'products', label: 'Products', icon: Package },
		{ id: 'orders', label: 'Orders', icon: ShoppingCart },
		{ id: 'more', label: 'More', icon: Menu }
	] as const;

	type TabId = (typeof TABS)[number]['id'];

	const MAIN_IDS: string[] = ['overview', 'products', 'orders'];

	let activeId = $derived(navIdFromPath(page.url.pathname));

	/** Ref: More flag = sheet open OR current view outside the three main tabs. */
	let moreActive = $derived(admin.moreSheetOpen || !MAIN_IDS.includes(activeId));
	/** Ref: amber five-dot shows whenever the current view is outside the main tabs. */
	let amberDot = $derived(!MAIN_IDS.includes(activeId));

	const tabActive = (id: TabId): boolean => {
		if (id === 'more') return moreActive;
		if (id === 'products') return activeId.startsWith('products');
		return activeId === id;
	};

	const tap = (id: TabId): void => {
		if (id === 'more') {
			admin.toggleMoreSheet();
			return;
		}
		admin.toggleMoreSheet(false);
		goto(resolve(ROUTE_BY_NAV_ID[id] as Path));
	};
</script>

<!--
	@component
	Mobile bottom tab bar — Overview / Products / Orders / More (converted from ref fixed bar).
-->

<div
	class="md:hidden fixed left-0 right-0 bottom-0 z-40 bg-white border-t flex"
	style="border-color: var(--border); padding-bottom: var(--safe-area-inset-bottom); height: calc(64px + var(--safe-area-inset-bottom));"
>
	{#each TABS as tab (tab.id)}
		{@const isActive = tabActive(tab.id)}
		<button
			type="button"
			class="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors {isActive
				? 'text-[#242424]'
				: 'text-[#999]'}"
			onclick={() => tap(tab.id)}
		>
			{#if isActive}
				<div
					class="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-[#242424] rounded-full"
				></div>
			{/if}
			<div
				class="h-6 w-6 rounded-[8px] flex items-center justify-center {isActive ? 'bg-[#F0F0EF]' : ''}"
			>
				<tab.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.6} />
			</div>
			<span
				class="text-[10px] font-medium tracking-wide {isActive ? 'text-[#242424]' : 'text-[#777]'}"
			>
				{tab.label}
			</span>
			{#if tab.id === 'more' && amberDot}
				<span
					class="absolute top-2 right-[32%] h-1.5 w-1.5 rounded-full bg-[#D69A35]"
				></span>
			{/if}
		</button>
	{/each}
</div>
