<script lang="ts">
	import { effectiveStock, formatIDR, stockStatus } from '#lib/admin/data.ts';
	import type { Product } from '#lib/admin/types.ts';
	import { Copy, MessageCircle } from '@lucide/svelte';

	let {
		product,
		onclose
	}: {
		product: Product;
		onclose: () => void;
	} = $props();


	let variantId = $state<string>('');

	// Effective stock for the selected variant (or product-level).
	let stock = $derived.by(() => {
		if (variantId) {
			const v = product.variants.find((x) => x.id === variantId);
			if (v) return v.stock;
		}
		if (product.hasVariants) return effectiveStock(product);
		return product.stock;
	});
	let st = $derived(stockStatus(stock, product.lowStockThreshold || 5, product.trackInventory));
	let availability = $derived(st === 'out' ? 'Out of stock' : `In stock (${stock})`);

	let selectedVariant = $derived(product.variants.find((x) => x.id === variantId));

	let price = $derived(selectedVariant?.priceOverride ?? product.basePrice);
	let sku = $derived(selectedVariant?.sku ?? product.sku ?? '');
	let compareAt = $derived(selectedVariant?.priceOverride ? product.compareAtPrice : product.compareAtPrice);

	let message = $derived.by(() => {
		const lines = [
			`Halo, saya tertarik dengan produk:`,
			product.name,
			selectedVariant ? `Variant: ${selectedVariant.name}` : null,
			`Harga: ${formatIDR(price)}` + (compareAt ? ` (was ${formatIDR(compareAt)})` : ''),
			`SKU: ${sku || '-'}`,
			`Availability: ${availability}`
		].filter(Boolean) as string[];
		return lines.join('\n');
	});

	let waUrl = $derived(`https://wa.me/?text=${encodeURIComponent(message)}`);

	function copyMsg() {
		const short = `Halo, saya tertarik dengan ${product.name} ${selectedVariant ? `- ${selectedVariant.name}` : ''} ${formatIDR(price)}`;
		const el = document.createElement('textarea');
		el.value = short;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	}
</script>

<!-- @component WhatsApp enquiry modal (converted from ref preview). -->
<div class="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center p-4 sm:p-5">
	<div
		class="bg-white rounded-[12px] border shadow-xl w-full p-4 sm:p-5 max-h-[90dvh] overflow-y-auto"
		style="border-color: var(--border); max-width: 420px;"
	>
		<div class="flex items-start justify-between gap-2">
			<div>
				<h3 class="text-[14px] font-semibold">WhatsApp enquiry</h3>
				<p class="text-[11px] text-[#777] mt-1">Preview matches the reference format.</p>
			</div>
			<button
				type="button"
				class="text-[12px] text-[#777] hover:text-[#242424]"
				onclick={onclose}
			>
				Close
			</button>
		</div>

		<div class="mt-4">
			<label
				class="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#777]"
				for="wa-variant">Variant</label
			>
			{#if product.variants.length > 0}
				<select
					id="wa-variant"
					class="mt-1 w-full h-9 rounded-[8px] border px-3 text-[13px] bg-white"
					style="border-color: var(--border);"
					bind:value={variantId}
				>
					<option value="">Default</option>
					{#each product.variants as v (v.id)}
						<option value={v.id}>{v.name} — {formatIDR(v.priceOverride ?? product.basePrice)}</option>
					{/each}
				</select>
			{:else}
				<p class="text-[12px] text-[#777] mt-1">No variants.</p>
			{/if}
		</div>

		<pre
			class="mt-3 bg-[#FBFBFA] border rounded-[8px] p-3 text-[11px] whitespace-pre-wrap break-words"
			style="border-color: var(--border);">{message}</pre>

		<div class="flex gap-2 mt-4">
			<a
				href={waUrl}
				target="_blank"
				rel="noopener"
				class="flex-1 h-10 rounded-full bg-[#343434] text-white text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-[#242424] transition"
			>
				<MessageCircle class="h-4 w-4 shrink-0" />
				Open WhatsApp
			</a>
			<button
				type="button"
				class="h-10 rounded-full border bg-white px-3 text-[12px] font-medium flex items-center gap-1.5 hover:border-[#242424] transition"
				style="border-color: var(--border);"
				onclick={copyMsg}
			>
				<Copy class="h-4 w-4 shrink-0" />
				Copy message
			</button>
		</div>
	</div>
</div>
