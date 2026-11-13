<script lang="ts">
	import { page } from '$app/state';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ShipmentStatusBadge from '#lib/admin/components/ShipmentStatusBadge.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import {
		SHIPMENT_STATUS_META,
		SHIPMENT_STATUSES,
		formatIDR,
		nextShipmentStatus
	} from '#lib/admin/data.ts';
	import type { ShipmentStatus } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Clock, MapPin, Package, Phone, Truck, User } from '@lucide/svelte';

	let shipment = $derived(admin.shipments.find((s) => s.id === page.params.id));

	let eventStatus = $state<ShipmentStatus>('in_transit');
	let eventLabel = $state('');
	let eventLocation = $state('');
	let eventNote = $state('');
	let formReady = $state(false);

	$effect(() => {
		const s = shipment;
		if (!s || formReady) return;
		eventStatus = nextShipmentStatus(s.status) ?? s.status;
		eventLocation = s.destination;
		eventLabel = SHIPMENT_STATUS_META[eventStatus].eventLabel;
		formReady = true;
	});

	function onStatusChange() {
		eventLabel = SHIPMENT_STATUS_META[eventStatus].eventLabel;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function submitEvent() {
		if (!shipment) return;
		if (!eventLabel.trim()) {
			admin.showToast('Event description required', 'error');
			return;
		}
		await admin.addShipmentEvent(shipment.id, {
			status: eventStatus,
			label: eventLabel.trim(),
			location: eventLocation.trim(),
			note: eventNote.trim() || undefined
		});
		eventNote = '';
	}
</script>

{#if !shipment}
	<Topbar
		crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Shipping', href: '/dashboard/shipping' }, { label: 'Not found' }]}
		title="Shipment not found"
		subtitle="This shipment may have been deleted."
	/>
	<div class="mx-auto w-full max-w-[1280px] px-4 py-10 text-center text-[13px] text-muted-foreground">
		The requested shipment does not exist.
	</div>
{:else}
	<Topbar
		crumbs={[
			{ label: 'Dashboard', href: '/dashboard' },
			{ label: 'Shipping', href: '/dashboard/shipping' },
			{ label: shipment.orderId }
		]}
		title={shipment.orderId}
		subtitle="Tracking timeline and delivery details."
	>
		{#snippet badge()}
			<ShipmentStatusBadge status={shipment.status} />
		{/snippet}
	</Topbar>

	<div class="mx-auto w-full max-w-[1280px] px-4 py-6 pb-[112px] md:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Left: summary + recipient + items -->
			<div class="space-y-4 lg:col-span-1">
				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="text-[13px] font-semibold">Shipment</h3>
					<div class="mt-3 space-y-2 text-[12px]">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-foreground">Tracking (resi)</span>
							<span class="mono font-medium">{shipment.trackingNumber || '—'}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-foreground">Courier</span>
							<span class="font-medium">{shipment.courier} {shipment.service ? `· ${shipment.service}` : ''}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-foreground">Weight</span>
							<span>{shipment.weightKg} kg</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-foreground">Shipping cost</span>
							<span>{formatIDR(shipment.shippingCost)}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-foreground">Order total</span>
							<span class="font-medium">{formatIDR(shipment.orderTotal)}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-foreground">Created</span>
							<span>{formatDate(shipment.createdAt)}</span>
						</div>
						{#if shipment.deliveredAt}
							<div class="flex items-center justify-between gap-3">
								<span class="text-muted-foreground">Delivered</span>
								<span class="text-[#1A7A52] font-medium">{formatDate(shipment.deliveredAt)}</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="text-[13px] font-semibold">Recipient</h3>
					<div class="mt-3 space-y-2 text-[12px]">
						<div class="flex items-start gap-2">
							<User class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<div>
								<div class="font-medium">{shipment.customerName}</div>
								<div class="text-muted-foreground flex items-center gap-1"><Phone class="h-3.5 w-3.5" /> {shipment.customerPhone || '—'}</div>
							</div>
						</div>
						<div class="flex items-start gap-2">
							<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<div>
								<div class="font-medium">{shipment.destination || '—'}</div>
								<div class="text-muted-foreground">{shipment.address || ''}</div>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-[12px] border border-border bg-card p-4">
					<h3 class="text-[13px] font-semibold">Items</h3>
					<ul class="mt-3 space-y-2">
						{#each shipment.items as item (item.id)}
							<li class="flex items-start justify-between gap-3 text-[12px]">
								<span class="flex items-start gap-2">
									<Package class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
									<span>{item.name}</span>
								</span>
								<span class="shrink-0 text-muted-foreground">×{item.qty}</span>
							</li>
						{/each}
						{#if shipment.items.length === 0}
							<li class="text-[12px] text-muted-foreground">No items recorded.</li>
						{/if}
					</ul>
				</div>
			</div>

			<!-- Right: timeline + add event -->
			<div class="space-y-4 lg:col-span-2">
				<div class="rounded-[12px] border border-border bg-card p-4 md:p-5">
					<h3 class="text-[13px] font-semibold">Add tracking update</h3>
					<p class="mt-1 text-[11px] text-muted-foreground">Append an event to the courier timeline. Changing the status updates the shipment status.</p>
					<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="[&>div]:w-full">
							<Label for="evt-status" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Status</Label>
							<NativeSelect id="evt-status" class="mt-1" bind:value={eventStatus} onchange={onStatusChange}>
								{#each SHIPMENT_STATUSES as st (st)}
									<option value={st}>{SHIPMENT_STATUS_META[st].label}</option>
								{/each}
							</NativeSelect>
						</div>
						<div>
							<Label for="evt-loc" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Location</Label>
							<Input id="evt-loc" class="mt-1" placeholder="City / hub" bind:value={eventLocation} />
						</div>
						<div class="sm:col-span-2">
							<Label for="evt-label" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Description</Label>
							<Input id="evt-label" class="mt-1" placeholder="e.g. Arrived at sorting center" bind:value={eventLabel} />
						</div>
						<div class="sm:col-span-2">
							<Label for="evt-note" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Note</Label>
							<Input id="evt-note" class="mt-1" placeholder="Optional" bind:value={eventNote} />
						</div>
					</div>
					<div class="mt-3">
						<Button onclick={submitEvent} disabled={shipment.status === 'delivered' || shipment.status === 'returned'}>
							<Clock class="h-4 w-4 shrink-0" /> Add tracking event
						</Button>
					</div>
				</div>

				<div class="rounded-[12px] border border-border bg-card">
					<div class="flex items-center justify-between border-b border-border px-4 py-3 md:px-5">
						<h3 class="text-[13px] font-semibold">Tracking timeline</h3>
						<span class="text-[11px] text-muted-foreground">{shipment.events.length} events</span>
					</div>
					<div class="p-4 md:p-5">
						{#if shipment.events.length === 0}
							<p class="text-[12px] text-muted-foreground">No tracking events yet.</p>
						{:else}
							<div class="relative">
								<div class="absolute top-1 bottom-1 left-[5px] w-px bg-border"></div>
								<ol class="space-y-5">
									{#each shipment.events as ev, i (ev.id)}
										<li class="relative flex gap-3">
											<span
												class="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card {i === 0
													? 'bg-[#242424]'
													: 'bg-[#D9D9D9]'}"
											></span>
											<div class="-mt-0.5 min-w-0 flex-1">
												<div class="flex flex-wrap items-center gap-2">
													<ShipmentStatusBadge status={ev.status} />
													<span class="text-[11px] text-muted-foreground">{formatDate(ev.createdAt)}</span>
												</div>
												<div class="mt-1 text-[12px] font-medium text-foreground">{ev.label}</div>
												<div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
													{#if ev.location}
														<span class="inline-flex items-center gap-1"><MapPin class="h-3.5 w-3.5" />{ev.location}</span>
													{/if}
													{#if ev.note}
														<span>{ev.note}</span>
													{/if}
												</div>
											</div>
										</li>
									{/each}
								</ol>
							</div>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2 rounded-[12px] border border-border bg-field p-3 text-[11px] text-muted-foreground">
					<Truck class="h-4 w-4 shrink-0" />
					<span>Courier: <b class="text-foreground">{shipment.courier}</b> • Resi <span class="mono">{shipment.trackingNumber}</span></span>
				</div>
			</div>
		</div>
	</div>
{/if}
