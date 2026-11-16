<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { AlertTriangle, FileQuestion, RotateCcw } from '@lucide/svelte';

	const status = $derived(page.status);
	const isNotFound = $derived(status === 404);
	const title = $derived(isNotFound ? 'Halaman tidak ditemukan' : 'Gagal memuat data');
	const description = $derived(
		isNotFound
			? 'Halaman yang kamu cari tidak tersedia atau sudah dipindahkan.'
			: (page.error?.message ?? 'Terjadi masalah saat memuat data. Coba muat ulang halaman.')
	);

	async function retry() {
		await invalidateAll();
		await goto(resolve('/'));
	}
</script>

<div class="flex min-h-[60vh] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md text-center">
		<div
			class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted"
		>
			{#if isNotFound}
				<FileQuestion class="h-6 w-6 text-muted-foreground" />
			{:else}
				<AlertTriangle class="h-6 w-6 text-muted-foreground" />
			{/if}
		</div>
		<p class="mono mb-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
			{status}
		</p>
		<h1 class="font-display text-[22px] font-semibold text-foreground">{title}</h1>
		<p class="mt-2 text-[13px] text-muted-foreground">{description}</p>
		<div class="mt-6 flex items-center justify-center gap-2">
			{#if !isNotFound}
				<Button class="gap-2" onclick={retry}>
					<RotateCcw class="h-4 w-4" /> Coba lagi
				</Button>
			{/if}
			<Button variant={isNotFound ? 'default' : 'outline'} href={resolve('/')}>
				Ke beranda
			</Button>
		</div>
	</div>
</div>
