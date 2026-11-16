<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { CircleAlert, CircleCheck, ChevronLeft, ChevronRight, LoaderCircle } from '@lucide/svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { productApi } from '#lib/admin/api.ts';
	import { nowISO, slugify } from '#lib/admin/data.ts';
	import type { Product } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';

	let { products: initial }: { products: Product[] } = $props();

	type SlideState = {
		product: Product;
		valid: boolean;
		done: boolean;
		saved: boolean;
		error: string;
	};

	let slides = $state<SlideState[]>(
		initial.map((p) => ({
			product: $state.snapshot(p) as Product,
			valid: false,
			done: false,
			saved: false,
			error: ''
		}))
	);

	let current = $state(0);
	let saving = $state(false);

	const currentSlide = $derived(slides[current]);
	const allDone = $derived(slides.length > 0 && slides.every((s) => s.done));
	const savedCount = $derived(slides.filter((s) => s.saved).length);

	function onDraftChange(index: number, state: { valid: boolean; product: Product }) {
		const slide = slides[index];
		if (!slide) return;
		slide.product = state.product;
		slide.valid = state.valid;
		// If the user edits after marking done, require re-confirmation.
		if (!state.valid) slide.done = false;
		// Clear a previous save error once they change something.
		if (slide.error) slide.error = '';
	}

	function markDone() {
		const slide = slides[current];
		if (!slide || !slide.valid) return;
		slide.done = true;
		// Advance to the next incomplete slide to keep the flow moving.
		const next = slides.findIndex((s, i) => i > current && !s.done);
		if (next !== -1) current = next;
	}

	function prev() {
		if (current > 0) current -= 1;
	}
	function next() {
		if (current < slides.length - 1) current += 1;
	}

	async function saveAll() {
		if (!allDone || saving) return;
		saving = true;
		let ok = 0;
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i]!;
			if (slide.saved) {
				ok++;
				continue;
			}
			const draft = $state.snapshot(slide.product) as Product;
			const toSave: Product = {
				...draft,
				status: 'draft',
				slug: slugify(draft.slug || draft.name),
				updatedAt: nowISO(),
				createdAt: draft.createdAt || nowISO(),
				variants: (draft.variants ?? []).map((v) => ({ ...v, productId: draft.id }))
			};
			try {
				const { product: saved } = await productApi.save(toSave);
				// Mirror into the dashboard cache (no per-item toast noise).
				const idx = admin.products.findIndex((p) => p.id === saved.id);
				if (idx >= 0) admin.products[idx] = saved;
				else admin.products = [saved, ...admin.products];
				slide.saved = true;
				slide.product = saved;
				slide.error = '';
				ok++;
			} catch (cause) {
				slide.error = cause instanceof Error ? cause.message : 'Save failed';
				slide.saved = false;
				// Jump to the failing slide so the merchant can fix it inline.
				current = i;
			}
		}
		saving = false;
		if (ok === slides.length) {
			admin.showToast(
				`${slides.length} product${slides.length === 1 ? '' : 's'} imported as drafts`,
				'success'
			);
			await goto(resolve('/dashboard/products'));
		} else {
			admin.showToast(
				`Saved ${ok} of ${slides.length}. Fix the highlighted slide to continue.`,
				'error'
			);
		}
	}
</script>

<div class="space-y-4">
	<!-- Stepper header -->
	<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-[13px] font-semibold">
					Product {current + 1} of {slides.length}
				</p>
				<p class="mt-0.5 text-[11px] text-[#5A5A5A]">
					Review each slide, fill missing fields, then mark it Done. All slides must be Done before
					saving.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#each slides as s, i (s.product.id + '-' + i)}
					<button
						type="button"
						class="flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 text-[11px] font-medium transition {i ===
						current
							? 'border-[#242424] bg-[#242424] text-white'
							: s.saved
								? 'border-[#269B65] bg-[#E9F7EF] text-[#1A7A52]'
								: s.error
									? 'border-[#D9534F] bg-[#FFF0F0] text-[#A33A37]'
									: s.done
										? 'border-[#269B65] text-[#1A7A52]'
										: 'text-[#5A5A5A]'}"
						style="border-color: {i === current
							? '#242424'
							: s.saved || s.done
								? '#269B65'
								: s.error
									? '#D9534F'
									: 'var(--border)'};"
						onclick={() => (current = i)}
						aria-label={`Go to product ${i + 1}`}
					>
						{#if s.saved || s.done}
							<CircleCheck class="h-3.5 w-3.5" />
						{:else if s.error}
							<CircleAlert class="h-3.5 w-3.5" />
						{:else}
							{i + 1}
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style="border-color: var(--border);">
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" type="button" onclick={prev} disabled={current === 0}>
					<ChevronLeft class="h-4 w-4" /> Prev
				</Button>
				<Button
					variant="outline"
					size="sm"
					type="button"
					onclick={next}
					disabled={current === slides.length - 1}
				>
					Next <ChevronRight class="h-4 w-4" />
				</Button>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-[11px] text-[#5A5A5A]">
					{slides.filter((s) => s.done).length}/{slides.length} done
				</span>
				<Button
					variant={currentSlide?.done ? 'outline' : 'default'}
					size="sm"
					type="button"
					disabled={!currentSlide?.valid || saving}
					onclick={markDone}
				>
					<CircleCheck class="h-4 w-4" />
					{currentSlide?.done ? 'Done' : 'Mark done'}
				</Button>
				<Button variant="default" size="sm" type="button" disabled={!allDone || saving} onclick={saveAll}>
					{#if saving}<LoaderCircle class="h-4 w-4 animate-spin" /> Saving…{:else}Save all as drafts{/if}
				</Button>
			</div>
		</div>

		{#if currentSlide?.error}
			<div
				class="mt-3 flex items-start gap-2 rounded-[8px] border bg-[#FFF0F0] px-3 py-2 text-[12px] text-[#A33A37]"
				style="border-color: #F2C2C0;"
			>
				<CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
				<div>
					<p class="font-medium">Could not save this product</p>
					<p class="mt-0.5 text-[11px]">{currentSlide.error}</p>
				</div>
			</div>
		{/if}
		{#if currentSlide?.valid && !currentSlide?.done}
			<p class="mt-2 text-[11px] text-[#1A7A52]">This slide is valid — mark it Done when ready.</p>
		{/if}
	</div>

	<!-- Slide: remount per slide so ProductForm picks up the slide's draft -->
	{#key current}
		{#if currentSlide}
			<ProductForm
				product={currentSlide.product}
				mode="create"
				embedded={true}
				onDraftChange={(s) => onDraftChange(current, s)}
			/>
		{/if}
	{/key}
</div>
