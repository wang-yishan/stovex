<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageStatusBadge from '#lib/admin/components/PageStatusBadge.svelte';
	import SectionRenderer from '#lib/admin/components/SectionRenderer.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { ArrowLeft, FileText, History, PenLine } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Button } from '#lib/components/ui/button/index.ts';

	let { params }: PageProps = $props();
	let page = $derived(admin.pages.find((p) => p.id === params.id));
	let versions = $derived(page ? admin.pageVersions.filter((v) => v.pageId === page!.id) : []);
	let sortedSections = $derived(page ? [...page.sections].sort((a, b) => a.order - b.order) : []);
	let seoTitle = $derived(page?.seo.title || admin.settings.defaultSeo.title || page?.title || '');
	let seoDesc = $derived(page?.seo.description || admin.settings.defaultSeo.description || '');
	let canonical = $derived(page?.seo.canonical || `/${page?.slug ?? ''}`);

	// Keep page view stable when data is missing so the "not found" fallback can render.

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
	}
	function fmtDateTime(iso: string) {
		return new Date(iso).toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Topbar
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Pages & Landing Pages', href: '/dashboard/pages' },
		{ label: page?.title ?? params.id }
	]}
	title={page?.title ?? 'Page detail'}
	subtitle="Live section preview, SEO and published history."
	mobileSubtitle="Page detail"
>
	{#snippet actions()}
		{#if page}
			<Button
				variant="outline"
				size="icon"
				onclick={() => void goto(resolve('/dashboard/pages'))}
				aria-label="Back to pages"><ArrowLeft class="h-4 w-4" /></Button
			>
			<Button
				href={resolvePath(`/dashboard/pages/${page.id}/edit`)}
				class="shrink-0 whitespace-nowrap"><PenLine class="h-4 w-4 shrink-0" /> Edit</Button
			>
		{/if}
	{/snippet}
</Topbar>

{#if page}
	<div class="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 lg:px-8">
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<h2 class="text-[16px] font-semibold">{page.title}</h2>
			<PageStatusBadge status={page.status} />
			{#if page.isHomepage}
				<span
					class="rounded-full border bg-[#F0FAF6] px-2 py-0.5 text-[10px] text-[#1A7A52]"
					style="border-color: #C7EBDB;">Homepage</span
				>
			{/if}
			<div class="grid w-full grid-cols-3 gap-2 sm:ml-auto sm:flex sm:w-auto">
				<Button
					variant="outline"
					class="px-2 whitespace-nowrap sm:px-3"
					onclick={() => admin.duplicatePage(page!.id)}>Duplicate</Button
				>
				<Button
					variant="outline"
					class="px-2 whitespace-nowrap sm:px-3"
					onclick={() => admin.archivePage(page!.id)}>Archive</Button
				>
				<Button
					href={resolvePath(`/dashboard/pages/${page.id}/edit`)}
					class="px-2 whitespace-nowrap sm:px-4"><PenLine class="h-4 w-4 shrink-0" /> Edit</Button
				>
			</div>
		</div>

		<div class="grid gap-4 lg:grid-cols-12">
			<div class="space-y-4 lg:col-span-8">
				<div class="rounded-[12px] border border-border bg-card p-4">
					<p class="text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
						Live preview — {sortedSections.filter((s) => s.visible).length} visible sections
					</p>
					<div class="mt-4 space-y-6">
						{#each sortedSections as s (s.id)}
							<SectionRenderer section={s} />
						{/each}
						{#if sortedSections.length === 0}
							<p class="text-[12px] text-muted-foreground">
								No sections yet. Open the editor to add one.
							</p>
						{/if}
					</div>
				</div>
			</div>

			<div class="space-y-4 lg:col-span-4">
				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
						SEO preview
					</h3>
					<div class="mt-3 rounded-[8px] border border-border bg-field p-3">
						<div class="truncate text-[11px] font-medium text-[#1A0DAB]">{seoTitle}</div>
						<div class="truncate text-[10px] text-[#006621]">bagstore.example{canonical}</div>
						<p class="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
							{seoDesc || 'No description — default SEO will be used.'}
						</p>
						{#if page.seo.image || admin.settings.defaultSeo.image}
							<div class="mt-2 text-[10px] text-muted-foreground">
								OG image: {(page.seo.image || admin.settings.defaultSeo.image).slice(0, 48)}…
							</div>
						{/if}
					</div>
					<dl class="mt-3 space-y-2 text-[12px]">
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Slug</dt>
							<dd class="mono">/{page.slug}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Type</dt>
							<dd>{page.type}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Published</dt>
							<dd>{page.publishedAt ? fmtDate(page.publishedAt) : '—'}</dd>
						</div>
					</dl>
				</div>

				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3
						class="flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
					>
						<History class="h-3.5 w-3.5" /> History
					</h3>
					{#if versions.length === 0}
						<p class="mt-2 text-[12px] text-muted-foreground">
							No published versions yet. Publish to create one.
						</p>
					{:else}
						<div class="mt-3 space-y-2">
							{#each versions as v (v.id)}
								<div
									class="flex items-center justify-between gap-2 rounded-[8px] border border-border p-2.5"
								>
									<div>
										<div class="text-[12px] font-medium">Version {v.ver}</div>
										<div class="text-[10px] text-muted-foreground">
											{fmtDateTime(v.publishedAt)} • {v.sections.length} sections
										</div>
									</div>
									<Button
										variant="outline"
										size="xs"
										class="h-7 px-2.5"
										onclick={() => admin.restoreVersion(v.id)}>Restore</Button
									>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-[1280px] px-4 py-16 text-center">
		<div
			class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted"
		>
			<FileText class="h-6 w-6 text-muted-foreground" />
		</div>
		<h3 class="text-[14px] font-semibold">Page not found</h3>
		<p class="mt-1 text-[12px] text-muted-foreground">
			The page you’re looking for doesn’t exist or may have been removed.
		</p>
		<Button href={resolve('/dashboard/pages')} class="mt-4 px-4">Back to pages</Button>
	</div>
{/if}
