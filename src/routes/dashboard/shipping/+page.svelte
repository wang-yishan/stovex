<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import { resolve } from '$app/paths';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import ShipmentStatusBadge from '#lib/admin/components/ShipmentStatusBadge.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import ConfirmModal from '#lib/admin/components/ConfirmModal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import {
		COURIER_SERVICES,
		COURIERS,
		SHIPMENT_STATUS_META,
		SHIPMENT_STATUSES,
		formatIDR,
		nextShipmentStatus,
		nowISO,
		uid
	} from '#lib/admin/data.ts';
	import type { Shipment, ShipmentStatus } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import {
		ChevronRight,
		Clock,
		MapPin,
		PackageCheck,
		Plus,
		Trash2,
		TriangleAlert,
		Truck
	} from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let statusFilter = $state<'all' | ShipmentStatus>('all');
	let courierFilter = $state<'all' | string>('all');

	let filtered = $derived.by(() => {
		const q = search.toLowerCase().trim();
		return admin.shipments.filter((s) => {
			const okQ =
				!q ||
				s.orderId.toLowerCase().includes(q) ||
				s.trackingNumber.toLowerCase().includes(q) ||
				s.customerName.toLowerCase().includes(q) ||
				s.destination.toLowerCase().includes(q) ||
				s.courier.toLowerCase().includes(q);
			const okS = statusFilter === 'all' || s.status === statusFilter;
			const okC = courierFilter === 'all' || s.courier === courierFilter;
			return okQ && okS && okC;
		});
	});

	let counts = $derived.by(() => {
		const all = admin.shipments;
		const inTransit = all.filter((s) =>
			['packed', 'shipped', 'in_transit', 'out_for_delivery'].includes(s.status)
		).length;
		const pending = all.filter((s) => s.status === 'pending').length;
		const exceptions = all.filter((s) => s.status === 'exception' || s.status === 'returned').length;
		const delivered = all.filter((s) => s.status === 'delivered').length;
		return { inTransit, pending, exceptions, delivered, total: all.length };
	});

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/* ---------- quick status update ---------- */
	let statusTarget = $state<Shipment | null>(null);
	let statusValue = $state<ShipmentStatus>('shipped');
	let statusLocation = $state('');
	let statusNote = $state('');

	function openStatus(s: Shipment) {
		statusTarget = s;
		statusValue = nextShipmentStatus(s.status) ?? s.status;
		statusLocation = s.destination;
		statusNote = '';
	}

	async function confirmStatus() {
		if (!statusTarget) return;
		await admin.setShipmentStatus(statusTarget.id, statusValue, {
			location: statusLocation || undefined,
			note: statusNote || undefined
		});
		statusTarget = null;
	}

	/* ---------- delete ---------- */
	let deleteId = $state<string | null>(null);
	async function confirmDelete() {
		if (!deleteId) return;
		await admin.deleteShipment(deleteId);
		deleteId = null;
	}

	/* ---------- create ---------- */
	let createOpen = $state(false);
	let createForm = $state({
		orderId: '',
		customerName: '',
		customerPhone: '',
		destination: '',
		address: '',
		courier: COURIERS[0],
		service: COURIER_SERVICES[COURIERS[0]][0],
		trackingNumber: '',
		itemName: '',
		itemQty: 1,
		weightKg: 1,
		shippingCost: 0,
		orderTotal: 0
	});

	function resetCreate() {
		createForm = {
			orderId: '',
			customerName: '',
			customerPhone: '',
			destination: '',
			address: '',
			courier: COURIERS[0],
			service: COURIER_SERVICES[COURIERS[0]][0],
			trackingNumber: '',
			itemName: '',
			itemQty: 1,
			weightKg: 1,
			shippingCost: 0,
			orderTotal: 0
		};
	}

	function onCourierChange() {
		const services = COURIER_SERVICES[createForm.courier] ?? [];
		if (!services.includes(createForm.service)) createForm.service = services[0] ?? '';
	}

	async function submitCreate() {
		if (!createForm.orderId.trim() || !createForm.customerName.trim()) {
			admin.showToast('Order ID and customer name required', 'error');
			return;
		}
		if (!createForm.trackingNumber.trim()) {
			admin.showToast('Tracking number required', 'error');
			return;
		}
		if (!createForm.itemName.trim()) {
			admin.showToast('Item name required', 'error');
			return;
		}
		const now = nowISO();
		const id = uid('ship-');
		const shipment: Shipment = {
			id,
			orderId: createForm.orderId.trim(),
			customerName: createForm.customerName.trim(),
			customerPhone: createForm.customerPhone.trim(),
			destination: createForm.destination.trim(),
			address: createForm.address.trim(),
			courier: createForm.courier,
			service: createForm.service,
			trackingNumber: createForm.trackingNumber.trim(),
			status: 'pending',
			items: [{ id: uid('itm-'), name: createForm.itemName.trim(), qty: Math.max(1, Number(createForm.itemQty) || 1) }],
			weightKg: Math.max(0, Number(createForm.weightKg) || 0),
			shippingCost: Math.max(0, Number(createForm.shippingCost) || 0),
			orderTotal: Math.max(0, Number(createForm.orderTotal) || 0),
			createdAt: now,
			updatedAt: now,
			deliveredAt: null,
			events: [
				{
					id: uid('evt-'),
					shipmentId: id,
					status: 'pending',
					label: SHIPMENT_STATUS_META.pending.eventLabel,
					location: 'BAG STORE Warehouse',
					createdAt: now
				}
			]
		};
		const saved = await admin.upsertShipment(shipment);
		if (saved) {
			createOpen = false;
			resetCreate();
		}
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Shipping' }]}
	title="Shipping"
	subtitle="Monitor deliveries, tracking, and courier status."
	mobileSubtitle="Monitor deliveries & tracking"
>
	{#snippet actions()}
		<Button onclick={() => (createOpen = true)}>
			<Plus class="h-4 w-4 shrink-0" />
			<span class="hidden sm:inline">New shipment</span>
			<span class="sm:hidden">New</span>
		</Button>
	{/snippet}
</Topbar>

<div
	class="mx-auto w-full max-w-[1280px] {isMobile
		? 'px-4 py-4 pb-[112px]'
		: 'px-4 py-6 md:px-6 lg:px-8'}"
>
	{#if counts.exceptions > 0}
		<div
			class="mb-4 flex items-start gap-2 rounded-[12px] border bg-[#FFF0F0] p-3"
			style="border-color: #F2C2C0;"
		>
			<TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-[#D9534F]" />
			<div>
				<p class="text-[12px] font-medium text-[#A33A37]">
					{counts.exceptions} shipment{counts.exceptions > 1 ? 's' : ''} need attention
				</p>
				<p class="mt-0.5 text-[11px] text-[#A33A37]/80">
					Exceptions or returns that should be reviewed with the courier.
				</p>
			</div>
		</div>
	{/if}

	<!-- KPIs -->
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border border-border bg-muted">
				<Truck class="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.inTransit}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">In transit now</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border bg-[#FFF8E6]" style="border-color: #F3D9A0;">
				<Clock class="h-5 w-5 text-[#8A6A24]" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.pending}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Pending / to pack</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border bg-[#F0FAF6]" style="border-color: #C7EBDB;">
				<PackageCheck class="h-5 w-5 text-[#1A7A52]" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.delivered}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Delivered</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border bg-[#FFF0F0]" style="border-color: #F2C2C0;">
				<TriangleAlert class="h-5 w-5 text-[#A33A37]" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.exceptions}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Exceptions / returns</div>
		</div>
	</div>

	<!-- Filters -->
	<div
		class="mb-4 flex flex-col justify-between gap-3 rounded-[12px] border border-border bg-card p-3 md:flex-row md:items-center md:p-4"
	>
		<SearchInput bind:value={search} placeholder="Search order, resi, customer, destination..." />
		<div class="flex flex-wrap gap-2 [&>div]:w-full sm:[&>div]:w-auto">
			<NativeSelect shape="pill" class="font-medium" bind:value={statusFilter}>
				<option value="all">All status</option>
				{#each SHIPMENT_STATUSES as st (st)}
					<option value={st}>{SHIPMENT_STATUS_META[st].label}</option>
				{/each}
			</NativeSelect>
			<NativeSelect shape="pill" class="font-medium" bind:value={courierFilter}>
				<option value="all">All couriers</option>
				{#each COURIERS as c (c)}
					<option value={c}>{c}</option>
				{/each}
			</NativeSelect>
		</div>
	</div>

	<!-- List -->
	<div class="overflow-hidden rounded-[12px] border border-border bg-card">
		{#if filtered.length === 0}
			<div class="px-6 py-16 text-center">
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-muted"
				>
					<Truck class="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 class="text-[14px] font-semibold">No shipments found</h3>
				<p class="mt-1 text-[12px] text-muted-foreground">
					{admin.shipments.length === 0
						? 'Create a shipment to start monitoring deliveries.'
						: 'Try adjusting your search or filters.'}
				</p>
			</div>
		{:else if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr
							class="border-b border-border bg-field text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
						>
							<th class="px-5 py-2.5">Order / Resi</th>
							<th class="px-5 py-2.5">Customer</th>
							<th class="px-5 py-2.5">Courier</th>
							<th class="px-5 py-2.5">Destination</th>
							<th class="px-5 py-2.5">Status</th>
							<th class="px-5 py-2.5">Updated</th>
							<th class="px-5 py-2.5 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filtered as s (s.id)}
							<tr class="hover:bg-muted">
								<td class="px-5 py-3">
									<div class="text-[13px] font-medium">{s.orderId}</div>
									<div class="mono text-[11px] text-muted-foreground">{s.trackingNumber || '—'}</div>
								</td>
								<td class="px-5 py-3">
									<div class="text-[12px] font-medium">{s.customerName}</div>
									<div class="text-[11px] text-muted-foreground">{s.customerPhone || '—'}</div>
								</td>
								<td class="px-5 py-3">
									<div class="text-[12px]">{s.courier || '—'}</div>
									<div class="text-[11px] text-muted-foreground">{s.service || ''}</div>
								</td>
								<td class="px-5 py-3">
									<div class="flex items-start gap-1.5 text-[12px]">
										<MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
										<span class="max-w-[220px] truncate">{s.destination || '—'}</span>
									</div>
								</td>
								<td class="px-5 py-3"><ShipmentStatusBadge status={s.status} /></td>
								<td class="px-5 py-3 text-[11px] text-muted-foreground">{formatDate(s.updatedAt)}</td>
								<td class="px-5 py-3">
									<div class="flex justify-end gap-1">
										<Button
											variant="outline"
											size="xs"
											class="px-2.5"
											onclick={() => openStatus(s)}
											disabled={s.status === 'delivered' || s.status === 'returned'}
										>
											Update
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											aria-label="View shipment"
											onclick={() => void 0}
											href={resolve(`/dashboard/shipping/${s.id}` as '/')}
										>
											<ChevronRight class="h-4 w-4 text-muted-foreground" />
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											aria-label="Delete shipment"
											onclick={() => (deleteId = s.id)}
										>
											<Trash2 class="h-3.5 w-3.5 text-muted-foreground" />
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each filtered as s (s.id)}
					<div class="p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-[13px] font-semibold">{s.orderId}</span>
									<ShipmentStatusBadge status={s.status} />
								</div>
								<div class="mono mt-0.5 text-[11px] text-muted-foreground">{s.trackingNumber}</div>
								<div class="mt-1 text-[12px] font-medium">{s.customerName}</div>
								<div class="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
									<MapPin class="h-3.5 w-3.5 shrink-0" /> {s.destination || '—'}
								</div>
								<div class="mt-1 text-[11px] text-muted-foreground">
									{s.courier} {s.service ? `· ${s.service}` : ''} · {formatDate(s.updatedAt)}
								</div>
							</div>
						</div>
						<div class="mt-3 flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={() => openStatus(s)}
								disabled={s.status === 'delivered' || s.status === 'returned'}
							>
								Update status
							</Button>
							<Button variant="outline" size="sm" href={resolve(`/dashboard/shipping/${s.id}` as '/')}>
								Details
							</Button>
							<Button variant="outline" size="icon-sm" aria-label="Delete" onclick={() => (deleteId = s.id)}>
								<Trash2 class="h-3.5 w-3.5 text-muted-foreground" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<p class="mt-3 text-[11px] text-muted-foreground">
		Showing {filtered.length} of {counts.total} shipments • statuses and tracking events are stored in SQLite.
	</p>
</div>

{#if statusTarget}
	<Modal title="Update shipment status">
		<p class="mt-1 text-[12px] text-muted-foreground">
			{statusTarget.orderId} — {statusTarget.trackingNumber} ({statusTarget.customerName})
		</p>
		<div class="mt-3 space-y-3">
			<div class="[&>div]:w-full">
				<Label for="ship-status" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">New status</Label>
				<NativeSelect id="ship-status" class="mt-1" bind:value={statusValue}>
					{#each SHIPMENT_STATUSES as st (st)}
						<option value={st}>{SHIPMENT_STATUS_META[st].label}</option>
					{/each}
				</NativeSelect>
			</div>
			<div>
				<Label for="ship-loc" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Location</Label>
				<Input id="ship-loc" class="mt-1" placeholder="e.g. Jakarta Selatan" bind:value={statusLocation} />
			</div>
			<div>
				<Label for="ship-note" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Note</Label>
				<Input id="ship-note" class="mt-1" placeholder="Optional note" bind:value={statusNote} />
			</div>
			<div class="rounded-[8px] border border-border bg-field p-2 text-[11px] text-muted-foreground">
				A tracking event will be added to the shipment timeline.
			</div>
		</div>
		<div class="mt-4 flex gap-2">
			<Button class="flex-1 sm:h-10" onclick={confirmStatus}>Save status</Button>
			<Button variant="outline" class="flex-1 sm:h-10" onclick={() => (statusTarget = null)}>Cancel</Button>
		</div>
	</Modal>
{/if}

{#if deleteId}
	<ConfirmModal
		title="Delete shipment?"
		body="This removes the shipment and its tracking timeline."
		confirmText="Delete"
		danger
		onConfirm={confirmDelete}
		onCancel={() => (deleteId = null)}
	/>
{/if}

{#if createOpen}
	<Modal title="New shipment" maxW={520}>
		<p class="mt-1 text-[12px] text-muted-foreground">Create a shipment to monitor delivery progress.</p>
		<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div>
				<Label for="c-order" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Order ID</Label>
				<Input id="c-order" class="mt-1" placeholder="#1024" bind:value={createForm.orderId} />
			</div>
			<div>
				<Label for="c-resi" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Tracking number</Label>
				<Input id="c-resi" class="mt-1" placeholder="Resi" bind:value={createForm.trackingNumber} />
			</div>
			<div>
				<Label for="c-name" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Customer name</Label>
				<Input id="c-name" class="mt-1" bind:value={createForm.customerName} />
			</div>
			<div>
				<Label for="c-phone" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Phone</Label>
				<Input id="c-phone" class="mt-1" bind:value={createForm.customerPhone} />
			</div>
			<div class="sm:col-span-2">
				<Label for="c-dest" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Destination (city)</Label>
				<Input id="c-dest" class="mt-1" placeholder="City, Province" bind:value={createForm.destination} />
			</div>
			<div class="sm:col-span-2">
				<Label for="c-addr" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Address</Label>
				<Textarea id="c-addr" class="mt-1" rows={2} bind:value={createForm.address} />
			</div>
			<div class="[&>div]:w-full">
				<Label for="c-courier" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Courier</Label>
				<NativeSelect id="c-courier" class="mt-1" bind:value={createForm.courier} onchange={onCourierChange}>
					{#each COURIERS as c (c)}
						<option value={c}>{c}</option>
					{/each}
				</NativeSelect>
			</div>
			<div class="[&>div]:w-full">
				<Label for="c-service" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Service</Label>
				<NativeSelect id="c-service" class="mt-1" bind:value={createForm.service}>
					{#each COURIER_SERVICES[createForm.courier] ?? [] as s (s)}
						<option value={s}>{s}</option>
					{/each}
				</NativeSelect>
			</div>
			<div class="sm:col-span-2">
				<Label for="c-item" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Item</Label>
				<Input id="c-item" class="mt-1" placeholder="Product name" bind:value={createForm.itemName} />
			</div>
			<div>
				<Label for="c-qty" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Qty</Label>
				<Input id="c-qty" type="number" class="mt-1" bind:value={createForm.itemQty} />
			</div>
			<div>
				<Label for="c-weight" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Weight (kg)</Label>
				<Input id="c-weight" type="number" class="mt-1" bind:value={createForm.weightKg} />
			</div>
			<div>
				<Label for="c-shipcost" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Shipping cost</Label>
				<Input id="c-shipcost" type="number" class="mt-1" bind:value={createForm.shippingCost} />
			</div>
			<div>
				<Label for="c-total" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Order total</Label>
				<Input id="c-total" type="number" class="mt-1" bind:value={createForm.orderTotal} />
			</div>
		</div>
		<div class="mt-4 flex gap-2">
			<Button class="flex-1 sm:h-10" onclick={submitCreate}>Create shipment</Button>
			<Button variant="outline" class="flex-1 sm:h-10" onclick={() => (createOpen = false)}>Cancel</Button>
		</div>
	</Modal>
{/if}
