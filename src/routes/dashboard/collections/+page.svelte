<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { slugify } from '#lib/admin/data.ts';
	import type { Collection } from '#lib/admin/types.ts';
	import { ChevronDown, ChevronUp, PenLine, Plus, Trash2 } from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let editing = $state<{ mode: 'create' | 'edit'; col?: Collection } | null>(null);
	let draft = $state({ name: '', slug: '', description: '', coverImage: '', productIds: [] as string[] });
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
		draft = { name: c.name, slug: c.slug, description: c.description ?? '', coverImage: c.coverImage ?? '', productIds: [...c.productIds] };
		productSearch = '';
		editing = { mode: 'edit', col: c };
	}
	function save() {
		if (!draft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		if (!admin.slugUnique(draft.slug, editing?.col?.id, 'collection')) {
			admin.showToast('Slug must be unique', 'error');
			return;
		}
		if (editing?.mode === 'create') {
			admin.createCollection({
				name: draft.name,
				slug: draft.slug || slugify(draft.name),
				description: draft.description,
				coverImage: draft.coverImage,
				productIds: draft.productIds
			});
			admin.showToast('Collection created', 'success');
		} else if (editing?.col) {
			admin.updateCollection({
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

<div class="mx-auto max-w-[1280px] w-full {isMobile ? 'px-4 py-4 pb-[112px]' : 'px-4 md:px-6 lg:px-8 py-6'}">
	<div class="bg-white border rounded-[12px] p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 justify-between" style="border-color: var(--border);">
		<SearchInput bind:value={search} placeholder="Search collections..." />
		<button type="button" onclick={startCreate} class="h-10 sm:h-9 rounded-full bg-[#343434] text-white px-4 text-[12px] font-medium flex items-center justify-center gap-1.5">
			<Plus class="h-4 w-4 shrink-0" /> Create Collection
		</button>
	</div>

	<div class="bg-white border rounded-[12px] overflow-hidden" style="border-color: var(--border);">
		{#if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="bg-[#FBFBFA] border-b text-[10px] font-semibold tracking-[0.08em] uppercase text-[#999]" style="border-color: var(--border);">
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
										<button type="button" class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]" style="border-color: var(--border);" onclick={() => admin.moveCollection(c.id, -1)} aria-label="Move up"><ChevronUp class="h-3.5 w-3.5 text-[#777]" /></button>
										<button type="button" class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]" style="border-color: var(--border);" onclick={() => admin.moveCollection(c.id, 1)} aria-label="Move down"><ChevronDown class="h-3.5 w-3.5 text-[#777]" /></button>
									</div>
								</td>
								<td class="px-5 py-3 text-[13px] font-medium">{c.name}</td>
								<td class="px-5 py-3 mono text-[11px] text-[#777]">{c.slug}</td>
								<td class="px-5 py-3 text-[12px] text-[#5A5A5A] max-w-[200px] truncate">{c.description || '—'}</td>
								<td class="px-5 py-3"><div class="h-8 w-8 rounded-[6px] bg-[#F5F5F4] border flex items-center justify-center text-[10px]" style="border-color: var(--border);">{c.coverImage ? 'IMG' : '—'}</div></td>
								<td class="px-5 py-3 text-[12px]">{c.productIds.length}</td>
								<td class="px-5 py-3 text-right">
									<div class="flex justify-end gap-1">
										<button type="button" class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]" style="border-color: var(--border);" onclick={() => startEdit(c)} aria-label="Edit"><PenLine class="h-3.5 w-3.5 text-[#777]" /></button>
										<button type="button" class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424] hover:bg-[#FFF0F0]" style="border-color: var(--border);" onclick={() => { admin.deleteCollection(c.id); admin.showToast('Collection deleted', 'success'); }} aria-label="Delete"><Trash2 class="h-3.5 w-3.5 text-[#777]" /></button>
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
					<div class="p-4 flex justify-between gap-3">
						<div>
							<div class="text-[13px] font-medium">{c.name}</div>
							<div class="mono text-[11px] text-[#777]">{c.slug} • {c.productIds.length} products</div>
						</div>
						<div class="flex gap-1">
							<button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white" style="border-color: var(--border);" onclick={() => admin.moveCollection(c.id, -1)} aria-label="Move up"><ChevronUp class="h-4 w-4 text-[#777]" /></button>
							<button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white" style="border-color: var(--border);" onclick={() => startEdit(c)} aria-label="Edit"><PenLine class="h-4 w-4 text-[#777]" /></button>
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
		<div class="max-h-[70vh] overflow-y-auto -mx-1 px-1">
			<div class="mt-3 space-y-3">
				<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]" style="border-color: var(--border);" placeholder="Name" bind:value={draft.name} oninput={() => (draft.slug = slugify(draft.name))} />
				<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] mono" style="border-color: var(--border);" placeholder="Slug" bind:value={draft.slug} />
				<textarea rows="2" class="w-full rounded-[8px] border px-3 py-2 text-[13px]" style="border-color: var(--border);" placeholder="Description" bind:value={draft.description}></textarea>
				<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]" style="border-color: var(--border);" placeholder="Cover image URL optional (reference)" bind:value={draft.coverImage} />
				<div>
					<span class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">Assign products (multi-select search)</span>
					<SearchInput
						bind:value={productSearch}
						placeholder="Search products..."
						size="sm"
						wrapperClass="relative mt-1"
					/>
					<div class="mt-2 border rounded-[8px] max-h-[160px] overflow-y-auto p-2" style="border-color: var(--border);">
						{#each productOptions as p (p.id)}
							<label class="flex items-center gap-2 py-1 text-[12px]">
								<input type="checkbox" checked={draft.productIds.includes(p.id)} onchange={(e) => toggleProduct(p.id, (e.currentTarget as HTMLInputElement).checked)} class="rounded" />
								{p.name} <span class="text-[10px] text-[#999] mono">{p.sku}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>
			<div class="flex gap-2 mt-4">
				<button type="button" class="flex-1 h-10 rounded-full bg-[#242424] text-white text-[12px]" onclick={save}>Save</button>
				<button type="button" class="flex-1 h-10 rounded-full border bg-white text-[12px]" style="border-color: var(--border);" onclick={() => (editing = null)}>Cancel</button>
			</div>
		</div>
	</Modal>
{/if}
