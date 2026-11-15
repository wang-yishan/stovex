<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { resolvePath } from '#lib/admin/paths.ts';
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
	import { uploadImages } from '#lib/admin/api.ts';
	import {
		effectiveStock,
		generateCombinations,
		formatIDR,
		nowISO,
		slugify,
		uid
	} from '#lib/admin/data.ts';
	import type { AttributeDraft, Product } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';

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

	/* --- Media: multi-file upload (saved to disk), primary flag, reorder --- */
	let uploadError = $state('');
	let uploading = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	async function onFiles(e: Event) {
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
		if (ok.length === 0) {
			input.value = '';
			return;
		}

		uploading = true;
		uploadError = '';
		try {
			// The bytes are written to disk by /api/uploads and served from /uploads.
			const saved = await uploadImages(ok);
			const added = saved.map((file, i) => ({
				id: uid('img'),
				url: file.url,
				isPrimary: false,
				alt: ok[i]?.name
			}));
			const images = [...draft.images, ...added];
			if (images.length > 0 && !images.some((i) => i.isPrimary))
				images[0] = { ...images[0]!, isPrimary: true };
			draft.images = images;
			admin.showToast(
				`${saved.length} image${saved.length > 1 ? 's' : ''} saved to disk`,
				'success'
			);
		} catch (cause) {
			uploadError = cause instanceof Error ? cause.message : 'Upload failed';
		} finally {
			uploading = false;
			input.value = '';
		}
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
		if (rest.length > 0 && !rest.some((i) => i.isPrimary))
			rest[0] = { ...rest[0]!, isPrimary: true };
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
			attrs = [...map.entries()].map(([name, set]) => ({
				id: uid('attr-'),
				name,
				values: [...set]
			}));
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
			.map((a) => ({
				id: a.id,
				name: a.name.trim(),
				values: a.values.map((v) => v.trim()).filter(Boolean)
			}))
			.filter((a) => a.values.length > 0);
		return generateCombinations(clean);
	});

	function generateVariants() {
		if (combos.length === 0) {
			admin.showToast('Add attribute values first', 'error');
			return;
		}
		if (combos.length > VARIANTS_MAX) {
			admin.showToast(
				`Too many combinations (${combos.length}) — reduce values (max ${VARIANTS_MAX})`,
				'error'
			);
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

	async function createCategoryInline() {
		if (!catDraft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		const slug = catDraft.slug.trim() || slugify(catDraft.name);
		if (!slug || !admin.slugUnique(slug, undefined, 'category')) {
			admin.showToast('Invalid or duplicate slug', 'error');
			return;
		}
		const c = await admin.createCategory({
			name: catDraft.name.trim(),
			slug,
			description: catDraft.description
		});
		if (!c) return;
		draft.categoryId = c.id;
		catModal = false;
		catDraft = { name: '', slug: '', description: '' };
		admin.showToast('Category created', 'success');
	}
	async function createCollectionInline() {
		if (!colDraft.name.trim()) {
			admin.showToast('Name required', 'error');
			return;
		}
		const slug = colDraft.slug.trim() || slugify(colDraft.name);
		if (!slug || !admin.slugUnique(slug, undefined, 'collection')) {
			admin.showToast('Invalid or duplicate slug', 'error');
			return;
		}
		const c = await admin.createCollection({
			name: colDraft.name.trim(),
			slug,
			description: colDraft.description,
			productIds: []
		});
		if (!c) return;
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
		else if (!admin.slugUnique(slug, mode === 'edit' ? draft.id : undefined))
			e.slug = 'Slug must be unique';
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
				if (v.sku && !admin.skuUnique(v.sku, draft.id, v.id))
					e[`var-${v.id}-sku`] = 'SKU duplicate';
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
		if (!draft.seoTitle?.trim())
			draft.seoTitle = draft.name.trim()
				? `${draft.name} - ${admin.settings.brand.name}`
				: draft.seoTitle;
		if (!draft.seoDescription?.trim() && draft.shortDescription)
			draft.seoDescription = draft.shortDescription.slice(0, 160);
	}

	let saving = $state(false);

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
		saving = true;
		// Writes to SQLite; the store mirrors the saved row.
		const saved = await admin.upsertProduct(toSave);
		saving = false;
		if (!saved) return;
		const target = mode === 'create' ? '/dashboard/products' : `/dashboard/products/${draft.id}`;
		await goto(resolvePath(target));
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
		if (pendingTo) await goto(pendingTo);
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

<div class="mx-auto w-full max-w-[1280px] px-4 py-4 pb-[120px] md:px-6 md:py-6 md:pb-6 lg:px-8">
	<div class="mb-4 flex items-center gap-2">
		<a
			href={resolve('/dashboard/products')}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white transition hover:border-[#242424]"
			style="border-color: var(--border);"
			aria-label="Back to products"
		>
			<ChevronLeft class="h-5 w-5" />
		</a>
		<h2 class="text-[16px] font-semibold sm:text-[18px]">
			{mode === 'create' ? 'New product' : `Edit ${draft.name || 'product'}`}
		</h2>
	</div>

	<div class="flex flex-col gap-6 lg:flex-row">
		<!-- Main column -->
		<div class="min-w-0 flex-1 space-y-4">
			<!-- Basic Info -->
			<div class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="mb-3 flex items-center gap-2 text-[13px] font-semibold">
					<Info class="h-4 w-4 shrink-0" />Basic Info
				</h3>
				<div class="space-y-3">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Name *</span
						>
						<Input
							class="mt-1"
							aria-invalid={Boolean(errors.name)}
							bind:value={draft.name}
							placeholder="Everyday Canvas Tote"
						/>
						{#if errors.name}<p class="mt-1 text-[11px] text-[#D9534F]">{errors.name}</p>{/if}
					</div>
					<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
						<div>
							<span
								class="flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
								>Slug *
								<Button
									variant="link"
									size="xs"
									class="h-auto px-0 text-[10px] tracking-normal normal-case underline"
									onclick={toggleSlugLock}>{slugManual ? 'Auto' : 'Edit'}</Button
								>
							</span>
							<Input
								font="mono"
								class="mt-1"
								aria-invalid={Boolean(errors.slug)}
								value={slug}
								disabled={!slugManual}
								oninput={(e) => {
									slugManual = true;
									draft.slug = slugify((e.currentTarget as HTMLInputElement).value);
								}}
							/>
							{#if errors.slug}<p class="mt-1 text-[11px] text-[#D9534F]">{errors.slug}</p>{/if}
						</div>
						<div>
							<span
								class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
								>SKU (unique)</span
							>
							<Input
								font="mono"
								class="mt-1"
								aria-invalid={Boolean(errors.sku)}
								bind:value={draft.sku}
								placeholder="ECT-BGE-M"
							/>
							{#if errors.sku}<p class="mt-1 text-[11px] text-[#D9534F]">{errors.sku}</p>{/if}
						</div>
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Short Description</span
						>
						<Textarea
							class="mt-1 resize-none"
							rows="2"
							bind:value={draft.shortDescription}
							placeholder="Lightweight canvas tote for daily essentials."
						></Textarea>
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Full Description</span
						>
						<Textarea
							class="mt-1"
							rows="4"
							bind:value={draft.fullDescription}
							placeholder="Made from organic canvas with reinforced handles..."
						></Textarea>
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Material / Bahan</span
						>
						<Input class="mt-1" bind:value={draft.material} placeholder="Organic cotton canvas" />
					</div>
				</div>
			</div>

			<!-- Media -->
			<div class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="mb-3 flex items-center gap-2 text-[13px] font-semibold">
					<Image class="h-4 w-4 shrink-0" />Media — upload, reorder, primary
				</h3>
				<div
					class="rounded-[10px] border border-dashed bg-[#FBFBFA] p-4 text-center"
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
					<Button variant="outline" size="default" type="button" onclick={() => fileInput?.click()}>
						<Upload class="h-4 w-4 shrink-0" />Upload images
					</Button>
					<p class="mt-2 text-[11px] text-[#636363]">
						jpg/png/webp max 5MB • Files are saved to disk • Primary required for publish
					</p>
					{#if uploading}
						<div class="mt-3 flex items-center gap-2 text-[11px] text-[#5A5A5A]">
							<span
								class="h-3 w-3 animate-spin rounded-full border-2 border-[#EAEAEA] border-t-[#242424]"
							></span>
							Saving files…
						</div>
					{/if}
					{#if uploadError}<p class="mt-2 text-[11px] text-[#D9534F]">{uploadError}</p>{/if}
				</div>
				{#if draft.images.length > 0}
					<div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
						{#each draft.images as img (img.id)}
							<div
								class="relative overflow-hidden rounded-[10px] border bg-[#F5F5F4] {img.isPrimary
									? 'ring-2 ring-[#242424]'
									: ''}"
								style="border-color: {img.isPrimary ? '#242424' : 'var(--border)'};"
							>
								<div class="flex aspect-square items-center justify-center text-[10px] font-bold">
									{#if img.url}
										<img
											src={img.url}
											alt={img.alt ?? draft.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										IMG
									{/if}
								</div>
								<div class="absolute top-1 left-1 flex gap-1">
									<Button
										variant="outline"
										size="icon-xs"
										class="flex h-8 w-8 items-center justify-center rounded-full border sm:h-6 sm:w-6 {img.isPrimary
											? 'border-primary bg-primary text-primary-foreground'
											: 'bg-card/80'}"
										onclick={() => setPrimary(img.id)}
										aria-label={img.isPrimary ? 'Primary image' : 'Set as primary image'}
									>
										<Star
											class="h-4 w-4 sm:h-3 sm:w-3"
											fill={img.isPrimary ? 'currentColor' : 'none'}
										/>
									</Button>
								</div>
								<div class="absolute top-1 right-1 flex gap-1">
									<Button
										variant="outline"
										size="icon-xs"
										class="bg-card/80"
										type="button"
										onclick={() => moveImage(img.id, -1)}
										aria-label="Move image left"
									>
										<ChevronLeft class="h-4 w-4 sm:h-3 sm:w-3" />
									</Button>
									<Button
										variant="outline"
										size="icon-xs"
										class="bg-card/80"
										type="button"
										onclick={() => moveImage(img.id, 1)}
										aria-label="Move image right"
									>
										<ChevronRight class="h-4 w-4 sm:h-3 sm:w-3" />
									</Button>
									<Button
										variant="outline"
										size="icon-xs"
										class="bg-card hover:bg-destructive/10!"
										type="button"
										onclick={() => removeImage(img.id)}
										aria-label="Remove image"
									>
										<X class="h-4 w-4 sm:h-3 sm:w-3" />
									</Button>
								</div>
								{#if img.isPrimary}
									<div class="absolute right-1 bottom-1 left-1 text-center">
										<span class="rounded-full bg-[#242424] px-2 py-0.5 text-[9px] text-white"
											>Primary</span
										>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Pricing IDR -->
			<div class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="mb-3 flex items-center gap-2 text-[13px] font-semibold">
					<DollarSign class="h-4 w-4 shrink-0" />Pricing — IDR
				</h3>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Regular Price *</span
						>
						<Input
							class="mt-1"
							type="number"
							min="0"
							aria-invalid={Boolean(errors.basePrice)}
							value={draft.basePrice || ''}
							oninput={(e) =>
								(draft.basePrice = Math.max(
									0,
									Number((e.currentTarget as HTMLInputElement).value) || 0
								))}
						/>
						<div class="mt-1 text-[11px] text-[#5A5A5A]">{formatIDR(draft.basePrice)}</div>
						{#if errors.basePrice}<p class="mt-1 text-[11px] text-[#D9534F]">
								{errors.basePrice}
							</p>{/if}
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Compare-at (optional, &gt; regular)</span
						>
						<Input
							class="mt-1"
							type="number"
							min="0"
							aria-invalid={Boolean(errors.compareAtPrice)}
							value={draft.compareAtPrice ?? ''}
							placeholder="1150000"
							oninput={(e) => {
								const el = e.currentTarget as HTMLInputElement;
								const n = el.value === '' ? undefined : Math.max(0, Number(el.value) || 0);
								draft.compareAtPrice = n;
							}}
						/>
						{#if draft.compareAtPrice !== undefined}
							<div class="mt-1 text-[11px] text-[#5A5A5A] line-through">
								{formatIDR(draft.compareAtPrice)}
							</div>
						{/if}
						{#if errors.compareAtPrice}<p class="mt-1 text-[11px] text-[#D9534F]">
								{errors.compareAtPrice}
							</p>{/if}
					</div>
				</div>
			</div>

			<!-- Inventory -->
			<div class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="mb-3 flex items-center gap-2 text-[13px] font-semibold">
					<Box class="h-4 w-4 shrink-0" />Inventory
				</h3>
				<div class="mb-3 flex items-center gap-2">
					<span class="text-[12px] font-medium">Track inventory</span>
					<button
						type="button"
						role="switch"
						aria-checked={draft.trackInventory}
						aria-label="Track inventory"
						class="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {draft.trackInventory
							? 'bg-primary'
							: 'bg-muted'}"
						onclick={() => (draft.trackInventory = !draft.trackInventory)}
					>
						<span
							class="pointer-events-none block h-5 w-5 rounded-full bg-card shadow-sm ring-0 transition-transform {draft.trackInventory
								? 'translate-x-5'
								: 'translate-x-0'}"
						></span>
					</button>
					{#if !draft.trackInventory}
						<span class="text-[11px] text-[#5A5A5A]"
							>Stock not tracked — hide misleading quantities</span
						>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Stock quantity</span
						>
						<Input
							class="mt-1"
							type="number"
							min="0"
							disabled={!draft.trackInventory || draft.hasVariants}
							aria-invalid={Boolean(errors.stock)}
							value={draft.stock}
							oninput={(e) =>
								(draft.stock = Math.max(
									0,
									Number((e.currentTarget as HTMLInputElement).value) || 0
								))}
						/>
						{#if draft.hasVariants}
							<p class="mt-1 text-[10px] text-[#5A5A5A]">
								Sum of variants used when variants enabled
							</p>
						{/if}
						{#if errors.stock}<p class="mt-1 text-[11px] text-[#D9534F]">{errors.stock}</p>{/if}
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Low-stock threshold</span
						>
						<Input
							class="mt-1"
							type="number"
							min="0"
							aria-invalid={Boolean(errors.lowStockThreshold)}
							value={draft.lowStockThreshold}
							oninput={(e) =>
								(draft.lowStockThreshold =
									Number((e.currentTarget as HTMLInputElement).value) || 0)}
						/>
						{#if errors.lowStockThreshold}<p class="mt-1 text-[11px] text-[#D9534F]">
								{errors.lowStockThreshold}
							</p>{/if}
					</div>
				</div>
			</div>

			<!-- Variants -->
			<div class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="flex items-center gap-2 text-[13px] font-semibold">
						<Layers class="h-4 w-4 shrink-0" />Variants
					</h3>
					<div class="flex items-center gap-2">
						<span class="text-[12px]">Enable variants</span>
						<button
							type="button"
							role="switch"
							aria-checked={draft.hasVariants}
							aria-label="Enable variants"
							class="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {draft.hasVariants
								? 'bg-primary'
								: 'bg-muted'}"
							onclick={toggleVariants}
						>
							<span
								class="pointer-events-none block h-5 w-5 rounded-full bg-card shadow-sm ring-0 transition-transform {draft.hasVariants
									? 'translate-x-5'
									: 'translate-x-0'}"
							></span>
						</button>
					</div>
				</div>

				{#if draft.hasVariants}
					<div class="space-y-4">
						<div
							class="rounded-[10px] border bg-[#FBFBFA] p-3"
							style="border-color: var(--border);"
						>
							<p class="mb-2 text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">
								Attribute builder (Color/Size)
							</p>
							<div class="space-y-3">
								{#each attrs as a (a.id)}
									<div
										class="rounded-[8px] border bg-white p-3"
										style="border-color: var(--border);"
									>
										<div class="flex items-start gap-2">
											<div class="min-w-0 flex-1 space-y-3">
												<div>
													<label
														for="attr-name-{a.id}"
														class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
														>Attribute label</label
													>
													<Input
														id="attr-name-{a.id}"
														size="sm"
														class="mt-1"
														placeholder="e.g. Color"
														value={a.name}
														oninput={(e) => {
															const name = (e.currentTarget as HTMLInputElement).value;
															attrs = attrs.map((x) => (x.id === a.id ? { ...x, name } : x));
														}}
													/>
												</div>
												<div>
													<label
														for="attr-values-{a.id}"
														class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
														>Values</label
													>
													<div
														class="mt-1 flex min-h-[36px] flex-wrap items-center gap-1.5 rounded-[6px] border bg-white px-2 py-1.5"
														style="border-color: var(--border);"
													>
														{#each a.values as v, i (i)}
															<span
																class="flex items-center gap-1 rounded-full border bg-[#F0F0EF] px-2 py-0.5 text-[11px]"
																style="border-color: var(--border);"
															>
																{v}
																<Button
																	variant="ghost"
																	size="xs"
																	class="size-4 rounded-full p-0"
																	onclick={() => removeValue(a.id, i)}
																	aria-label="Remove value {v} from {a.name || 'attribute'}"
																>
																	<X class="h-3 w-3" />
																</Button>
															</span>
														{/each}
														<input
															id="attr-values-{a.id}"
															class="min-w-[120px] flex-1 bg-transparent text-[12px] outline-none"
															placeholder="Type a value and press Enter or comma"
															value={chipInputs[a.id] ?? ''}
															oninput={(e) =>
																(chipInputs = {
																	...chipInputs,
																	[a.id]: (e.currentTarget as HTMLInputElement).value
																})}
															onkeydown={(e) => chipKeyDown(e, a.id)}
														/>
													</div>
													<p class="mt-1 text-[10px] text-[#636363]">Press Enter or comma to add a value.</p>
												</div>
											</div>
											<Button
												variant="outline"
												size="icon-sm"
												class="mt-5 shrink-0"
												type="button"
												onclick={() => removeAttr(a.id)}
												aria-label="Remove attribute {a.name || 'attribute'}"
											>
												<Trash2 class="h-3.5 w-3.5 text-[#5A5A5A]" />
											</Button>
										</div>
									</div>
								{/each}
							</div>

							<div
								class="mt-3 rounded-[8px] border border-dashed bg-white p-3"
								style="border-color: var(--border);"
							>
								<p class="mb-2 text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">
									Add attribute
								</p>
								<div class="space-y-2">
									<div>
										<label
											for="new-attr-name"
											class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
											>Attribute label</label
										>
										<Input
											id="new-attr-name"
											size="sm"
											class="mt-1"
											placeholder="e.g. Material"
											bind:value={newAttrName}
										/>
									</div>
									<div>
										<label
											for="new-attr-values"
											class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
											>Values</label
										>
										<Input
											id="new-attr-values"
											size="sm"
											class="mt-1"
											placeholder="Comma-separated, e.g. Cotton, Leather"
											bind:value={newAttrValues}
										/>
									</div>
									<div class="pt-1">
										<Button variant="default" size="sm" type="button" onclick={addAttr}>
											<Plus class="h-3.5 w-3.5 shrink-0" />Add attribute
										</Button>
									</div>
								</div>
							</div>
							<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
								<span class="text-[11px] text-[#5A5A5A]">
									Combinations preview: <b>{combos.length}</b>
									{#if combos.length > VARIANTS_MAX}<span class="text-[#D9534F]">
											— Warn if &gt;{VARIANTS_MAX}, excessive</span
										>{/if}
								</span>
								<Button variant="default" size="sm" type="button" onclick={generateVariants}>
									Generate
								</Button>
							</div>
						</div>

						{#if draft.variants.length > 0}
							<div
								class="overflow-x-auto rounded-[10px] border"
								style="border-color: var(--border);"
							>
								<table class="w-full text-left">
									<thead>
										<tr
											class="border-b bg-[#FBFBFA] text-[10px] font-semibold tracking-[0.08em] text-[#636363] uppercase"
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
													<div class="text-[10px] text-[#5A5A5A]">
														{v.attributes.map((a) => `${a.name}:${a.value}`).join(', ')}
													</div>
													{#if v.stock === 0}
														<span
															class="rounded-full border bg-[#FFF0F0] px-1.5 py-0.5 text-[9px] text-[#A33A37]"
															style="border-color: #F2C2C0;">Out</span
														>
													{/if}
												</td>
												<td class="px-3 py-2">
													<Input
														size="sm"
														font="mono"
														class="w-[110px]"
														aria-invalid={Boolean(errors[`var-${v.id}-sku`])}
														bind:value={v.sku}
													/>
													{#if errors[`var-${v.id}-sku`]}<p class="text-[9px] text-[#D9534F]">
															{errors[`var-${v.id}-sku`]}
														</p>{/if}
												</td>
												<td class="px-3 py-2">
													<Input
														size="sm"
														class="w-[90px]"
														type="number"
														min="0"
														value={v.priceOverride ?? ''}
														placeholder={String(draft.basePrice)}
														oninput={(e) => {
															const el = e.currentTarget as HTMLInputElement;
															updateVariant(v.id, {
																priceOverride:
																	el.value === '' ? undefined : Math.max(0, Number(el.value) || 0)
															});
														}}
													/>
												</td>
												<td class="px-3 py-2">
													<Input
														size="sm"
														class="w-[60px]"
														type="number"
														min="0"
														aria-invalid={Boolean(errors[`var-${v.id}-stock`])}
														value={v.stock}
														oninput={(e) =>
															updateVariant(v.id, {
																stock: Math.max(
																	0,
																	Number((e.currentTarget as HTMLInputElement).value) || 0
																)
															})}
													/>
													{#if errors[`var-${v.id}-stock`]}<p class="text-[9px] text-[#D9534F]">
															{errors[`var-${v.id}-stock`]}
														</p>{/if}
												</td>
												<td class="px-3 py-2">
													<button
														type="button"
														role="switch"
														aria-checked={v.available}
														aria-label="Toggle availability for {v.name}"
														class="inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {v.available
															? 'bg-success'
															: 'bg-muted'}"
														onclick={() => updateVariant(v.id, { available: !v.available })}
													>
														<span
															class="pointer-events-none block h-5 w-5 rounded-full bg-card shadow-sm ring-0 transition-transform {v.available
																? 'translate-x-5'
																: 'translate-x-0'}"
														></span>
													</button>
												</td>
												<td class="px-3 py-2">
													<Button
														variant="outline"
														size="icon-sm"
														type="button"
														onclick={() => removeVariant(v.id)}
														aria-label="Remove variant {v.name}"
													>
														<Trash2 class="h-3.5 w-3.5 text-[#5A5A5A]" />
													</Button>
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
					<p class="text-[11px] text-[#5A5A5A]">
						Enable variants to manage Color/Size combinations. When disabled, product-level
						pricing/inventory used.
					</p>
				{/if}
			</div>

			<!-- Organization -->
			<div class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<h3 class="mb-3 flex items-center gap-2 text-[13px] font-semibold">
					<Tag class="h-4 w-4 shrink-0" />Organization
				</h3>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Category *</span
						>
						<div class="mt-1 flex gap-2">
							<NativeSelect
								class="flex-1"
								aria-invalid={Boolean(errors.categoryId)}
								bind:value={draft.categoryId}
							>
								<option value="">Select category</option>
								{#each admin.categories as c (c.id)}
									<option value={c.id}>{c.name}</option>
								{/each}
							</NativeSelect>
							<Button
								variant="outline"
								size="icon-lg"
								class="shrink-0"
								type="button"
								onclick={() => (catModal = true)}
								aria-label="Create category inline"
							>
								<Plus class="h-4 w-4" />
							</Button>
						</div>
						{#if errors.categoryId}<p class="mt-1 text-[11px] text-[#D9534F]">
								{errors.categoryId}
							</p>{/if}
					</div>
					<div>
						<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
							>Featured</span
						>
						<div class="mt-2 flex items-center gap-2">
							<Button
								variant="ghost"
								size="default"
								class="h-6 w-11 shrink-0 rounded-full p-0.5 transition {draft.featured
									? 'bg-primary'
									: 'bg-muted'}"
								onclick={() => (draft.featured = !draft.featured)}
								aria-label="Toggle featured"
							>
								<span
									class="block h-5 w-5 rounded-full bg-card transition-transform {draft.featured
										? 'translate-x-5'
										: ''}"
								></span>
							</Button>
							<span class="text-[12px]"
								>{draft.featured ? 'Featured in storefront' : 'Not featured'}</span
							>
						</div>
					</div>
				</div>
				<div class="mt-3">
					<span class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
						>Collections</span
					>
					<div
						class="mt-1 max-h-[120px] overflow-y-auto rounded-[8px] border bg-[#FBFBFA] p-2"
						style="border-color: var(--border);"
					>
						{#each admin.collections as c (c.id)}
							<label class="flex items-center gap-2 py-1 text-[12px]">
								<Checkbox
									checked={draft.collectionIds.includes(c.id)}
									onCheckedChange={(on) => {
										draft.collectionIds = on
											? [...draft.collectionIds, c.id]
											: draft.collectionIds.filter((id) => id !== c.id);
									}}
								/>
								{c.name}
								<span class="text-[10px] text-[#636363]">({c.slug})</span>
							</label>
						{/each}
					</div>
					<Button
						variant="link"
						size="xs"
						class="mt-2 h-auto px-0 text-[11px] underline"
						onclick={() => (colModal = true)}
					>
						+ Create new collection inline (auto-selects)
					</Button>
				</div>
			</div>

			<!-- SEO -->
			<div class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<Button
					variant="ghost"
					size="default"
					class="h-auto w-full justify-between px-0"
					onclick={() => (seoOpen = !seoOpen)}
				>
					<span class="flex items-center gap-2 text-[13px] font-semibold"
						><Search class="h-4 w-4 shrink-0" />SEO (optional)</span
					>
					{#if seoOpen}<ChevronUp class="h-4 w-4" />{:else}<ChevronDown class="h-4 w-4" />{/if}
				</Button>
				{#if seoOpen}
					<div class="mt-3 space-y-3">
						<div>
							<span
								class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
								>SEO Title</span
							>
							<Input class="mt-1" bind:value={draft.seoTitle} placeholder="60 chars recommended" />
						</div>
						<div>
							<span
								class="block text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
								>SEO Description</span
							>
							<Textarea
								class="mt-1"
								rows="2"
								bind:value={draft.seoDescription}
								placeholder="155 chars"
							></Textarea>
						</div>
						<div class="rounded-[8px] border bg-[#FBFBFA] p-3" style="border-color: var(--border);">
							<div class="truncate text-[11px] font-medium text-[#1A0DAB]">
								{draft.seoTitle || draft.name || 'Your product title'}
							</div>
							<div class="truncate text-[10px] text-[#006621]">
								{admin.settings.brand.domain}/products/{slug || 'your-slug'}
							</div>
							<div class="mt-1 line-clamp-2 text-[11px] text-[#545454]">
								{draft.seoDescription || draft.shortDescription || 'Search preview Google-style'}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Publishing rail -->
		<div class="shrink-0 space-y-4 self-start lg:sticky lg:top-[88px] lg:w-[320px]">
			<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
				<h3 class="text-[12px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">
					Publishing
				</h3>
				<div class="mt-3 space-y-2 text-[12px]">
					<div class="flex justify-between">
						<span class="text-[#5A5A5A]">Status</span><StatusBadge status={draft.status} />
					</div>
					<div class="flex justify-between">
						<span class="text-[#5A5A5A]">Featured</span><span>{draft.featured ? 'Yes' : 'No'}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-[#5A5A5A]">Inventory</span>
						<span>{draft.trackInventory ? `${inventoryTotal} total` : 'Not tracked'}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-[#5A5A5A]">Variants</span><span
							>{draft.hasVariants ? `${draft.variants.length}` : 'No'}</span
						>
					</div>
				</div>
				<div class="mt-4">
					<p class="mb-2 text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase">
						Validation summary
					</p>
					{#if Object.keys(publishErrors).length === 0}
						<p class="flex items-center gap-1 text-[11px] text-[#269B65]">
							<CircleCheck class="h-3.5 w-3.5 shrink-0" /> No errors
						</p>
					{:else}
						<ul class="space-y-1">
							{#each Object.entries(publishErrors) as [k, v] (k)}
								<li class="text-[11px] text-[#D9534F]">• {k}: {v}</li>
							{/each}
						</ul>
					{/if}
					<p class="mt-2 text-[10px] text-[#5A5A5A]">
						Business rules: publish requires name, valid price, category, primary image. Variants
						must have valid configs. SKU unique. Inventory never negative. Archived/Draft not in
						storefront. No inaccurate stock when tracking off.
					</p>
				</div>
				<div class="mt-4 space-y-2">
					<Button
						variant="default"
						size="default"
						class="w-full"
						type="button"
						disabled={saving}
						onclick={() => saveAs('active')}
					>
						Publish Product
					</Button>
					<Button
						variant="outline"
						size="default"
						class="w-full"
						type="button"
						onclick={() => saveAs('draft')}
					>
						Save as Draft
					</Button>
					<Button
						variant="outline"
						size="default"
						class="w-full"
						type="button"
						onclick={() => saveAs('archived')}
					>
						Archive
					</Button>
				</div>
			</div>
			<div class="rounded-[12px] border bg-[#FBFBFA] p-3" style="border-color: var(--border);">
				<p class="text-[11px] text-[#5A5A5A]">
					Saved to SQLite — the storefront catalog shows this product as soon as it is published.
					Uploaded images are written to disk.
				</p>
			</div>
		</div>
	</div>
</div>

{#if catModal}
	<Modal title="Create category inline">
		<p class="mt-1 text-[11px] text-[#5A5A5A]">
			Auto-selects new category without losing form data.
		</p>
		<div class="mt-3 space-y-2">
			<Input
				placeholder="Name"
				bind:value={catDraft.name}
				oninput={() => (catDraft.slug = slugify(catDraft.name))}
			/>
			<Input font="mono" placeholder="Slug" bind:value={catDraft.slug} />
			<Input placeholder="Description" bind:value={catDraft.description} />
		</div>
		<div class="mt-4 flex gap-2">
			<Button
				variant="default"
				size="lg"
				class="flex-1"
				type="button"
				onclick={createCategoryInline}>Create &amp; Select</Button
			>
			<Button
				variant="outline"
				size="lg"
				class="flex-1"
				type="button"
				onclick={() => (catModal = false)}>Cancel</Button
			>
		</div>
	</Modal>
{/if}

{#if colModal}
	<Modal title="Create collection inline">
		<p class="mt-1 text-[11px] text-[#5A5A5A]">
			Auto-selects new collection without losing form data.
		</p>
		<div class="mt-3 space-y-2">
			<Input
				placeholder="Name"
				bind:value={colDraft.name}
				oninput={() => (colDraft.slug = slugify(colDraft.name))}
			/>
			<Input font="mono" placeholder="Slug" bind:value={colDraft.slug} />
			<Input placeholder="Description" bind:value={colDraft.description} />
		</div>
		<div class="mt-4 flex gap-2">
			<Button
				variant="default"
				size="lg"
				class="flex-1"
				type="button"
				onclick={createCollectionInline}>Create &amp; Select</Button
			>
			<Button
				variant="outline"
				size="lg"
				class="flex-1"
				type="button"
				onclick={() => (colModal = false)}>Cancel</Button
			>
		</div>
	</Modal>
{/if}

{#if guardOpen}
	<Modal title="Leave form?">
		<p class="mt-1 text-[12px] text-[#5A5A5A]">You have unsaved changes. Leave without saving?</p>
		<div class="mt-4 flex gap-2">
			<Button variant="default" size="lg" class="flex-1" type="button" onclick={leave}>Leave</Button
			>
			<Button variant="outline" size="lg" class="flex-1" type="button" onclick={stay}>Stay</Button>
		</div>
	</Modal>
{/if}
