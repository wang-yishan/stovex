<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Image, Upload } from '@lucide/svelte';

	const items = $derived(admin.media ?? []);
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Media Library' }]}
	title="Media"
	subtitle="Manage uploaded images and assets."
/>

{#if items.length === 0}
	<div class="mx-auto max-w-[1280px] px-4 py-16 text-center">
		<div
			class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted"
		>
			<Image class="h-6 w-6 text-muted-foreground" />
		</div>
		<h3 class="text-[14px] font-semibold">No media yet</h3>
		<p class="mx-auto mt-1 max-w-[320px] text-[12px] text-muted-foreground">
			Uploaded images will appear here. Add images from products, brand, or store settings.
		</p>
		<Button href="/dashboard/products/new" class="mt-4 gap-2 px-4">
			<Upload class="h-4 w-4" /> Upload via product
		</Button>
	</div>
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-6">
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
			{#each items as item (item.id)}
				<div class="overflow-hidden rounded-[10px] border border-border bg-card">
					<div class="flex aspect-square items-center justify-center bg-muted">
						{#if item.url}
							<img src={item.url} alt={item.alt || item.name} class="h-full w-full object-cover" />
						{:else}
							<Image class="h-6 w-6 text-muted-foreground" />
						{/if}
					</div>
					<div class="truncate px-2 py-1.5 text-[11px] text-muted-foreground" title={item.name}>
						{item.name}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
