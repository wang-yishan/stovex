<script lang="ts">
	import { page } from '$app/state';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { NAV_SECTIONS, ROUTE_BY_NAV_ID, navIdFromPath } from '#lib/admin/navSections.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { ChevronDown, PanelLeftClose, PanelLeftOpen, ShoppingBag } from '@lucide/svelte';

	let collapsed = $derived(admin.sidebarCollapsed);
	let activeId = $derived(navIdFromPath(page.url.pathname));

	const routeHref = (id: keyof typeof ROUTE_BY_NAV_ID): string => resolvePath(ROUTE_BY_NAV_ID[id]);
</script>

<!--
	@component
	Desktop admin sidebar — 248px ↔ 72px collapse, sticky (converted from ref aside).
-->

<aside
	class="sticky hidden shrink-0 flex-col self-start border-r bg-white md:flex"
	style="width: {collapsed
		? 72
		: 248}px; border-color: var(--border); top: var(--safe-area-inset-top); height: calc(100vh - var(--safe-area-inset-top)); transition: width 200ms ease;"
>
	<!-- header -->
	<div
		class="flex h-[64px] shrink-0 items-center border-b px-3"
		style="border-color: var(--border);"
	>
		<div class="flex w-full items-center gap-2.5">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#111]">
				<ShoppingBag class="h-4 w-4 text-white" strokeWidth={1.5} />
			</div>
			{#if !collapsed}
				<div class="flex-1">
					<div class="text-[13px] leading-none font-bold tracking-[0.08em] text-[#242424]">
						{admin.settings.brand.wordmark}
					</div>
					<div class="mt-0.5 text-[10px] tracking-wide text-[#5A5A5A]">ADMIN</div>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => admin.toggleSidebar()}
					aria-label="Collapse sidebar"
					class="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
				>
					<PanelLeftClose class="h-4 w-4" />
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => admin.toggleSidebar()}
					aria-label="Expand sidebar"
					class="mx-auto shrink-0 text-muted-foreground transition-colors hover:text-foreground"
				>
					<PanelLeftOpen class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</div>

	<!-- nav -->
	<div class="flex-1 overflow-x-hidden overflow-y-auto py-3">
		{#each NAV_SECTIONS as section (section.label)}
			<div class="mb-5 px-2">
				{#if !collapsed}
					<div
						class="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.12em] text-[#636363] uppercase"
					>
						{section.label}
					</div>
				{:else}
					<div class="h-3"></div>
				{/if}
				<div class="space-y-0.5">
					{#each section.items as item (item.id)}
						{@const isActive =
							activeId === item.id || (item.id === 'products' && activeId.startsWith('products'))}
						{@const href = routeHref(item.id)}
						<div class="group/item relative">
							<a
								{href}
								class="relative flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors {isActive
									? 'bg-[#F0F0EF] text-foreground'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'} {collapsed
									? 'justify-center'
									: ''}"
							>
								{#if isActive && !collapsed}
									<span
										class="absolute top-1/2 left-0 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#343434]"
									></span>
								{/if}
								<item.icon
									class="h-5 w-5 shrink-0 {isActive ? 'text-foreground' : 'text-muted-foreground'}"
									strokeWidth={1.6}
								/>
								{#if !collapsed}
									<span class="flex-1 truncate text-left">{item.label}</span>
									{#if isActive}
										<span class="h-1.5 w-1.5 rounded-full bg-[#242424]"></span>
									{/if}
								{/if}
							</a>
							{#if collapsed}
								<div
									class="pointer-events-none absolute top-1/2 left-[calc(100%+8px)] z-50 hidden -translate-y-1/2 group-hover/item:block"
								>
									<div
										class="rounded-md bg-[#242424] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-lg"
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
		<div class="mt-auto border-t p-3" style="border-color: var(--border);">
			<div
				class="flex items-center gap-2.5 rounded-lg border bg-[#FBFBFA] p-2.5"
				style="border-color: var(--border);"
			>
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDEDEB] text-[11px] font-semibold"
				>
					IK
				</div>
				<div class="min-w-0 flex-1">
					<div class="truncate text-[12px] font-medium">I. Kim</div>
					<div class="truncate text-[10px] text-[#5A5A5A]">Owner</div>
				</div>
				<ChevronDown class="h-4 w-4 text-[#636363]" />
			</div>
		</div>
	{/if}
</aside>
