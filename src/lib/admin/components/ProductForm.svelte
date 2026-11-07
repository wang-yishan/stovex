<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Path } from '$app/types';
	import {
		Box,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		ChevronUp,
		CircleAlert,
		CircleCheck,
		DollarSign,
		Image,
		Info,
		Layers,
		Plus,
		Search,
		Star,
		Tag,
		Trash2,
		Upload,
		X
	} from '@lucide/svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import StatusBadge from '#lib/admin/components/StatusBadge.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import {
		effectiveStock,
		generateCombinations,
		formatIDR,
		nowISO,
		slugify,
		uid
	} from '#lib/admin/data.ts';
	import type { AttributeDraft, Product } from '#lib/admin/types.ts';

	let {
		product: initial,
		mode
	}: {
		product: Product;
		mode: 'create' | 'edit';
	} = $props();

	const VARIANTS_MAX = 50;

	// Working draft (reactive copy; original stays untouched until save)
	let draft = $state<Product>($state.snapshot(initial) as Product);
	let initialJson = $state(JSON.stringify(initial));
	let dirty = $derived(JSON.stringify(draft) !== initialJson);
	let inventoryTotal = $derived(
		draft.hasVariants
			? draft.variants.reduce((n, v) => n + v.stock, 0)
			: draft.trackInventory
				? draft.stock
				: 0
	);

	/* --- Slug: auto-derive until manually unlocked (ref Auto/Edit toggle). The
	       effective slug is derived so no effect ever writes back into the draft;
	       it is committed to the draft model at save time. --- */
	let slugManual = $state(mode === 'edit');
	let slug = $derived(slugManual ? draft.slug : slugify(draft.name));
	function toggleSlugLock() {
		if (slugManual) {
			// Switching back to Auto discards any hand-typed fragment.
			draft.slug = slugify(draft.name);
		}
		slugManual = !slugManual;
	}

	/* --- Media: multi-file upload (reference-only), primary flag, reorder --- */
	let uploadError = $state('');
	let uploadProgress = $state<number | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	function onFiles(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = input.files ? Array.from(input.files) : [];
		let hadError = false;
		const ok = files.filter((file) => {
			if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
				uploadError = 'Only jpg / png / webp allowed.';
				hadError = true;
				return false;
			}
			if (file.size > 5 * 1024 * 1024) {
				uploadError = 'Max 5MB per image.';
				hadError = true;
				return false;
			}
			return true;
		});
		if (hadError && ok.length === 0) return;
		uploadProgress = 0;
		const urls = ok.map((f) => URL.createObjectURL(f));
		const tick = setInterval(() => {
			if (uploadProgress === null) {
				clearInterval(tick);
				return;
			}
			if (uploadProgress >= 100) {
				clearInterval(tick);
				uploadProgress = 100;
			} else {
				uploadProgress = uploadProgress + 20;
			}
		}, 120);
		setTimeout(() => {
			clearInterval(tick);
			uploadProgress = null;
			const added = urls.map((url, i) => ({ id: uid('img'), url, isPrimary: false, alt: ok[i]?.name }));
			const images = [...draft.images, ...added];
			if (images.length > 0 && !images.some((i) => i.isPrimary)) images[0] = { ...images[0]!, isPrimary: true };
			draft.images = images;
			admin.showToast('Images added (reference only, not binary stored)', 'success');
			input.value = '';
		}, 700);
	}

	function setPrimary(id: string) {
		draft.images = draft.images.map((i) => ({ ...i, isPrimary: i.id === id }));
	}
	function moveImage(id: string, dir: 1 | -1) {
		const i = draft.images.findIndex((img) => img.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= draft.images.length) return;
		const next = [...draft.images];
		const [moved] = next.splice(i, 1);
		next.splice(j, 0, moved!);
		draft.images = next;
	}
	function removeImage(id: string) {
		const rest = draft.images.filter((i) => i.id !== id);
		if (rest.length > 0 && !rest.some((i) => i.isPrimary)) rest[0] = { ...rest[0]!, isPrimary: true };
		draft.images = rest;
	}

	/* --- Attribute builder (ref Gy): seeded Color/Size, comma-separated values --- */
	const ATTRIBUTE_SEED: AttributeDraft[] = [
		{ id: uid('attr-'), name: 'Color', values: ['Black', 'Beige'] },
		{ id: uid('attr-'), name: 'Size', values: ['S', 'M'] }
	];

	/** Ref form starts from existing variant attributes, else the Color/Size seed. */
	function refreshAttrs() {
		if (attrs.length > 0) return;
		if (draft.variants.length > 0) {
			const map = new Map<string, Set<string>>();
			for (const v of draft.variants) {
				for (const a of v.attributes) {
					if (!map.has(a.name)) map.set(a.name, new Set());
					map.get(a.name)!.add(a.value);
				}
			}
			attrs = [...map.entries()].map(([name, set]) => ({ id: uid('attr-'), name, values: [...set] }));
		} else {
			attrs = structuredClone(ATTRIBUTE_SEED).map((a) => ({ ...a, id: uid('attr-') }));
		}
	}

	let attrs: AttributeDraft[] = $state([]);
	refreshAttrs();

	function toggleVariants() {
		draft.hasVariants = !draft.hasVariants;
		if (draft.hasVariants) refreshAttrs();
	}

	let newAttrName = $state('');
	let newAttrValues = $state('');
	let chipInputs = $state<Record<string, string>>({});

	function addAttr() {
		if (!newAttrName.trim()) {
			admin.showToast('Attribute name required', 'error');
			return;
		}
		const values = newAttrValues
			.split(',')
			.map((v) => v.trim())
			.filter(Boolean);
		attrs = [...attrs, { id: uid('attr-'), name: newAttrName.trim(), values }];
		newAttrName = '';
		newAttrValues = '';
	}

	function chipKeyDown(e: KeyboardEvent, attrId: string) {
		if (e.key !== ',' && e.key !== 'Enter') return;
		e.preventDefault();
		const value = (e.currentTarget as HTMLInputElement).value.replace(/,/g, '').trim();
		if (!value) return;
		const a = attrs.find((x) => x.id === attrId);
		if (!a) return;
		attrs = attrs.map((x) => (x.id === attrId ? { ...x, values: [...x.values, value] } : x));
		chipInputs = { ...chipInputs, [attrId]: '' };
	}

	function removeValue(attrId: string, idx: number) {
		const a = attrs.find((x) => x.id === attrId);
		if (!a) return;
		attrs = attrs.map((x) =>
			x.id === attrId ? { ...x, values: x.values.filter((_, i) => i !== idx) } : x
		);
	}
	function removeAttr(id: string) {
		attrs = attrs.filter((a) => a.id !== id);
	}

	let combos = $derived.by(() => {
		const clean = attrs
			.filter((a) => a.name.trim())
			.map((a) => ({ id: a.id, name: a.name.trim(), values: a.values.map((v) => v.trim()).filter(Boolean) }))
			.filter((a) => a.values.length > 0);
		return generateCombinations(clean);
	});

	function generateVariants() {
		if (combos.length === 0) {
			admin.showToast('Add attribute values first', 'error');
			return;
		}
		if (combos.length > VARIANTS_MAX) {
			admin.showToast(`Too many combinations (${combos.length}) — reduce values (max ${VARIANTS_MAX})`, 'error');
			return;
		}
		const existingByName = new Map(draft.variants.map((v) => [v.name, v]));
		const variants = combos.map((c) => {
			const ex = existingByName.get(c.name);
			if (ex) return ex;
			return {
				id: uid('var-'),
				productId: draft.id,
				name: c.name,
				attributes: c.attributes,
				sku: '',
				stock: 0,
				available: true,
				priceOverride: undefined,
				lowThreshold: draft.lowStockThreshold || 5
			};
		});
		draft.hasVariants = true;
		draft.variants = variants;
		admin.showToast(`Generated ${variants.length} variants`, 'success');
	}

	function updateVariant(id: string, patch: Partial<Product['variants'][number]>) {
		draft.variants = draft.variants.map((v) => (v.id === id ? { ...v, ...patch } : v));
	}
	function removeVariant(id: string) {
		draft.variants = draft.variants.filter((v) => v.id !== id);
	}

	/* --- SEO collapsible --- */
	let seoOpen = $state(false);

	/* --- Inline create category / collection --- */
	let catModal = $state(false);
	let catDraft = $state({ name: '', slug: '', description: '' });
	let colModal = $state(false);
	let colDraft = $state({ name: '', slug: '', description: '' });

	function createCategoryInline() {
		if (!catDraft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		const slug = catDraft.slug.trim() || slugify(catDraft.name);
		if (!slug || !admin.slugUnique(slug, undefined, 'category')) {
			admin.showToast('Invalid or duplicate slug', 'error');
			return;
		}
		const c = admin.createCategory({ name: catDraft.name.trim(), slug, description: catDraft.description });
		draft.categoryId = c.id;
		catModal = false;
		catDraft = { name: '', slug: '', description: '' };
		admin.showToast('Category created', 'success');
	}
	function createCollectionInline() {
		if (!colDraft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		const slug = colDraft.slug.trim() || slugify(colDraft.name);
		if (!slug || !admin.slugUnique(slug, undefined, 'collection')) {
			admin.showToast('Invalid or duplicate slug', 'error');
			return;
		}
		const c = admin.createCollection({
			name: colDraft.name.trim(),
			slug,
			description: colDraft.description,
			productIds: []
		});
		draft.collectionIds = [...draft.collectionIds, c.id];
		colModal = false;
		colDraft = { name: '', slug: '', description: '' };
		admin.showToast('Collection created', 'success');
	}

	/* --- Live validation (ref H rules, extended to run before save) --- */
	let errors = $derived.by(() => {
		const e: Record<string, string> = {};
		if (!draft.name.trim()) e.name = 'Name required';
		if (!slug.trim()) e.slug = 'Slug required';
		else if (!admin.slugUnique(slug, mode === 'edit' ? draft.id : undefined)) e.slug = 'Slug must be unique';
		if (draft.basePrice <= 0) e.basePrice = 'Price must be positive';
		if (draft.compareAtPrice !== undefined && draft.compareAtPrice <= draft.basePrice)
			e.compareAtPrice = 'Compare-at must be > regular price';
		if (draft.sku && !admin.skuUnique(draft.sku, draft.id)) e.sku = 'SKU must be unique';
		if (draft.trackInventory && draft.stock < 0) e.stock = 'Inventory never negative';
		if (draft.lowStockThreshold < 0) e.lowStockThreshold = 'Threshold cannot be negative';
		if (draft.hasVariants) {
			if (draft.variants.length === 0) e.variants = 'Generate variants before publishing';
			for (const v of draft.variants) {
				if (v.stock < 0) e[`var-${v.id}-stock`] = 'Stock cannot be negative';
				if (v.sku && !admin.skuUnique(v.sku, draft.id, v.id)) e[`var-${v.id}-sku`] = 'SKU duplicate';
			}
		}
		return e;
	});

	/** Publish gates: everything above + primary image required. */
	let publishErrors = $derived.by(() => {
		const e = { ...errors };
		const images = draft.images;
		if (images.length === 0) e.images = 'Primary image required to publish';
		else if (!images.some((i) => i.isPrimary)) e.images = 'Select primary image';
		return e;
	});

	function backfillSeo() {
		if (!draft.seoTitle?.trim()) draft.seoTitle = draft.name.trim() ? `${draft.name} - Bag Store` : draft.seoTitle;
		if (!draft.seoDescription?.trim() && draft.shortDescription)
			draft.seoDescription = draft.shortDescription.slice(0, 160);
	}

	async function saveAs(status: 'active' | 'draft' | 'archived') {
		const strict = status === 'active';
		const gate = strict ? publishErrors : errors;
		if (Object.keys(gate).length > 0) {
			admin.showToast('Fix validation errors', 'error');
			return;
		}
		backfillSeo();
		const toSave: Product = {
			...($state.snapshot(draft) as Product),
			status,
			slug: slug,
			updatedAt: nowISO(),
			createdAt: draft.createdAt || nowISO(),
			variants: draft.variants.map((v) => ({ ...v, productId: draft.id }))
		};
		admin.upsertProduct(toSave);
		const target = mode === 'create' ? '/dashboard/products' : `/dashboard/products/${draft.id}`;
		await goto(resolve(target as Path));
	}

	/* --- Dirty guard --- */
	let guardOpen = $state(false);
	let pendingTo: string | null = $state(null);
	beforeNavigate((nav) => {
		if (dirty && nav.type === 'leave') {
			pendingTo = nav.to?.url.pathname ?? null;
			guardOpen = true;
			nav.cancel();
		}
	});
	function stay() {
		guardOpen = false;
		pendingTo = null;
	}
	async function leave() {
		dirty = false;
		initialJson = JSON.stringify(draft);
		guardOpen = false;
		if (pendingTo) await goto(pendingTo as Path);
	}
</script>

<!-- @component
	Product create/edit form (ref Gy): Basic Info with Auto/Edit slug, multi-image
	upload with primary/reorder, IDR pricing with compare-at validation, inventory
	with notes, attribute builder (comma chips + combos preview), variant table,
	organization with inline create, SEO preview and publishing rail. -->

<svelte:window
	onbeforeunload={(e) => {
		if (dirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}}
/>

<div class="mx-auto max-w-[1280px] w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-[120px] md:pb-6">
	<div class="flex items-center gap-2 mb-4">
		<a
			href={resolve('/dashboard/products' as Path)}
			class="h-10 w-10 shrink-0 rounded-full border bg-white flex items-center justify-center hover:border-[#242424] transition"
			style="border-color: var(--border);"
			aria-label="Back to products"
		>
			<ChevronLeft class="h-5 w-5" />
		</a>
		<h2 class="text-[16px] sm:text-[18px] font-semibold">{mode === 'create' ? 'New product' : `Edit ${draft.name || 'product'}`}</h2>
	</div>

	<div class="flex flex-col lg:flex-row gap-6">
		<!-- Main column -->
		<div class="flex-1 min-w-0 space-y-4">
			<!-- Basic Info -->
			<div class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="text-[13px] font-semibold mb-3 flex items-center gap-2"><Info class="h-4 w-4 shrink-0" />Basic Info</h3>
				<div class="space-y-3">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Name *</span>
						<input
							class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
							style="border-color: {errors.name ? '#D9534F' : 'var(--border)'}"
							bind:value={draft.name}
							placeholder="Everyday Canvas Tote"
						/>
						{#if errors.name}<p class="text-[11px] text-[#D9534F] mt-1">{errors.name}</p>{/if}
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<span class="flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]"
								>Slug *
								<button
									type="button"
									class="text-[10px] normal-case tracking-normal underline"
									onclick={toggleSlugLock}>{slugManual ? 'Auto' : 'Edit'}</button
								>
							</span>
							<input
								class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] mono bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424] disabled:opacity-60"
								style="border-color: {errors.slug ? '#D9534F' : 'var(--border)'}"
								value={slug}
								disabled={!slugManual}
								oninput={(e) => {
									slugManual = true;
									draft.slug = slugify((e.currentTarget as HTMLInputElement).value);
								}}
							/>
							{#if errors.slug}<p class="text-[11px] text-[#D9534F] mt-1">{errors.slug}</p>{/if}
						</div>
						<div>
							<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">SKU (unique)</span>
							<input
								class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] mono bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
								style="border-color: {errors.sku ? '#D9534F' : 'var(--border)'}"
								bind:value={draft.sku}
								placeholder="ECT-BGE-M"
							/>
							{#if errors.sku}<p class="text-[11px] text-[#D9534F] mt-1">{errors.sku}</p>{/if}
						</div>
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Short Description</span>
						<textarea
							rows="2"
							class="mt-1 w-full rounded-[8px] border px-3 py-2 text-[13px] resize-none bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
							style="border-color: var(--border);"
							bind:value={draft.shortDescription}
							placeholder="Lightweight canvas tote for daily essentials."
						></textarea>
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Full Description</span>
						<textarea
							rows="4"
							class="mt-1 w-full rounded-[8px] border px-3 py-2 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
							style="border-color: var(--border);"
							bind:value={draft.fullDescription}
							placeholder="Made from organic canvas with reinforced handles..."
						></textarea>
					</div>
				</div>
			</div>

			<!-- Media -->
			<div class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="text-[13px] font-semibold mb-3 flex items-center gap-2"><Image class="h-4 w-4 shrink-0" />Media — upload, reorder, primary</h3>
				<div
					class="border border-dashed rounded-[10px] p-4 text-center bg-[#FBFBFA]"
					style="border-color: var(--border);"
				>
					<input
						type="file"
						multiple
						accept="image/jpeg,image/png,image/webp"
						class="hidden"
						bind:this={fileInput}
						onchange={onFiles}
					/>
					<button
						type="button"
						class="h-10 sm:h-8 rounded-full border bg-white px-4 text-[12px] font-medium hover:border-[#242424] transition inline-flex items-center gap-1.5"
						style="border-color: var(--border);"
						onclick={() => fileInput?.click()}
					>
						<Upload class="h-4 w-4 shrink-0" />Upload images
					</button>
					<p class="text-[11px] text-[#999] mt-2">jpg/png/webp max 5MB • Store references not binary • Primary required for publish</p>
					{#if uploadProgress !== null}
						<div class="mt-3 h-1.5 w-full bg-[#EAEAEA] rounded-full overflow-hidden">
							<div class="h-full bg-[#242424] transition-all" style="width: {uploadProgress}%"></div>
						</div>
					{/if}
					{#if uploadError}<p class="text-[11px] text-[#D9534F] mt-2">{uploadError}</p>{/if}
				</div>
				{#if draft.images.length > 0}
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
						{#each draft.images as img (img.id)}
							<div
								class="relative border rounded-[10px] overflow-hidden bg-[#F5F5F4] {img.isPrimary ? 'ring-2 ring-[#242424]' : ''}"
								style="border-color: {img.isPrimary ? '#242424' : 'var(--border)'};"
							>
								<div class="aspect-square flex items-center justify-center text-[10px] font-bold">
									{#if img.url}
										<img src={img.url} alt={img.alt ?? draft.name} class="h-full w-full object-cover" />
									{:else}
										IMG
									{/if}
								</div>
								<div class="absolute top-1 left-1 flex gap-1">
									<button
										type="button"
										class="h-8 w-8 sm:h-6 sm:w-6 rounded-full flex items-center justify-center border {img.isPrimary
											? 'bg-[#242424] text-white border-[#242424]'
											: 'bg-white/80'}"
										style="border-color: {img.isPrimary ? '#242424' : 'var(--border)'};"
										onclick={() => setPrimary(img.id)}
										aria-label={img.isPrimary ? 'Primary image' : 'Set as primary image'}
									>
										<Star class="h-4 sm:h-3 w-4 sm:w-3" fill={img.isPrimary ? 'currentColor' : 'none'} />
									</button>
								</div>
								<div class="absolute top-1 right-1 flex gap-1">
									<button
										type="button"
										class="h-8 w-8 sm:h-6 sm:w-6 rounded-full bg-white/80 border flex items-center justify-center"
										style="border-color: var(--border);"
										onclick={() => moveImage(img.id, -1)}
										aria-label="Move image left"
									>
										<ChevronLeft class="h-4 sm:h-3 w-4 sm:w-3" />
									</button>
									<button
										type="button"
										class="h-8 w-8 sm:h-6 sm:w-6 rounded-full bg-white/80 border flex items-center justify-center"
										style="border-color: var(--border);"
										onclick={() => moveImage(img.id, 1)}
										aria-label="Move image right"
									>
										<ChevronRight class="h-4 sm:h-3 w-4 sm:w-3" />
									</button>
									<button
										type="button"
										class="h-8 w-8 sm:h-6 sm:w-6 rounded-full bg-white border flex items-center justify-center hover:bg-[#FFF0F0]"
										style="border-color: var(--border);"
										onclick={() => removeImage(img.id)}
										aria-label="Remove image"
									>
										<X class="h-4 sm:h-3 w-4 sm:w-3" />
									</button>
								</div>
								{#if img.isPrimary}
									<div class="absolute bottom-1 left-1 right-1 text-center">
										<span class="text-[9px] bg-[#242424] text-white px-2 py-0.5 rounded-full">Primary</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Pricing IDR -->
			<div class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="text-[13px] font-semibold mb-3 flex items-center gap-2"><DollarSign class="h-4 w-4 shrink-0" />Pricing — IDR</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Regular Price *</span>
						<input
							type="number"
							min="0"
							class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
							style="border-color: {errors.basePrice ? '#D9534F' : 'var(--border)'}"
							value={draft.basePrice || ''}
							oninput={(e) => (draft.basePrice = Math.max(0, Number((e.currentTarget as HTMLInputElement).value) || 0))}
						/>
						<div class="text-[11px] text-[#777] mt-1">{formatIDR(draft.basePrice)}</div>
						{#if errors.basePrice}<p class="text-[11px] text-[#D9534F] mt-1">{errors.basePrice}</p>{/if}
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Compare-at (optional, &gt; regular)</span>
						<input
							type="number"
							min="0"
							class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
							style="border-color: {errors.compareAtPrice ? '#D9534F' : 'var(--border)'}"
							value={draft.compareAtPrice ?? ''}
							placeholder="1150000"
							oninput={(e) => {
								const el = e.currentTarget as HTMLInputElement;
								const n = el.value === '' ? undefined : Math.max(0, Number(el.value) || 0);
								draft.compareAtPrice = n;
							}}
						/>
						{#if draft.compareAtPrice !== undefined}
							<div class="text-[11px] text-[#777] mt-1 line-through">{formatIDR(draft.compareAtPrice)}</div>
						{/if}
						{#if errors.compareAtPrice}<p class="text-[11px] text-[#D9534F] mt-1">{errors.compareAtPrice}</p>{/if}
					</div>
				</div>
			</div>

			<!-- Inventory -->
			<div class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="text-[13px] font-semibold mb-3 flex items-center gap-2"><Box class="h-4 w-4 shrink-0" />Inventory</h3>
				<div class="flex items-center gap-2 mb-3">
					<span class="text-[12px] font-medium">Track inventory</span>
					<button
						type="button"
						class="h-6 w-11 rounded-full shrink-0 p-0.5 transition {draft.trackInventory ? 'bg-[#242424]' : 'bg-[#EAEAEA]'}"
						onclick={() => (draft.trackInventory = !draft.trackInventory)}
						aria-label="Toggle inventory tracking"
					>
						<span class="block h-5 w-5 rounded-full bg-white transition-transform {draft.trackInventory ? 'translate-x-5' : ''}"></span>
					</button>
					{#if !draft.trackInventory}
						<span class="text-[11px] text-[#777]">Stock not tracked — hide misleading quantities</span>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Stock quantity</span>
						<input
							type="number"
							min="0"
							disabled={!draft.trackInventory || draft.hasVariants}
							class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424] disabled:opacity-50"
							style="border-color: {errors.stock ? '#D9534F' : 'var(--border)'}"
							value={draft.stock}
							oninput={(e) => (draft.stock = Math.max(0, Number((e.currentTarget as HTMLInputElement).value) || 0))}
						/>
						{#if draft.hasVariants}
							<p class="text-[10px] text-[#777] mt-1">Sum of variants used when variants enabled</p>
						{/if}
						{#if errors.stock}<p class="text-[11px] text-[#D9534F] mt-1">{errors.stock}</p>{/if}
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Low-stock threshold</span>
						<input
							type="number"
							min="0"
							class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
							style="border-color: {errors.lowStockThreshold ? '#D9534F' : 'var(--border)'}"
							value={draft.lowStockThreshold}
							oninput={(e) =>
								(draft.lowStockThreshold = Number((e.currentTarget as HTMLInputElement).value) || 0)}
						/>
						{#if errors.lowStockThreshold}<p class="text-[11px] text-[#D9534F] mt-1">{errors.lowStockThreshold}</p>{/if}
					</div>
				</div>
			</div>

			<!-- Variants -->
			<div class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-[13px] font-semibold flex items-center gap-2"><Layers class="h-4 w-4 shrink-0" />Variants</h3>
					<div class="flex items-center gap-2">
						<span class="text-[12px]">Enable variants</span>
						<button
							type="button"
							class="h-6 w-11 rounded-full shrink-0 p-0.5 transition {draft.hasVariants ? 'bg-[#242424]' : 'bg-[#EAEAEA]'}"
							onclick={toggleVariants}
							aria-label="Toggle variants"
						>
							<span class="block h-5 w-5 rounded-full bg-white transition-transform {draft.hasVariants ? 'translate-x-5' : ''}"></span>
						</button>
					</div>
				</div>

				{#if draft.hasVariants}
					<div class="space-y-4">
						<div class="bg-[#FBFBFA] border rounded-[10px] p-3" style="border-color: var(--border);">
							<p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777] mb-2">Attribute builder (Color/Size)</p>
							{#each attrs as a (a.id)}
								<div class="flex items-center gap-2 mb-2">
									<div class="flex-1 grid grid-cols-2 gap-2">
										<input
											class="h-8 rounded-[6px] border px-2 text-[12px] bg-white"
											style="border-color: var(--border);"
											placeholder="Attribute name"
											value={a.name}
											oninput={(e) => {
												const name = (e.currentTarget as HTMLInputElement).value;
												attrs = attrs.map((x) => (x.id === a.id ? { ...x, name } : x));
											}}
										/>
										<div
											class="flex flex-wrap gap-1 items-center border rounded-[6px] px-2 py-1 bg-white min-h-[32px]"
											style="border-color: var(--border);"
										>
											{#each a.values as v, i (i)}
												<span
													class="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F0F0EF] border flex items-center gap-1"
													style="border-color: var(--border);"
												>
													{v}
													<button
														type="button"
														class="ml-1"
														onclick={() => removeValue(a.id, i)}
														aria-label="Remove value {v}"
													>
														<X class="h-2.5 w-2.5" />
													</button>
												</span>
											{/each}
											<input
												class="flex-1 text-[11px] outline-none min-w-[80px] bg-transparent"
												placeholder="comma separated"
												value={chipInputs[a.id] ?? ''}
												oninput={(e) => (chipInputs = { ...chipInputs, [a.id]: (e.currentTarget as HTMLInputElement).value })}
												onkeydown={(e) => chipKeyDown(e, a.id)}
											/>
										</div>
									</div>
									<button
										type="button"
										class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]"
										style="border-color: var(--border);"
										onclick={() => removeAttr(a.id)}
										aria-label="Remove attribute {a.name}"
									>
										<Trash2 class="h-3.5 w-3.5 text-[#777]" />
									</button>
								</div>
							{/each}
							<div class="flex gap-2 mt-3">
								<input
									class="h-10 sm:h-8 rounded-[6px] border px-2 text-[12px] bg-white flex-1"
									style="border-color: var(--border);"
									placeholder="New attribute e.g. Material"
									bind:value={newAttrName}
								/>
								<input
									class="h-10 sm:h-8 rounded-[6px] border px-2 text-[12px] bg-white flex-1"
									style="border-color: var(--border);"
									placeholder="Values comma e.g. Cotton, Leather"
									bind:value={newAttrValues}
								/>
								<button
									type="button"
									class="h-10 sm:h-8 rounded-full bg-[#242424] text-white px-3 text-[11px]"
									onclick={addAttr}
								>
									Add
								</button>
							</div>
							<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
								<span class="text-[11px] text-[#777]">
									Combinations preview: <b>{combos.length}</b>
									{#if combos.length > VARIANTS_MAX}<span class="text-[#D9534F]"> — Warn if &gt;{VARIANTS_MAX}, excessive</span>{/if}
								</span>
								<button
									type="button"
									class="h-9 sm:h-7 rounded-full bg-[#343434] text-white px-3 text-[11px] font-medium"
									onclick={generateVariants}
								>
									Generate
								</button>
							</div>
						</div>

						{#if draft.variants.length > 0}
							<div class="overflow-x-auto border rounded-[10px]" style="border-color: var(--border);">
								<table class="w-full text-left">
									<thead>
										<tr
											class="bg-[#FBFBFA] border-b text-[10px] font-semibold tracking-[0.08em] uppercase text-[#999]"
											style="border-color: var(--border);"
										>
											<th class="px-3 py-2">Variant</th>
											<th class="px-3 py-2">SKU</th>
											<th class="px-3 py-2">Price override</th>
											<th class="px-3 py-2">Stock</th>
											<th class="px-3 py-2">Avail</th>
											<th class="px-3 py-2">Actions</th>
										</tr>
									</thead>
									<tbody class="divide-y" style="border-color: var(--border);">
										{#each draft.variants as v (v.id)}
											<tr class={v.stock === 0 ? 'bg-[#FFFDF3]' : ''}>
												<td class="px-3 py-2">
													<div class="text-[12px] font-medium">{v.name}</div>
													<div class="text-[10px] text-[#777]">{v.attributes.map((a) => `${a.name}:${a.value}`).join(', ')}</div>
													{#if v.stock === 0}
														<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FFF0F0] border text-[#A33A37]" style="border-color: #F2C2C0;">Out</span>
													{/if}
												</td>
												<td class="px-3 py-2">
													<input
														class="h-8 w-[110px] rounded-[6px] border px-2 text-[11px] mono"
														style="border-color: {errors[`var-${v.id}-sku`] ? '#D9534F' : 'var(--border)'}"
														bind:value={v.sku}
													/>
													{#if errors[`var-${v.id}-sku`]}<p class="text-[9px] text-[#D9534F]">{errors[`var-${v.id}-sku`]}</p>{/if}
												</td>
												<td class="px-3 py-2">
													<input
														type="number"
														min="0"
														class="h-8 w-[90px] rounded-[6px] border px-2 text-[11px]"
														style="border-color: var(--border);"
														value={v.priceOverride ?? ''}
														placeholder={String(draft.basePrice)}
														oninput={(e) => {
															const el = e.currentTarget as HTMLInputElement;
															updateVariant(v.id, {
																priceOverride: el.value === '' ? undefined : Math.max(0, Number(el.value) || 0)
															});
														}}
													/>
												</td>
												<td class="px-3 py-2">
													<input
														type="number"
														min="0"
														class="h-8 w-[60px] rounded-[6px] border px-2 text-[11px]"
														style="border-color: {errors[`var-${v.id}-stock`] ? '#D9534F' : 'var(--border)'}"
														value={v.stock}
														oninput={(e) =>
															updateVariant(v.id, {
																stock: Math.max(0, Number((e.currentTarget as HTMLInputElement).value) || 0)
															})}
													/>
													{#if errors[`var-${v.id}-stock`]}<p class="text-[9px] text-[#D9534F]">{errors[`var-${v.id}-stock`]}</p>{/if}
												</td>
												<td class="px-3 py-2">
													<button
														type="button"
														class="h-6 w-11 rounded-full shrink-0 p-0.5 transition {v.available ? 'bg-[#269B65]' : 'bg-[#EAEAEA]'}"
														onclick={() => updateVariant(v.id, { available: !v.available })}
														aria-label="Toggle availability for {v.name}"
													>
														<span class="block h-5 w-5 rounded-full bg-white transition-transform {v.available ? 'translate-x-5' : ''}"></span>
													</button>
												</td>
												<td class="px-3 py-2">
													<button
														type="button"
														class="flex h-7 w-7 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]"
														style="border-color: var(--border);"
														onclick={() => removeVariant(v.id)}
														aria-label="Remove variant {v.name}"
													>
														<Trash2 class="h-3.5 w-3.5 text-[#777]" />
													</button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
						{#if errors.variants}<p class="text-[11px] text-[#D9534F]">{errors.variants}</p>{/if}
					</div>
				{:else}
					<p class="text-[11px] text-[#777]">Enable variants to manage Color/Size combinations. When disabled, product-level pricing/inventory used.</p>
				{/if}
			</div>

			<!-- Organization -->
			<div class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="text-[13px] font-semibold mb-3 flex items-center gap-2"><Tag class="h-4 w-4 shrink-0" />Organization</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Category *</span>
						<div class="flex gap-2 mt-1">
							<select
								class="flex-1 h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
								style="border-color: {errors.categoryId ? '#D9534F' : 'var(--border)'}"
								bind:value={draft.categoryId}
							>
								<option value="">Select category</option>
								{#each admin.categories as c (c.id)}
									<option value={c.id}>{c.name}</option>
								{/each}
							</select>
							<button
								type="button"
								class="h-10 w-10 sm:h-9 sm:w-9 shrink-0 rounded-[8px] border bg-white flex items-center justify-center hover:border-[#242424]"
								style="border-color: var(--border);"
								onclick={() => (catModal = true)}
								aria-label="Create category inline"
							>
								<Plus class="h-4 w-4" />
							</button>
						</div>
						{#if errors.categoryId}<p class="text-[11px] text-[#D9534F] mt-1">{errors.categoryId}</p>{/if}
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Featured</span>
						<div class="flex items-center gap-2 mt-2">
							<button
								type="button"
								class="h-6 w-11 rounded-full shrink-0 p-0.5 transition {draft.featured ? 'bg-[#242424]' : 'bg-[#EAEAEA]'}"
								onclick={() => (draft.featured = !draft.featured)}
								aria-label="Toggle featured"
							>
								<span class="block h-5 w-5 rounded-full bg-white transition-transform {draft.featured ? 'translate-x-5' : ''}"></span>
							</button>
							<span class="text-[12px]">{draft.featured ? 'Featured in storefront' : 'Not featured'}</span>
						</div>
					</div>
				</div>
				<div class="mt-3">
					<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">Collections</span>
					<div class="mt-1 border rounded-[8px] p-2 max-h-[120px] overflow-y-auto bg-[#FBFBFA]" style="border-color: var(--border);">
						{#each admin.collections as c (c.id)}
							<label class="flex items-center gap-2 py-1 text-[12px]">
								<input
									type="checkbox"
									checked={draft.collectionIds.includes(c.id)}
									onchange={(e) => {
										const on = (e.currentTarget as HTMLInputElement).checked;
										draft.collectionIds = on
											? [...draft.collectionIds, c.id]
											: draft.collectionIds.filter((id) => id !== c.id);
									}}
									class="rounded"
								/>
								{c.name}
								<span class="text-[10px] text-[#999]">({c.slug})</span>
							</label>
						{/each}
					</div>
					<button type="button" class="mt-2 text-[11px] underline" onclick={() => (colModal = true)}>
						+ Create new collection inline (auto-selects)
					</button>
				</div>
			</div>

			<!-- SEO -->
			<div class="bg-white border rounded-[12px] p-4 md:p-5" style="border-color: var(--border);">
				<button type="button" class="w-full flex items-center justify-between" onclick={() => (seoOpen = !seoOpen)}>
					<span class="text-[13px] font-semibold flex items-center gap-2"><Search class="h-4 w-4 shrink-0" />SEO (optional)</span>
					{#if seoOpen}<ChevronUp class="h-4 w-4" />{:else}<ChevronDown class="h-4 w-4" />{/if}
				</button>
				{#if seoOpen}
					<div class="mt-3 space-y-3">
						<div>
							<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">SEO Title</span>
							<input
								class="mt-1 w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
								style="border-color: var(--border);"
								bind:value={draft.seoTitle}
								placeholder="60 chars recommended"
							/>
						</div>
						<div>
							<span class="block text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]">SEO Description</span>
							<textarea
								rows="2"
								class="mt-1 w-full rounded-[8px] border px-3 py-2 text-[13px] bg-[#FBFBFA] focus:bg-white focus:outline-none focus:border-[#242424]"
								style="border-color: var(--border);"
								bind:value={draft.seoDescription}
								placeholder="155 chars"
							></textarea>
						</div>
						<div class="border rounded-[8px] p-3 bg-[#FBFBFA]" style="border-color: var(--border);">
							<div class="text-[11px] text-[#1A0DAB] font-medium truncate">{draft.seoTitle || draft.name || 'Your product title'}</div>
							<div class="text-[10px] text-[#006621] truncate">https://bagstore.com/products/{slug || 'your-slug'}</div>
							<div class="text-[11px] text-[#545454] mt-1 line-clamp-2">
								{draft.seoDescription || draft.shortDescription || 'Search preview Google-style'}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Publishing rail -->
		<div class="lg:w-[320px] shrink-0 space-y-4 lg:sticky lg:top-[88px] self-start">
			<div class="bg-white border rounded-[12px] p-4" style="border-color: var(--border);">
				<h3 class="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#777]">Publishing</h3>
				<div class="mt-3 space-y-2 text-[12px]">
					<div class="flex justify-between"><span class="text-[#777]">Status</span><StatusBadge status={draft.status} /></div>
					<div class="flex justify-between"><span class="text-[#777]">Featured</span><span>{draft.featured ? 'Yes' : 'No'}</span></div>
					<div class="flex justify-between">
						<span class="text-[#777]">Inventory</span>
						<span>{draft.trackInventory ? `${inventoryTotal} total` : 'Not tracked'}</span>
					</div>
					<div class="flex justify-between"><span class="text-[#777]">Variants</span><span>{draft.hasVariants ? `${draft.variants.length}` : 'No'}</span></div>
				</div>
				<div class="mt-4">
					<p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777] mb-2">Validation summary</p>
					{#if Object.keys(publishErrors).length === 0}
						<p class="text-[11px] text-[#269B65] flex items-center gap-1"><CircleCheck class="h-3.5 w-3.5 shrink-0" /> No errors</p>
					{:else}
						<ul class="space-y-1">
							{#each Object.entries(publishErrors) as [k, v] (k)}
								<li class="text-[11px] text-[#D9534F]">• {k}: {v}</li>
							{/each}
						</ul>
					{/if}
					<p class="text-[10px] text-[#777] mt-2">Business rules: publish requires name, valid price, category, primary image. Variants must have valid configs. SKU unique. Inventory never negative. Archived/Draft not in storefront. No inaccurate stock when tracking off.</p>
				</div>
				<div class="mt-4 space-y-2">
					<button
						type="button"
						class="w-full h-10 sm:h-9 rounded-full bg-[#343434] text-white text-[12px] font-medium hover:bg-[#242424] transition"
						onclick={() => saveAs('active')}
					>
						Publish Product
					</button>
					<button
						type="button"
						class="w-full h-10 sm:h-9 rounded-full border bg-white text-[12px] font-medium hover:border-[#242424] transition"
						style="border-color: var(--border);"
						onclick={() => saveAs('draft')}
					>
						Save as Draft
					</button>
					<button
						type="button"
						class="w-full h-10 sm:h-9 rounded-full border bg-[#FFF8E6] text-[12px] font-medium hover:border-[#D69A35] transition"
						style="border-color: #F3D9A0;"
						onclick={() => saveAs('archived')}
					>
						Archive
					</button>
				</div>
			</div>
			<div class="bg-[#FBFBFA] border rounded-[12px] p-3" style="border-color: var(--border);">
				<p class="text-[11px] text-[#777]">In-memory draft mode — changes not persisted to server. Server-side validation simulated.</p>
			</div>
		</div>
	</div>
</div>

{#if catModal}
	<Modal title="Create category inline">
		<p class="text-[11px] text-[#777] mt-1">Auto-selects new category without losing form data.</p>
		<div class="mt-3 space-y-2">
			<input
				class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]"
				style="border-color: var(--border);"
				placeholder="Name"
				bind:value={catDraft.name}
				oninput={() => (catDraft.slug = slugify(catDraft.name))}
			/>
			<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] mono" style="border-color: var(--border);" placeholder="Slug" bind:value={catDraft.slug} />
			<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]" style="border-color: var(--border);" placeholder="Description" bind:value={catDraft.description} />
		</div>
		<div class="flex gap-2 mt-4">
			<button type="button" class="flex-1 h-10 rounded-full bg-[#242424] text-white text-[12px]" onclick={createCategoryInline}>Create &amp; Select</button>
			<button type="button" class="flex-1 h-10 rounded-full border bg-white text-[12px]" style="border-color: var(--border);" onclick={() => (catModal = false)}>Cancel</button>
		</div>
	</Modal>
{/if}

{#if colModal}
	<Modal title="Create collection inline">
		<p class="text-[11px] text-[#777] mt-1">Auto-selects new collection without losing form data.</p>
		<div class="mt-3 space-y-2">
			<input
				class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]"
				style="border-color: var(--border);"
				placeholder="Name"
				bind:value={colDraft.name}
				oninput={() => (colDraft.slug = slugify(colDraft.name))}
			/>
			<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px] mono" style="border-color: var(--border);" placeholder="Slug" bind:value={colDraft.slug} />
			<input class="w-full h-10 sm:h-9 rounded-[8px] border px-3 text-[13px]" style="border-color: var(--border);" placeholder="Description" bind:value={colDraft.description} />
		</div>
		<div class="flex gap-2 mt-4">
			<button type="button" class="flex-1 h-10 rounded-full bg-[#242424] text-white text-[12px]" onclick={createCollectionInline}>Create &amp; Select</button>
			<button type="button" class="flex-1 h-10 rounded-full border bg-white text-[12px]" style="border-color: var(--border);" onclick={() => (colModal = false)}>Cancel</button>
		</div>
	</Modal>
{/if}

{#if guardOpen}
	<Modal title="Leave form?">
		<p class="text-[12px] text-[#777] mt-1">You have unsaved changes. Leave without saving?</p>
		<div class="flex gap-2 mt-4">
			<button type="button" class="flex-1 h-10 rounded-full bg-[#242424] text-white text-[12px]" onclick={leave}>Leave</button>
			<button type="button" class="flex-1 h-10 rounded-full border bg-white text-[12px]" style="border-color: var(--border);" onclick={stay}>Stay</button>
		</div>
	</Modal>
{/if}
