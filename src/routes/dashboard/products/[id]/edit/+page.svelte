<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Path } from '$app/types';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	let product = $derived(admin.products.find((p) => p.id === params.id));

	$effect(() => {
		if (!product) {
			void goto(resolve('/dashboard/products' as Path));
		}
	});
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Products', href: '/dashboard/products' }, { label: 'Edit' }]}
	title="Edit Product"
	subtitle="Update catalog item."
>
	{#snippet actions()}
		<button
			type="button"
			class="h-10 sm:h-8 rounded-full border bg-white px-4 text-[12px] font-medium shrink-0"
			style="border-color: var(--border);"
			onclick={() => {
				const to =
					product && admin.products.some((p) => p.id === product.id)
						? `/dashboard/products/${product.id}`
						: '/dashboard/products';
				void goto(resolve(to as Path));
			}}
		>
			Cancel
		</button>
	{/snippet}
</Topbar>{#if product}
	<ProductForm product={product} mode="edit" />
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-6 text-[13px] text-[#777]">Loading…</div>
{/if}
