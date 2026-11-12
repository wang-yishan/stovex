<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageEditor from '#lib/admin/components/PageEditor.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
</script>

<Topbar
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Pages & Landing Pages', href: '/dashboard/pages' },
		{ label: 'New' }
	]}
	title="New Page"
	subtitle="Create a landing page with sections, SEO and homepage flag."
	mobileSubtitle="Create landing page"
>
	{#snippet actions()}
		<Button
			variant="outline"
			class="shrink-0 px-4"
			onclick={() => void goto(resolve('/dashboard/pages'))}>Cancel</Button
		>
	{/snippet}
</Topbar>

<PageEditor
	mode="create"
	initialPage={admin.newPage()}
	onSave={(page, action) => {
		admin.savePage(page, action);
		void goto(resolvePath(`/dashboard/pages/${page.id}`));
	}}
	onCancel={() => void goto(resolve('/dashboard/pages'))}
/>
