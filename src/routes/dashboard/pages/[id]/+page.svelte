<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageStatusBadge from '#lib/admin/components/PageStatusBadge.svelte';
	import SectionRenderer from '#lib/admin/components/SectionRenderer.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { ArrowLeft, History, PenLine } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	let page = $derived(admin.pages.find((p) => p.id === params.id));
	let versions = $derived(page ? admin.pageVersions.filter((v) => v.pageId === page!.id) : []);
	let sortedSections = $derived(page ? [...page.sections].sort((a, b) => a.order - b.order) : []);
	let seoTitle = $derived(page?.seo.title || admin.settings.defaultSeo.title || page?.title || '');
	let seoDesc = $derived(page?.seo.description || admin.settings.defaultSeo.description || '');
	let canonical = $derived(page?.seo.canonical || `/${page?.slug ?? ''}`);

	$effect(() => {
		// unknown id → back to list
		if (!page) {
			// avoid flash loop on first paint when navigating; goto list.
			void goto(resolve('/dashboard/pages' as Path));
		}
	});

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
	}
	function fmtDateTime(iso: string) {
		return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pages & Landing Pages', href: '/dashboard/pages' }, { label: page?.title ?? params.id }]}
	title={page?.title ?? 'Page detail'}
	subtitle="Live section preview, SEO and published history."
	mobileSubtitle="Page detail"
>
	{#snippet actions()}
		{#if page}
			<button type="button" onclick={() => void goto(resolve('/dashboard/pages' as Path))} class="h-10 w-10 sm:h-8 sm:w-8 rounded-full border bg-white flex items-center justify-center shrink-0" style="border-color: var(--border);" aria-label="Back to pages"><ArrowLeft class="h-4 w-4" /></button>
			<a href={resolve(`/dashboard/pages/${page.id}/edit` as Path)} class="h-10 sm:h-8 rounded-full bg-[#343434] text-white px-4 text-[12px] font-medium flex items-center gap-1.5 hover:bg-[#242424] transition whitespace-nowrap shrink-0"><PenLine class="h-4 w-4 shrink-0" /> Edit</a>
		{/if}
	{/snippet}
</Topbar>

{#if page}
	<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-6">
		<div class="flex flex-wrap items-center gap-2 mb-4">
			<h2 class="text-[16px] font-semibold">{page.title}</h2>
			<PageStatusBadge status={page.status} />
			{#if page.isHomepage}
				<span class="text-[10px] px-2 py-0.5 rounded-full bg-[#F0FAF6] border text-[#1A7A52]" style="border-color: #C7EBDB;">Homepage</span>
			{/if}
			<div class="w-full sm:w-auto sm:ml-auto grid grid-cols-3 sm:flex gap-2">
				<button type="button" onclick={() => admin.duplicatePage(page!.id)} class="h-10 sm:h-8 px-2 sm:px-3 rounded-full border bg-white text-[12px] font-medium whitespace-nowrap" style="border-color: var(--border);">Duplicate</button>
				<button type="button" onclick={() => admin.archivePage(page!.id)} class="h-10 sm:h-8 px-2 sm:px-3 rounded-full border bg-white text-[12px] font-medium whitespace-nowrap" style="border-color: var(--border);">Archive</button>
				<a href={resolve(`/dashboard/pages/${page.id}/edit` as Path)} class="h-10 sm:h-8 rounded-full bg-[#343434] text-white px-2 sm:px-4 text-[12px] font-medium flex items-center justify-center gap-1.5 whitespace-nowrap"><PenLine class="h-4 w-4 shrink-0" /> Edit</a>
			</div>
		</div>

		<div class="grid lg:grid-cols-12 gap-4">
			<div class="lg:col-span-8 space-y-4">
				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<p class="text-[11px] uppercase tracking-[0.08em] text-[#777]">Live preview — {sortedSections.filter((s) => s.visible).length} visible sections</p>
					<div class="mt-4 space-y-6">
						{#each sortedSections as s (s.id)}
							<SectionRenderer section={s} />
						{/each}
						{#if sortedSections.length === 0}
							<p class="text-[12px] text-[#777]">No sections yet. Open the editor to add one.</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="lg:col-span-4 space-y-4">
				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777]">SEO preview</h3>
					<div class="mt-3 border rounded-[8px] p-3 bg-[#FBFBFA]" style="border-color: var(--border);">
						<div class="text-[11px] text-[#1A0DAB] font-medium truncate">{seoTitle}</div>
						<div class="text-[10px] text-[#006621] truncate">bagstore.example{canonical}</div>
						<p class="text-[11px] text-[#545454] mt-1 line-clamp-2">{seoDesc || 'No description — default SEO will be used.'}</p>
						{#if page.seo.image || admin.settings.defaultSeo.image}
							<div class="mt-2 text-[10px] text-[#777]">OG image: {(page.seo.image || admin.settings.defaultSeo.image).slice(0, 48)}…</div>
						{/if}
					</div>
					<dl class="mt-3 space-y-2 text-[12px]">
						<div class="flex justify-between"><dt class="text-[#777]">Slug</dt><dd class="mono">/{page.slug}</dd></div>
						<div class="flex justify-between"><dt class="text-[#777]">Type</dt><dd>{page.type}</dd></div>
						<div class="flex justify-between"><dt class="text-[#777]">Published</dt><dd>{page.publishedAt ? fmtDate(page.publishedAt) : '—'}</dd></div>
					</dl>
				</div>

				<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
					<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777] flex items-center gap-1.5"><History class="h-3.5 w-3.5" /> History</h3>
					{#if versions.length === 0}
						<p class="text-[12px] text-[#777] mt-2">No published versions yet. Publish to create one.</p>
					{:else}
						<div class="space-y-2 mt-3">
							{#each versions as v (v.id)}
								<div class="flex items-center justify-between gap-2 border rounded-[8px] p-2.5" style="border-color: var(--border);">
									<div>
										<div class="text-[12px] font-medium">Version {v.ver}</div>
										<div class="text-[10px] text-[#777]">{fmtDateTime(v.publishedAt)} • {v.sections.length} sections</div>
									</div>
									<button type="button" onclick={() => admin.restoreVersion(v.id)} class="h-7 px-2.5 rounded-full border bg-white text-[11px] font-medium flex items-center gap-1" style="border-color: var(--border);">Restore</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-6 text-[13px] text-[#777]">Page not found.</div>
{/if}
