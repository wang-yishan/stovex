<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { slugify } from '#lib/admin/data.ts';
	import type { Collection } from '#lib/admin/types.ts';
	import { ChevronDown, ChevronUp, PenLine, Plus, Trash2 } from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let editing = $state<{ mode: 'create' | 'edit'; col?: Collection } | null>(null);
	let draft = $state({
		name: '',
		slug: '',
		description: '',
		coverImage: '',
		productIds: [] as string[]
	});
	let productSearch = $state('');

	let sorted = $derived(
		[...admin.collections]
			.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
			.sort((a, b) => a.order - b.order)
	);
	let productOptions = $derived(
		admin.products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
	);

	function startCreate() {
		draft = { name: '', slug: '', description: '', coverImage: '', productIds: [] };
		productSearch = '';
		editing = { mode: 'create' };
	}
	function startEdit(c: Collection) {
		draft = {
			name: c.name,
			slug: c.slug,
			description: c.description ?? '',
			coverImage: c.coverImage ?? '',
			productIds: [...c.productIds]
		};
		productSearch = '';
		editing = { mode: 'edit', col: c };
	}
	async function save() {
		if (!draft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		if (!admin.slugUnique(draft.slug, editing?.col?.id, 'collection')) {
			admin.showToast('Slug must be unique', 'error');
			return;
		}
		if (editing?.mode === 'create') {
			const created = await admin.createCollection({
				name: draft.name,
				slug: draft.slug || slugify(draft.name),
				description: draft.description,
				coverImage: draft.coverImage,
				productIds: draft.productIds
			});
			if (!created) return;
			admin.showToast('Collection created', 'success');
		} else if (editing?.col) {
			await admin.updateCollection({
				...editing.col,
				name: draft.name,
				slug: draft.slug,
				description: draft.description,
				coverImage: draft.coverImage,
				productIds: draft.productIds
			});
			admin.showToast('Collection updated', 'success');
		}
		editing = null;
	}
	function toggleProduct(id: string, on: boolean) {
		draft.productIds = on ? [...draft.productIds, id] : draft.productIds.filter((x) => x !== id);
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Collections' }]}
	title="Collections"
	subtitle="Group products for the storefront."
/>

<div
	class="mx-auto w-full max-w-[1280px] {isMobile
		? 'px-4 py-4 pb-[112px]'
		: 'px-4 py-6 md:px-6 lg:px-8'}"
>
	<div
		class="mb-4 flex flex-col justify-between gap-3 rounded-[12px] border bg-white p-3 md:flex-row md:p-4"
		style="border-color: var(--border);"
	>
		<SearchInput bind:value={search} placeholder="Search collections..." />
		<Button onclick={startCreate} class="px-4">
			<Plus class="h-4 w-4 shrink-0" /> Create Collection
		</Button>
	</div>

	<div class="overflow-hidden rounded-[12px] border bg-white" style="border-color: var(--border);">
		{#if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr
							class="border-b bg-[#FBFBFA] text-[10px] font-semibold tracking-[0.08em] text-[#636363] uppercase"
							style="border-color: var(--border);"
						>
							<th class="px-5 py-2.5">Order</th>
							<th class="px-5 py-2.5">Name</th>
							<th class="px-5 py-2.5">Slug</th>
							<th class="px-5 py-2.5">Description</th>
							<th class="px-5 py-2.5">Cover</th>
							<th class="px-5 py-2.5">Products</th>
							<th class="px-5 py-2.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y" style="border-color: var(--border);">
						{#each sorted as c (c.id)}
							<tr class="hover:bg-[#F8F8F7]">
								<td class="px-5 py-3">
									<div class="flex gap-1">
										<Button
											variant="outline"
											size="icon-sm"
											onclick={() => void admin.moveCollection(c.id, -1)}
											aria-label="Move up"><ChevronUp class="h-3.5 w-3.5 text-[#5A5A5A]" /></Button
										>
										<Button
											variant="outline"
											size="icon-sm"
											onclick={() => void admin.moveCollection(c.id, 1)}
											aria-label="Move down"
											><ChevronDown class="h-3.5 w-3.5 text-[#5A5A5A]" /></Button
										>
									</div>
								</td>
								<td class="px-5 py-3 text-[13px] font-medium">{c.name}</td>
								<td class="mono px-5 py-3 text-[11px] text-[#5A5A5A]">{c.slug}</td>
								<td class="max-w-[200px] truncate px-5 py-3 text-[12px] text-[#5A5A5A]"
									>{c.description || '—'}</td
								>
								<td class="px-5 py-3"
									><div
										class="flex h-8 w-8 items-center justify-center rounded-[6px] border bg-[#F5F5F4] text-[10px]"
										style="border-color: var(--border);"
									>
										{c.coverImage ? 'IMG' : '—'}
									</div></td
								>
								<td class="px-5 py-3 text-[12px]">{c.productIds.length}</td>
								<td class="px-5 py-3 text-right">
									<div class="flex justify-end gap-1">
										<Button
											variant="outline"
											size="icon-sm"
											onclick={() => startEdit(c)}
											aria-label="Edit"><PenLine class="h-3.5 w-3.5 text-[#5A5A5A]" /></Button
										>
										<Button
											variant="outline"
											size="icon-sm"
											class="hover:border-destructive/40 hover:bg-destructive/10!"
											onclick={() => {
												admin.deleteCollection(c.id);
												admin.showToast('Collection deleted', 'success');
											}}
											aria-label="Delete"><Trash2 class="h-3.5 w-3.5 text-[#5A5A5A]" /></Button
										>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y" style="border-color: var(--border);">
				{#each sorted as c (c.id)}
					<div class="flex justify-between gap-3 p-4">
						<div>
							<div class="text-[13px] font-medium">{c.name}</div>
							<div class="mono text-[11px] text-[#5A5A5A]">
								{c.slug} • {c.productIds.length} products
							</div>
						</div>
						<div class="flex gap-1">
							<Button
								variant="outline"
								size="icon"
								class="shrink-0"
								onclick={() => admin.moveCollection(c.id, -1)}
								aria-label="Move up"><ChevronUp class="h-4 w-4 text-[#5A5A5A]" /></Button
							>
							<Button
								variant="outline"
								size="icon"
								class="shrink-0"
								onclick={() => startEdit(c)}
								aria-label="Edit"><PenLine class="h-4 w-4 text-[#5A5A5A]" /></Button
							>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if editing}
	<Modal title={editing.mode === 'create' ? 'Create Collection' : 'Edit Collection'}>
		<!-- max height scroll handled via inner div -->
		<div class="-mx-1 max-h-[70vh] overflow-y-auto px-1">
			<div class="mt-3 space-y-3">
				<Input
					class="w-full"
					placeholder="Name"
					bind:value={draft.name}
					oninput={() => (draft.slug = slugify(draft.name))}
				/>
				<Input font="mono" class="w-full" placeholder="Slug" bind:value={draft.slug} />
				<Textarea class="w-full" rows="2" placeholder="Description" bind:value={draft.description}
				></Textarea>
				<Input
					class="w-full"
					placeholder="Cover image URL optional (reference)"
					bind:value={draft.coverImage}
				/>
				<div>
					<span class="text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
						>Assign products (multi-select search)</span
					>
					<SearchInput
						bind:value={productSearch}
						placeholder="Search products..."
						size="sm"
						wrapperClass="relative mt-1"
					/>
					<div
						class="mt-2 max-h-[160px] overflow-y-auto rounded-[8px] border p-2"
						style="border-color: var(--border);"
					>
						{#each productOptions as p (p.id)}
							<label class="flex items-center gap-2 py-1 text-[12px]">
								<Checkbox
									checked={draft.productIds.includes(p.id)}
									onCheckedChange={(on) => toggleProduct(p.id, on)}
								/>
								{p.name} <span class="mono text-[10px] text-[#636363]">{p.sku}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>
			<div class="mt-4 flex gap-2">
				<Button class="flex-1" onclick={save}>Save</Button>
				<Button variant="outline" class="flex-1" onclick={() => (editing = null)}>Cancel</Button>
			</div>
		</div>
	</Modal>
{/if}
