<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageStatusBadge from '#lib/admin/components/PageStatusBadge.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { Archive, Copy, Ellipsis, Home, Plus, Search, Trash2 } from '@lucide/svelte';

	let search = $state('');
	let typeFilter = $state<'all' | 'homepage' | 'campaign'>('all');
	let statusFilter = $state<'all' | 'draft' | 'published' | 'archived'>('all');
	let deleteId = $state<string | null>(null);

	let filtered = $derived(
		admin.pages.filter((p) => {
			const q = search.toLowerCase();
			const okQ = !q || p.title.toLowerCase().includes(q) || p.slug.includes(q);
			const okT = typeFilter === 'all' || p.type === typeFilter;
			const okS = statusFilter === 'all' || p.status === statusFilter;
			return okQ && okT && okS;
		})
	);
	let publishedCount = $derived(admin.pages.filter((p) => p.status === 'published').length);
	let homepageTitle = $derived(admin.pages.find((p) => p.isHomepage)?.title ?? 'None set');

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
	}
</script>

<!--
	@component
	Pages & Landing Pages list (ref L2): stats, search/filters, homepage set,
	duplicate/archive/delete, empty state.
-->

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pages & Landing Pages' }]}
	title="Pages"
	subtitle="Manage landing pages • sections, SEO, homepage"
	mobileSubtitle="Manage landing pages"
