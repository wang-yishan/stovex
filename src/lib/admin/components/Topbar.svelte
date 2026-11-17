<script lang="ts">
	import ThemeToggle from '#lib/admin/components/ThemeToggle.svelte';
	import NotificationBell from '#lib/admin/components/NotificationBell.svelte';
	import type { Snippet } from 'svelte';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { page } from '$app/state';
	import { LogOut, User } from '@lucide/svelte';
	import { Switch } from '#lib/components/ui/switch/index.ts';
	import { mode, toggleMode } from 'mode-watcher';
	import {
		profileDisplayName,
		profileImageUrl,
		profileInitials,
		type ProfileUser
	} from '#lib/admin/user.ts';

	let {
		crumbs,
		title,
		subtitle,
		mobileSubtitle,
		badge,
		actions
	}: {
		crumbs: { label: string; href?: string }[];
		title: string;
		subtitle: string;
		/** Ref: mobile row-2 copy differs from desktop baseline subtitle on some views. */
		mobileSubtitle?: string;
		/** Inline badges rendered next to the title (ref: status/featured on product detail). */
		badge?: Snippet;
		/** Per-page action buttons (Today/Bell, Add Product, Back/Edit…). */
		actions?: Snippet;
	} = $props();

	let user = $derived(page.data.user as ProfileUser | null);
	let displayName = $derived(profileDisplayName(user));
	let initials = $derived(profileInitials(user));
	let avatarUrl = $derived(profileImageUrl(user));

	let open = $state(false);
	let isDark = $state(mode.current === 'dark');

	function toggleMenu(): void {
		open = !open;
	}

	function handleThemeChange(checked: boolean): void {
		isDark = checked;
		toggleMode();
	}

	function onWindowClick(event: MouseEvent): void {
		if (!open) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('[data-user-menu-root]')) return;
		open = false;
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<!--
	@component
	Sticky dashboard header: breadcrumbs, title+subtitle, actions, status rows (converted from ref header).
	On mobile, page actions render on their own row so the title and global controls stay readable.
-->

<div
	class="sticky z-30 border-b bg-[var(--chrome-bg)] backdrop-blur-xl"
	style="top: var(--safe-area-inset-top); border-color: var(--border);"
>
	<div class="mx-auto w-full max-w-[1280px] px-4 py-3 sm:py-4 md:px-6 lg:px-8">
		<div class="flex flex-col gap-2 sm:gap-3">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<div
						class="mb-1 flex items-center gap-1.5 overflow-hidden text-[11px] whitespace-nowrap text-[#636363]"
					>
						{#each crumbs as crumb, i (i)}
							{#if i > 0}
								<span class="shrink-0 opacity-60">/</span>
							{/if}
							{#if crumb.href}
								<a
									href={resolvePath(crumb.href)}
									class="shrink-0 transition-colors hover:text-foreground hover:underline"
								>
									{crumb.label}
								</a>
							{:else}
								<span class="truncate font-medium text-[#242424]">{crumb.label}</span>
							{/if}
						{/each}
					</div>
					<div class="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 sm:items-baseline">
						<div class="flex min-w-0 flex-wrap items-center gap-2">
							<h1
								class="truncate text-[20px] leading-none font-semibold tracking-tight text-[#242424] sm:text-[24px]"
							>
								{title}
							</h1>
							{#if badge}
								<div class="flex flex-wrap items-center gap-1.5">
									{@render badge()}
								</div>
							{/if}
						</div>
						<span class="hidden shrink-0 text-[12px] text-[#5A5A5A] md:inline">{subtitle}</span>
					</div>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					{#if actions}
						<div class="hidden items-center gap-2 sm:flex">
							{@render actions()}
						</div>
					{/if}
					<NotificationBell />
					<ThemeToggle />
					<div
						class="relative ml-1 hidden items-center gap-2 border-l pl-2 md:flex"
						style="border-color: var(--border);"
					>
						<div class="relative flex items-center">
							<button
								type="button"
								onclick={() => (open = !open)}
								aria-haspopup="menu"
								aria-expanded={open}
								aria-label="Account menu"
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#242424] text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
							>
								{#if avatarUrl}
									<img src={avatarUrl} alt="" class="h-9 w-9 rounded-full object-cover" />
								{:else}
									{initials}
								{/if}
							</button>
							<div class="hidden min-w-0 leading-tight lg:block">
								<button
									type="button"
									onclick={() => (open = !open)}
									class="block w-full truncate text-left text-[12px] font-medium text-[#242424] transition-colors hover:text-foreground"
								>
									{displayName}
								</button>
								<div class="-mt-0.5 text-[10px] text-[#5A5A5A]">Signed in</div>
							</div>
							{#if open}
								<div
									data-user-menu-root
									class="absolute top-[calc(100%+8px)] right-0 z-50 w-[230px] overflow-hidden rounded-[12px] border border-border bg-card p-1 shadow-xl"
									role="menu"
								>
									<a
										href={resolvePath('/dashboard/profile')}
										onclick={() => (open = false)}
										class="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
									>
										<User class="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} />
										<span class="flex-1 text-left">Profile settings</span>
									</a>
									<div class="flex items-center justify-between gap-3 px-3 py-2">
										<span class="text-[12px] font-medium">Theme</span>
										<Switch checked={isDark} onCheckedChange={handleThemeChange} />
									</div>
									<form method="POST" action="/logout">
										<button
											type="submit"
											class="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
										>
											<LogOut class="h-4 w-4 shrink-0 text-muted-foreground" />
											<span class="text-left">Sign out</span>
										</button>
									</form>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
			{#if actions}
				<div class="flex flex-wrap items-center gap-2 sm:hidden">
					{@render actions()}
				</div>
			{/if}
		</div>

		<!-- mobile subtitle row -->
		<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:hidden">
			<span class="text-[12px] text-[#5A5A5A]">{mobileSubtitle ?? subtitle}</span>
			<span class="text-[11px] whitespace-nowrap text-[#636363]">Last updated: 11:42 AM</span>
		</div>

		<!-- desktop status row -->
		<div class="mt-3 hidden items-center gap-2 text-[11px] text-[#636363] md:flex">
			<span>Last updated: 11:42 AM</span>
			<span class="h-1 w-1 rounded-full bg-[#D9D9D9]"></span>
			<span class="inline-flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-[#269B65]"></span>
				Live monitoring • In-memory draft, not persisted
			</span>
		</div>
	</div>
</div>
