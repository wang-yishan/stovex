/* Shipping repository — the single place that reads and writes shipment
   monitoring data. Shipments and their tracking timeline live in SQLite so
   the dashboard keeps the courier history across reloads. */

import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { shipment, shipmentEvent } from '#lib/server/db/schema.ts';
import {
	SEED_SHIPMENTS,
	SHIPMENT_STATUSES,
	SHIPMENT_STATUS_META,
	nowISO,
	uid
} from '#lib/admin/data.ts';
import type {
	Shipment,
	ShipmentEvent,
	ShipmentEventInput,
	ShipmentStatus
} from '#lib/admin/types.ts';

function str(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function statusOf(value: unknown): ShipmentStatus {
	return SHIPMENT_STATUSES.includes(value as ShipmentStatus)
		? (value as ShipmentStatus)
		: 'pending';
}

function rowToEvent(row: typeof shipmentEvent.$inferSelect): ShipmentEvent {
	return {
		id: row.id,
		shipmentId: row.shipmentId,
		status: row.status as ShipmentStatus,
		label: row.label,
		location: row.location,
		note: row.note ?? undefined,
		createdAt: row.createdAt
	};
}

function rowToShipment(row: typeof shipment.$inferSelect, events: ShipmentEvent[]): Shipment {
	return {
		id: row.id,
		orderId: row.orderId,
		customerName: row.customerName,
		customerPhone: row.customerPhone,
		destination: row.destination,
		address: row.address,
		courier: row.courier,
		service: row.service,
		trackingNumber: row.trackingNumber,
		status: row.status as ShipmentStatus,
		items: row.items ?? [],
		weightKg: row.weightKg,
		shippingCost: row.shippingCost,
		orderTotal: row.orderTotal,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		deliveredAt: row.deliveredAt ?? null,
		events
	};
}

/* ------------------------------- reading ------------------------------- */

/** Every shipment with its tracking timeline (newest activity first). */
export async function getShipments(): Promise<Shipment[]> {
	await ensureSeeded();

	const [shipmentRows, eventRows] = await Promise.all([
		db.select().from(shipment).orderBy(desc(shipment.updatedAt)),
		db.select().from(shipmentEvent).orderBy(desc(shipmentEvent.createdAt))
	]);

	const eventsByShipment = new Map<string, ShipmentEvent[]>();
	for (const row of eventRows) {
		const list = eventsByShipment.get(row.shipmentId) ?? [];
		list.push(rowToEvent(row));
		eventsByShipment.set(row.shipmentId, list);
	}

	return shipmentRows.map((row) => rowToShipment(row, eventsByShipment.get(row.id) ?? []));
}

/* --------------------------- parsing/validation --------------------------- */

/** Coerce an untrusted JSON body into a well-formed shipment. */
export function parseShipmentPayload(body: unknown): Shipment {
	const raw = (body ?? {}) as Record<string, unknown>;

	const items = Array.isArray(raw.items)
		? raw.items
				.map((item) => {
					const i = (item ?? {}) as Record<string, unknown>;
					return {
						id: str(i.id, uid('itm-')),
						name: str(i.name),
						qty: Math.max(1, Math.round(num(i.qty, 1)))
					};
				})
				.filter((i) => i.name.length > 0)
		: [];

	const events: ShipmentEvent[] = Array.isArray(raw.events)
		? raw.events.map((item) => {
				const e = (item ?? {}) as Record<string, unknown>;
				return {
					id: str(e.id, uid('evt-')),
					shipmentId: str(e.shipmentId),
					status: statusOf(e.status),
					label: str(e.label),
					location: str(e.location),
					note: e.note ? str(e.note) : undefined,
					createdAt: str(e.createdAt, nowISO())
				};
			})
		: [];

	return {
		id: str(raw.id),
		orderId: str(raw.orderId),
		customerName: str(raw.customerName),
		customerPhone: str(raw.customerPhone),
		destination: str(raw.destination),
		address: str(raw.address),
		courier: str(raw.courier),
		service: str(raw.service),
		trackingNumber: str(raw.trackingNumber),
		status: statusOf(raw.status),
		items,
		weightKg: num(raw.weightKg),
		shippingCost: num(raw.shippingCost),
		orderTotal: num(raw.orderTotal),
		createdAt: str(raw.createdAt, nowISO()),
		updatedAt: str(raw.updatedAt, nowISO()),
		deliveredAt: raw.deliveredAt ? str(raw.deliveredAt) : null,
		events
	};
}

export function validateShipment(
	input: Shipment,
	existing: Shipment[]
): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!input.orderId.trim()) errors.orderId = 'Order ID required';
	if (!input.customerName.trim()) errors.customerName = 'Customer name required';
	if (!input.trackingNumber.trim()) errors.trackingNumber = 'Tracking number required';
	else if (
		existing.some(
			(s) =>
				s.id !== input.id &&
				s.trackingNumber.toLowerCase() === input.trackingNumber.toLowerCase()
		)
	) {
		errors.trackingNumber = 'Tracking number must be unique';
	}
	if (!input.courier.trim()) errors.courier = 'Courier required';
	if (input.items.length === 0) errors.items = 'At least one item required';
	if (input.weightKg < 0) errors.weightKg = 'Weight cannot be negative';
	if (input.shippingCost < 0) errors.shippingCost = 'Shipping cost cannot be negative';
	if (input.orderTotal < 0) errors.orderTotal = 'Order total cannot be negative';
	return errors;
}

/* ------------------------------- writing ------------------------------- */

