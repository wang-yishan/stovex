<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Package } from '@lucide/svelte';

	let { params }: PageProps = $props();
	let product = $derived(admin.products.find((p) => p.id === params.id));
</script>

<Topbar
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Products', href: '/dashboard/products' },
		{ label: 'Edit' }
	]}
	title="Edit Product"
	subtitle="Update catalog item."
>
	{#snippet actions()}
		<Button
			variant="outline"
			class="shrink-0 px-4"
			onclick={() => {
				const to =
					product && admin.products.some((p) => p.id === product.id)
						? `/dashboard/products/${product.id}`
						: '/dashboard/products';
				void goto(resolvePath(to));
			}}
		>
			Cancel
		</Button>
	{/snippet}
</Topbar>
{#if product}
	<ProductForm {product} mode="edit" />
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-16 text-center">
		<div
			class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted"
		>
			<Package class="h-6 w-6 text-muted-foreground" />
		</div>
		<h3 class="text-[14px] font-semibold">Product not found</h3>
		<p class="mt-1 text-[12px] text-muted-foreground">
			The product you’re looking for doesn’t exist or may have been removed.
		</p>
		<Button href={resolve('/dashboard/products')} class="mt-4 px-4">Back to products</Button>
	</div>
{/if}
