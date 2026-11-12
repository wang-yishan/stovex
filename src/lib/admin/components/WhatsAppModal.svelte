<script lang="ts">
	import { effectiveStock, formatIDR, stockStatus } from '#lib/admin/data.ts';
	import type { Product } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
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
	let compareAt = $derived(
		selectedVariant?.priceOverride ? product.compareAtPrice : product.compareAtPrice
	);

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
<div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 sm:p-5">
	<div
		class="max-h-[90dvh] w-full overflow-y-auto rounded-[12px] border bg-white p-4 shadow-xl sm:p-5"
		style="border-color: var(--border); max-width: 420px;"
	>
		<div class="flex items-start justify-between gap-2">
			<div>
				<h3 class="text-[14px] font-semibold">WhatsApp enquiry</h3>
				<p class="mt-1 text-[11px] text-[#5A5A5A]">Preview matches the reference format.</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onclick={onclose}
				class="h-auto px-1 text-[12px] text-muted-foreground hover:text-foreground"
			>
				Close
			</Button>
		</div>

		<div class="mt-4">
			<label
				class="text-[11px] font-semibold tracking-[0.08em] text-[#5A5A5A] uppercase"
				for="wa-variant">Variant</label
			>
			{#if product.variants.length > 0}
				<NativeSelect id="wa-variant" class="mt-1 w-full" bind:value={variantId}>
					<option value="">Default</option>
					{#each product.variants as v (v.id)}
						<option value={v.id}
							>{v.name} — {formatIDR(v.priceOverride ?? product.basePrice)}</option
						>
					{/each}
				</NativeSelect>
			{:else}
				<p class="mt-1 text-[12px] text-muted-foreground">No variants.</p>
			{/if}
		</div>

		<pre
			class="mt-3 rounded-[8px] border bg-[#FBFBFA] p-3 text-[11px] break-words whitespace-pre-wrap"
			style="border-color: var(--border);">{message}</pre>

		<div class="mt-4 flex gap-2">
			<Button href={waUrl} target="_blank" rel="noopener" class="flex-1">
				<MessageCircle class="h-4 w-4 shrink-0" />
				Open WhatsApp
			</Button>
			<Button variant="outline" onclick={copyMsg}>
				<Copy class="h-4 w-4 shrink-0" />
				Copy message
			</Button>
		</div>
	</div>
</div>
