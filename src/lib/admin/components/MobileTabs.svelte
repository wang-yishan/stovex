<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { ROUTE_BY_NAV_ID, navIdFromPath } from '#lib/admin/navSections.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
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
		goto(resolvePath(ROUTE_BY_NAV_ID[id]));
	};
</script>

<!--
	@component
	Mobile bottom tab bar — Overview / Products / Orders / More (converted from ref fixed bar).
-->

<div
	class="fixed right-0 bottom-0 left-0 z-40 flex border-t bg-white md:hidden"
	style="border-color: var(--border); padding-bottom: var(--safe-area-inset-bottom); height: calc(68px + var(--safe-area-inset-bottom));"
>
	{#each TABS as tab (tab.id)}
		{@const isActive = tabActive(tab.id)}
		<Button
			variant="ghost"
			size="default"
			class="h-auto min-h-[60px] flex-1 flex-col gap-1 rounded-none py-1.5 {isActive
				? 'text-foreground'
				: 'text-muted-foreground'}"
			onclick={() => tap(tab.id)}
		>
			{#if isActive}
				<div
					class="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-foreground"
				></div>
			{/if}
			<div
				class="flex h-9 w-9 items-center justify-center rounded-[10px] {isActive
					? 'bg-accent'
					: ''}"
			>
				<tab.icon class="h-5 w-5" strokeWidth={isActive ? 2 : 1.6} />
			</div>
			<span
				class="text-[11px] font-medium tracking-wide {isActive
					? 'text-foreground'
					: 'text-muted-foreground'}"
			>
				{tab.label}
			</span>
			{#if tab.id === 'more' && amberDot}
				<span class="absolute top-2 right-[32%] h-1.5 w-1.5 rounded-full bg-warning"></span>
			{/if}
		</Button>
	{/each}
</div>
