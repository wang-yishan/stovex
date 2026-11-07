<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import { emptyProduct } from '#lib/admin/data.ts';
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Products', href: '/dashboard/products' }, { label: 'New' }]}
	title="New Product"
	subtitle="Create a catalog item."
	mobileSubtitle="Manage catalog • IDR pricing"
>
	{#snippet actions()}
		<button
			type="button"
			class="h-10 sm:h-8 rounded-full border bg-white px-4 text-[12px] font-medium shrink-0"
			style="border-color: var(--border);"
			onclick={() => void goto(resolve('/dashboard/products' as Path))}
		>
			Cancel
		</button>
	{/snippet}
</Topbar>
<ProductForm product={emptyProduct()} mode="create" />
