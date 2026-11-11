<script lang="ts">
	import type { CatalogImage } from '#lib/catalog/photos.ts';
	import { ChevronLeft, ChevronRight, X } from '@lucide/svelte';

	interface Props {
		images: CatalogImage[];
		/** Product name — used as the accessible label of the viewer. */
		name: string;
		/** Small badge in the top-left corner of the main frame. */
		badge?: string | null;
	}

	let { images, name, badge = null }: Props = $props();

	let active = $state(0);
	let lightbox = $state(false);

	const current = $derived(images[active] ?? images[0]);

	function go(delta: number) {
		if (images.length === 0) return;
		active = (active + delta + images.length) % images.length;
	}

	function select(index: number) {
		active = index;
	}

	function onKeydown(event: KeyboardEvent) {
		if (!lightbox) return;
		if (event.key === 'Escape') lightbox = false;
		if (event.key === 'ArrowLeft') go(-1);
		if (event.key === 'ArrowRight') go(1);
	}

	// Swipe between frames on touch devices.
	let touchStart = $state(0);

	function onTouchStart(event: TouchEvent) {
		touchStart = event.changedTouches[0]?.clientX ?? 0;
	}

	function onTouchEnd(event: TouchEvent) {
		const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart;
		if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="grid grid-cols-[60px_minmax(0,1fr)] gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-4">
	<!-- Thumbnail rail -->
	<div class="order-1 flex flex-col gap-2 sm:gap-3">
		{#each images as image, i (image.src + i)}
			<button
				type="button"
				class="aspect-[3/4] overflow-hidden border transition duration-200 {i === active
					? 'border-[#242424] opacity-100'
					: 'border-transparent opacity-70 hover:opacity-100'}"
				aria-label={`Lihat gambar ${i + 1}`}
				aria-current={i === active}
				onclick={() => select(i)}
			>
				<img class="h-full w-full object-cover" src={image.src} alt={image.alt} loading="lazy" />
			</button>
		{/each}
	</div>

	<!-- Main frame -->
	<div class="relative order-2 min-w-0 bg-[#F5F3EF]">
		<button
			type="button"
			class="block w-full cursor-zoom-in"
			aria-label="Perbesar gambar produk"
			onclick={() => (lightbox = true)}
			ontouchstart={onTouchStart}
			ontouchend={onTouchEnd}
		>
			<img
				class="aspect-[4/5] w-full object-cover transition-opacity duration-200 sm:aspect-[5/6]"
				src={current?.src}
				alt={current?.alt ?? name}
			/>
		</button>

		{#if badge}
			<span
				class="absolute top-4 left-4 bg-[#FBFBFA]/90 px-3 py-2 text-[9px] tracking-[0.18em] uppercase"
			>
				{badge}
			</span>
		{/if}

		<div class="absolute right-4 bottom-4 flex items-center gap-2">
			<button
				type="button"
				class="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:bg-white"
				aria-label="Gambar sebelumnya"
				onclick={() => go(-1)}
			>
				<ChevronLeft class="h-4 w-4" strokeWidth={1.6} />
			</button>
			<span class="bg-white/90 px-3 py-[11px] text-[10px] tracking-widest">
				{String(active + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
			</span>
			<button
				type="button"
				class="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:bg-white"
				aria-label="Gambar berikutnya"
				onclick={() => go(1)}
			>
				<ChevronRight class="h-4 w-4" strokeWidth={1.6} />
			</button>
		</div>
	</div>
</div>

<!-- Lightbox -->
{#if lightbox}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-10"
		role="dialog"
		aria-modal="true"
		aria-label={`Penampil gambar ${name}`}
	>
		<button
			type="button"
			class="absolute top-5 right-5 text-white"
			aria-label="Tutup penampil gambar"
			onclick={() => (lightbox = false)}
		>
			<X class="h-7 w-7" strokeWidth={1.6} />
		</button>

		<button
			type="button"
			class="absolute left-3 text-white sm:left-8"
			aria-label="Gambar sebelumnya"
			onclick={() => go(-1)}
		>
			<ChevronLeft class="h-8 w-8" strokeWidth={1.6} />
		</button>

		<img
			class="max-h-[86vh] max-w-[88vw] object-contain"
			src={current?.src}
			alt={current?.alt ?? name}
		/>

		<button
			type="button"
			class="absolute right-3 text-white sm:right-8"
			aria-label="Gambar berikutnya"
			onclick={() => go(1)}
		>
			<ChevronRight class="h-8 w-8" strokeWidth={1.6} />
		</button>

		<span class="absolute bottom-5 text-[10px] tracking-[0.2em] text-white">
			{String(active + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
		</span>
	</div>
{/if}
