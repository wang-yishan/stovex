<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageEditor from '#lib/admin/components/PageEditor.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import type { PageProps } from './$types';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Button } from '#lib/components/ui/button/index.ts';

	let { params }: PageProps = $props();
	let page = $derived(admin.pages.find((p) => p.id === params.id));

	$effect(() => {
		if (!page) {
			void goto(resolve('/dashboard/pages'));
		}
	});
</script>

<Topbar
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Pages & Landing Pages', href: '/dashboard/pages' },
		{ label: 'Edit' }
	]}
	title="Edit Page"
	subtitle="Update sections, settings and SEO."
	mobileSubtitle="Edit landing page"
>
	{#snippet actions()}
		<Button
			variant="outline"
			class="shrink-0 px-4"
			onclick={() => void goto(resolvePath(`/dashboard/pages/${params.id}`))}>Cancel</Button
		>
	{/snippet}
</Topbar>

{#if page}
	<PageEditor
		mode="edit"
		initialPage={page}
		onSave={(next, action) => {
			admin.savePage(next, action);
			void goto(resolvePath(`/dashboard/pages/${next.id}`));
		}}
		onCancel={() => void goto(resolvePath(`/dashboard/pages/${params.id}`))}
	/>
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-6 text-[13px] text-muted-foreground">
		Page not found.
	</div>
{/if}
