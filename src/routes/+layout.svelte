<script lang="ts">
	import DemoLinks from './demo/DemoLinks.svelte';
	import { untrack } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { locales, localizeHref } from '#lib/paraglide/runtime.js';
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { brandStyleVars } from '#lib/admin/brand.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { AlertTriangle, RotateCcw } from '@lucide/svelte';

	let { data, children }: LayoutProps = $props();

	// The admin store mirrors SQLite: fill it with the loaded data before
	// any page renders, on the server as well as in the browser.
	// `untrack` keeps this a one-off read of the initial payload. A `null`
	// payload means that source failed to load — keep the existing/default
	// cache so the UI can still render with a degraded-but-safe state.
	if (untrack(() => data.catalog)) admin.hydrateCatalog(untrack(() => data.catalog)!);
	if (untrack(() => data.shipments)) admin.hydrateShipments(untrack(() => data.shipments)!);
	if (untrack(() => data.notifications))
		admin.hydrateNotifications(untrack(() => data.notifications)!);
	if (untrack(() => data.orders)) admin.hydrateOrders(untrack(() => data.orders)!);
	admin.hydrateSettings(untrack(() => data.settings));

	// Navigations refresh the data; keep the mirror in sync, but never
	// overwrite a good cache with a failed (null) payload.
	$effect(() => {
		if (data.catalog) admin.hydrateCatalog(data.catalog);
		if (data.shipments) admin.hydrateShipments(data.shipments);
		if (data.notifications) admin.hydrateNotifications(data.notifications);
		if (data.orders) admin.hydrateOrders(data.orders);
		admin.hydrateSettings(data.settings);
	});

	const hasLoadError = $derived(
		Boolean(
			data.loadErrors?.catalog ||
				data.loadErrors?.shipments ||
				data.loadErrors?.notifications ||
				data.loadErrors?.settings ||
				data.loadErrors?.orders
		)
	);

	// The saved brand becomes CSS custom properties on the app root, so the
	// storefront renders with the merchant's palette on the very first
	// server-rendered paint (no flash of the default brand).
	const brandVars = $derived(brandStyleVars(admin.settings.brand));
</script>

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={admin.settings.brand.faviconUrl || favicon} />
</svelte:head>

<!-- `display: contents` keeps the wrapper out of the box tree; the brand
     custom properties still inherit down to every page. -->
<div style={brandVars} class="contents">
	{#if hasLoadError}
		<div
			class="flex items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-[12px] text-foreground"
			role="status"
			aria-live="polite"
		>
			<div class="flex min-w-0 items-center gap-2">
				<AlertTriangle class="h-4 w-4 shrink-0 text-warning" />
				<span>Sebagian data gagal dimuat. Tampilan mungkin tidak lengkap.</span>
			</div>
			<Button
				variant="outline"
				size="sm"
				class="h-7 shrink-0 gap-1.5 px-2.5 text-[11px]"
				onclick={() => void invalidateAll()}
			>
				<RotateCcw class="h-3.5 w-3.5" /> Coba lagi
			</Button>
		</div>
	{/if}
	{@render children()}
</div>

{#if page.url.pathname.startsWith('/demo')}
	<div style="display:none">
		{#each locales as locale (locale)}
			<a href={resolvePath(localizeHref(page.url.pathname, { locale }))}>{locale}</a>
		{/each}
	</div>

	<DemoLinks />
{/if}
