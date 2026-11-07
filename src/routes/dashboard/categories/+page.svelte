<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { slugify } from '#lib/admin/data.ts';
	import type { Category } from '#lib/admin/types.ts';
	import { PenLine, Plus, Trash2 } from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let editing = $state<{ mode: 'create' | 'edit'; cat?: Category } | null>(null);
	let draft = $state({ name: '', slug: '', description: '' });
	let deleteId = $state<string | null>(null);
	let reassignTo = $state('');

	let filtered = $derived(
		admin.categories.filter(
			(c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase())
		)
	);
	let counts = $derived.by(() => {
		const m: Record<string, number> = {};
		for (const c of admin.categories) m[c.id] = 0;
		for (const p of admin.products) if (m[p.categoryId] !== undefined) m[p.categoryId]++;
		return m;
	});

	function startCreate() {
		draft = { name: '', slug: '', description: '' };
		editing = { mode: 'create' };
	}
	function startEdit(c: Category) {
		draft = { name: c.name, slug: c.slug, description: c.description ?? '' };
		editing = { mode: 'edit', cat: c };
	}
	function save() {
		if (!draft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		if (!admin.slugUnique(draft.slug, editing?.cat?.id, 'category')) {
			admin.showToast('Slug must be unique', 'error');
			return;
		}
		if (editing?.mode === 'create') {
			admin.createCategory({ name: draft.name, slug: draft.slug || slugify(draft.name), description: draft.description });
			admin.showToast('Category created', 'success');
		} else if (editing?.cat) {
			admin.updateCategory({ id: editing.cat.id, name: draft.name, slug: draft.slug, description: draft.description });
			admin.showToast('Category updated', 'success');
		}
		editing = null;
	}
	function doDelete() {
		if (!deleteId) return;
		const n = counts[deleteId] ?? 0;
		if (n > 0 && !reassignTo) {
			admin.showToast('Reassign products before delete', 'error');
			return;
		}
		admin.deleteCategory(deleteId, reassignTo || undefined);
		admin.showToast('Category deleted', 'success');
		deleteId = null;
		reassignTo = '';
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Categories' }]}
	title="Categories"
	subtitle="Organize your catalog."
/>

<div class="mx-auto max-w-[1280px] w-full {isMobile ? 'px-4 py-4 pb-[112px]' : 'px-4 md:px-6 lg:px-8 py-6'}">
	<div class="bg-white border rounded-[12px] p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 justify-between" style="border-color: var(--border);">
		<SearchInput bind:value={search} placeholder="Search categories..." />
		<button type="button" onclick={startCreate} class="h-10 sm:h-9 rounded-full bg-[#343434] text-white px-4 text-[12px] font-medium flex items-center justify-center gap-1.5">
			<Plus class="h-4 w-4 shrink-0" /> Create Category
		</button>
	</div>

	<div class="bg-white border rounded-[12px] overflow-hidden" style="border-color: var(--border);">
		{#if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="bg-[#FBFBFA] border-b text-[10px] font-semibold tracking-[0.08em] uppercase text-[#999]" style="border-color: var(--border);">
							<th class="px-5 py-2.5">Name</th>
							<th class="px-5 py-2.5">Slug</th>
							<th class="px-5 py-2.5">Description</th>
							<th class="px-5 py-2.5">Products</th>
							<th class="px-5 py-2.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y" style="border-color: var(--border);">
						{#each filtered as c (c.id)}
							<tr class="hover:bg-[#F8F8F7]">
								<td class="px-5 py-3 text-[13px] font-medium">{c.name}</td>
								<td class="px-5 py-3 mono text-[11px] text-[#777]">{c.slug}</td>
								<td class="px-5 py-3 text-[12px] text-[#5A5A5A] max-w-[260px] truncate">{c.description || '—'}</td>
								<td class="px-5 py-3 text-[12px]">{counts[c.id] ?? 0}</td>
								<td class="px-5 py-3 text-right">
									<div class="flex justify-end gap-1">
										<button type="button" class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]" style="border-color: var(--border);" onclick={() => startEdit(c)} aria-label="Edit"><PenLine class="h-3.5 w-3.5 text-[#777]" /></button>
										<button type="button" class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424] hover:bg-[#FFF0F0]" style="border-color: var(--border);" onclick={() => { deleteId = c.id; reassignTo = ''; }} aria-label="Delete"><Trash2 class="h-3.5 w-3.5 text-[#777]" /></button>
									</div>
								</td>
							</tr>
						{/each}
						{#if filtered.length === 0}
							<tr><td colspan="5" class="px-5 py-12 text-center">
								<div class="text-[13px] font-medium">No categories</div>
								<div class="text-[11px] text-[#777] mt-1">Empty/error states handled — create first category</div>
							</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y" style="border-color: var(--border);">
				{#each filtered as c (c.id)}
					<div class="p-4 flex justify-between gap-3">
						<div>
							<div class="text-[13px] font-medium">{c.name}</div>
							<div class="mono text-[11px] text-[#777]">{c.slug} • {counts[c.id] ?? 0} products</div>
						</div>
						<div class="flex gap-1">
							<button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white" style="border-color: var(--border);" onclick={() => startEdit(c)} aria-label="Edit"><PenLine class="h-4 w-4 text-[#777]" /></button>
							<button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white" style="border-color: var(--border);" onclick={() => { deleteId = c.id; reassignTo = ''; }} aria-label="Delete"><Trash2 class="h-4 w-4 text-[#777]" /></button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if editing}
	<Modal title={editing.mode === 'create' ? 'Create Category' : 'Edit Category'}>
		<div class="mt-3 space-y-3">
			<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]" style="border-color: var(--border);" placeholder="Name" bind:value={draft.name} oninput={() => (draft.slug = slugify(draft.name))} />
			<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] mono" style="border-color: var(--border);" placeholder="Slug" bind:value={draft.slug} />
			<textarea rows="2" class="w-full rounded-[8px] border px-3 py-2 text-[13px]" style="border-color: var(--border);" placeholder="Description" bind:value={draft.description}></textarea>
			<p class="text-[10px] text-[#777]">Unique slug validation enforced.</p>
		</div>
		<div class="flex gap-2 mt-4">
			<button type="button" class="flex-1 h-10 rounded-full bg-[#242424] text-white text-[12px]" onclick={save}>Save</button>
			<button type="button" class="flex-1 h-10 rounded-full border bg-white text-[12px]" style="border-color: var(--border);" onclick={() => (editing = null)}>Cancel</button>
		</div>
	</Modal>
{/if}

{#if deleteId}
	<Modal title="Delete category?">
		<p class="text-[12px] text-[#777] mt-1">Prevent deletion when products depend unless reassigned (show reassignment dropdown).</p>
		{#if (counts[deleteId] ?? 0) > 0}
			<div class="mt-3">
				<label for="reassign-to" class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">Reassign products to</label>
				<select id="reassign-to" class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-white" style="border-color: var(--border);" bind:value={reassignTo}>
					<option value="">Select category</option>
					{#each admin.categories.filter((c) => c.id !== deleteId) as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>
				<p class="text-[11px] text-[#777] mt-1">{counts[deleteId]} products depend on this category.</p>
			</div>
		{/if}
		<div class="flex gap-2 mt-4">
			<button type="button" class="flex-1 h-10 rounded-full bg-[#D9534F] text-white text-[12px]" onclick={doDelete}>Delete</button>
			<button type="button" class="flex-1 h-10 rounded-full border bg-white text-[12px]" style="border-color: var(--border);" onclick={() => (deleteId = null)}>Cancel</button>
		</div>
	</Modal>
{/if}
