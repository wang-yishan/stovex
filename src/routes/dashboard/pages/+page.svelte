<script lang="ts">
	import { resolve } from '$app/paths';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import PageStatusBadge from '#lib/admin/components/PageStatusBadge.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { Archive, Copy, Ellipsis, Home, Plus, Search, Trash2 } from '@lucide/svelte';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';

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
		<Button variant="outline" href={resolve('/dashboard/storefront')}>
			<Ellipsis class="h-4 w-4 shrink-0" /> Storefront
		</Button>
		<Button href={resolve('/dashboard/pages/new')}>
			<Plus class="h-4 w-4 shrink-0" /> New Page
		</Button>
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 lg:px-8">
	<div class="mb-4 grid grid-cols-3 gap-3">
		<div class="rounded-[12px] border border-border bg-card p-3.5">
			<div class="text-[11px] tracking-[0.08em] text-muted-foreground uppercase">Total pages</div>
			<div class="mt-1 text-[22px] font-semibold">{admin.pages.length}</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-3.5">
			<div class="text-[11px] tracking-[0.08em] text-muted-foreground uppercase">Published</div>
			<div class="mt-1 text-[22px] font-semibold">{publishedCount}</div>
		</div>
		<div class="rounded-[12px] border bg-[#FFFDF3] p-3.5" style="border-color: #F0D99E;">
			<div class="text-[11px] tracking-[0.08em] text-[#8A6A24] uppercase">Homepage</div>
			<div class="mt-1.5 truncate text-[13px] font-semibold">{homepageTitle}</div>
		</div>
	</div>

	<div class="mb-4 rounded-[12px] border border-border bg-card p-3 md:p-4">
		<div class="flex flex-col justify-between gap-3 md:flex-row">
			<div class="relative flex-1">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					shape="pill"
					value={search}
					oninput={(e) => (search = (e.currentTarget as HTMLInputElement).value)}
					placeholder="Search pages by title or slug…"
					class="pl-9"
				/>
			</div>
			<div class="flex flex-wrap gap-2">
				<NativeSelect
					shape="pill"
					size="md"
					value={typeFilter}
					onchange={(e) =>
						(typeFilter = (e.currentTarget as HTMLSelectElement).value as typeof typeFilter)}
				>
					<option value="all">All types</option>
					<option value="homepage">Homepage</option>
					<option value="campaign">Campaign</option>
				</NativeSelect>
				<NativeSelect
					shape="pill"
					size="md"
					value={statusFilter}
					onchange={(e) =>
						(statusFilter = (e.currentTarget as HTMLSelectElement).value as typeof statusFilter)}
				>
					<option value="all">All status</option>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
					<option value="archived">Archived</option>
				</NativeSelect>
			</div>
		</div>
	</div>

	<div class="overflow-hidden rounded-[12px] border border-border bg-card">
		{#if filtered.length === 0}
			<div class="px-6 py-12 text-center">
				<h3 class="text-[14px] font-semibold">No pages match</h3>
				<p class="mt-1 text-[12px] text-muted-foreground">
					Adjust search or filters, or create a page.
				</p>
				<Button href={resolve('/dashboard/pages/new')} class="mt-4 h-9 px-5 text-[12px] sm:h-8"
					>Create page</Button
				>
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each filtered as p (p.id)}
					<div class="flex flex-col gap-3 p-4 md:flex-row md:items-center">
						<div class="min-w-0 flex-1">
							<a
								href={resolvePath(`/dashboard/pages/${p.id}`)}
								class="text-left text-[14px] font-medium hover:underline">{p.title}</a
							>
							<div class="mono mt-0.5 text-[11px] text-muted-foreground">
								/{p.slug} • {p.sections.length} sections • updated {fmtDate(p.updatedAt)}
							</div>
							<div class="mt-2 flex flex-wrap gap-1.5">
								<span class="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]"
									>{p.type}</span
								>
								<PageStatusBadge status={p.status} />
								{#if p.isHomepage}
									<span
										class="rounded-full border bg-[#F0FAF6] px-2 py-0.5 text-[10px] text-[#1A7A52]"
										style="border-color: #C7EBDB;">Homepage</span
									>
								{/if}
							</div>
						</div>
						<div class="flex flex-wrap gap-1.5">
							<Button variant="outline" size="xs" href={resolvePath(`/dashboard/pages/${p.id}`)}
								>View</Button
							>
							<Button
								variant="outline"
								size="xs"
								href={resolvePath(`/dashboard/pages/${p.id}/edit`)}>Edit</Button
							>
							{#if !p.isHomepage}
								<Button variant="outline" size="xs" onclick={() => admin.setHomepage(p.id)}>
									<Home class="inline h-3.5 w-3.5" /> Set homepage
								</Button>
							{/if}
							<Button
								variant="outline"
								size="icon-xs"
								class="size-8 sm:size-8"
								onclick={() => admin.duplicatePage(p.id)}
								aria-label="Duplicate page"><Copy class="h-3.5 w-3.5" /></Button
							>
							<Button
								variant="outline"
								size="icon-xs"
								class="size-8 sm:size-8"
								onclick={() => admin.archivePage(p.id)}
								aria-label="Archive page"><Archive class="h-3.5 w-3.5" /></Button
							>
							<Button
								variant="outline"
								size="icon-xs"
								class="size-8 hover:bg-destructive/10 sm:size-8"
								onclick={() => (deleteId = p.id)}
								aria-label="Delete page"><Trash2 class="h-3.5 w-3.5" /></Button
							>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if deleteId}
	{@const target = admin.pages.find((p) => p.id === deleteId)}
	<div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
		<div class="w-full max-w-[380px] rounded-[12px] border border-border bg-card p-5">
			<h3 class="text-[14px] font-semibold">Delete page?</h3>
			<p class="mt-1 text-[12px] text-muted-foreground">
				This removes “{target?.title}” and its draft sections from this session. Published versions
				stay listed in History until the page is gone.
			</p>
			<div class="mt-4 flex gap-2">
				<Button
					variant="destructive"
					size="xs"
					class="flex-1 text-[12px]"
					onclick={() => {
						admin.deletePage(deleteId!);
						deleteId = null;
					}}>Delete</Button
				>
				<Button
					variant="outline"
					size="xs"
					class="flex-1 text-[12px]"
					onclick={() => (deleteId = null)}>Cancel</Button
				>
			</div>
		</div>
	</div>
{/if}
