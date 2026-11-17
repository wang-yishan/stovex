<script lang="ts">
	import { page } from '$app/state';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { NAV_SECTIONS, ROUTE_BY_NAV_ID, navIdFromPath } from '#lib/admin/navSections.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { LogOut, PanelLeftClose, PanelLeftOpen, ShoppingBag } from '@lucide/svelte';
	import {
		profileDisplayName,
		profileImageUrl,
		profileInitials,
		type ProfileUser
	} from '#lib/admin/user.ts';

	let collapsed = $derived(admin.sidebarCollapsed);
	let activeId = $derived(navIdFromPath(page.url.pathname));
	let user = $derived(page.data.user as (ProfileUser & { role?: string }) | null);
	let displayName = $derived(profileDisplayName(user));
	let initials = $derived(profileInitials(user));
	let avatarUrl = $derived(profileImageUrl(user));
	let isOwner = $derived(user?.role === 'owner');

	/** Owner-only pages: settings, integrations and admin management. */
	const OWNER_ONLY_NAV: ReadonlySet<string> = new Set(['brand', 'integrations', 'users-perms']);
	let sections = $derived(
		isOwner
			? NAV_SECTIONS
			: NAV_SECTIONS.map((section) => ({
					...section,
					items: section.items.filter((item) => !OWNER_ONLY_NAV.has(item.id))
				})).filter((section) => section.items.length > 0)
	);

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
		{#each sections as section (section.label)}
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
				<a
					href={resolvePath('/dashboard/profile')}
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EDEDEB] text-[11px] font-semibold transition-opacity hover:opacity-80"
					aria-label="Profile"
				>
					{#if avatarUrl}
						<img src={avatarUrl} alt="" class="h-7 w-7 rounded-full object-cover" />
					{:else}
						{initials}
					{/if}
				</a>
				<div class="min-w-0 flex-1">
					<a
						href={resolvePath('/dashboard/profile')}
						class="block truncate text-[12px] font-medium transition-colors hover:text-foreground hover:underline"
						>{displayName}</a
					>
					<div class="truncate text-[10px] text-[#5A5A5A]">Signed in</div>
				</div>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#636363] transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Sign out"
						title="Sign out"
					>
						<LogOut class="h-4 w-4" />
					</button>
				</form>
			</div>
		</div>
	{/if}
</aside>
