<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { SECTION_TYPES, newSection, slugify, uid } from '#lib/admin/data.ts';
	import SectionRenderer from './SectionRenderer.svelte';
	import type { PageSection, SectionType, StorePage } from '#lib/admin/types.ts';
	import {
		ArrowDown,
		ArrowUp,
		Copy,
		Eye,
		EyeOff,
		History,
		Plus,
		Trash2,
		X
	} from '@lucide/svelte';

	let {
		mode,
		initialPage,
		onSave,
		onCancel
	}: {
		mode: 'create' | 'edit';
		initialPage: StorePage;
		onSave: (page: StorePage, action: 'draft' | 'publish' | 'archive') => void;
		onCancel: () => void;
	} = $props();

	const INPUT =
		'mt-1 w-full h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]';
	const TEXTAREA =
		'mt-1 w-full rounded-[8px] border px-3 py-2 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]';
	const LABEL = 'text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]';

	let draft = $state<StorePage>(structuredClone($state.snapshot(initialPage) as StorePage));
	let tab = $state<'edit' | 'preview'>('edit');
	let selectedId = $state<string>(draft.sections[0]?.id ?? '');
	let addOpen = $state(false);
	let historyOpen = $state(false);
	let slugManual = $state(mode === 'edit');

	$effect(() => {
		if (!slugManual) draft.slug = slugify(draft.title);
	});

	let selected = $derived(draft.sections.find((s) => s.id === selectedId));
	let sortedSections = $derived([...draft.sections].sort((a, b) => a.order - b.order));
	let versions = $derived(admin.pageVersions.filter((v) => v.pageId === draft.id));
	let slugValid = $derived(admin.pageSlugUnique(draft.slug, draft.id));

	function patchSection(id: string, patch: Partial<PageSection>) {
		draft.sections = draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s));
	}
	function patchContent(id: string, patch: Record<string, unknown>) {
		draft.sections = draft.sections.map((s) =>
			s.id === id ? { ...s, content: { ...s.content, ...patch } } : s
		);
	}
	function moveSection(id: string, dir: 1 | -1) {
		const list = [...draft.sections].sort((a, b) => a.order - b.order);
		const i = list.findIndex((s) => s.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= list.length) return;
		const [moved] = list.splice(i, 1);
		list.splice(j, 0, moved!);
		draft.sections = list.map((s, k) => ({ ...s, order: k }));
	}
	function duplicateSection(id: string) {
		const src = draft.sections.find((s) => s.id === id);
		if (!src) return;
		const copy = structuredClone($state.snapshot(src) as PageSection);
		copy.id = uid('sec-');
		copy.order = draft.sections.length;
		draft.sections = [...draft.sections, copy];
		selectedId = copy.id;
		admin.showToast('Section duplicated', 'success');
	}
	function deleteSection(id: string) {
		draft.sections = draft.sections.filter((s) => s.id !== id);
		if (selectedId === id) selectedId = draft.sections[0]?.id ?? '';
	}
	function addSection(type: SectionType) {
		const s = newSection(type, draft.sections.length);
		draft.sections = [...draft.sections, s];
		selectedId = s.id;
		addOpen = false;
		tab = 'edit';
		admin.showToast(`${s.label} added`, 'success');
	}

	function validate(): boolean {
		if (!draft.title.trim()) {
			admin.showToast('Page title required', 'error');
			return false;
		}
		if (!draft.slug.trim()) {
			admin.showToast('Slug required', 'error');
			return false;
		}
		if (!slugValid) {
			admin.showToast('Slug must be unique', 'error');
			return false;
		}
		return true;
	}

	function save(action: 'draft' | 'publish' | 'archive') {
		if (!validate()) return;
		const normalized: StorePage = {
			...draft,
			sections: [...draft.sections]
				.sort((a, b) => a.order - b.order)
				.map((s, i) => ({ ...s, order: i })),
			seo: { ...draft.seo, canonical: draft.seo.canonical || `/${draft.slug}` }
		};
		onSave(normalized, action);
	}

	function restoreVersion(vid: string) {
		const v = admin.pageVersions.find((x) => x.id === vid);
		if (!v) return;
		draft = { ...draft, title: v.title, sections: structuredClone(v.sections) };
		selectedId = draft.sections[0]?.id ?? '';
		historyOpen = false;
		admin.showToast(`Restored version ${v.ver} into editor`, 'success');
	}

	// helpers for per-type forms
	function str(v: unknown): string {
		return typeof v === 'string' ? v : '';
	}
	function num(v: unknown, fallback: number): number {
		return typeof v === 'number' ? v : fallback;
	}
	function strArr(v: unknown): string[] {
		return Array.isArray(v) ? (v as string[]) : [];
	}

	// benefits / testimonials row helpers
	type Benefit = { icon?: string; title?: string; description?: string };
	type Testimonial = { name?: string; text?: string; image?: string; rating?: number };
	function benefitsOf(s: PageSection): Benefit[] {
		return Array.isArray(s.content.items) ? (s.content.items as Benefit[]) : [];
	}
	function testimonialsOf(s: PageSection): Testimonial[] {
		return Array.isArray(s.content.items) ? (s.content.items as Testimonial[]) : [];
	}
	function galleryImages(s: PageSection): string[] {
		return Array.isArray(s.content.images) ? (s.content.images as string[]) : [];
	}
