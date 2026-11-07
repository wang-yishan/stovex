<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { NAV_SECTIONS, ROUTE_BY_NAV_ID, navIdFromPath } from '#lib/admin/navSections.ts';
	import { X } from '@lucide/svelte';

	let activeId = $derived(navIdFromPath(page.url.pathname));
	let footerMode = $derived(
		activeId.startsWith('products') ? 'Full product spec linked' : 'Monitoring-only mode'
	);

	const go = (id: keyof typeof ROUTE_BY_NAV_ID): void => {
		admin.toggleMoreSheet(false);
		goto(resolve(ROUTE_BY_NAV_ID[id] as Path));
	};
</script>

<!--
	@component
	Mobile "More" bottom sheet — all non-GENERAL sections (converted from ref Er sheet).
-->

{#if admin.moreSheetOpen}
	<div class="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onclick={() => admin.toggleMoreSheet(false)} aria-hidden="true"></div>
	<div
		class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[16px] border-t shadow-[0_-8px_30px_rgba(0,0,0,0.08)] max-h-[82vh] flex flex-col animate-[slideUp_260ms_cubic-bezier(0.16,1,0.3,1)]"
		style="border-color: var(--border); padding-bottom: var(--safe-area-inset-bottom);"
	>
		<div class="flex flex-col items-center pt-3 pb-2">
			<div class="h-1 w-9 rounded-full bg-[#E5E5E3] mb-3"></div>
			<div class="w-full flex items-center justify-between px-5 pb-3">
				<h3 class="text-[15px] font-semibold">More navigation</h3>
				<button
					type="button"
					class="h-9 w-9 rounded-full bg-[#F5F5F4] border flex items-center justify-center shrink-0"
					style="border-color: var(--border);"
					onclick={() => admin.toggleMoreSheet(false)}
					aria-label="Close More sheet"
				>
					<X class="h-4 w-4 text-[#777]" />
				</button>
			</div>
		</div>

		<div class="overflow-y-auto px-3 pb-4 space-y-5">
			{#each NAV_SECTIONS.filter((s) => s.label !== 'GENERAL') as section (section.label)}
				<div>
					<div class="px-3 mb-2 text-[10px] font-semibold tracking-[0.12em] text-[#999] uppercase">
						{section.label}
					</div>
					<div class="space-y-1">
						{#each section.items as item (item.id)}
							{@const isActive =
								activeId === item.id ||
								(item.id === 'products' && activeId.startsWith('products'))}
							<button
								type="button"
								class="w-full flex items-center gap-3 px-3 h-12 rounded-[10px] border text-[13px] font-medium transition {isActive
									? 'bg-[#F0F0EF] border-[#242424]/10 text-[#242424]'
									: 'bg-white border-[#EAEAEA] text-[#242424] hover:bg-[#F8F8F7]'}"
								onclick={() => go(item.id)}
							>
								<item.icon
									class="h-5 w-5 {isActive ? 'text-[#242424]' : 'text-[#777]'}"
									strokeWidth={1.6}
								/>
								<span class="flex-1 text-left">{item.label}</span>
								{#if isActive}
									<span class="h-1.5 w-1.5 rounded-full bg-[#242424]"></span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div
			class="px-5 py-3 border-t bg-[#FBFBFA] text-[11px] text-[#777] rounded-b-[16px]"
			style="border-color: var(--border);"
		>
			BAG STORE • Admin v2.4 • {footerMode}
		</div>
	</div>
{/if}
