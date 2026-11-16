/* Storefront cart — shared between the landing page and the /catalog routes.
   Lives in a runes module so the basket survives client-side navigation. */

import { formatIDR } from '#lib/admin/data.ts';
import { orderApi } from '#lib/admin/api.ts';
import { cartWaMessage, waTextUrl } from '#lib/catalog/wa.ts';
import type { Product } from '#lib/admin/types.ts';

export interface CartLine {
	id: string;
	productId: string;
	name: string;
	price: number;
	variant?: string;
	sku?: string;
}

class CartStore {
	lines = $state<CartLine[]>([]);
	open = $state(false);
	/** Ids of products added in the last moment, used for the "+ → ✓" feedback. */
	recent = $state<string[]>([]);

	count = $derived(this.lines.length);
	total = $derived(this.lines.reduce((sum, line) => sum + line.price, 0));

	add(product: Product, price = product.basePrice, variant?: string, sku?: string): void {
		const id = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		this.lines = [
			...this.lines,
			{ id, productId: product.id, name: product.name, price, variant, sku }
		];
		this.recent = [...this.recent, product.id];
		setTimeout(() => {
			this.recent = this.recent.filter((pid) => pid !== product.id);
		}, 900);
	}

	remove(id: string): void {
		this.lines = this.lines.filter((line) => line.id !== id);
	}

	toggle(): void {
		this.open = !this.open;
	}

	itemsText(): string {
		return this.lines
			.map(
				(line, i) =>
					`${i + 1}. ${line.name}${line.variant ? ` (${line.variant})` : ''} — ${formatIDR(line.price)}`
			)
			.join('\n');
	}

	checkoutMessage(customerName: string, customerNote: string, orderCode: string): string {
		return cartWaMessage(this.itemsText(), this.total, { customerName, customerNote, orderCode });
	}

	checkoutUrl(customerName: string, customerNote: string, orderCode: string): string {
		return waTextUrl(this.checkoutMessage(customerName, customerNote, orderCode));
	}

	/** Record a pending cart order (fire-and-forget) and clear the basket. */
	recordCheckout(customerName: string, customerNote: string, orderCode: string): void {
		if (this.lines.length === 0) return;
		const snapshot = this.lines.map((line) => ({ ...line }));
		const total = snapshot.reduce((sum, line) => sum + line.price, 0);
		const items = snapshot
			.map(
				(line, i) =>
					`${i + 1}. ${line.name}${line.variant ? ` (${line.variant})` : ''} — ${formatIDR(line.price)}`
			)
			.join('\n');
		const message = cartWaMessage(items, total, { customerName, customerNote, orderCode });

		void orderApi
			.create({
				code: orderCode,
				source: 'cart',
				customerName,
				customerNote,
				items: snapshot.map((line) => ({
					productId: line.productId,
					productName: line.name,
					variant: line.variant,
					sku: line.sku,
					quantity: 1,
					unitPrice: line.price
				})),
				message
			})
			.catch(() => {
				/* redirect to WhatsApp already happened; recording is best-effort */
			});

		this.lines = [];
		this.open = false;
	}
}

export const cart = new CartStore();
