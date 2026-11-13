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

	let { data, children }: LayoutProps = $props();

	// The admin store mirrors SQLite: fill it with the loaded catalog before
	// any page renders, on the server as well as in the browser.
	// `untrack` keeps this a one-off read of the initial payload.
	admin.hydrateCatalog(untrack(() => data.catalog));

	// Navigations refresh the catalog; keep the mirror in sync.
	$effect(() => {
		admin.hydrateCatalog(data.catalog);
	});
</script>

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if page.url.pathname.startsWith('/demo')}
	<div style="display:none">
		{#each locales as locale (locale)}
			<a href={resolvePath(localizeHref(page.url.pathname, { locale }))}>{locale}</a>
		{/each}
	</div>

	<DemoLinks />
{/if}
