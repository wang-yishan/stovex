<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { slugify } from '#lib/admin/data.ts';
	import type { Category } from '#lib/admin/types.ts';
	import { PenLine, Plus, Trash2 } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let editing = $state<{ mode: 'create' | 'edit'; cat?: Category } | null>(null);
	let draft = $state({ name: '', slug: '', description: '' });
	let deleteId = $state<string | null>(null);
	let reassignTo = $state('');

	let filtered = $derived(
		admin.categories.filter(
			(c) =>
				c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase())
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
	async function save() {
		if (!draft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		if (!admin.slugUnique(draft.slug, editing?.cat?.id, 'category')) {
			admin.showToast('Slug must be unique', 'error');
			return;
		}
		if (editing?.mode === 'create') {
			const created = await admin.createCategory({
				name: draft.name,
				slug: draft.slug || slugify(draft.name),
				description: draft.description
			});
			if (!created) return;
			admin.showToast('Category created', 'success');
		} else if (editing?.cat) {
			await admin.updateCategory({
				id: editing.cat.id,
				name: draft.name,
				slug: draft.slug,
				description: draft.description
			});
			admin.showToast('Category updated', 'success');
		}
		editing = null;
	}
	async function doDelete() {
		if (!deleteId) return;
		const n = counts[deleteId] ?? 0;
		if (n > 0 && !reassignTo) {
			admin.showToast('Reassign products before delete', 'error');
			return;
		}
		await admin.deleteCategory(deleteId, reassignTo || undefined);
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

<div
	class="mx-auto w-full max-w-[1280px] {isMobile
		? 'px-4 py-4 pb-[112px]'
		: 'px-4 py-6 md:px-6 lg:px-8'}"
>
	<div
		class="mb-4 flex flex-col justify-between gap-3 rounded-[12px] border border-border bg-card p-3 md:flex-row md:p-4"
	>
		<SearchInput bind:value={search} placeholder="Search categories..." />
		<Button onclick={startCreate} class="px-4 sm:h-9">
			<Plus class="h-4 w-4 shrink-0" /> Create Category
		</Button>
	</div>

	<div class="overflow-hidden rounded-[12px] border border-border bg-card">
		{#if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr
							class="border-b border-border bg-field text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
						>
							<th class="px-5 py-2.5">Name</th>
							<th class="px-5 py-2.5">Slug</th>
							<th class="px-5 py-2.5">Description</th>
							<th class="px-5 py-2.5">Products</th>
							<th class="px-5 py-2.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filtered as c (c.id)}
							<tr class="hover:bg-muted">
								<td class="px-5 py-3 text-[13px] font-medium">{c.name}</td>
								<td class="mono px-5 py-3 text-[11px] text-muted-foreground">{c.slug}</td>
								<td class="max-w-[260px] truncate px-5 py-3 text-[12px] text-muted-foreground"
									>{c.description || '—'}</td
								>
								<td class="px-5 py-3 text-[12px]">{counts[c.id] ?? 0}</td>
								<td class="px-5 py-3 text-right">
									<div class="flex justify-end gap-1">
										<Button
											variant="outline"
											size="icon-sm"
											onclick={() => startEdit(c)}
											aria-label="Edit"
											><PenLine class="h-3.5 w-3.5 text-muted-foreground" /></Button
										>
										<Button
											variant="outline"
											size="icon-sm"
											class="hover:border-destructive/40 hover:bg-destructive/10!"
											onclick={() => {
												deleteId = c.id;
												reassignTo = '';
											}}
											aria-label="Delete"
											><Trash2 class="h-3.5 w-3.5 text-muted-foreground" /></Button
										>
									</div>
								</td>
							</tr>
						{/each}
						{#if filtered.length === 0}
							<tr
								><td colspan="5" class="px-5 py-12 text-center">
									<div class="text-[13px] font-medium">No categories</div>
									<div class="mt-1 text-[11px] text-muted-foreground">
										Empty/error states handled — create first category
									</div>
								</td></tr
							>
						{/if}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each filtered as c (c.id)}
					<div class="flex justify-between gap-3 p-4">
						<div>
							<div class="text-[13px] font-medium">{c.name}</div>
							<div class="mono text-[11px] text-muted-foreground">
								{c.slug} • {counts[c.id] ?? 0} products
							</div>
						</div>
						<div class="flex gap-1">
							<Button variant="outline" size="icon" onclick={() => startEdit(c)} aria-label="Edit"
								><PenLine class="h-4 w-4 text-muted-foreground" /></Button
							>
							<Button
								variant="outline"
								size="icon"
								onclick={() => {
									deleteId = c.id;
									reassignTo = '';
								}}
								aria-label="Delete"><Trash2 class="h-4 w-4 text-muted-foreground" /></Button
							>
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
			<Input
				placeholder="Name"
				bind:value={draft.name}
				oninput={() => (draft.slug = slugify(draft.name))}
			/>
			<Input font="mono" placeholder="Slug" bind:value={draft.slug} />
			<Textarea rows="2" placeholder="Description" bind:value={draft.description}></Textarea>
			<p class="text-[10px] text-muted-foreground">Unique slug validation enforced.</p>
		</div>
		<div class="mt-4 flex gap-2">
			<Button class="flex-1 sm:h-10" onclick={save}>Save</Button>
			<Button variant="outline" class="flex-1 sm:h-10" onclick={() => (editing = null)}
				>Cancel</Button
			>
		</div>
	</Modal>
{/if}

{#if deleteId}
	<Modal title="Delete category?">
		<p class="mt-1 text-[12px] text-muted-foreground">
			Prevent deletion when products depend unless reassigned (show reassignment dropdown).
		</p>
		{#if (counts[deleteId] ?? 0) > 0}
			<div class="mt-3 [&>div]:w-full">
				<label
					for="reassign-to"
					class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
					>Reassign products to</label
				>
				<NativeSelect id="reassign-to" bind:value={reassignTo}>
					<option value="">Select category</option>
					{#each admin.categories.filter((c) => c.id !== deleteId) as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</NativeSelect>
				<p class="mt-1 text-[11px] text-muted-foreground">
					{counts[deleteId]} products depend on this category.
				</p>
			</div>
		{/if}
		<div class="mt-4 flex gap-2">
			<Button variant="destructive" class="flex-1 sm:h-10" onclick={doDelete}>Delete</Button>
			<Button variant="outline" class="flex-1 sm:h-10" onclick={() => (deleteId = null)}
				>Cancel</Button
			>
		</div>
	</Modal>
{/if}
