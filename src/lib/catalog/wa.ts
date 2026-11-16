/* WhatsApp helpers for the storefront.
   The store ships a single WhatsApp number (dashboard → store settings) and
   every enquiry — product order, generic question, checkout — is a chat link. */

import { admin } from '#lib/admin/state.svelte.ts';
import { formatIDR } from '#lib/admin/data.ts';
import type { OrderItem, OrderSource, Product, ProductVariant } from '#lib/admin/types.ts';
import { priceFor, skuFor } from './product.ts';

function digits(): string {
	return admin.settings.whatsappNumber.replace(/[^0-9]/g, '');
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

/** Client-side order code shown in the modal and shared in WhatsApp.
 *  Starts with DD + 3-letter month + YYYY and includes a high-entropy suffix
 *  so it stays unique for a full day of orders. */
export function generateOrderCode(): string {
	const now = new Date();
	const dd = String(now.getDate()).padStart(2, '0');
	const mmm = MONTHS[now.getMonth()] ?? 'UNK';
	const yyyy = String(now.getFullYear());
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let rand = '';
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		const buf = new Uint32Array(8);
		crypto.getRandomValues(buf);
		for (let i = 0; i < 8; i++) rand += chars[buf[i]! % chars.length];
	} else {
		for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
	}
	return `${dd}${mmm}${yyyy}-${rand}`;
}

/** wa.me link for an arbitrary message body. */
export function waTextUrl(text: string): string {
	return `https://wa.me/${digits()}?text=${encodeURIComponent(text)}`;
}

/** The greeting every WhatsApp message opens with — always the brand name. */
export function waGreeting(): string {
	return `Halo ${admin.settings.brand.name},`;
}

/** Generic store enquiry link. */
export function generalWaLink(text: string): string {
	return waTextUrl(text);
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

export interface WaOrderMeta {
	orderCode?: string;
	customerName?: string;
	customerNote?: string;
}

/** Product enquiry text for the "buy" and "ask" flows. */
export function waMessage(request: WaRequest, mode: 'buy' | 'ask', meta: WaOrderMeta = {}): string {
	const { product, variant, quantity, url } = request;
	const unit = priceFor(product, variant);
	const color = variant?.attributes?.find((a) => a.name.toLowerCase() === 'color')?.value;
	const size = variant?.attributes?.find((a) => a.name.toLowerCase() === 'size')?.value;

	const lines = [waGreeting(), ''];
	if (meta.orderCode) lines.push(`Kode pesanan: ${meta.orderCode}`);
	if (meta.customerName) lines.push(`Nama: ${meta.customerName}`);
	if (meta.orderCode || meta.customerName) lines.push('');
	lines.push(
		mode === 'ask'
			? 'saya ingin bertanya tentang produk ini.'
			: 'saya tertarik untuk memesan produk berikut.',
		'',
		`Produk: ${product.name}`,
		`Warna: ${color ?? '—'}`,
		`Ukuran: ${size ?? '—'}`,
		`SKU: ${skuFor(product, variant)}`
	);

	if (mode === 'buy') {
		lines.push(
			`Jumlah: ${quantity}`,
			`Harga satuan: ${formatIDR(unit)}`,
			`Subtotal: ${formatIDR(unit * quantity)}`
		);
	}

	lines.push('', `Link produk: ${url}`);
	if (meta.customerNote) lines.push(`Catatan: ${meta.customerNote}`);
	lines.push('', 'Mohon konfirmasi ketersediaan dan informasi pengiriman.');
	return lines.join('\n');
}

/** wa.me link for a product selection. */
export function waLink(request: WaRequest, mode: 'buy' | 'ask', meta: WaOrderMeta = {}): string {
	return `https://wa.me/${digits()}?text=${encodeURIComponent(waMessage(request, mode, meta))}`;
}

/** Build an order item payload from a single-product request. */
export function productOrderItem(request: WaRequest): OrderItem {
	const { product, variant, quantity } = request;
	const unit = priceFor(product, variant);
	const color = variant?.attributes?.find((a) => a.name.toLowerCase() === 'color')?.value;
	const size = variant?.attributes?.find((a) => a.name.toLowerCase() === 'size')?.value;
	const parts = [color, size].filter(Boolean);
	return {
		productId: product.id,
		productName: product.name,
		variant: parts.length ? parts.join(' / ') : variant?.name || undefined,
		sku: skuFor(product, variant),
		quantity,
		unitPrice: unit,
		subtotal: unit * quantity
	};
}

/** Cart checkout message including the order code and customer details. */
export function cartWaMessage(
	items: string,
	total: number,
	meta: WaOrderMeta = {}
): string {
	const tpl =
		admin.settings.whatsappCartTemplate?.trim() ||
		`Halo {{brandName}}, saya ingin memesan:\n{{items}}\n\nTotal: {{total}}`;
	const head = [waGreeting()];
	if (meta.orderCode) head.push(`Kode pesanan: ${meta.orderCode}`);
	if (meta.customerName) head.push(`Nama: ${meta.customerName}`);
	head.push('');
	const body = tpl
		.replace(/^Halo[^\n]*,?\s*/i, '')
		.replaceAll('{{brandName}}', admin.settings.brand.name)
		.replaceAll('{{items}}', items)
		.replaceAll('{{total}}', formatIDR(total));
	const tail: string[] = [];
	if (meta.customerNote) tail.push('', `Catatan: ${meta.customerNote}`);
	return [...head, body.trim(), ...tail].join('\n');
}

export function waNumberDigits(): string {
	return digits();
}

export type { OrderSource };
