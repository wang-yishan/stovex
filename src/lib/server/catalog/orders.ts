/* Order repository — WhatsApp orders captured from the storefront.
   Orders are created as `pending` and verified/cancelled by an admin. */

import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { notification, order, orderItem } from '#lib/server/db/schema.ts';
import { nowISO, uid } from '#lib/admin/data.ts';
import type { Order, OrderItem, OrderSource, OrderStatus } from '#lib/admin/types.ts';

const STATUSES: OrderStatus[] = ['pending', 'verified', 'cancelled'];
const SOURCES: OrderSource[] = ['product', 'cart'];

function str(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function statusOf(value: unknown): OrderStatus {
	return STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : 'pending';
}

function sourceOf(value: unknown): OrderSource {
	return SOURCES.includes(value as OrderSource) ? (value as OrderSource) : 'cart';
}

function rowToItem(row: typeof orderItem.$inferSelect): OrderItem {
	return {
		productId: row.productId,
		productName: row.productName,
		variant: row.variant ?? undefined,
		sku: row.sku,
		quantity: row.quantity,
		unitPrice: row.unitPrice,
		subtotal: row.subtotal
	};
}

function rowToOrder(row: typeof order.$inferSelect, items: OrderItem[]): Order {
	return {
		id: row.id,
		code: row.code,
		source: sourceOf(row.source),
		customerName: row.customerName,
		customerNote: row.customerNote,
		items,
		total: row.total,
		status: statusOf(row.status),
		message: row.message,
		verifiedAt: row.verifiedAt ?? null,
		adminNote: row.adminNote,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export async function getOrders(): Promise<Order[]> {
	const [rows, itemRows] = await Promise.all([
		db.select().from(order).orderBy(desc(order.createdAt)),
		db.select().from(orderItem)
	]);
	const itemsByOrder = new Map<string, OrderItem[]>();
	for (const row of itemRows) {
		const list = itemsByOrder.get(row.orderId) ?? [];
		list.push(rowToItem(row));
		itemsByOrder.set(row.orderId, list);
	}
	return rows.map((row) => rowToOrder(row, itemsByOrder.get(row.id) ?? []));
}

export interface CreateOrderInput {
	code?: string;
	source?: OrderSource;
	customerName: string;
	customerNote?: string;
	items: Array<{
		productId?: string;
		productName: string;
		variant?: string;
		sku?: string;
		quantity: number;
		unitPrice: number;
	}>;
	message?: string;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

function datePrefix(now: Date): string {
	const dd = String(now.getDate()).padStart(2, '0');
	const mmm = MONTHS[now.getMonth()] ?? 'UNK';
	const yyyy = String(now.getFullYear());
	return `${dd}${mmm}${yyyy}`;
}

function randomSuffix(length = 8): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let out = '';
	for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
	return out;
}

async function nextOrderCode(now: Date): Promise<string> {
	const prefix = datePrefix(now);
	for (let i = 0; i < 30; i++) {
		const code = `${prefix}-${randomSuffix(8)}`;
		const exists = await db.select({ id: order.id }).from(order).where(eq(order.code, code)).limit(1);
		if (exists.length === 0) return code;
	}
	// Extremely unlikely fallback: still date-prefixed and unique by time+rand.
	return `${prefix}-${Date.now().toString(36).toUpperCase()}${randomSuffix(4)}`;
}

export function parseOrderInput(body: unknown): CreateOrderInput {
	const raw = (body ?? {}) as Record<string, unknown>;
	const rawItems = Array.isArray(raw.items) ? raw.items : [];
	const items = rawItems
		.map((item) => {
			const i = (item ?? {}) as Record<string, unknown>;
			const quantity = Math.max(1, Math.round(num(i.quantity, 1)));
			const unitPrice = Math.max(0, Math.round(num(i.unitPrice, 0)));
			return {
				productId: str(i.productId),
				productName: str(i.productName),
				variant: i.variant ? str(i.variant) : undefined,
				sku: str(i.sku),
				quantity,
				unitPrice
			};
		})
		.filter((i) => i.productName.trim().length > 0);

	const rawCode = str(raw.code).trim().toUpperCase().slice(0, 40);

	return {
		code: rawCode || undefined,
		source: sourceOf(raw.source),
		customerName: str(raw.customerName).trim().slice(0, 120),
		customerNote: str(raw.customerNote).trim().slice(0, 500),
		items,
		message: str(raw.message).slice(0, 4000)
	};
}

export function validateOrderInput(input: CreateOrderInput): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!input.customerName.trim()) errors.customerName = 'Nama pembeli wajib diisi';
	if (input.items.length === 0) errors.items = 'Pesanan harus memiliki minimal 1 item';
	return errors;
}

async function resolveCode(requested: string | undefined, now: Date): Promise<string> {
	if (requested) {
		const exists = await db
			.select({ id: order.id })
			.from(order)
			.where(eq(order.code, requested))
			.limit(1);
		if (exists.length === 0) return requested;
	}
	return nextOrderCode(now);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
	const now = new Date();
	const ts = now.toISOString();
	const id = uid('ord-');
	const code = await resolveCode(input.code, now);
	const items: (OrderItem & { id: string; orderId: string })[] = input.items.map((item) => ({
		id: uid('oit-'),
		orderId: id,
		productId: item.productId || '',
		productName: item.productName,
		variant: item.variant,
		sku: item.sku || '',
		quantity: item.quantity,
		unitPrice: item.unitPrice,
		subtotal: item.unitPrice * item.quantity
	}));
	const total = items.reduce((sum, i) => sum + i.subtotal, 0);

	const saved: Order = {
		id,
		code,
		source: input.source ?? 'cart',
		customerName: input.customerName.trim(),
		customerNote: input.customerNote?.trim() || '',
		items: items.map(({ id: _id, orderId: _oid, ...rest }) => rest),
		total,
		status: 'pending',
		message: input.message || '',
		verifiedAt: null,
		adminNote: '',
		createdAt: ts,
		updatedAt: ts
	};

	await db.transaction(async (tx) => {
		await tx.insert(order).values({
			id: saved.id,
			code: saved.code,
			source: saved.source,
			customerName: saved.customerName,
			customerNote: saved.customerNote,
			total: saved.total,
			status: saved.status,
			message: saved.message,
			verifiedAt: saved.verifiedAt,
			adminNote: saved.adminNote,
			createdAt: saved.createdAt,
			updatedAt: saved.updatedAt
		});
		if (items.length > 0) {
			await tx.insert(orderItem).values(
				items.map((i) => ({
					id: i.id,
					orderId: i.orderId,
					productId: i.productId,
					productName: i.productName,
					variant: i.variant ?? null,
					sku: i.sku,
					quantity: i.quantity,
					unitPrice: i.unitPrice,
					subtotal: i.subtotal
				}))
			);
		}
		// In-app alert so the admin sees the new pending order.
		await tx.insert(notification).values({
			id: uid('notif-'),
			kind: 'order',
			title: 'Pesanan WhatsApp baru',
			message: `${saved.code} dari ${saved.customerName || 'Pelanggan'} — menunggu verifikasi.`,
			href: '/dashboard/orders',
			read: false,
			createdAt: ts
		});
	});

	return saved;
}

export async function setOrderStatus(
	id: string,
	status: OrderStatus,
	adminNote?: string
): Promise<Order | null> {
	if (!STATUSES.includes(status)) throw new Error('Unknown order status');
	const rows = await db.select().from(order).where(eq(order.id, id)).limit(1);
	const row = rows[0];
	if (!row) return null;

	const now = nowISO();
	const verifiedAt = status === 'verified' ? now : status === 'pending' ? null : row.verifiedAt;
	const note = adminNote !== undefined ? adminNote.trim().slice(0, 500) : row.adminNote;

	await db
		.update(order)
		.set({ status, verifiedAt, adminNote: note, updatedAt: now })
		.where(eq(order.id, id));

	const items = await db.select().from(orderItem).where(eq(orderItem.orderId, id));
	return rowToOrder({ ...row, status, verifiedAt, adminNote: note, updatedAt: now }, items.map(rowToItem));
}