</script>

<!--
	@component
	Page / landing editor (ref Uy): draft copy, section list + per-type form,
	edit/preview toggle, page settings, SEO, history restore, lifecycle save.
-->

<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-24 lg:pb-6">
	<!-- toolbar: stacked 2x2 action grid on mobile, single row on >=md -->
	<div class="bg-white border rounded-[12px] p-3 md:p-4 mb-4 space-y-3" style="border-color: var(--border);">
		<div class="flex items-center gap-2">
			<div class="flex flex-1 sm:flex-none rounded-full border overflow-hidden" style="border-color: var(--border);">
				<button type="button" onclick={() => (tab = 'edit')} class="flex-1 sm:flex-none h-10 sm:h-8 px-4 text-[12px] font-medium {tab === 'edit' ? 'bg-[#242424] text-white' : 'bg-white'}">Edit</button>
				<button type="button" onclick={() => (tab = 'preview')} class="flex-1 sm:flex-none h-10 sm:h-8 px-4 text-[12px] font-medium {tab === 'preview' ? 'bg-[#242424] text-white' : 'bg-white'}">Preview</button>
			</div>
			<span class="text-[11px] text-[#777] whitespace-nowrap">{draft.sections.length} sections • {draft.sections.filter((s) => s.visible).length} visible</span>
		</div>
		<div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
			<button type="button" onclick={() => (historyOpen = true)} class="h-10 sm:h-8 px-3 rounded-full border bg-white text-[12px] font-medium flex items-center justify-center gap-1.5" style="border-color: var(--border);">
				<History class="h-3.5 w-3.5" /> History ({versions.length})
			</button>
			<button type="button" onclick={() => save('archive')} class="h-10 sm:h-8 px-3 rounded-full border bg-[#FFF8E6] text-[12px] font-medium" style="border-color: #F3D9A0;">Archive</button>
			<button type="button" onclick={() => save('draft')} class="h-10 sm:h-8 px-3 rounded-full border bg-white text-[12px] font-medium" style="border-color: var(--border);">Save Draft</button>
			<button type="button" onclick={() => save('publish')} class="h-10 sm:h-8 px-4 rounded-full bg-[#242424] text-white text-[12px] font-medium">Publish</button>
		</div>
	</div>

	<div class="grid lg:grid-cols-12 gap-4 items-start">
		<!-- Section list: horizontal snap strip on mobile, vertical rail on lg -->
		<div class="lg:col-span-3 bg-white border rounded-[12px] p-3 min-w-0" style="border-color: var(--border);">
			<div class="flex items-center justify-between px-1 mb-2">
				<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777]">Sections</h3>
				<button type="button" onclick={() => (addOpen = true)} class="h-10 sm:h-7 px-3 sm:px-2.5 rounded-full bg-[#242424] text-white text-[11px] font-medium flex items-center gap-1">
					<Plus class="h-3 w-3" /> Add
				</button>
			</div>
			<div class="flex lg:flex-col gap-2 lg:gap-0 lg:space-y-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1 snap-x lg:snap-none">
				{#each sortedSections as s (s.id)}
					<div class="shrink-0 w-[200px] lg:w-auto snap-start border rounded-[10px] p-2.5 {selectedId === s.id ? 'border-[#242424] bg-[#FBFBFA]' : 'bg-white'}" style="border-color: {selectedId === s.id ? '#242424' : 'var(--border)'};">
						<button type="button" onclick={() => { selectedId = s.id; tab = 'edit'; }} class="w-full text-left">
							<div class="flex items-center gap-2">
								<span class="text-[12px] font-medium flex-1 truncate">{s.label}</span>
								<span class="text-[10px] text-[#999]">{s.type}</span>
								{#if !s.visible}
									<EyeOff class="h-3.5 w-3.5 text-[#999]" />
								{/if}
							</div>
						</button>
						<div class="flex gap-1 mt-2">
							<button type="button" onclick={() => moveSection(s.id, -1)} class="h-8 w-8 lg:h-6 lg:w-6 rounded-full border bg-white flex items-center justify-center shrink-0" style="border-color: var(--border);" aria-label="Move up"><ArrowUp class="h-3 w-3" /></button>
							<button type="button" onclick={() => moveSection(s.id, 1)} class="h-8 w-8 lg:h-6 lg:w-6 rounded-full border bg-white flex items-center justify-center shrink-0" style="border-color: var(--border);" aria-label="Move down"><ArrowDown class="h-3 w-3" /></button>
							<button type="button" onclick={() => patchSection(s.id, { visible: !s.visible })} class="h-8 w-8 lg:h-6 lg:w-6 rounded-full border bg-white flex items-center justify-center shrink-0" style="border-color: var(--border);" aria-label="Toggle visible">
								{#if s.visible}<Eye class="h-3 w-3" />{:else}<EyeOff class="h-3 w-3" />{/if}
							</button>
							<button type="button" onclick={() => duplicateSection(s.id)} class="h-8 w-8 lg:h-6 lg:w-6 rounded-full border bg-white flex items-center justify-center shrink-0" style="border-color: var(--border);" aria-label="Duplicate section"><Copy class="h-3 w-3" /></button>
							<button type="button" onclick={() => deleteSection(s.id)} class="h-8 w-8 lg:h-6 lg:w-6 rounded-full border bg-white flex items-center justify-center shrink-0 hover:bg-[#FFF0F0]" style="border-color: var(--border);" aria-label="Delete section"><Trash2 class="h-3 w-3" /></button>
						</div>
					</div>
				{/each}
				{#if draft.sections.length === 0}
					<p class="text-[12px] text-[#777] p-2">No sections. Add your first section.</p>
				{/if}
			</div>
		</div>

		<!-- Editor / preview -->
		<div class="lg:col-span-6 space-y-4 min-w-0">
			{#if tab === 'preview'}
				<div class="space-y-6">
					<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
						<p class="text-[11px] text-[#777]">Preview — {draft.title || 'Untitled'} • /{draft.slug || 'slug'}</p>
					</div>
					{#each sortedSections as s (s.id)}
						<SectionRenderer section={s} />
					{/each}
				</div>
			{:else if !selected}
				<div class="bg-white border rounded-[12px] p-5 text-[13px] text-[#777]" style="border-color: var(--border);">
					Select a section on the left to edit it, or add a new section.
				</div>
			{:else}
				{@const c = selected.content}
				<div class="bg-white border rounded-[12px] p-4 md:p-5 space-y-4" style="border-color: var(--border);">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 class="text-[14px] font-semibold">{selected.label}</h3>
							<p class="text-[11px] text-[#777]">{SECTION_TYPES.find((t) => t.type === selected.type)?.desc}</p>
						</div>
						<label class="flex items-center gap-2 text-[12px]">
							Visible
							<button type="button" aria-label="Visible" onclick={() => patchSection(selected.id, { visible: !selected.visible })} class="h-5 w-9 rounded-full p-0.5 {selected.visible ? 'bg-[#242424]' : 'bg-[#EAEAEA]'}">
								<span class="block h-4 w-4 rounded-full bg-white transition-transform {selected.visible ? 'translate-x-4' : ''}"></span>
							</button>
						</label>
					</div>

					<div>
						<label class={LABEL} for="sec-label">Section label</label>
						<input id="sec-label" value={selected.label} oninput={(e) => patchSection(selected.id, { label: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
					</div>
					<div>
						<label class={LABEL} for="sec-layout">Layout</label>
						<select id="sec-layout" value={selected.layout} onchange={(e) => patchSection(selected.id, { layout: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
							<option value="standard">Standard</option>
							<option value="grid">Grid</option>
							<option value="masonry">Masonry</option>
							<option value="wide">Wide</option>
						</select>
					</div>

					{#if selected.type === 'hero'}
						<div>
							<label class={LABEL} for="hero-headline">Headline</label>
							<input id="hero-headline" value={str(c.headline)} oninput={(e) => patchContent(selected.id, { headline: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<div>
							<label class={LABEL} for="hero-desc">Description</label>
							<textarea id="hero-desc" value={str(c.description)} oninput={(e) => patchContent(selected.id, { description: (e.currentTarget as HTMLTextAreaElement).value })} rows={2} class={TEXTAREA}></textarea>
						</div>
						<div>
							<label class={LABEL} for="hero-image">Hero image</label>
							<select id="hero-image" value={str(c.image)} onchange={(e) => patchContent(selected.id, { image: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
								<option value="">— No image —</option>
								{#each admin.media as m (m.id)}
									<option value={m.url}>{m.name}</option>
								{/each}
							</select>
							{#if str(c.image)}
								<img src={str(c.image)} alt="Hero" class="mt-2 h-[100px] w-full object-cover rounded-[8px]" />
							{/if}
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label class={LABEL} for="hero-cta">CTA label</label>
								<input id="hero-cta" value={str(c.ctaLabel)} oninput={(e) => patchContent(selected.id, { ctaLabel: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
							</div>
							<div>
								<label class={LABEL} for="hero-href">CTA link</label>
								<input id="hero-href" value={str(c.ctaHref)} oninput={(e) => patchContent(selected.id, { ctaHref: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
							</div>
						</div>
						<div>
							<label class={LABEL} for="hero-align">Align</label>
							<select id="hero-align" value={str(c.align) || 'left'} onchange={(e) => patchContent(selected.id, { align: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
								<option value="left">Left</option>
								<option value="center">Center</option>
								<option value="right">Right</option>
							</select>
						</div>
					{:else if selected.type === 'featured-products' || selected.type === 'collection-grid'}
						<div>
							<label class={LABEL} for="fp-heading">Heading</label>
							<input id="fp-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label class={LABEL} for="fp-limit">Limit</label>
								<input id="fp-limit" type="number" min={1} max={12} value={num(c.limit, 4)} oninput={(e) => patchContent(selected.id, { limit: Number((e.currentTarget as HTMLInputElement).value) })} class={INPUT} />
							</div>
							{#if selected.type === 'collection-grid'}
								<div>
									<label class={LABEL} for="fp-variation">Variation</label>
									<select id="fp-variation" value={str(c.variation) || 'grid'} onchange={(e) => patchContent(selected.id, { variation: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
										<option value="grid">Grid</option>
										<option value="masonry">Masonry</option>
										<option value="wide">Wide</option>
									</select>
								</div>
							{:else}
								<div>
									<label class={LABEL} for="fp-order">Order</label>
									<select id="fp-order" value={str(c.orderMode) || 'manual'} onchange={(e) => patchContent(selected.id, { orderMode: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
										<option value="manual">Manual</option>
										<option value="featured">Featured first</option>
									</select>
								</div>
							{/if}
						</div>
						<div>
							<span class={LABEL}>Manual products — Active only</span>
							<div class="mt-1 border rounded-[8px] p-2 max-h-[160px] overflow-y-auto bg-[#FBFBFA]" style="border-color: var(--border);">
								{#each admin.products.filter((p) => p.status === 'active') as p (p.id)}
									<label class="flex items-center gap-2 py-1 text-[12px]">
										<input type="checkbox" checked={strArr(c.productIds).includes(p.id)} onchange={(e) => {
											const on = (e.currentTarget as HTMLInputElement).checked;
											const ids = strArr(c.productIds);
											patchContent(selected.id, { productIds: on ? [...ids, p.id] : ids.filter((x) => x !== p.id) });
										}} class="rounded" />
										{p.name}
									</label>
								{/each}
							</div>
							<p class="text-[10px] text-[#777] mt-1">If none selected, Featured Active products are used as fallback.</p>
						</div>
					{:else if selected.type === 'categories'}
						<div>
							<label class={LABEL} for="cat-heading">Heading</label>
							<input id="cat-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<div>
							<span class={LABEL}>Categories</span>
							<div class="mt-1 border rounded-[8px] p-2 max-h-[140px] overflow-y-auto bg-[#FBFBFA]" style="border-color: var(--border);">
								{#each admin.categories as cat (cat.id)}
									<label class="flex items-center gap-2 py-1 text-[12px]">
										<input type="checkbox" checked={strArr(c.categoryIds).includes(cat.id)} onchange={(e) => {
											const on = (e.currentTarget as HTMLInputElement).checked;
											const ids = strArr(c.categoryIds);
											patchContent(selected.id, { categoryIds: on ? [...ids, cat.id] : ids.filter((x) => x !== cat.id) });
										}} class="rounded" />
										{cat.name}
									</label>
								{/each}
							</div>
						</div>
					{:else if selected.type === 'promo-banner'}
						<div>
							<label class={LABEL} for="promo-heading">Heading</label>
							<input id="promo-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<div>
							<label class={LABEL} for="promo-image">Banner image</label>
							<select id="promo-image" value={str(c.image)} onchange={(e) => patchContent(selected.id, { image: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
								<option value="">— No image —</option>
								{#each admin.media as m (m.id)}
									<option value={m.url}>{m.name}</option>
								{/each}
							</select>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label class={LABEL} for="promo-cta">CTA label</label>
								<input id="promo-cta" value={str(c.ctaLabel)} oninput={(e) => patchContent(selected.id, { ctaLabel: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
							</div>
							<div>
								<label class={LABEL} for="promo-href">CTA link</label>
								<input id="promo-href" value={str(c.ctaHref)} oninput={(e) => patchContent(selected.id, { ctaHref: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
							</div>
						</div>
					{:else if selected.type === 'rich-text'}
						<div>
							<label class={LABEL} for="rt-heading">Heading</label>
							<input id="rt-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<div>
							<label class={LABEL} for="rt-text">Text</label>
							<textarea id="rt-text" value={str(c.text)} oninput={(e) => patchContent(selected.id, { text: (e.currentTarget as HTMLTextAreaElement).value })} rows={4} class={TEXTAREA}></textarea>
						</div>
						<div>
							<label class={LABEL} for="rt-image">Image</label>
							<select id="rt-image" value={str(c.image)} onchange={(e) => patchContent(selected.id, { image: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
								<option value="">— No image —</option>
								{#each admin.media as m (m.id)}
									<option value={m.url}>{m.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class={LABEL} for="rt-align">Align</label>
							<select id="rt-align" value={str(c.align) || 'left'} onchange={(e) => patchContent(selected.id, { align: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
								<option value="left">Left</option>
								<option value="center">Center</option>
								<option value="right">Right</option>
							</select>
						</div>
					{:else if selected.type === 'cta'}
						<div>
							<label class={LABEL} for="cta-heading">Heading</label>
							<input id="cta-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<div>
							<label class={LABEL} for="cta-text">Text</label>
							<textarea id="cta-text" value={str(c.text)} oninput={(e) => patchContent(selected.id, { text: (e.currentTarget as HTMLTextAreaElement).value })} rows={2} class={TEXTAREA}></textarea>
						</div>
						<div>
							<label class={LABEL} for="cta-label">Button label</label>
							<input id="cta-label" value={str(c.label)} oninput={(e) => patchContent(selected.id, { label: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<label class="flex items-center gap-2 text-[12px]">
							<input type="checkbox" checked={Boolean(c.useWhatsApp)} onchange={(e) => patchContent(selected.id, { useWhatsApp: (e.currentTarget as HTMLInputElement).checked })} class="rounded" />
							Use WhatsApp link from Settings
						</label>
					{:else if selected.type === 'benefits'}
						<div>
							<label class={LABEL} for="ben-heading">Heading</label>
							<input id="ben-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						{#each benefitsOf(selected) as b, i (i)}
							<div class="border rounded-[10px] p-3 space-y-2" style="border-color: var(--border);">
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									<input value={b.icon ?? ''} placeholder="Icon word" oninput={(e) => {
										const rows = benefitsOf(selected).map((r, j) => (j === i ? { ...r, icon: (e.currentTarget as HTMLInputElement).value } : r));
										patchContent(selected.id, { items: rows });
									}} class={INPUT} />
									<input value={b.title ?? ''} placeholder="Title" oninput={(e) => {
										const rows = benefitsOf(selected).map((r, j) => (j === i ? { ...r, title: (e.currentTarget as HTMLInputElement).value } : r));
										patchContent(selected.id, { items: rows });
									}} class={INPUT} />
								</div>
								<input value={b.description ?? ''} placeholder="Description" oninput={(e) => {
									const rows = benefitsOf(selected).map((r, j) => (j === i ? { ...r, description: (e.currentTarget as HTMLInputElement).value } : r));
									patchContent(selected.id, { items: rows });
								}} class={INPUT} />
								<button type="button" onclick={() => patchContent(selected.id, { items: benefitsOf(selected).filter((_, j) => j !== i) })} class="text-[11px] text-[#A33A37] underline">Remove benefit</button>
							</div>
						{/each}
						<button type="button" onclick={() => patchContent(selected.id, { items: [...benefitsOf(selected), { icon: 'Star', title: 'New benefit', description: '' }] })} class="h-8 rounded-full border bg-white px-3 text-[11px] font-medium" style="border-color: var(--border);">+ Add benefit</button>
					{:else if selected.type === 'gallery'}
						<div>
							<label class={LABEL} for="gal-heading">Heading</label>
							<input id="gal-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						<div>
							<label class={LABEL} for="gal-layout">Layout</label>
							<select id="gal-layout" value={str(c.layout) || 'grid'} onchange={(e) => patchContent(selected.id, { layout: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
								<option value="grid">Grid</option>
								<option value="masonry">Masonry</option>
								<option value="carousel">Carousel grid</option>
							</select>
						</div>
						{#each galleryImages(selected) as img, i (i)}
							<div class="flex gap-2 items-center">
								<select value={img} onchange={(e) => {
									const rows = galleryImages(selected).map((r, j) => (j === i ? (e.currentTarget as HTMLSelectElement).value : r));
									patchContent(selected.id, { images: rows });
								}} class={INPUT}>
									<option value="">— No image —</option>
									{#each admin.media as m (m.id)}
										<option value={m.url}>{m.name}</option>
									{/each}
								</select>
								<button type="button" onclick={() => patchContent(selected.id, { images: galleryImages(selected).filter((_, j) => j !== i) })} class="h-8 w-8 shrink-0 rounded-full border bg-white flex items-center justify-center" style="border-color: var(--border);" aria-label="Remove image"><X class="h-3.5 w-3.5" /></button>
							</div>
						{/each}
						<button type="button" onclick={() => patchContent(selected.id, { images: [...galleryImages(selected), ''] })} class="h-8 rounded-full border bg-white px-3 text-[11px] font-medium" style="border-color: var(--border);">+ Add image slot</button>
					{:else if selected.type === 'testimonials'}
						<div>
							<label class={LABEL} for="test-heading">Heading</label>
							<input id="test-heading" value={str(c.heading)} oninput={(e) => patchContent(selected.id, { heading: (e.currentTarget as HTMLInputElement).value })} class={INPUT} />
						</div>
						{#each testimonialsOf(selected) as t, i (i)}
							<div class="border rounded-[10px] p-3 space-y-2" style="border-color: var(--border);">
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									<input value={t.name ?? ''} placeholder="Name" oninput={(e) => {
										const rows = testimonialsOf(selected).map((r, j) => (j === i ? { ...r, name: (e.currentTarget as HTMLInputElement).value } : r));
										patchContent(selected.id, { items: rows });
									}} class={INPUT} />
									<select value={t.rating ?? 5} onchange={(e) => {
										const rows = testimonialsOf(selected).map((r, j) => (j === i ? { ...r, rating: Number((e.currentTarget as HTMLSelectElement).value) } : r));
										patchContent(selected.id, { items: rows });
									}} class={INPUT}>
										<option value={5}>5 stars</option>
										<option value={4}>4 stars</option>
										<option value={3}>3 stars</option>
									</select>
								</div>
								<textarea value={t.text ?? ''} placeholder="Testimonial text" rows={2} oninput={(e) => {
									const rows = testimonialsOf(selected).map((r, j) => (j === i ? { ...r, text: (e.currentTarget as HTMLTextAreaElement).value } : r));
									patchContent(selected.id, { items: rows });
								}} class={TEXTAREA}></textarea>
								<select value={t.image ?? ''} onchange={(e) => {
									const rows = testimonialsOf(selected).map((r, j) => (j === i ? { ...r, image: (e.currentTarget as HTMLSelectElement).value } : r));
									patchContent(selected.id, { items: rows });
								}} class={INPUT}>
									<option value="">— No photo —</option>
									{#each admin.media as m (m.id)}
										<option value={m.url}>{m.name}</option>
									{/each}
								</select>
								<button type="button" onclick={() => patchContent(selected.id, { items: testimonialsOf(selected).filter((_, j) => j !== i) })} class="text-[11px] text-[#A33A37] underline">Remove testimonial</button>
							</div>
						{/each}
						<button type="button" onclick={() => patchContent(selected.id, { items: [...testimonialsOf(selected), { name: '', text: '', image: '', rating: 5 }] })} class="h-8 rounded-full border bg-white px-3 text-[11px] font-medium" style="border-color: var(--border);">+ Add testimonial</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Settings + SEO -->
		<div class="lg:col-span-3 space-y-4 min-w-0">
			<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
				<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777]">Page settings</h3>
				<div class="space-y-3 mt-3">
					<div>
						<label class={LABEL} for="ps-title">Title *</label>
						<input id="ps-title" value={draft.title} oninput={(e) => (draft.title = (e.currentTarget as HTMLInputElement).value)} placeholder="Summer Edit" class={INPUT} />
					</div>
					<div>
						<label class={LABEL} for="ps-slug">Slug *</label>
						<input id="ps-slug" value={draft.slug} oninput={(e) => { slugManual = true; draft.slug = slugify((e.currentTarget as HTMLInputElement).value); }} placeholder="summer-edit" class={INPUT} />
						{#if !slugValid && draft.slug}
							<p class="text-[11px] text-[#D9534F] mt-1">Slug must be unique.</p>
						{/if}
					</div>
					<div>
						<label class={LABEL} for="ps-type">Type</label>
						<select id="ps-type" value={draft.type} onchange={(e) => (draft.type = (e.currentTarget as HTMLSelectElement).value as 'homepage' | 'campaign')} class={INPUT}>
							<option value="homepage">Homepage</option>
							<option value="campaign">Campaign</option>
						</select>
					</div>
					<label class="flex items-center gap-2 text-[12px]">
						<input type="checkbox" checked={draft.isHomepage} onchange={(e) => { draft.isHomepage = (e.currentTarget as HTMLInputElement).checked; if (draft.isHomepage) draft.type = 'homepage'; }} class="rounded" />
						Set as the one homepage <span class="text-[10px] text-[#777]">(unsets others on save)</span>
					</label>
					<div class="text-[11px] text-[#777]">Status: <b>{draft.status}</b> • Updated {new Date(draft.updatedAt).toLocaleDateString('id-ID')}</div>
				</div>
			</div>

			<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
				<h3 class="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#777]">SEO</h3>
				<div class="space-y-3 mt-3">
					<div>
						<label class={LABEL} for="seo-title">SEO title</label>
						<input id="seo-title" value={draft.seo.title} oninput={(e) => (draft.seo = { ...draft.seo, title: (e.currentTarget as HTMLInputElement).value })} placeholder="Falls back to Store Settings" class={INPUT} />
					</div>
					<div>
						<label class={LABEL} for="seo-desc">SEO description</label>
						<textarea id="seo-desc" value={draft.seo.description} oninput={(e) => (draft.seo = { ...draft.seo, description: (e.currentTarget as HTMLTextAreaElement).value })} rows={2} class={TEXTAREA}></textarea>
					</div>
					<div>
						<label class={LABEL} for="seo-image">OG image</label>
						<select id="seo-image" value={draft.seo.image} onchange={(e) => (draft.seo = { ...draft.seo, image: (e.currentTarget as HTMLSelectElement).value })} class={INPUT}>
							<option value="">Use default SEO image</option>
							{#each admin.media as m (m.id)}
								<option value={m.url}>{m.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class={LABEL} for="seo-canonical">Canonical</label>
						<input id="seo-canonical" value={draft.seo.canonical} oninput={(e) => (draft.seo = { ...draft.seo, canonical: (e.currentTarget as HTMLInputElement).value })} placeholder="/summer-edit" class={INPUT} />
					</div>
					<div class="border rounded-[8px] p-3 bg-[#FBFBFA]" style="border-color: var(--border);">
						<div class="text-[11px] text-[#1A0DAB] font-medium truncate">{draft.seo.title || admin.settings.defaultSeo.title || draft.title || 'Title'}</div>
						<div class="text-[10px] text-[#006621] truncate">bagstore.example{draft.seo.canonical || `/${draft.slug || 'slug'}`}</div>
						<p class="text-[11px] text-[#545454] mt-1 line-clamp-2">{draft.seo.description || admin.settings.defaultSeo.description || 'Description'}</p>
					</div>
				</div>
			</div>

			<button type="button" onclick={onCancel} class="w-full h-11 sm:h-9 rounded-full border bg-white text-[12px] font-medium" style="border-color: var(--border);">Cancel</button>
		</div>
	</div>

	<!-- Add section modal: bottom sheet on mobile, centered on >=sm -->
	{#if addOpen}
		<div class="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center sm:p-4">
			<div class="bg-white w-full sm:max-w-[560px] p-5 rounded-t-[16px] sm:rounded-[12px] border max-h-[92dvh] overflow-y-auto" style="border-color: var(--border);">
				<div class="flex items-center justify-between">
					<h3 class="text-[14px] font-semibold">Add section</h3>
					<button type="button" onclick={() => (addOpen = false)} class="h-7 w-7 rounded-full border bg-white flex items-center justify-center" style="border-color: var(--border);" aria-label="Close"><X class="h-4 w-4" /></button>
				</div>
				<p class="text-[11px] text-[#777] mt-1">Choose one of 10 section types. You can reorder, hide, duplicate or delete it later.</p>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
					{#each SECTION_TYPES as t (t.type)}
						<button type="button" onclick={() => addSection(t.type)} class="text-left border rounded-[10px] p-3 hover:border-[#242424] transition bg-white" style="border-color: var(--border);">
							<div class="text-[13px] font-medium">{t.label}</div>
							<p class="text-[11px] text-[#777] mt-0.5">{t.desc}</p>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- History modal: bottom sheet on mobile, centered on >=sm -->
	{#if historyOpen}
		<div class="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center sm:p-4">
			<div class="bg-white w-full sm:max-w-[420px] p-5 rounded-t-[16px] sm:rounded-[12px] border max-h-[92dvh] overflow-y-auto" style="border-color: var(--border);">
				<div class="flex items-center justify-between">
					<h3 class="text-[14px] font-semibold">History</h3>
					<button type="button" onclick={() => (historyOpen = false)} class="h-7 w-7 rounded-full border bg-white flex items-center justify-center" style="border-color: var(--border);" aria-label="Close"><X class="h-4 w-4" /></button>
				</div>
				{#if versions.length === 0}
					<p class="text-[12px] text-[#777] mt-3">No published versions yet. Publish to create version 1.</p>
				{:else}
					<div class="space-y-2 mt-3">
						{#each versions as v (v.id)}
							<div class="flex items-center justify-between gap-2 border rounded-[8px] p-2.5" style="border-color: var(--border);">
								<div>
									<div class="text-[12px] font-medium">Version {v.ver} — {v.title}</div>
									<div class="text-[10px] text-[#777]">{new Date(v.publishedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} • {v.sections.length} sections</div>
								</div>
								<button type="button" onclick={() => restoreVersion(v.id)} class="h-7 px-2.5 rounded-full border bg-white text-[11px] font-medium">Restore</button>
							</div>
						{/each}
					</div>
					<p class="text-[10px] text-[#777] mt-3">Restore loads the version into the editor. Save Draft or Publish to keep it.</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Mobile sticky action bar: thumb-reachable save/publish/preview on <lg -->
<div class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t px-4 py-3 flex gap-2" style="border-color: var(--border); padding-bottom: calc(0.75rem + var(--safe-area-inset-bottom));">
	<button type="button" onclick={() => (tab = tab === 'edit' ? 'preview' : 'edit')} class="flex-1 h-11 rounded-full border bg-white text-[12px] font-medium" style="border-color: var(--border);">{tab === 'edit' ? 'Preview' : 'Edit'}</button>
	<button type="button" onclick={() => save('draft')} class="flex-1 h-11 rounded-full border bg-white text-[12px] font-medium" style="border-color: var(--border);">Save Draft</button>
	<button type="button" onclick={() => save('publish')} class="flex-1 h-11 rounded-full bg-[#242424] text-white text-[12px] font-medium">Publish</button>
</div>

