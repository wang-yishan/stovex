<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageEditor from '#lib/admin/components/PageEditor.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pages & Landing Pages', href: '/dashboard/pages' }, { label: 'New' }]}
	title="New Page"
	subtitle="Create a landing page with sections, SEO and homepage flag."
	mobileSubtitle="Create landing page"
>
	{#snippet actions()}
		<button type="button" onclick={() => void goto(resolve('/dashboard/pages' as Path))} class="h-10 sm:h-8 rounded-full border bg-white px-4 text-[12px] font-medium shrink-0" style="border-color: var(--border);">Cancel</button>
	{/snippet}
</Topbar>

<PageEditor
	mode="create"
	initialPage={admin.newPage()}
	onSave={(page, action) => {
		admin.savePage(page, action);
		void goto(resolve(`/dashboard/pages/${page.id}` as Path));
	}}
	onCancel={() => void goto(resolve('/dashboard/pages' as Path))}
/>