>
	{#snippet actions()}
		<a href={resolve('/dashboard/storefront' as Path)} class="h-10 sm:h-8 rounded-full border bg-white px-4 text-[12px] font-medium flex items-center gap-1.5 hover:border-[#242424] transition" style="border-color: var(--border);">
			<Ellipsis class="h-4 w-4 shrink-0" /> Storefront
		</a>
		<a href={resolve('/dashboard/pages/new' as Path)} class="h-10 sm:h-8 rounded-full bg-[#343434] text-white px-4 text-[12px] font-medium flex items-center gap-1.5 hover:bg-[#242424] transition">
			<Plus class="h-4 w-4 shrink-0" /> New Page
		</a>
	{/snippet}
</Topbar>

<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-6">
	<div class="grid grid-cols-3 gap-3 mb-4">
		<div class="bg-white border rounded-[12px] p-3.5" style="border-color: var(--border);">
			<div class="text-[11px] uppercase tracking-[0.08em] text-[#999]">Total pages</div>
			<div class="text-[22px] font-semibold mt-1">{admin.pages.length}</div>
		</div>
		<div class="bg-white border rounded-[12px] p-3.5" style="border-color: var(--border);">
			<div class="text-[11px] uppercase tracking-[0.08em] text-[#999]">Published</div>
			<div class="text-[22px] font-semibold mt-1">{publishedCount}</div>
		</div>
		<div class="bg-[#FFFDF3] border rounded-[12px] p-3.5" style="border-color: #F0D99E;">
			<div class="text-[11px] uppercase tracking-[0.08em] text-[#8A6A24]">Homepage</div>
			<div class="text-[13px] font-semibold mt-1.5 truncate">{homepageTitle}</div>
		</div>
	</div>

	<div class="bg-white border rounded-[12px] p-3 md:p-4 mb-4" style="border-color: var(--border);">
		<div class="flex flex-col md:flex-row gap-3 justify-between">
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
				<input value={search} oninput={(e) => (search = (e.currentTarget as HTMLInputElement).value)} placeholder="Search pages by title or slug…" class="w-full h-9 pl-9 pr-3 rounded-full border bg-[#FBFBFA] text-[13px] focus:outline-none focus:border-[#242424]" style="border-color: var(--border);" />
			</div>
			<div class="flex flex-wrap gap-2">
				<select value={typeFilter} onchange={(e) => (typeFilter = (e.currentTarget as HTMLSelectElement).value as typeof typeFilter)} class="h-9 rounded-full border bg-white px-3 text-[12px]" style="border-color: var(--border);">
					<option value="all">All types</option>
					<option value="homepage">Homepage</option>
					<option value="campaign">Campaign</option>
				</select>
				<select value={statusFilter} onchange={(e) => (statusFilter = (e.currentTarget as HTMLSelectElement).value as typeof statusFilter)} class="h-9 rounded-full border bg-white px-3 text-[12px]" style="border-color: var(--border);">
					<option value="all">All status</option>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
					<option value="archived">Archived</option>
				</select>
			</div>
		</div>
	</div>

	<div class="bg-white border rounded-[12px] overflow-hidden" style="border-color: var(--border);">
		{#if filtered.length === 0}
			<div class="py-12 text-center px-6">
				<h3 class="text-[14px] font-semibold">No pages match</h3>
				<p class="text-[12px] text-[#777] mt-1">Adjust search or filters, or create a page.</p>
				<a href={resolve('/dashboard/pages/new' as Path)} class="mt-4 h-9 rounded-full bg-[#242424] text-white px-5 text-[12px] inline-flex items-center">Create page</a>
			</div>
		{:else}
			<div class="divide-y" style="border-color: var(--border);">
				{#each filtered as p (p.id)}
					<div class="p-4 flex flex-col md:flex-row md:items-center gap-3">
						<div class="flex-1 min-w-0">
							<a href={resolve(`/dashboard/pages/${p.id}` as Path)} class="text-[14px] font-medium hover:underline text-left">{p.title}</a>
							<div class="text-[11px] text-[#777] mt-0.5 mono">/{p.slug} • {p.sections.length} sections • updated {fmtDate(p.updatedAt)}</div>
							<div class="flex flex-wrap gap-1.5 mt-2">
								<span class="text-[10px] px-2 py-0.5 rounded-full border bg-[#F5F5F4]" style="border-color: var(--border);">{p.type}</span>
								<PageStatusBadge status={p.status} />
								{#if p.isHomepage}
									<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#F0FAF6] border text-[#1A7A52]" style="border-color: #C7EBDB;">Homepage</span>
								{/if}
							</div>
						</div>
						<div class="flex flex-wrap gap-1.5">
							<a href={resolve(`/dashboard/pages/${p.id}` as Path)} class="h-8 px-3 rounded-full border bg-white text-[11px] font-medium inline-flex items-center" style="border-color: var(--border);">View</a>
							<a href={resolve(`/dashboard/pages/${p.id}/edit` as Path)} class="h-8 px-3 rounded-full border bg-white text-[11px] font-medium inline-flex items-center" style="border-color: var(--border);">Edit</a>
							{#if !p.isHomepage}
								<button type="button" onclick={() => admin.setHomepage(p.id)} class="h-8 px-3 rounded-full border bg-white text-[11px] font-medium inline-flex items-center gap-1" style="border-color: var(--border);">
									<Home class="h-3.5 w-3.5 inline" /> Set homepage
								</button>
							{/if}
							<button type="button" onclick={() => admin.duplicatePage(p.id)} class="h-8 w-8 rounded-full border bg-white flex items-center justify-center" style="border-color: var(--border);" aria-label="Duplicate page"><Copy class="h-3.5 w-3.5" /></button>
							<button type="button" onclick={() => admin.archivePage(p.id)} class="h-8 w-8 rounded-full border bg-white flex items-center justify-center" style="border-color: var(--border);" aria-label="Archive page"><Archive class="h-3.5 w-3.5" /></button>
							<button type="button" onclick={() => (deleteId = p.id)} class="h-8 w-8 rounded-full border bg-white flex items-center justify-center hover:bg-[#FFF0F0]" style="border-color: var(--border);" aria-label="Delete page"><Trash2 class="h-3.5 w-3.5" /></button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if deleteId}
	{@const target = admin.pages.find((p) => p.id === deleteId)}
	<div class="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4">
		<div class="bg-white rounded-[12px] border max-w-[380px] w-full p-5" style="border-color: var(--border);">
			<h3 class="text-[14px] font-semibold">Delete page?</h3>
			<p class="text-[12px] text-[#777] mt-1">This removes “{target?.title}” and its draft sections from this session. Published versions stay listed in History until the page is gone.</p>
			<div class="flex gap-2 mt-4">
				<button type="button" onclick={() => { admin.deletePage(deleteId!); deleteId = null; }} class="flex-1 h-8 rounded-full bg-[#D9534F] text-white text-[12px]">Delete</button>
				<button type="button" onclick={() => (deleteId = null)} class="flex-1 h-8 rounded-full border bg-white text-[12px]" style="border-color: var(--border);">Cancel</button>
			</div>
		</div>
	</div>
{/if}
