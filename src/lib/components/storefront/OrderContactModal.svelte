<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';

	interface Props {
		open: boolean;
		orderCode: string;
		title?: string;
		description?: string;
		getHref: (name: string, note: string) => string;
		onProceed: (detail: { name: string; note: string }) => void;
		onClose: () => void;
	}

	let {
		open,
		orderCode,
		title = 'Lengkapi data pesanan',
		description = 'Nama dan catatan akan dikirim bersama kode pesanan ke WhatsApp.',
		getHref,
		onProceed,
		onClose
	}: Props = $props();

	let name = $state('');
	let note = $state('');
	let showError = $state(false);

	let waHref = $derived(getHref(name.trim(), note.trim()));
	let canProceed = $derived(name.trim().length > 0);

	function proceed(e: MouseEvent) {
		const trimmed = name.trim();
		if (!trimmed) {
			e.preventDefault();
			showError = true;
			return;
		}
		onProceed({ name: trimmed, note: note.trim() });
		// allow default navigation on the <a> to wa.me
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<div class="w-full max-w-[440px] border border-brand-border bg-white shadow-[0_20px_60px_rgba(36,36,36,0.18)]">
			<div class="flex items-start justify-between gap-4 border-b border-brand-border px-5 py-4">
				<div>
					<h3 class="text-[14px] font-semibold text-brand-ink">{title}</h3>
					{#if description}
						<p class="mt-1 text-[12px] leading-5 text-brand-muted">{description}</p>
					{/if}
					<div class="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#C7EBDB] bg-[#F0FAF6] px-2.5 py-1">
						<span class="text-[10px] font-semibold tracking-[0.08em] text-[#1A7A52] uppercase">Kode pesanan</span>
						<span class="font-mono text-[12px] font-semibold text-[#1A7A52]">{orderCode}</span>
					</div>
				</div>
				<button
					type="button"
					class="p-1 text-brand-muted hover:text-brand-ink"
					aria-label="Tutup"
					onclick={onClose}
				>
					<X class="h-4 w-4" />
				</button>
			</div>
			<div class="space-y-4 px-5 py-4">
				<div>
					<Label for="order-name" class="text-[11px] font-semibold tracking-[0.08em] text-brand-muted uppercase">Nama pembeli</Label>
					<Input
						id="order-name"
						class="mt-1.5"
						placeholder="Nama kamu"
						bind:value={name}
						oninput={() => {
							if (name.trim()) showError = false;
						}}
						required
					/>
					{#if showError && !canProceed}
						<p class="mt-1 text-[11px] text-[#A33A37]">Nama pembeli wajib diisi.</p>
					{/if}
				</div>
				<div>
					<Label for="order-note" class="text-[11px] font-semibold tracking-[0.08em] text-brand-muted uppercase">Catatan (opsional)</Label>
					<Textarea
						id="order-note"
						class="mt-1.5"
						rows={3}
						placeholder="Contoh: alamat, permintaan khusus, atau waktu kirim"
						bind:value={note}
					/>
				</div>
				<div class="rounded-[8px] border border-brand-border bg-[#FBFBFA] p-3 text-[11px] leading-5 text-brand-muted">
					Kode pesanan akan dikirim bersama pesan ini ke WhatsApp dan tercatat untuk diverifikasi admin.
				</div>
				<div class="flex gap-2 pt-1">
					<a
						href={waHref}
						target="_blank"
						rel="noopener"
						class="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90 {canProceed ? '' : 'pointer-events-none opacity-50'}"
						aria-disabled={!canProceed}
						onclick={proceed}
					>
						Lanjut ke WhatsApp
					</a>
					<Button type="button" variant="outline" class="flex-1" onclick={onClose}>Batal</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
