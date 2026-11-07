<script lang="ts">
	import { resolve } from '$app/paths';
	import ThemeToggle from '#lib/admin/components/ThemeToggle.svelte';
	import type { Path } from '$app/types';
	import type { Snippet } from 'svelte';

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
-->

<div
	class="sticky z-30 bg-[#F8F8F7]/80 backdrop-blur-xl border-b"
	style="top: var(--safe-area-inset-top); border-color: var(--border);"
>
	<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-3 sm:py-4">
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5 text-[11px] text-[#999] mb-1 whitespace-nowrap overflow-hidden">
					{#each crumbs as crumb, i (i)}
						{#if i > 0}
							<span class="opacity-60 shrink-0">/</span>
						{/if}
						{#if crumb.href}
							<a href={resolve(crumb.href as Path)} class="hover:text-[#242424] hover:underline shrink-0">
								{crumb.label}
							</a>
						{:else}
							<span class="text-[#242424] font-medium truncate">{crumb.label}</span>
						{/if}
					{/each}
				</div>
				<div class="flex items-baseline gap-3 min-w-0">
					<div class="flex items-center gap-2 min-w-0">
						<h1
							class="text-[20px] sm:text-[24px] font-semibold tracking-tight text-[#242424] leading-none truncate"
						>
							{title}
						</h1>
						{#if badge}
							{@render badge()}
						{/if}
					</div>
					<span class="hidden md:inline text-[12px] text-[#777] shrink-0">{subtitle}</span>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				{#if actions}
					{@render actions()}
				{/if}
				<ThemeToggle />
				<div class="hidden md:flex items-center gap-2 pl-2 border-l ml-1" style="border-color: var(--border);">
					<div
						class="h-9 w-9 rounded-full bg-[#242424] text-white flex items-center justify-center text-[11px] font-semibold shrink-0"
					>
						IK
					</div>
					<div class="hidden lg:block leading-tight">
						<div class="text-[12px] font-medium">I. Kim</div>
						<div class="text-[10px] text-[#777] -mt-0.5">Owner</div>
					</div>
				</div>
			</div>
		</div>

		<!-- mobile subtitle row -->
		<div class="md:hidden mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
			<span class="text-[12px] text-[#777]">{mobileSubtitle ?? subtitle}</span>
			<span class="text-[11px] text-[#999] whitespace-nowrap">Last updated: 11:42 AM</span>
		</div>

		<!-- desktop status row -->
		<div class="hidden md:flex mt-3 items-center gap-2 text-[11px] text-[#999]">
			<span>Last updated: 11:42 AM</span>
			<span class="h-1 w-1 rounded-full bg-[#D9D9D9]"></span>
			<span class="inline-flex items-center gap-1">
				<span class="h-1.5 w-1.5 rounded-full bg-[#269B65]"></span>
				Live monitoring • In-memory draft, not persisted
			</span>
		</div>
	</div>
</div>
