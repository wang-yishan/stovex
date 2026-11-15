/* Storefront cart — shared between the landing page and the /catalog routes.
   Lives in a runes module so the basket survives client-side navigation. */

import { admin } from '#lib/admin/state.svelte.ts';
import { formatIDR } from '#lib/admin/data.ts';
import type { Product } from '#lib/admin/types.ts';

export interface CartLine {
	id: string;
	name: string;
	price: number;
	variant?: string;
}

class CartStore {
	lines = $state<CartLine[]>([]);
	open = $state(false);
	/** Ids of products added in the last moment, used for the "+ → ✓" feedback. */
	recent = $state<string[]>([]);

	count = $derived(this.lines.length);
	total = $derived(this.lines.reduce((sum, line) => sum + line.price, 0));

	add(product: Product, price = product.basePrice, variant?: string): void {
		const id = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
		this.lines = [...this.lines, { id, name: product.name, price, variant }];
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

	/** Order the basket through WhatsApp. */
	checkout(): void {
		if (this.lines.length === 0) {
			this.open = false;
			alert('Keranjang masih kosong. Pilih produk yang kamu suka terlebih dahulu.');
			return;
		}
		const items = this.lines.map(
			(line, i) =>
				`${i + 1}. ${line.name}${line.variant ? ` (${line.variant})` : ''} — ${formatIDR(line.price)}`
		);
		const message = `Halo ${admin.settings.brand.name}, saya ingin memesan:\n${items.join('\n')}\n\nTotal: ${formatIDR(this.total)}`;
		const digits = admin.settings.whatsappNumber.replace(/[^0-9]/g, '');
		window.open(
			`https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
			'_blank',
			'noopener'
		);
	}
}

export const cart = new CartStore();
