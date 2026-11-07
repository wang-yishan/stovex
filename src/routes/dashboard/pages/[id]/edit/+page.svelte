<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageEditor from '#lib/admin/components/PageEditor.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	let page = $derived(admin.pages.find((p) => p.id === params.id));

	$effect(() => {
		if (!page) {
			void goto(resolve('/dashboard/pages' as Path));
		}
	});
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pages & Landing Pages', href: '/dashboard/pages' }, { label: 'Edit' }]}
	title="Edit Page"
	subtitle="Update sections, settings and SEO."
	mobileSubtitle="Edit landing page"
>
	{#snippet actions()}
		<button type="button" onclick={() => void goto(resolve(`/dashboard/pages/${params.id}` as Path))} class="h-10 sm:h-8 rounded-full border bg-white px-4 text-[12px] font-medium shrink-0" style="border-color: var(--border);">Cancel</button>
	{/snippet}
</Topbar>

{#if page}
	<PageEditor
		mode="edit"
		initialPage={page}
		onSave={(next, action) => {
			admin.savePage(next, action);
			void goto(resolve(`/dashboard/pages/${next.id}` as Path));
		}}
		onCancel={() => void goto(resolve(`/dashboard/pages/${params.id}` as Path))}
/>
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-6 text-[13px] text-[#777]">Page not found.</div>
{/if}
