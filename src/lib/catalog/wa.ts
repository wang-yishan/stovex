/* WhatsApp helpers for the storefront.
   The store ships a single WhatsApp number (dashboard → store settings) and
   every enquiry — product order, generic question, checkout — is a chat link. */

import { admin } from '#lib/admin/state.svelte.ts';
import { formatIDR } from '#lib/admin/data.ts';
import type { Product, ProductVariant } from '#lib/admin/types.ts';
import { priceFor, skuFor } from './product.ts';

function digits(): string {
	return admin.settings.whatsappNumber.replace(/[^0-9]/g, '');
}

/** The greeting every WhatsApp message opens with — always the brand name. */
export function waGreeting(): string {
	return `Halo ${admin.settings.brand.name},`;
}

/** Generic store enquiry link. */
export function generalWaLink(text: string): string {
	return `https://wa.me/${digits()}?text=${encodeURIComponent(text)}`;
}

/** The generic "I need help" enquiry, addressed to the brand by name. */
export function generalWaLinkWithGreeting(body: string): string {
	return generalWaLink(`${waGreeting()} ${body}`);
}

export interface WaRequest {
	product: Product;
	variant?: ProductVariant;
	quantity: number;
	url: string;
}

/** Product enquiry text for the "buy" and "ask" flows. */
export function waMessage(request: WaRequest, mode: 'buy' | 'ask'): string {
	const { product, variant, quantity, url } = request;
	const unit = priceFor(product, variant);
	const color = variant?.attributes?.find((a) => a.name.toLowerCase() === 'color')?.value;
	const size = variant?.attributes?.find((a) => a.name.toLowerCase() === 'size')?.value;

	const lines = [
		waGreeting(),
		'',
		mode === 'ask'
			? 'saya ingin bertanya tentang produk ini.'
			: 'saya tertarik untuk memesan produk berikut.',
		'',
		`Produk: ${product.name}`,
		`Warna: ${color ?? '—'}`,
		`Ukuran: ${size ?? '—'}`,
		`SKU: ${skuFor(product, variant)}`
	];

	if (mode === 'buy') {
		lines.push(
			`Jumlah: ${quantity}`,
			`Harga satuan: ${formatIDR(unit)}`,
			`Subtotal: ${formatIDR(unit * quantity)}`
		);
	}

	lines.push(
		'',
		`Link produk: ${url}`,
		'',
		'Mohon konfirmasi ketersediaan dan informasi pengiriman.'
	);
	return lines.join('\n');
}

/** wa.me link for a product selection. */
export function waLink(request: WaRequest, mode: 'buy' | 'ask'): string {
	return `https://wa.me/${digits()}?text=${encodeURIComponent(waMessage(request, mode))}`;
}
