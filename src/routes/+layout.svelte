<script lang="ts">
	import DemoLinks from './demo/DemoLinks.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import type { Path } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '#lib/paraglide/runtime.js';
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if page.url.pathname.startsWith('/demo')}
	<div style="display:none">
		{#each locales as locale (locale)}
			<a
				href={resolve(localizeHref(page.url.pathname, { locale }) as Path)}
			>{locale}</a>
		{/each}
	</div>

	<DemoLinks />
{/if}
