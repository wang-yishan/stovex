<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { NAV_SECTIONS, ROUTE_BY_NAV_ID, navIdFromPath } from '#lib/admin/navSections.ts';
	import { ChevronDown, PanelLeftClose, PanelLeftOpen, ShoppingBag } from '@lucide/svelte';

	let collapsed = $derived(admin.sidebarCollapsed);
	let activeId = $derived(navIdFromPath(page.url.pathname));

	const routeHref = (id: keyof typeof ROUTE_BY_NAV_ID): string => resolve(ROUTE_BY_NAV_ID[id] as Path);
</script>

<!--
	@component
	Desktop admin sidebar — 248px ↔ 72px collapse, sticky (converted from ref aside).
-->

<aside
	class="hidden md:flex shrink-0 bg-white border-r flex-col sticky self-start"
	style="width: {collapsed ? 72 : 248}px; border-color: var(--border); top: var(--safe-area-inset-top); height: calc(100vh - var(--safe-area-inset-top)); transition: width 200ms ease;"
>
	<!-- header -->
	<div class="h-[64px] flex items-center px-3 border-b shrink-0" style="border-color: var(--border);">
		<div class="flex items-center gap-2.5 w-full">
			<div class="h-8 w-8 bg-[#111] rounded-[6px] flex items-center justify-center shrink-0">
				<ShoppingBag className="h-4 w-4 text-white" strokeWidth={1.5} />
			</div>
			{#if !collapsed}
				<div class="flex-1">
					<div class="text-[13px] font-bold tracking-[0.08em] leading-none text-[#242424]">
						BAG STORE
					</div>
					<div class="text-[10px] text-[#777] tracking-wide mt-0.5">ADMIN</div>
				</div>
				<button
					type="button"
					class="h-7 w-7 rounded-md flex items-center justify-center text-[#777] hover:bg-[#F8F8F7] hover:text-[#242424] transition"
					onclick={() => admin.toggleSidebar()}
					aria-label="Collapse sidebar"
				>
					<PanelLeftClose className="h-4 w-4" />
				</button>
			{:else}
				<button
					type="button"
					class="mx-auto h-7 w-7 rounded-md flex items-center justify-center text-[#777] hover:bg-[#F8F8F7] hover:text-[#242424] transition"
					onclick={() => admin.toggleSidebar()}
					aria-label="Expand sidebar"
				>
					<PanelLeftOpen className="h-4 w-4" />
				</button>
			{/if}
		</div>
	</div>

	<!-- nav -->
	<div class="flex-1 overflow-y-auto overflow-x-hidden py-3">
		{#each NAV_SECTIONS as section (section.label)}
			<div class="mb-5 px-2">
				{#if !collapsed}
					<div class="px-2 mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#999] uppercase">
						{section.label}
					</div>
				{:else}
					<div class="h-3"></div>
				{/if}
				<div class="space-y-0.5">
					{#each section.items as item (item.id)}
						{@const isActive = activeId === item.id || (item.id === 'products' && activeId.startsWith('products'))}
						{@const href = routeHref(item.id)}
						<div class="relative group/item">
							<a
								href={href}
								class="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-[13px] font-medium transition-colors relative {isActive
									? 'bg-[#F0F0EF] text-[#242424]'
									: 'text-[#5A5A5A] hover:bg-[#F8F8F7] hover:text-[#242424]'} {collapsed
									? 'justify-center'
									: ''}"
							>
								{#if isActive && !collapsed}
									<span
										class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] bg-[#343434] rounded-full"
									></span>
								{/if}
								<item.icon
									className="h-[18px] w-[18px] shrink-0 {isActive ? 'text-[#242424]' : 'text-[#777]'}"
									strokeWidth={1.6}
								/>
								{#if !collapsed}
									<span class="truncate text-left flex-1">{item.label}</span>
									{#if isActive}
										<span class="h-1.5 w-1.5 rounded-full bg-[#242424]"></span>
									{/if}
								{/if}
							</a>
							{#if collapsed}
								<div
									class="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 hidden group-hover/item:block"
								>
									<div
										class="bg-[#242424] text-white text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg"
									>
										{item.label}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- footer user card -->
	{#if !collapsed}
		<div class="p-3 border-t mt-auto" style="border-color: var(--border);">
			<div class="rounded-lg border p-2.5 flex items-center gap-2.5 bg-[#FBFBFA]" style="border-color: var(--border);">
				<div class="h-7 w-7 rounded-full bg-[#EDEDEB] flex items-center justify-center text-[11px] font-semibold">
					IK
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-[12px] font-medium truncate">I. Kim</div>
					<div class="text-[10px] text-[#777] truncate">Owner</div>
				</div>
				<ChevronDown className="h-3.5 w-3.5 text-[#999]" />
			</div>
		</div>
	{/if}
</aside>