/** Insert or update a shipment together with its tracking timeline. */
export async function saveShipment(input: Shipment): Promise<Shipment> {
	const row = {
		id: input.id,
		orderId: input.orderId,
		customerName: input.customerName,
		customerPhone: input.customerPhone,
		destination: input.destination,
		address: input.address,
		courier: input.courier,
		service: input.service,
		trackingNumber: input.trackingNumber,
		status: input.status,
		items: input.items,
		weightKg: input.weightKg,
		shippingCost: input.shippingCost,
		orderTotal: input.orderTotal,
		createdAt: input.createdAt,
		updatedAt: input.updatedAt,
		deliveredAt: input.deliveredAt
	};

	await db.transaction(async (tx) => {
		await tx.insert(shipment).values(row).onConflictDoUpdate({ target: shipment.id, set: row });
		await tx.delete(shipmentEvent).where(eq(shipmentEvent.shipmentId, input.id));
		if (input.events.length > 0) {
			await tx.insert(shipmentEvent).values(
				input.events.map((event) => ({
					id: event.id,
					shipmentId: input.id,
					status: event.status,
					label: event.label,
					location: event.location,
					note: event.note ?? null,
					createdAt: event.createdAt
				}))
			);
		}
	});

	return {
		...input,
		events: input.events.map((event) => ({ ...event, shipmentId: input.id }))
	};
}

export async function deleteShipment(id: string): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(shipmentEvent).where(eq(shipmentEvent.shipmentId, id));
		await tx.delete(shipment).where(eq(shipment.id, id));
	});
}

/**
 * Move a shipment to a new status. Appends a tracking event so the timeline
 * always shows who/when the change happened.
 */
export async function setShipmentStatus(
	id: string,
	status: ShipmentStatus,
	input: { location?: string; label?: string; note?: string } = {}
): Promise<{ shipment: Shipment; event: ShipmentEvent }> {
	const all = await getShipments();
	const current = all.find((s) => s.id === id);
	if (!current) throw new Error('Shipment not found');
	if (!SHIPMENT_STATUSES.includes(status)) throw new Error('Unknown shipment status');

	const now = nowISO();
	const event: ShipmentEvent = {
		id: uid('evt-'),
		shipmentId: id,
		status,
		label: input.label?.trim() || SHIPMENT_STATUS_META[status].eventLabel,
		location: input.location?.trim() || '',
		note: input.note?.trim() || undefined,
		createdAt: now
	};

	const deliveredAt = status === 'delivered' ? current.deliveredAt ?? now : null;

	await db.transaction(async (tx) => {
		await tx.insert(shipmentEvent).values({
			id: event.id,
			shipmentId: id,
			status: event.status,
			label: event.label,
			location: event.location,
			note: event.note ?? null,
			createdAt: event.createdAt
		});
		await tx
			.update(shipment)
			.set({ status, updatedAt: now, deliveredAt })
			.where(eq(shipment.id, id));
	});

	return {
		shipment: { ...current, status, updatedAt: now, deliveredAt, events: [event, ...current.events] },
		event
	};
}

/**
 * Append a tracking event. When the event carries a new status the shipment
 * status follows, so the timeline and the summary row never disagree.
 */
export async function addShipmentEvent(
	id: string,
	input: ShipmentEventInput
): Promise<{ shipment: Shipment; event: ShipmentEvent }> {
	const all = await getShipments();
	const current = all.find((s) => s.id === id);
	if (!current) throw new Error('Shipment not found');
	if (!SHIPMENT_STATUSES.includes(input.status)) throw new Error('Unknown shipment status');

	const now = nowISO();
	const event: ShipmentEvent = {
		id: uid('evt-'),
		shipmentId: id,
		status: input.status,
		label: input.label.trim() || SHIPMENT_STATUS_META[input.status].eventLabel,
		location: input.location.trim(),
		note: input.note?.trim() || undefined,
		createdAt: now
	};

	const statusChanged = input.status !== current.status;
	const deliveredAt =
		input.status === 'delivered'
			? current.deliveredAt ?? now
			: statusChanged
				? null
				: current.deliveredAt;

	await db.transaction(async (tx) => {
		await tx.insert(shipmentEvent).values({
			id: event.id,
			shipmentId: id,
			status: event.status,
			label: event.label,
			location: event.location,
			note: event.note ?? null,
			createdAt: event.createdAt
		});
		await tx
			.update(shipment)
			.set({ status: input.status, updatedAt: now, deliveredAt })
			.where(eq(shipment.id, id));
	});

	return {
		shipment: {
			...current,
			status: input.status,
			updatedAt: now,
			deliveredAt,
			events: [event, ...current.events]
		},
		event
	};
}

/* -------------------------------- seeding -------------------------------- */

/** Fill an empty database with the prototype shipments (runs at most once). */
export async function ensureSeeded(): Promise<void> {
	const existing = await db.select({ id: shipment.id }).from(shipment).limit(1);
	if (existing.length > 0) return;

	await db.transaction(async (tx) => {
		for (const seed of SEED_SHIPMENTS) {
			await tx.insert(shipment).values({
				id: seed.id,
				orderId: seed.orderId,
				customerName: seed.customerName,
				customerPhone: seed.customerPhone,
				destination: seed.destination,
				address: seed.address,
				courier: seed.courier,
				service: seed.service,
				trackingNumber: seed.trackingNumber,
				status: seed.status,
				items: seed.items,
				weightKg: seed.weightKg,
				shippingCost: seed.shippingCost,
				orderTotal: seed.orderTotal,
				createdAt: seed.createdAt,
				updatedAt: seed.updatedAt,
				deliveredAt: seed.deliveredAt
			});
			if (seed.events.length > 0) {
				await tx.insert(shipmentEvent).values(
					seed.events.map((event) => ({
						id: event.id,
						shipmentId: seed.id,
						status: event.status,
						label: event.label,
						location: event.location,
						note: event.note ?? null,
						createdAt: event.createdAt
					}))
				);
			}
		}
	});
}
