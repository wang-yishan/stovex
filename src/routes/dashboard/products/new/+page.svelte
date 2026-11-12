<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import { emptyProduct } from '#lib/admin/data.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
</script>

<Topbar
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Products', href: '/dashboard/products' },
		{ label: 'New' }
	]}
	title="New Product"
	subtitle="Create a catalog item."
	mobileSubtitle="Manage catalog • IDR pricing"
>
	{#snippet actions()}
		<Button
			variant="outline"
			class="shrink-0 px-4"
			onclick={() => void goto(resolve('/dashboard/products'))}
		>
			Cancel
		</Button>
	{/snippet}
</Topbar>
<ProductForm product={emptyProduct()} mode="create" />
