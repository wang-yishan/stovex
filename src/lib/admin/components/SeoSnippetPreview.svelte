<script lang="ts">
	/**
	 * Google-style SERP/snippet preview for SEO fields.
	 * Pass resolved (fallback-applied) title/url/description as they should appear.
	 */
	let {
		title = '',
		url = '',
		description = '',
		titleLimit = 60,
		descriptionLimit = 160
	}: {
		title?: string;
		url?: string;
		description?: string;
		titleLimit?: number;
		descriptionLimit?: number;
	} = $props();

	const titleLength = $derived(title.length);
	const descriptionLength = $derived(description.length);
	const titleOver = $derived(titleLength > titleLimit);
	const descriptionOver = $derived(descriptionLength > descriptionLimit);

	function lengthTone(over: boolean, length: number): string {
		if (length === 0) return 'text-[#8A8A8A]';
		return over ? 'text-[#A33A37]' : 'text-[#1A7A52]';
	}
</script>

<!-- @component
	Visual SEO snippet preview (search result style) with character guidance. -->
<div class="rounded-[10px] border bg-[#FBFBFA] p-3" style="border-color: var(--border);">
	<div class="space-y-0.5">
		<div class="truncate text-[14px] leading-snug font-medium text-[#1A0DAB]" title={title}>
			{title || 'Judul halaman'}
		</div>
		<div class="truncate text-[12px] leading-snug text-[#006621]" title={url}>
			{url || 'https://example.com/path'}
		</div>
		<p class="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#545454]" title={description}>
			{description || 'Deskripsi meta akan tampil di sini.'}
		</p>
	</div>

	<div
		class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-[10px]"
		style="border-color: var(--border);"
	>
		<div class="flex items-center gap-1.5">
			<span class="font-semibold tracking-[0.06em] text-[#5A5A5A] uppercase">Title</span>
			<span class={lengthTone(titleOver, titleLength)}>{titleLength}/{titleLimit}</span>
			{#if titleOver}
				<span class="text-[#A33A37]">• berpotensi terpotong</span>
			{:else if titleLength === 0}
				<span class="text-[#8A8A8A]">• kosong</span>
			{/if}
		</div>
		<div class="flex items-center gap-1.5">
			<span class="font-semibold tracking-[0.06em] text-[#5A5A5A] uppercase">Description</span>
			<span class={lengthTone(descriptionOver, descriptionLength)}
				>{descriptionLength}/{descriptionLimit}</span
			>
			{#if descriptionOver}
				<span class="text-[#A33A37]">• berpotensi terpotong</span>
			{:else if descriptionLength === 0}
				<span class="text-[#8A8A8A]">• kosong</span>
			{/if}
		</div>
	</div>
</div>
