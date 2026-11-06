<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PlaceholderContent from '#lib/admin/components/PlaceholderContent.svelte';
	import type { PageProps } from './$types';
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Promotions' }]}
	title="promotions"
	subtitle="Full spec product management."
	mobileSubtitle="Manage catalog • 8 seed bags"
/>
<PlaceholderContent title="promotions" />
