<script lang="ts">
	import DemoLinks from './demo/DemoLinks.svelte';
	import { untrack } from 'svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import { locales, localizeHref } from '#lib/paraglide/runtime.js';
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { brandStyleVars } from '#lib/admin/brand.ts';

	let { data, children }: LayoutProps = $props();

	// The admin store mirrors SQLite: fill it with the loaded data before
	// any page renders, on the server as well as in the browser.
	// `untrack` keeps this a one-off read of the initial payload.
	admin.hydrateCatalog(untrack(() => data.catalog));
	admin.hydrateShipments(untrack(() => data.shipments));
	admin.hydrateNotifications(untrack(() => data.notifications));
	admin.hydrateSettings(untrack(() => data.settings));

	// Navigations refresh the data; keep the mirror in sync.
	$effect(() => {
		admin.hydrateCatalog(data.catalog);
		admin.hydrateShipments(data.shipments);
		admin.hydrateNotifications(data.notifications);
		admin.hydrateSettings(data.settings);
	});

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
