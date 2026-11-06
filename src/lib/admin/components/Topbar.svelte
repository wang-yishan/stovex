<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import type { Snippet } from 'svelte';

	let {
		crumbs,
		title,
		subtitle,
		mobileSubtitle,
		actions
	}: {
		crumbs: { label: string; href?: string }[];
		title: string;
		subtitle: string;
		/** Ref: mobile row-2 copy differs from desktop baseline subtitle on some views. */
		mobileSubtitle?: string;
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
	<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-4">
		<div class="flex items-center justify-between gap-3">
			<div>
				<div class="flex items-center gap-1.5 text-[11px] text-[#999] mb-1">
					{#each crumbs as crumb, i (i)}
						{#if i > 0}
							<span class="opacity-60">/</span>
						{/if}
						{#if crumb.href}
							<a href={resolve(crumb.href as Path)} class="hover:text-[#242424] hover:underline">
								{crumb.label}
							</a>
						{:else}
							<span class="text-[#242424] font-medium">{crumb.label}</span>
						{/if}
					{/each}
				</div>
				<div class="flex items-baseline gap-3">
					<h1
						class="text-[22px] md:text-[24px] font-semibold tracking-tight text-[#242424] leading-none"
					>
						{title}
					</h1>
					<span class="hidden md:inline text-[12px] text-[#777]">{subtitle}</span>
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if actions}
					{@render actions()}
				{/if}
				<div class="hidden md:flex items-center gap-2 pl-2 border-l ml-1" style="border-color: var(--border);">
					<div
						class="h-8 w-8 rounded-full bg-[#242424] text-white flex items-center justify-center text-[11px] font-semibold"
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
		<div class="md:hidden mt-2 flex items-center justify-between">
			<span class="text-[12px] text-[#777]">{mobileSubtitle ?? subtitle}</span>
			<span class="text-[11px] text-[#999]">Last updated: 11:42 AM</span>
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
