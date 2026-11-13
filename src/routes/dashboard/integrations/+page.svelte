<script lang="ts">
	import type { Component } from 'svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import {
		CATEGORY_LABELS,
		INTEGRATION_CATALOG,
		STATUS_LABELS,
		type IntegrationCategory,
		type IntegrationProvider
	} from '#lib/admin/integrations.ts';
	import {
		ArrowUpRight,
		Boxes,
		ClipboardList,
		Megaphone,
		PackageOpen,
		PlugZap,
		Share2,
		Truck
	} from '@lucide/svelte';
	import { Badge } from '#lib/components/ui/badge/index.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let categoryFilter = $state<'all' | IntegrationCategory>('all');
	let selected = $state<IntegrationProvider | null>(null);
	let planProvider = $state<IntegrationProvider | null>(null);

	let providers = $derived(
		INTEGRATION_CATALOG.filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
	);

	let connectedCount = $derived(INTEGRATION_CATALOG.filter((p) => p.status === 'connected').length);

	const CATEGORY_ICON: Record<IntegrationCategory, Component> = {
		dropshipping: Boxes,
		'print-on-demand': PackageOpen,
		shipping: Truck,
		ads: Megaphone,
		social: Share2
	};

	function statusClass(status: IntegrationProvider['status']): string {
		switch (status) {
			case 'connected':
			case 'available':
				return 'border-success/30 bg-success/10 text-success-text';
			case 'in-progress':
				return 'border-warning/30 bg-warning/10 text-warning-text';
			default:
				return 'border-border bg-muted text-muted-foreground';
		}
	}
</script>

<!--
	@component
	Integrations module — placeholder for provider connections (CJdropshipping, AutoDS, …).
	Lists the planned provider catalog and the rollout order; the connect flow lands later.
-->

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Integrations' }]}
	title="Integrations"
	subtitle="Connect dropshipping, print-on-demand and shipping partners."
	mobileSubtitle={`${INTEGRATION_CATALOG.length} providers planned • ${connectedCount} connected`}
/>

<div
	class="mx-auto w-full max-w-[1280px] {isMobile
		? 'px-4 py-4 pb-[112px]'
		: 'px-4 py-6 md:px-6 lg:px-8'}"
