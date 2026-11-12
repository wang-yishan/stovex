<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Button } from '#lib/components/ui/button/index.ts';

	let { params }: PageProps = $props();
	let product = $derived(admin.products.find((p) => p.id === params.id));

	$effect(() => {
		if (!product) {
			void goto(resolve('/dashboard/products'));
		}
	});
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
</Topbar>{#if product}
	<ProductForm {product} mode="edit" />
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-6 text-[13px] text-muted-foreground">Loading…</div>
{/if}
