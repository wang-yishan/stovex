<script lang="ts">
	import { innerWidth } from 'svelte/reactivity/window';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import SearchInput from '#lib/admin/components/SearchInput.svelte';
	import Modal from '#lib/admin/components/Modal.svelte';
	import ConfirmModal from '#lib/admin/components/ConfirmModal.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { formatIDR } from '#lib/admin/data.ts';
	import type { Order, OrderStatus } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import {
		BadgeCheck,
		Ban,
		Calendar,
		CheckCircle2,
		ClipboardList,
		Clock,
		Copy,
		Eye,
		MessageCircle,
		Package,
		ShoppingBag,
		XCircle
	} from '@lucide/svelte';

	const isMobile = $derived((innerWidth.current ?? 1024) < 768);

	let search = $state('');
	let statusFilter = $state<'all' | OrderStatus>('all');
	let sourceFilter = $state<'all' | 'product' | 'cart'>('all');
	let dateFrom = $state('');
	let dateTo = $state('');

	let selected = $state<Order | null>(null);
	let verifyTarget = $state<Order | null>(null);
	let cancelTarget = $state<Order | null>(null);
	let adminNote = $state('');

	function inRange(iso: string): boolean {
		if (!dateFrom && !dateTo) return true;
		const day = iso.slice(0, 10);
		if (dateFrom && day < dateFrom) return false;
		if (dateTo && day > dateTo) return false;
		return true;
	}

	let filtered = $derived.by(() => {
		const q = search.toLowerCase().trim();
		return [...admin.orders]
			.filter((o) => {
				const hay = [
					o.code,
					o.customerName,
					o.customerNote,
					...o.items.map((i) => `${i.productName} ${i.sku} ${i.variant ?? ''}`)
				]
					.join(' ')
					.toLowerCase();
				const okQ = !q || hay.includes(q);
				const okS = statusFilter === 'all' || o.status === statusFilter;
				const okSrc = sourceFilter === 'all' || o.source === sourceFilter;
				return okQ && okS && okSrc && inRange(o.createdAt);
			})
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	});

	let counts = $derived.by(() => {
		const all = admin.orders;
		const pending = all.filter((o) => o.status === 'pending');
		const verified = all.filter((o) => o.status === 'verified');
		const cancelled = all.filter((o) => o.status === 'cancelled');
		return {
			pending: pending.length,
			verified: verified.length,
			cancelled: cancelled.length,
			pendingValue: pending.reduce((s, o) => s + o.total, 0),
			verifiedValue: verified.reduce((s, o) => s + o.total, 0),
			total: all.length
		};
	});

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function statusLabel(status: OrderStatus): string {
		return status === 'pending' ? 'Menunggu verifikasi' : status === 'verified' ? 'Terverifikasi' : 'Dibatalkan';
	}

	function statusClass(status: OrderStatus): string {
		if (status === 'verified') return 'border-[#C7EBDB] bg-[#F0FAF6] text-[#1A7A52]';
		if (status === 'cancelled') return 'border-[#F2C2C0] bg-[#FFF0F0] text-[#A33A37]';
		return 'border-[#F3D9A0] bg-[#FFF8E6] text-[#8A6A24]';
	}

	function itemsSummary(order: Order): string {
		const first = order.items[0];
		if (!first) return '—';
		const extra = order.items.length > 1 ? ` +${order.items.length - 1} item` : '';
		return `${first.productName}${first.variant ? ` (${first.variant})` : ''}${extra}`;
	}

	function openDetail(order: Order) {
		selected = order;
	}

	async function confirmVerify() {
		if (!verifyTarget) return;
		await admin.setOrderStatus(verifyTarget.id, 'verified', adminNote);
		verifyTarget = null;
		if (selected?.id) selected = admin.orders.find((o) => o.id === selected!.id) ?? null;
		adminNote = '';
	}

	async function confirmCancel() {
		if (!cancelTarget) return;
		await admin.setOrderStatus(cancelTarget.id, 'cancelled', adminNote);
		cancelTarget = null;
		if (selected?.id) selected = admin.orders.find((o) => o.id === selected!.id) ?? null;
		adminNote = '';
	}

	async function copyMessage(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			admin.showToast('Pesan WhatsApp disalin', 'success');
		} catch {
			admin.showToast('Gagal menyalin pesan', 'error');
		}
	}

	function openVerify(order: Order) {
		verifyTarget = order;
		cancelTarget = null;
		adminNote = '';
	}

	function openCancel(order: Order) {
		cancelTarget = order;
		verifyTarget = null;
		adminNote = '';
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Orders' }]}
	title="Orders"
	subtitle="Monitor pesanan WhatsApp, pilah, dan verifikasi oleh admin."
	mobileSubtitle="Monitoring & verifikasi pesanan WA"
>
	{#snippet actions()}
		<div class="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
			<MessageCircle class="h-3.5 w-3.5" />
			<span>{counts.pending} menunggu verifikasi</span>
		</div>
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] {isMobile ? 'px-4 py-4 pb-[112px]' : 'px-4 py-6 md:px-6 lg:px-8'}">
	<!-- KPIs -->
	<div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border bg-[#FFF8E6]" style="border-color: #F3D9A0;">
				<Clock class="h-5 w-5 text-[#8A6A24]" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.pending}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Menunggu verifikasi</div>
			<div class="mt-1 text-[11px] font-medium text-foreground">{formatIDR(counts.pendingValue)}</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border bg-[#F0FAF6]" style="border-color: #C7EBDB;">
				<BadgeCheck class="h-5 w-5 text-[#1A7A52]" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.verified}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Terverifikasi</div>
			<div class="mt-1 text-[11px] font-medium text-foreground">{formatIDR(counts.verifiedValue)}</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border bg-[#FFF0F0]" style="border-color: #F2C2C0;">
				<XCircle class="h-5 w-5 text-[#A33A37]" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.cancelled}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Dibatalkan</div>
		</div>
		<div class="rounded-[12px] border border-border bg-card p-4">
			<div class="mb-2 flex h-9 w-9 items-center justify-center rounded-[8px] border border-border bg-muted">
				<ClipboardList class="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
			</div>
			<div class="text-[24px] leading-none font-semibold tracking-tight">{counts.total}</div>
			<div class="mt-1 text-[11px] text-muted-foreground">Total pesanan</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="mb-4 flex flex-col gap-3 rounded-[12px] border border-border bg-card p-3 md:p-4">
		<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<SearchInput bind:value={search} placeholder="Cari kode, nama pembeli, produk, SKU..." />
			<div class="flex flex-wrap gap-2 [&>div]:w-full sm:[&>div]:w-auto">
				<NativeSelect shape="pill" class="font-medium" bind:value={statusFilter}>
					<option value="all">Semua status</option>
					<option value="pending">Menunggu verifikasi</option>
					<option value="verified">Terverifikasi</option>
					<option value="cancelled">Dibatalkan</option>
				</NativeSelect>
				<NativeSelect shape="pill" class="font-medium" bind:value={sourceFilter}>
					<option value="all">Semua sumber</option>
					<option value="cart">Keranjang</option>
					<option value="product">Produk langsung</option>
				</NativeSelect>
			</div>
		</div>
		<div class="flex flex-wrap items-end gap-2">
			<div>
				<Label for="date-from" class="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Dari</Label>
				<Input id="date-from" type="date" class="mt-1 h-9 w-[150px]" bind:value={dateFrom} />
			</div>
			<div>
				<Label for="date-to" class="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Sampai</Label>
				<Input id="date-to" type="date" class="mt-1 h-9 w-[150px]" bind:value={dateTo} />
			</div>
			{#if dateFrom || dateTo}
				<Button variant="outline" size="sm" onclick={() => { dateFrom = ''; dateTo = ''; }}>Reset tanggal</Button>
			{/if}
		</div>
	</div>

	<!-- List -->
	<div class="overflow-hidden rounded-[12px] border border-border bg-card">
		{#if filtered.length === 0}
			<div class="px-6 py-16 text-center">
				<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
					<ShoppingBag class="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 class="text-[14px] font-semibold">Belum ada pesanan</h3>
				<p class="mt-1 text-[12px] text-muted-foreground">
					{admin.orders.length === 0
						? 'Pesanan WhatsApp dari storefront akan muncul di sini untuk diverifikasi.'
						: 'Coba ubah pencarian atau filter.'}
				</p>
			</div>
		{:else if !isMobile}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="border-b border-border bg-field text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
							<th class="px-5 py-2.5">Kode / Tanggal</th>
							<th class="px-5 py-2.5">Pembeli</th>
							<th class="px-5 py-2.5">Sumber</th>
							<th class="px-5 py-2.5">Ringkasan item</th>
							<th class="px-5 py-2.5 text-right">Total</th>
							<th class="px-5 py-2.5">Status</th>
							<th class="px-5 py-2.5 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filtered as o (o.id)}
							<tr class="transition-colors hover:bg-muted">
								<td class="px-5 py-3">
									<div class="text-[13px] font-medium">{o.code}</div>
									<div class="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
										<Calendar class="h-3 w-3" /> {formatDate(o.createdAt)}
									</div>
								</td>
								<td class="px-5 py-3">
									<div class="text-[12px] font-medium">{o.customerName || '—'}</div>
									{#if o.customerNote}
										<div class="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">{o.customerNote}</div>
									{/if}
								</td>
								<td class="px-5 py-3 text-[12px] text-muted-foreground">
									{o.source === 'cart' ? 'Keranjang' : 'Produk langsung'}
								</td>
								<td class="px-5 py-3">
									<div class="max-w-[260px] truncate text-[12px]">{itemsSummary(o)}</div>
									<div class="text-[11px] text-muted-foreground">{o.items.length} item</div>
								</td>
								<td class="px-5 py-3 text-right text-[13px] font-medium">{formatIDR(o.total)}</td>
								<td class="px-5 py-3">
									<span class={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(o.status)}`}>
										{statusLabel(o.status)}
									</span>
								</td>
								<td class="px-5 py-3">
									<div class="flex justify-end gap-1">
										<Button variant="outline" size="sm" class="gap-1.5 px-2.5" onclick={() => openDetail(o)}>
											<Eye class="h-3.5 w-3.5" /> Detail
										</Button>
										{#if o.status === 'pending'}
											<Button size="sm" class="gap-1.5 bg-[#1A7A52] px-2.5 text-white hover:bg-[#166646]" onclick={() => openVerify(o)}>
												<CheckCircle2 class="h-3.5 w-3.5" /> Verifikasi
											</Button>
											<Button variant="outline" size="icon-sm" aria-label="Batalkan" onclick={() => openCancel(o)}>
												<Ban class="h-3.5 w-3.5 text-[#A33A37]" />
											</Button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each filtered as o (o.id)}
					<div class="p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-[13px] font-semibold">{o.code}</span>
									<span class={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(o.status)}`}>
										{statusLabel(o.status)}
									</span>
								</div>
								<div class="mt-1 text-[12px] font-medium">{o.customerName || '—'}</div>
								<div class="mt-0.5 text-[11px] text-muted-foreground">{formatDate(o.createdAt)}</div>
								<div class="mt-1 text-[12px] text-foreground">{itemsSummary(o)}</div>
								<div class="mt-0.5 text-[12px] font-semibold">{formatIDR(o.total)}</div>
							</div>
						</div>
						<div class="mt-3 flex flex-wrap gap-2">
							<Button variant="outline" size="sm" onclick={() => openDetail(o)}>Detail</Button>
							{#if o.status === 'pending'}
								<Button size="sm" class="bg-[#1A7A52] text-white hover:bg-[#166646]" onclick={() => openVerify(o)}>Verifikasi</Button>
								<Button variant="outline" size="sm" onclick={() => openCancel(o)}>Batalkan</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<p class="mt-3 text-[11px] text-muted-foreground">
		Menampilkan {filtered.length} dari {counts.total} pesanan • pesanan masuk otomatis saat checkout WhatsApp dan menunggu verifikasi admin.
	</p>
</div>

{#if selected}
	{@const cur = admin.orders.find((o) => o.id === selected.id) ?? selected}
	<Modal title="Detail pesanan" maxW={640}>
		<div class="mt-2 flex flex-wrap items-center gap-2">
			<span class="text-[13px] font-semibold">{cur.code}</span>
			<span class={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(cur.status)}`}>
				{statusLabel(cur.status)}
			</span>
			<span class="text-[11px] text-muted-foreground">{cur.source === 'cart' ? 'Keranjang' : 'Produk langsung'}</span>
		</div>

		<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="rounded-[10px] border border-border bg-field p-3">
				<p class="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Pembeli</p>
				<p class="mt-1 text-[13px] font-medium">{cur.customerName || '—'}</p>
				<p class="mt-1 text-[11px] text-muted-foreground">Dibuat: {formatDate(cur.createdAt)}</p>
				{#if cur.verifiedAt}
					<p class="mt-0.5 text-[11px] text-[#1A7A52]">Diverifikasi: {formatDate(cur.verifiedAt)}</p>
				{/if}
				{#if cur.customerNote}
					<p class="mt-2 text-[11px] text-muted-foreground">Catatan pembeli:</p>
					<p class="text-[12px]">{cur.customerNote}</p>
				{/if}
				{#if cur.adminNote}
					<p class="mt-2 text-[11px] text-muted-foreground">Catatan admin:</p>
					<p class="text-[12px]">{cur.adminNote}</p>
				{/if}
			</div>
			<div class="rounded-[10px] border border-border bg-field p-3">
				<p class="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Ringkasan</p>
				<p class="mt-1 text-[12px] text-muted-foreground">{cur.items.length} item</p>
				<p class="mt-1 text-[18px] font-semibold">{formatIDR(cur.total)}</p>
			</div>
		</div>

		<div class="mt-4">
			<p class="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Item pesanan</p>
			<div class="overflow-hidden rounded-[10px] border border-border">
				<table class="w-full text-left text-[12px]">
					<thead>
						<tr class="border-b border-border bg-field text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
							<th class="px-3 py-2">Produk</th>
							<th class="px-3 py-2">SKU / Varian</th>
							<th class="px-3 py-2 text-right">Qty</th>
							<th class="px-3 py-2 text-right">Harga</th>
							<th class="px-3 py-2 text-right">Subtotal</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each cur.items as item, i (item.productId + i)}
							<tr>
								<td class="px-3 py-2 font-medium">{item.productName}</td>
								<td class="px-3 py-2 text-muted-foreground">{item.sku || '—'}{item.variant ? ` · ${item.variant}` : ''}</td>
								<td class="px-3 py-2 text-right">{item.quantity}</td>
								<td class="px-3 py-2 text-right">{formatIDR(item.unitPrice)}</td>
								<td class="px-3 py-2 text-right font-medium">{formatIDR(item.subtotal)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		{#if cur.message}
			<div class="mt-4">
				<div class="mb-2 flex items-center justify-between gap-2">
					<p class="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Pesan WhatsApp</p>
					<Button variant="outline" size="xs" class="gap-1.5" onclick={() => copyMessage(cur.message)}>
						<Copy class="h-3.5 w-3.5" /> Salin
					</Button>
				</div>
				<pre class="max-h-52 overflow-auto whitespace-pre-wrap rounded-[10px] border border-border bg-field p-3 text-[11px] leading-5 text-foreground">{cur.message}</pre>
			</div>
		{/if}

		<div class="mt-4 flex flex-wrap gap-2">
			{#if cur.status === 'pending'}
				<Button class="gap-1.5 bg-[#1A7A52] text-white hover:bg-[#166646]" onclick={() => { selected = null; openVerify(cur); }}>
					<CheckCircle2 class="h-4 w-4" /> Verifikasi
				</Button>
				<Button variant="outline" class="gap-1.5" onclick={() => { selected = null; openCancel(cur); }}>
					<Ban class="h-4 w-4 text-[#A33A37]" /> Batalkan
				</Button>
			{/if}
			<Button variant="outline" onclick={() => (selected = null)}>Tutup</Button>
		</div>
	</Modal>
{/if}

{#if verifyTarget}
	<Modal title="Verifikasi pesanan" maxW={440}>
		<p class="mt-1 text-[12px] text-muted-foreground">
			Verifikasi <b>{verifyTarget.code}</b> dari <b>{verifyTarget.customerName || 'pembeli'}</b>? Status akan menjadi terverifikasi.
		</p>
		<div class="mt-3">
			<Label for="verify-note" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Catatan admin (opsional)</Label>
			<Textarea id="verify-note" class="mt-1" rows={3} bind:value={adminNote} placeholder="Contoh: sudah konfirmasi via WA" />
		</div>
		<div class="mt-4 flex gap-2">
			<Button class="flex-1 bg-[#1A7A52] text-white hover:bg-[#166646]" onclick={confirmVerify}>Verifikasi</Button>
			<Button variant="outline" class="flex-1" onclick={() => (verifyTarget = null)}>Batal</Button>
		</div>
	</Modal>
{/if}

{#if cancelTarget}
	<Modal title="Batalkan pesanan" maxW={440}>
		<p class="mt-1 text-[12px] text-muted-foreground">
			Batalkan <b>{cancelTarget.code}</b>? Tindakan ini menandai pesanan sebagai dibatalkan.
		</p>
		<div class="mt-3">
			<Label for="cancel-note" class="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Alasan / catatan (opsional)</Label>
			<Textarea id="cancel-note" class="mt-1" rows={3} bind:value={adminNote} placeholder="Contoh: stok habis / pembeli batal" />
		</div>
		<div class="mt-4 flex gap-2">
			<Button variant="destructive" class="flex-1" onclick={confirmCancel}>Batalkan pesanan</Button>
			<Button variant="outline" class="flex-1" onclick={() => (cancelTarget = null)}>Kembali</Button>
		</div>
	</Modal>
{/if}
