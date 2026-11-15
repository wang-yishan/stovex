<script lang="ts">
	import ThemeToggle from '#lib/admin/components/ThemeToggle.svelte';
	import NotificationBell from '#lib/admin/components/NotificationBell.svelte';
	import type { Snippet } from 'svelte';
	import { resolvePath } from '#lib/admin/paths.ts';

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
</script>

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
					<div class="mb-1 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px] text-[#636363]">
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
								class="truncate text-[20px] font-semibold leading-none tracking-tight text-[#242424] sm:text-[24px]"
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
						class="ml-1 hidden items-center gap-2 border-l pl-2 md:flex"
						style="border-color: var(--border);"
					>
						<div
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#242424] text-[11px] font-semibold text-white"
						>
							IK
						</div>
						<div class="hidden leading-tight lg:block">
							<div class="text-[12px] font-medium">I. Kim</div>
							<div class="-mt-0.5 text-[10px] text-[#5A5A5A]">Owner</div>
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
		<div class="md:hidden mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
			<span class="text-[12px] text-[#5A5A5A]">{mobileSubtitle ?? subtitle}</span>
			<span class="text-[11px] text-[#636363] whitespace-nowrap">Last updated: 11:42 AM</span>
		</div>

		<!-- desktop status row -->
		<div class="hidden md:flex mt-3 items-center gap-2 text-[11px] text-[#636363]">
			<span>Last updated: 11:42 AM</span>
			<span class="h-1 w-1 rounded-full bg-[#D9D9D9]"></span>
			<span class="inline-flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-[#269B65]"></span>
				Live monitoring • In-memory draft, not persisted
			</span>
		</div>
	</div>
</div>