>
	<!-- Rollout plan -->
	<div class="mb-4 overflow-hidden rounded-[12px] border border-border bg-card">
		<div class="flex items-center justify-between border-b border-border px-4 py-3 md:px-5">
			<h3 class="text-[13px] font-semibold">Rollout plan</h3>
			<span class="text-[11px] text-muted-foreground"
				>Module is a placeholder — connections are not live</span
			>
		</div>
		<div class="grid grid-cols-1 gap-px bg-border md:grid-cols-3">
			<div class="bg-card p-4 md:p-5">
				<div class="mb-2 flex items-center gap-2">
					<span
						class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-success/30 bg-success/10 text-[11px] font-semibold text-success-text"
					>
						1
					</span>
					<h4 class="text-[13px] font-semibold">Supply &amp; production</h4>
				</div>
				<p class="text-[12px] text-muted-foreground">
					Source catalog, route production orders, pull shipping cost and delivery estimates back
					into Products and Orders.
				</p>
				<div class="mt-3 flex flex-wrap gap-1.5">
					<Badge variant="outline" class="text-[11px]">CJdropshipping</Badge>
					<Badge variant="outline" class="text-[11px]">AutoDS</Badge>
				</div>
			</div>
			<div class="bg-card p-4 md:p-5">
				<div class="mb-2 flex items-center gap-2">
					<span
						class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-warning/30 bg-warning/10 text-[11px] font-semibold text-warning-text"
					>
						2
					</span>
					<h4 class="text-[13px] font-semibold">Fulfilment</h4>
				</div>
				<p class="text-[12px] text-muted-foreground">
					Buy labels from the order screen, push fulfilment status, and keep stock movements
					traceable across every channel.
				</p>
				<div class="mt-3 flex flex-wrap gap-1.5">
					<Badge variant="outline" class="text-[11px]">Printful</Badge>
					<Badge variant="outline" class="text-[11px]">ShipStation</Badge>
				</div>
			</div>
			<div class="bg-card p-4 md:p-5">
				<div class="mb-2 flex items-center gap-2">
					<span
						class="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-[11px] font-semibold text-muted-foreground"
					>
						3
					</span>
					<h4 class="text-[13px] font-semibold">Channels &amp; growth</h4>
				</div>
				<p class="text-[12px] text-muted-foreground">
					Publish to marketplaces and report spend against promoted products once the catalog side
					is stable.
				</p>
				<div class="mt-3 flex flex-wrap gap-1.5">
					<Badge variant="outline" class="text-[11px]">Shopee</Badge>
					<Badge variant="outline" class="text-[11px]">Meta Ads</Badge>
				</div>
			</div>
		</div>
	</div>

	<!-- Filter -->
	<div
		class="mb-4 flex flex-col justify-between gap-3 rounded-[12px] border border-border bg-card p-3 md:flex-row md:p-4"
	>
		<div class="text-[12px] text-muted-foreground">
			{providers.length} of {INTEGRATION_CATALOG.length} providers
		</div>
		<div class="[&>div]:w-full sm:[&>div]:w-auto">
			<NativeSelect shape="pill" class="font-medium" bind:value={categoryFilter}>
				<option value="all">All categories</option>
				{#each Object.entries(CATEGORY_LABELS) as [value, label] (value)}
					<option {value}>{label}</option>
				{/each}
			</NativeSelect>
		</div>
	</div>

	<!-- Provider grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each providers as provider (provider.id)}
			{@const Icon = CATEGORY_ICON[provider.category]}
			<div class="flex flex-col rounded-[12px] border border-border bg-card p-4 md:p-5">
				<div class="mb-3 flex items-start gap-3">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-muted"
					>
						<Icon class="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-[13px] font-semibold">{provider.name}</h3>
							{#if provider.priority}
								<Badge variant="outline" class="text-[10px]">Priority</Badge>
							{/if}
						</div>
						<div class="mt-1 text-[11px] text-muted-foreground">
							{CATEGORY_LABELS[provider.category]}
						</div>
					</div>
					<span
						class="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium {statusClass(
							provider.status
						)}"
					>
						<span
							class="h-1 w-1 rounded-full {provider.status === 'planned'
								? 'bg-muted-foreground'
								: provider.status === 'in-progress'
									? 'bg-warning'
									: 'bg-success'}"
						></span>
						{STATUS_LABELS[provider.status]}
					</span>
				</div>

				<p class="text-[12px] text-muted-foreground">{provider.description}</p>

				<ul class="mt-3 flex-1 space-y-1.5">
					{#each provider.capabilities as capability (capability)}
						<li class="flex items-start gap-2 text-[12px]">
							<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border"></span>
							<span class="text-muted-foreground">{capability}</span>
						</li>
					{/each}
				</ul>

				<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
					<Button
						variant={provider.priority ? 'default' : 'outline'}
						size="sm"
						class="px-3"
						onclick={() => (selected = provider)}
					>
						<PlugZap class="h-4 w-4 shrink-0" /> Connect
					</Button>
					<Button
						variant="outline"
						size="sm"
						class="px-3"
						onclick={() => (planProvider = provider)}
					>
						<ClipboardList class="h-4 w-4 shrink-0" /> Plan
					</Button>
					<a
						href={provider.docsUrl}
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
					>
						Docs <ArrowUpRight class="h-3.5 w-3.5" />
					</a>
				</div>
			</div>
		{/each}
	</div>

	{#if providers.length === 0}
		<div
			class="mt-4 rounded-[12px] border border-border bg-card p-12 text-center text-[13px] text-muted-foreground"
		>
			No providers in this category yet.
		</div>
	{/if}
</div>

{#if selected}
	<Modal title={`Connect ${selected.name}`} maxW={440}>
		<p class="mt-1 text-[12px] text-muted-foreground">
			{selected.description} The connect flow is not implemented yet — this module is a placeholder for
			{selected.name} and the other providers in the catalog.
		</p>
		<div class="mt-3 space-y-2">
			{#each selected.capabilities as capability (capability)}
				<div
					class="flex items-start gap-2 rounded-[8px] border border-border bg-field p-2.5 text-[12px] text-muted-foreground"
				>
					<span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border"></span>
					<span>{capability}</span>
				</div>
			{/each}
		</div>
		<div class="mt-4 flex gap-2">
			<Button
				class="flex-1 sm:h-10"
				onclick={() => {
					admin.showToast(`${selected?.name} connection is not available yet`, 'info');
					selected = null;
				}}>Got it</Button
			>
			<Button variant="outline" class="flex-1 sm:h-10" onclick={() => (selected = null)}
				>Close</Button
			>
		</div>
	</Modal>
{/if}

{#if planProvider}
	<Modal title={`Plan — ${planProvider.name}`} maxW={440}>
		<p class="mt-1 text-[12px] text-muted-foreground">
			Connection rollout plan for {planProvider.name}. The connect flow itself lands with the
			rollout phase — provider credentials and backend wiring come first.
		</p>
		<ol class="mt-3 space-y-2">
			{#each planProvider.plan ?? [] as step, index (index)}
				<li class="flex items-start gap-2 text-[12px] text-muted-foreground">
					<span
						class="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground"
					>
						{index + 1}
					</span>
					<span class="pt-0.5">{step}</span>
				</li>
			{/each}
		</ol>
		<div class="mt-4 flex gap-2">
			<Button class="flex-1 sm:h-10" onclick={() => (planProvider = null)}>Got it</Button>
			<Button variant="outline" class="flex-1 sm:h-10" onclick={() => (planProvider = null)}
				>Close</Button
			>
		</div>
	</Modal>
{/if}
