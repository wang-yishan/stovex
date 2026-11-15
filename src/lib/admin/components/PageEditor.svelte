<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { SECTION_TYPES, newSection, slugify, uid } from '#lib/admin/data.ts';
	import SectionRenderer from './SectionRenderer.svelte';
	import type { PageSection, SectionType, StorePage } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, History, Plus, Trash2, X } from '@lucide/svelte';

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

	const LABEL = 'text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground';

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

<div class="mx-auto w-full max-w-[1280px] px-4 py-4 pb-24 md:px-6 md:py-6 lg:px-8 lg:pb-6">
	<!-- toolbar: stacked 2x2 action grid on mobile, single row on >=md -->
	<div
		class="mb-4 space-y-3 rounded-[12px] border bg-white p-3 md:p-4"
		style="border-color: var(--border);"
	>
		<div class="flex items-center gap-2">
			<div
				class="flex flex-1 overflow-hidden rounded-full border sm:flex-none"
				style="border-color: var(--border);"
			>
				<Button
					variant={tab === 'edit' ? 'default' : 'outline'}
					class="flex-1 px-4 sm:flex-none"
					onclick={() => (tab = 'edit')}
				>
					Edit
				</Button>
				<Button
					variant={tab === 'preview' ? 'default' : 'outline'}
					class="flex-1 px-4 sm:flex-none"
					onclick={() => (tab = 'preview')}
				>
					Preview
				</Button>
			</div>
			<span class="text-[11px] whitespace-nowrap text-[#5A5A5A]"
				>{draft.sections.length} sections • {draft.sections.filter((s) => s.visible).length} visible</span
			>
		</div>
		<div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
			<Button variant="outline" class="px-3" onclick={() => (historyOpen = true)}>
				<History class="h-3.5 w-3.5" /> History ({versions.length})
			</Button>
			<Button
				variant="outline"
				class="border-[#F3D9A0] bg-[#FFF8E6] px-3"
				onclick={() => save('archive')}
			>
				Archive
			</Button>
			<Button variant="outline" class="px-3" onclick={() => save('draft')}>Save Draft</Button>
			<Button class="px-4" onclick={() => save('publish')}>Publish</Button>
		</div>
	</div>

	<div class="grid items-start gap-4 lg:grid-cols-12">
		<!-- Section list: horizontal snap strip on mobile, vertical rail on lg -->
		<div
			class="min-w-0 rounded-[12px] border bg-white p-3 lg:col-span-3"
			style="border-color: var(--border);"
		>
			<div class="mb-2 flex items-center justify-between px-1">
				<h3 class="text-[12px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">
					Sections
				</h3>
				<Button size="sm" class="h-10 px-3 sm:h-7 sm:px-2.5" onclick={() => (addOpen = true)}>
					<Plus class="h-3 w-3" /> Add
				</Button>
			</div>
			<div
				class="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 lg:snap-none lg:flex-col lg:gap-0 lg:space-y-1.5 lg:overflow-visible lg:pb-0"
			>
				{#each sortedSections as s (s.id)}
					<div
						class="w-[200px] shrink-0 snap-start rounded-[10px] border p-2.5 lg:w-auto {selectedId ===
						s.id
							? 'border-[#242424] bg-[#FBFBFA]'
							: 'bg-white'}"
						style="border-color: {selectedId === s.id ? '#242424' : 'var(--border)'};"
					>
						<Button
							variant="ghost"
							size="sm"
							class="h-auto w-full justify-start px-0"
							onclick={() => {
								selectedId = s.id;
								tab = 'edit';
							}}
						>
							<div class="flex items-center gap-2">
								<span class="flex-1 truncate text-[12px] font-medium">{s.label}</span>
								<span class="text-[10px] text-[#636363]">{s.type}</span>
								{#if !s.visible}
									<EyeOff class="h-3.5 w-3.5 text-[#636363]" />
								{/if}
							</div>
						</Button>
						<div class="mt-2 flex gap-1">
							<Button variant="outline" size="icon-xs" aria-label="Move up"
								><ArrowUp class="h-3 w-3" /></Button
							>
							<Button variant="outline" size="icon-xs" aria-label="Move down"
								><ArrowDown class="h-3 w-3" /></Button
							>
							<Button variant="outline" size="icon-xs" aria-label="Toggle visible">
								{#if s.visible}<Eye class="h-3 w-3" />{:else}<EyeOff class="h-3 w-3" />{/if}
							</Button>
							<Button variant="outline" size="icon-xs" aria-label="Duplicate section"
								><Copy class="h-3 w-3" /></Button
							>
							<Button
								variant="outline"
								size="icon-xs"
								class="hover:border-destructive/40 hover:bg-destructive/10!"
								aria-label="Delete section"><Trash2 class="h-3 w-3" /></Button
							>
						</div>
					</div>
				{/each}
				{#if draft.sections.length === 0}
					<p class="p-2 text-[12px] text-[#5A5A5A]">No sections. Add your first section.</p>
				{/if}
			</div>
		</div>

		<!-- Editor / preview -->
		<div class="min-w-0 space-y-4 lg:col-span-6">
			{#if tab === 'preview'}
				<div class="space-y-6">
					<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
						<p class="text-[11px] text-[#5A5A5A]">
							Preview — {draft.title || 'Untitled'} • /{draft.slug || 'slug'}
						</p>
					</div>
					{#each sortedSections as s (s.id)}
						<SectionRenderer section={s} />
					{/each}
				</div>
			{:else if !selected}
				<div
					class="rounded-[12px] border bg-white p-5 text-[13px] text-[#5A5A5A]"
					style="border-color: var(--border);"
				>
					Select a section on the left to edit it, or add a new section.
				</div>
			{:else}
				{@const c = selected.content}
				<div
					class="space-y-4 rounded-[12px] border bg-white p-4 md:p-5"
					style="border-color: var(--border);"
				>
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 class="text-[14px] font-semibold">{selected.label}</h3>
							<p class="text-[11px] text-[#5A5A5A]">
								{SECTION_TYPES.find((t) => t.type === selected.type)?.desc}
							</p>
						</div>
						<label class="flex items-center gap-2 text-[12px]">
							<Button
								variant="ghost"
								size="default"
								type="button"
								aria-label="Visible"
								class="h-5 w-9 shrink-0 rounded-full p-0.5 {selected.visible
									? 'bg-primary'
									: 'bg-muted'}"
								onclick={() => patchSection(selected.id, { visible: !selected.visible })}
							>
								<span
									class="block h-4 w-4 rounded-full bg-card transition-transform {selected.visible
										? 'translate-x-4'
										: ''}"
								></span>
							</Button>
						</label>
					</div>

					<div>
						<label class={LABEL} for="sec-label">Section label</label>
						<Input
							class="mt-1"
							id="sec-label"
							value={selected.label}
							oninput={(e) =>
								patchSection(selected.id, { label: (e.currentTarget as HTMLInputElement).value })}
						/>
					</div>
					<div>
						<label class={LABEL} for="sec-layout">Layout</label>
						<NativeSelect
							class="mt-1"
							id="sec-layout"
							value={selected.layout}
							onchange={(e) =>
								patchSection(selected.id, { layout: (e.currentTarget as HTMLSelectElement).value })}
						>
							<option value="standard">Standard</option>
							<option value="grid">Grid</option>
							<option value="masonry">Masonry</option>
							<option value="wide">Wide</option>
						</NativeSelect>
					</div>

					{#if selected.type === 'hero'}
						<div>
							<label class={LABEL} for="hero-headline">Headline</label>
							<Input
								class="mt-1"
								id="hero-headline"
								value={str(c.headline)}
								oninput={(e) =>
									patchContent(selected.id, {
										headline: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						<div>
							<label class={LABEL} for="hero-desc">Description</label>
							<Textarea
								class="mt-1"
								id="hero-desc"
								value={str(c.description)}
								oninput={(e) =>
									patchContent(selected.id, {
										description: (e.currentTarget as HTMLTextAreaElement).value
									})}
								rows={2}
							></Textarea>
						</div>
						<div>
							<label class={LABEL} for="hero-image">Hero image</label>
							<NativeSelect
								class="mt-1"
								id="hero-image"
								value={str(c.image)}
								onchange={(e) =>
									patchContent(selected.id, {
										image: (e.currentTarget as HTMLSelectElement).value
									})}
							>
								<option value="">— No image —</option>
								{#each admin.media as m (m.id)}
									<option value={m.url}>{m.name}</option>
								{/each}
							</NativeSelect>
							{#if str(c.image)}
								<img
									src={str(c.image)}
									alt="Hero"
									class="mt-2 h-[100px] w-full rounded-[8px] object-cover"
								/>
							{/if}
						</div>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div>
								<label class={LABEL} for="hero-cta">CTA label</label>
								<Input
									class="mt-1"
									id="hero-cta"
									value={str(c.ctaLabel)}
									oninput={(e) =>
										patchContent(selected.id, {
											ctaLabel: (e.currentTarget as HTMLInputElement).value
										})}
								/>
							</div>
							<div>
								<label class={LABEL} for="hero-href">CTA link</label>
								<Input
									class="mt-1"
									id="hero-href"
									value={str(c.ctaHref)}
									oninput={(e) =>
										patchContent(selected.id, {
											ctaHref: (e.currentTarget as HTMLInputElement).value
										})}
								/>
							</div>
						</div>
						<div>
							<label class={LABEL} for="hero-align">Align</label>
							<NativeSelect
								class="mt-1"
								id="hero-align"
								value={str(c.align) || 'left'}
								onchange={(e) =>
									patchContent(selected.id, {
										align: (e.currentTarget as HTMLSelectElement).value
									})}
							>
								<option value="left">Left</option>
								<option value="center">Center</option>
								<option value="right">Right</option>
							</NativeSelect>
						</div>
					{:else if selected.type === 'featured-products' || selected.type === 'collection-grid'}
						<div>
							<label class={LABEL} for="fp-heading">Heading</label>
							<Input
								class="mt-1"
								id="fp-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div>
								<label class={LABEL} for="fp-limit">Limit</label>
								<Input
									class="mt-1"
									id="fp-limit"
									type="number"
									min={1}
									max={12}
									value={num(c.limit, 4)}
									oninput={(e) =>
										patchContent(selected.id, {
											limit: Number((e.currentTarget as HTMLInputElement).value)
										})}
								/>
							</div>
							{#if selected.type === 'collection-grid'}
								<div>
									<label class={LABEL} for="fp-variation">Variation</label>
									<NativeSelect
										class="mt-1"
										id="fp-variation"
										value={str(c.variation) || 'grid'}
										onchange={(e) =>
											patchContent(selected.id, {
												variation: (e.currentTarget as HTMLSelectElement).value
											})}
									>
										<option value="grid">Grid</option>
										<option value="masonry">Masonry</option>
										<option value="wide">Wide</option>
									</NativeSelect>
								</div>
							{:else}
								<div>
									<label class={LABEL} for="fp-order">Order</label>
									<NativeSelect
										class="mt-1"
										id="fp-order"
										value={str(c.orderMode) || 'manual'}
										onchange={(e) =>
											patchContent(selected.id, {
												orderMode: (e.currentTarget as HTMLSelectElement).value
											})}
									>
										<option value="manual">Manual</option>
										<option value="featured">Featured first</option>
									</NativeSelect>
								</div>
							{/if}
						</div>
						<div>
							<span class={LABEL}>Manual products — Active only</span>
							<div
								class="mt-1 max-h-[160px] overflow-y-auto rounded-[8px] border bg-[#FBFBFA] p-2"
								style="border-color: var(--border);"
							>
								{#each admin.products.filter((p) => p.status === 'active') as p (p.id)}
									<label class="flex items-center gap-2 py-1 text-[12px]">
										<Checkbox
											checked={strArr(c.productIds).includes(p.id)}
											onCheckedChange={(on) => {
												const ids = strArr(c.productIds);
												patchContent(selected.id, {
													productIds: on ? [...ids, p.id] : ids.filter((x) => x !== p.id)
												});
											}}
										/>
										{p.name}
									</label>
								{/each}
							</div>
							<p class="mt-1 text-[10px] text-[#5A5A5A]">
								If none selected, Featured Active products are used as fallback.
							</p>
						</div>
					{:else if selected.type === 'categories'}
						<div>
							<label class={LABEL} for="cat-heading">Heading</label>
							<Input
								class="mt-1"
								id="cat-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						<div>
							<span class={LABEL}>Categories</span>
							<div
								class="mt-1 max-h-[140px] overflow-y-auto rounded-[8px] border bg-[#FBFBFA] p-2"
								style="border-color: var(--border);"
							>
								{#each admin.categories as cat (cat.id)}
									<label class="flex items-center gap-2 py-1 text-[12px]">
										<Checkbox
											checked={strArr(c.categoryIds).includes(cat.id)}
											onCheckedChange={(on) => {
												const ids = strArr(c.categoryIds);
												patchContent(selected.id, {
													categoryIds: on ? [...ids, cat.id] : ids.filter((x) => x !== cat.id)
												});
											}}
										/>
										{cat.name}
									</label>
								{/each}
							</div>
						</div>
					{:else if selected.type === 'promo-banner'}
						<div>
							<label class={LABEL} for="promo-heading">Heading</label>
							<Input
								class="mt-1"
								id="promo-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						<div>
							<label class={LABEL} for="promo-image">Banner image</label>
							<NativeSelect
								class="mt-1"
								id="promo-image"
								value={str(c.image)}
								onchange={(e) =>
									patchContent(selected.id, {
										image: (e.currentTarget as HTMLSelectElement).value
									})}
							>
								<option value="">— No image —</option>
								{#each admin.media as m (m.id)}
									<option value={m.url}>{m.name}</option>
								{/each}
							</NativeSelect>
						</div>
						<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div>
								<label class={LABEL} for="promo-cta">CTA label</label>
								<Input
									class="mt-1"
									id="promo-cta"
									value={str(c.ctaLabel)}
									oninput={(e) =>
										patchContent(selected.id, {
											ctaLabel: (e.currentTarget as HTMLInputElement).value
										})}
								/>
							</div>
							<div>
								<label class={LABEL} for="promo-href">CTA link</label>
								<Input
									class="mt-1"
									id="promo-href"
									value={str(c.ctaHref)}
									oninput={(e) =>
										patchContent(selected.id, {
											ctaHref: (e.currentTarget as HTMLInputElement).value
										})}
								/>
							</div>
						</div>
					{:else if selected.type === 'rich-text'}
						<div>
							<label class={LABEL} for="rt-heading">Heading</label>
							<Input
								class="mt-1"
								id="rt-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						<div>
							<label class={LABEL} for="rt-text">Text</label>
							<Textarea
								class="mt-1"
								id="rt-text"
								value={str(c.text)}
								oninput={(e) =>
									patchContent(selected.id, {
										text: (e.currentTarget as HTMLTextAreaElement).value
									})}
								rows={4}
							></Textarea>
						</div>
						<div>
							<label class={LABEL} for="rt-image">Image</label>
							<NativeSelect
								class="mt-1"
								id="rt-image"
								value={str(c.image)}
								onchange={(e) =>
									patchContent(selected.id, {
										image: (e.currentTarget as HTMLSelectElement).value
									})}
							>
								<option value="">— No image —</option>
								{#each admin.media as m (m.id)}
									<option value={m.url}>{m.name}</option>
								{/each}
							</NativeSelect>
						</div>
						<div>
							<label class={LABEL} for="rt-align">Align</label>
							<NativeSelect
								class="mt-1"
								id="rt-align"
								value={str(c.align) || 'left'}
								onchange={(e) =>
									patchContent(selected.id, {
										align: (e.currentTarget as HTMLSelectElement).value
									})}
							>
								<option value="left">Left</option>
								<option value="center">Center</option>
								<option value="right">Right</option>
							</NativeSelect>
						</div>
					{:else if selected.type === 'cta'}
						<div>
							<label class={LABEL} for="cta-heading">Heading</label>
							<Input
								class="mt-1"
								id="cta-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						<div>
							<label class={LABEL} for="cta-text">Text</label>
							<Textarea
								class="mt-1"
								id="cta-text"
								value={str(c.text)}
								oninput={(e) =>
									patchContent(selected.id, {
										text: (e.currentTarget as HTMLTextAreaElement).value
									})}
								rows={2}
							></Textarea>
						</div>
						<div>
							<label class={LABEL} for="cta-label">Button label</label>
							<Input
								class="mt-1"
								id="cta-label"
								value={str(c.label)}
								oninput={(e) =>
									patchContent(selected.id, { label: (e.currentTarget as HTMLInputElement).value })}
							/>
						</div>
						<label class="flex items-center gap-2 text-[12px]">
							<Checkbox
								checked={Boolean(c.useWhatsApp)}
								onCheckedChange={(on) => patchContent(selected.id, { useWhatsApp: on })}
							/>
							Use WhatsApp link from Settings
						</label>
					{:else if selected.type === 'benefits'}
						<div>
							<label class={LABEL} for="ben-heading">Heading</label>
							<Input
								class="mt-1"
								id="ben-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						{#each benefitsOf(selected) as b, i (i)}
							<div class="space-y-2 rounded-[10px] border p-3" style="border-color: var(--border);">
								<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Input
										class="mt-1"
										value={b.icon ?? ''}
										placeholder="Icon word"
										oninput={(e) => {
											const rows = benefitsOf(selected).map((r, j) =>
												j === i ? { ...r, icon: (e.currentTarget as HTMLInputElement).value } : r
											);
											patchContent(selected.id, { items: rows });
										}}
									/>
									<Input
										class="mt-1"
										value={b.title ?? ''}
										placeholder="Title"
										oninput={(e) => {
											const rows = benefitsOf(selected).map((r, j) =>
												j === i ? { ...r, title: (e.currentTarget as HTMLInputElement).value } : r
											);
											patchContent(selected.id, { items: rows });
										}}
									/>
								</div>
								<Input
									class="mt-1"
									value={b.description ?? ''}
									placeholder="Description"
									oninput={(e) => {
										const rows = benefitsOf(selected).map((r, j) =>
											j === i
												? { ...r, description: (e.currentTarget as HTMLInputElement).value }
												: r
										);
										patchContent(selected.id, { items: rows });
									}}
								/>
								<Button
									variant="link"
									size="xs"
									class="h-auto px-0 text-[11px] text-destructive underline"
									onclick={() =>
										patchContent(selected.id, {
											items: benefitsOf(selected).filter((_, j) => j !== i)
										})}
								>
									Remove benefit
								</Button>
							</div>
						{/each}
						<Button
							type="button"
							onclick={() =>
								patchContent(selected.id, {
									items: [
										...benefitsOf(selected),
										{ icon: 'Star', title: 'New benefit', description: '' }
									]
								})}
							class="h-8 rounded-full border bg-white px-3 text-[11px] font-medium"
							style="border-color: var(--border);">+ Add benefit</Button
						>
					{:else if selected.type === 'gallery'}
						<div>
							<label class={LABEL} for="gal-heading">Heading</label>
							<Input
								class="mt-1"
								id="gal-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						<div>
							<label class={LABEL} for="gal-layout">Layout</label>
							<NativeSelect
								class="mt-1"
								id="gal-layout"
								value={str(c.layout) || 'grid'}
								onchange={(e) =>
									patchContent(selected.id, {
										layout: (e.currentTarget as HTMLSelectElement).value
									})}
							>
								<option value="grid">Grid</option>
								<option value="masonry">Masonry</option>
								<option value="carousel">Carousel grid</option>
							</NativeSelect>
						</div>
						{#each galleryImages(selected) as img, i (i)}
							<div class="flex items-center gap-2">
								<NativeSelect
									class="mt-1"
									value={img}
									onchange={(e) => {
										const rows = galleryImages(selected).map((r, j) =>
											j === i ? (e.currentTarget as HTMLSelectElement).value : r
										);
										patchContent(selected.id, { images: rows });
									}}
								>
									<option value="">— No image —</option>
									{#each admin.media as m (m.id)}
										<option value={m.url}>{m.name}</option>
									{/each}
								</NativeSelect>
								<Button
									type="button"
									onclick={() =>
										patchContent(selected.id, {
											images: galleryImages(selected).filter((_, j) => j !== i)
										})}
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white"
									style="border-color: var(--border);"
									aria-label="Remove image"><X class="h-3.5 w-3.5" /></Button
								>
							</div>
						{/each}
						<Button
							variant="outline"
							size="sm"
							type="button"
							onclick={() =>
								patchContent(selected.id, { images: [...galleryImages(selected), ''] })}
							>+ Add image slot</Button
						>
					{:else if selected.type === 'testimonials'}
						<div>
							<label class={LABEL} for="test-heading">Heading</label>
							<Input
								class="mt-1"
								id="test-heading"
								value={str(c.heading)}
								oninput={(e) =>
									patchContent(selected.id, {
										heading: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</div>
						{#each testimonialsOf(selected) as t, i (i)}
							<div class="space-y-2 rounded-[10px] border p-3" style="border-color: var(--border);">
								<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Input
										class="mt-1"
										value={t.name ?? ''}
										placeholder="Name"
										oninput={(e) => {
											const rows = testimonialsOf(selected).map((r, j) =>
												j === i ? { ...r, name: (e.currentTarget as HTMLInputElement).value } : r
											);
											patchContent(selected.id, { items: rows });
										}}
									/>
									<NativeSelect
										class="mt-1"
										value={t.rating ?? 5}
										onchange={(e) => {
											const rows = testimonialsOf(selected).map((r, j) =>
												j === i
													? { ...r, rating: Number((e.currentTarget as HTMLSelectElement).value) }
													: r
											);
											patchContent(selected.id, { items: rows });
										}}
									>
										<option value={5}>5 stars</option>
										<option value={4}>4 stars</option>
										<option value={3}>3 stars</option>
									</NativeSelect>
								</div>
								<Textarea
									class="mt-1"
									value={t.text ?? ''}
									placeholder="Testimonial text"
									rows={2}
									oninput={(e) => {
										const rows = testimonialsOf(selected).map((r, j) =>
											j === i ? { ...r, text: (e.currentTarget as HTMLTextAreaElement).value } : r
										);
										patchContent(selected.id, { items: rows });
									}}
								></Textarea>
								<NativeSelect
									class="mt-1"
									value={t.image ?? ''}
									onchange={(e) => {
										const rows = testimonialsOf(selected).map((r, j) =>
											j === i ? { ...r, image: (e.currentTarget as HTMLSelectElement).value } : r
										);
										patchContent(selected.id, { items: rows });
									}}
								>
									<option value="">— No photo —</option>
									{#each admin.media as m (m.id)}
										<option value={m.url}>{m.name}</option>
									{/each}
								</NativeSelect>
								<Button
									variant="link"
									size="xs"
									class="h-auto px-0 text-[11px] text-destructive underline"
									onclick={() =>
										patchContent(selected.id, {
											items: testimonialsOf(selected).filter((_, j) => j !== i)
										})}
								>
									Remove testimonial
								</Button>
							</div>
						{/each}
						<Button
							type="button"
							onclick={() =>
								patchContent(selected.id, {
									items: [...testimonialsOf(selected), { name: '', text: '', image: '', rating: 5 }]
								})}
							class="h-8 rounded-full border bg-white px-3 text-[11px] font-medium"
							style="border-color: var(--border);">+ Add testimonial</Button
						>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Settings + SEO -->
		<div class="min-w-0 space-y-4 lg:col-span-3">
			<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
				<h3 class="text-[12px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">
					Page settings
				</h3>
				<div class="mt-3 space-y-3">
					<div>
						<label class={LABEL} for="ps-title">Title *</label>
						<Input
							class="mt-1"
							id="ps-title"
							value={draft.title}
							oninput={(e) => (draft.title = (e.currentTarget as HTMLInputElement).value)}
							placeholder="Summer Edit"
						/>
					</div>
					<div>
						<label class={LABEL} for="ps-slug">Slug *</label>
						<Input
							class="mt-1"
							id="ps-slug"
							value={draft.slug}
							oninput={(e) => {
								slugManual = true;
								draft.slug = slugify((e.currentTarget as HTMLInputElement).value);
							}}
							placeholder="summer-edit"
						/>
						{#if !slugValid && draft.slug}
							<p class="mt-1 text-[11px] text-[#D9534F]">Slug must be unique.</p>
						{/if}
					</div>
					<div>
						<label class={LABEL} for="ps-type">Type</label>
						<NativeSelect
							class="mt-1"
							id="ps-type"
							value={draft.type}
							onchange={(e) =>
								(draft.type = (e.currentTarget as HTMLSelectElement).value as
									'homepage' | 'campaign')}
						>
							<option value="homepage">Homepage</option>
							<option value="campaign">Campaign</option>
						</NativeSelect>
					</div>
					<label class="flex items-center gap-2 text-[12px]">
						<Checkbox
							checked={draft.isHomepage}
							onCheckedChange={(on) => {
								draft.isHomepage = on;
								if (draft.isHomepage) draft.type = 'homepage';
							}}
						/>
						Set as the one homepage
						<span class="text-[10px] text-[#5A5A5A]">(unsets others on save)</span>
					</label>
					<div class="text-[11px] text-[#5A5A5A]">
						Status: <b>{draft.status}</b> • Updated {new Date(draft.updatedAt).toLocaleDateString(
							'id-ID'
						)}
					</div>
				</div>
			</div>

			<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
				<h3 class="text-[12px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">SEO</h3>
				<div class="mt-3 space-y-3">
					<div>
						<label class={LABEL} for="seo-title">SEO title</label>
						<Input
							class="mt-1"
							id="seo-title"
							value={draft.seo.title}
							oninput={(e) =>
								(draft.seo = { ...draft.seo, title: (e.currentTarget as HTMLInputElement).value })}
							placeholder="Falls back to Store Settings"
						/>
					</div>
					<div>
						<label class={LABEL} for="seo-desc">SEO description</label>
						<Textarea
							class="mt-1"
							id="seo-desc"
							value={draft.seo.description}
							oninput={(e) =>
								(draft.seo = {
									...draft.seo,
									description: (e.currentTarget as HTMLTextAreaElement).value
								})}
							rows={2}
						></Textarea>
					</div>
					<div>
						<label class={LABEL} for="seo-image">OG image</label>
						<NativeSelect
							class="mt-1"
							id="seo-image"
							value={draft.seo.image}
							onchange={(e) =>
								(draft.seo = { ...draft.seo, image: (e.currentTarget as HTMLSelectElement).value })}
						>
							<option value="">Use default SEO image</option>
							{#each admin.media as m (m.id)}
								<option value={m.url}>{m.name}</option>
							{/each}
						</NativeSelect>
					</div>
					<div>
						<label class={LABEL} for="seo-canonical">Canonical</label>
						<Input
							class="mt-1"
							id="seo-canonical"
							value={draft.seo.canonical}
							oninput={(e) =>
								(draft.seo = {
									...draft.seo,
									canonical: (e.currentTarget as HTMLInputElement).value
								})}
							placeholder="/summer-edit"
						/>
					</div>
					<div class="rounded-[8px] border bg-[#FBFBFA] p-3" style="border-color: var(--border);">
						<div class="truncate text-[11px] font-medium text-[#1A0DAB]">
							{draft.seo.title || admin.settings.defaultSeo.title || draft.title || 'Title'}
						</div>
						<div class="truncate text-[10px] text-[#006621]">
							{admin.settings.brand.domain}{draft.seo.canonical || `/${draft.slug || 'slug'}`}
						</div>
						<p class="mt-1 line-clamp-2 text-[11px] text-[#545454]">
							{draft.seo.description || admin.settings.defaultSeo.description || 'Description'}
						</p>
					</div>
				</div>
			</div>

			<Button variant="outline" size="lg" class="w-full" type="button" onclick={onCancel}
				>Cancel</Button
			>
		</div>
	</div>

	<!-- Add section modal: bottom sheet on mobile, centered on >=sm -->
	{#if addOpen}
		<div
			class="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
		>
			<div
				class="max-h-[92dvh] w-full overflow-y-auto rounded-t-[16px] border bg-white p-5 sm:max-w-[560px] sm:rounded-[12px]"
				style="border-color: var(--border);"
			>
				<div class="flex items-center justify-between">
					<h3 class="text-[14px] font-semibold">Add section</h3>
					<Button
						variant="outline"
						size="icon-sm"
						type="button"
						onclick={() => (addOpen = false)}
						aria-label="Close"><X class="h-4 w-4" /></Button
					>
				</div>
				<p class="mt-1 text-[11px] text-[#5A5A5A]">
					Choose one of 10 section types. You can reorder, hide, duplicate or delete it later.
				</p>
				<div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
					{#each SECTION_TYPES as t (t.type)}
						<Button
							variant="outline"
							size="default"
							class="h-auto w-full justify-start rounded-[10px] p-3 text-left hover:border-ring"
							type="button"
							onclick={() => addSection(t.type)}
						>
							<div class="text-[13px] font-medium">{t.label}</div>
							<p class="mt-0.5 text-[11px] text-[#5A5A5A]">{t.desc}</p>
						</Button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- History modal: bottom sheet on mobile, centered on >=sm -->
	{#if historyOpen}
		<div
			class="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
		>
			<div
				class="max-h-[92dvh] w-full overflow-y-auto rounded-t-[16px] border bg-white p-5 sm:max-w-[420px] sm:rounded-[12px]"
				style="border-color: var(--border);"
			>
				<div class="flex items-center justify-between">
					<h3 class="text-[14px] font-semibold">History</h3>
					<Button
						variant="outline"
						size="icon-sm"
						type="button"
						onclick={() => (historyOpen = false)}
						aria-label="Close"><X class="h-4 w-4" /></Button
					>
				</div>
				{#if versions.length === 0}
					<p class="mt-3 text-[12px] text-[#5A5A5A]">
						No published versions yet. Publish to create version 1.
					</p>
				{:else}
					<div class="mt-3 space-y-2">
						{#each versions as v (v.id)}
							<div
								class="flex items-center justify-between gap-2 rounded-[8px] border p-2.5"
								style="border-color: var(--border);"
							>
								<div>
									<div class="text-[12px] font-medium">Version {v.ver} — {v.title}</div>
									<div class="text-[10px] text-[#5A5A5A]">
										{new Date(v.publishedAt).toLocaleString('id-ID', {
											day: '2-digit',
											month: 'short',
											hour: '2-digit',
											minute: '2-digit'
										})} • {v.sections.length} sections
									</div>
								</div>
								<Button
									variant="outline"
									size="xs"
									type="button"
									onclick={() => restoreVersion(v.id)}>Restore</Button
								>
							</div>
						{/each}
					</div>
					<p class="mt-3 text-[10px] text-[#5A5A5A]">
						Restore loads the version into the editor. Save Draft or Publish to keep it.
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Mobile sticky action bar: thumb-reachable save/publish/preview on <lg -->
<div
	class="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden"
	style="border-color: var(--border); padding-bottom: calc(0.75rem + var(--safe-area-inset-bottom));"
>
	<Button
		variant="outline"
		size="lg"
		class="flex-1"
		type="button"
		onclick={() => (tab = tab === 'edit' ? 'preview' : 'edit')}
		>{tab === 'edit' ? 'Preview' : 'Edit'}</Button
	>
	<Button variant="outline" size="lg" class="flex-1" type="button" onclick={() => save('draft')}
		>Save Draft</Button
	>
	<Button variant="default" size="lg" class="flex-1" type="button" onclick={() => save('publish')}
		>Publish</Button
	>
</div>
