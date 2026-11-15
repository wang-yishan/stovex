<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { NAV_SECTIONS, ROUTE_BY_NAV_ID, navIdFromPath } from '#lib/admin/navSections.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { X } from '@lucide/svelte';

	let activeId = $derived(navIdFromPath(page.url.pathname));
	let footerMode = $derived(
		activeId.startsWith('products') ? 'Full product spec linked' : 'Monitoring-only mode'
	);

	const go = (id: keyof typeof ROUTE_BY_NAV_ID): void => {
		admin.toggleMoreSheet(false);
		goto(resolvePath(ROUTE_BY_NAV_ID[id]));
	};
</script>

<!--
	@component
	Mobile "More" bottom sheet — all non-GENERAL sections (converted from ref Er sheet).
-->

{#if admin.moreSheetOpen}
	<div
		class="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
		onclick={() => admin.toggleMoreSheet(false)}
		aria-hidden="true"
	></div>
	<div
		class="fixed right-0 bottom-0 left-0 z-50 flex max-h-[82vh] animate-[slideUp_260ms_cubic-bezier(0.16,1,0.3,1)] flex-col rounded-t-[16px] border-t bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
		style="border-color: var(--border); padding-bottom: var(--safe-area-inset-bottom);"
	>
		<div class="flex flex-col items-center pt-3 pb-2">
			<div class="mb-3 h-1 w-9 rounded-full bg-[#E5E5E3]"></div>
			<div class="flex w-full items-center justify-between px-5 pb-3">
				<h3 class="text-[15px] font-semibold">More navigation</h3>
				<Button
					variant="secondary"
					size="icon-lg"
					onclick={() => admin.toggleMoreSheet(false)}
					aria-label="Close More sheet"
					class="shrink-0"
				>
					<X class="h-4 w-4 text-muted-foreground" />
				</Button>
			</div>
		</div>

		<div class="space-y-5 overflow-y-auto px-3 pb-4">
			{#each NAV_SECTIONS.filter((s) => s.label !== 'GENERAL') as section (section.label)}
				<div>
					<div
						class="mb-2 px-3 text-[10px] font-semibold tracking-[0.12em] text-[#636363] uppercase"
					>
						{section.label}
					</div>
					<div class="space-y-1">
						{#each section.items as item (item.id)}
							{@const isActive =
								activeId === item.id || (item.id === 'products' && activeId.startsWith('products'))}
							<Button
								variant="outline"
								class="h-12 w-full justify-start gap-3 rounded-[10px] px-3 text-[13px] {isActive
									? 'border-foreground/10 bg-accent text-accent-foreground'
									: 'bg-card hover:bg-muted'}"
								onclick={() => go(item.id)}
							>
								<item.icon
									class="h-5 w-5 {isActive ? 'text-foreground' : 'text-muted-foreground'}"
									strokeWidth={1.6}
								/>
								<span class="flex-1 text-left">{item.label}</span>
								{#if isActive}
									<span class="h-1.5 w-1.5 rounded-full bg-foreground"></span>
								{/if}
							</Button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div
			class="rounded-b-[16px] border-t bg-[#FBFBFA] px-5 py-3 text-[11px] text-[#5A5A5A]"
			style="border-color: var(--border);"
		>
			{admin.settings.brand.wordmark} • Admin v2.4 • {footerMode}
		</div>
	</div>
{/if}
