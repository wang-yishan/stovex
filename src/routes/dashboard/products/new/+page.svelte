<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { FileJson, FileSpreadsheet, Upload } from '@lucide/svelte';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import ImportQueue from '#lib/admin/components/ImportQueue.svelte';
	import { emptyProduct } from '#lib/admin/data.ts';
	import { parseJson, parseXlsx } from '#lib/admin/import/parse.ts';
	import type { Product } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';

	type Tab = 'inputs' | 'xlsx' | 'json';
	let tab = $state<Tab>('inputs');

	let queue = $state<Product[] | null>(null);
	let importError = $state('');
	let jsonText = $state('');
	let xlsxInput = $state<HTMLInputElement | null>(null);
	let jsonInput = $state<HTMLInputElement | null>(null);

	function resetQueue() {
		queue = null;
		importError = '';
	}

	async function onXlsx(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		importError = '';
		try {
			const products = await parseXlsx(file);
			queue = products.length > 0 ? products : null;
			if (!queue) importError = 'No rows found in the spreadsheet.';
		} catch {
			// Never reject: fall back to a single empty slide.
			queue = [emptyProduct()];
		} finally {
			input.value = '';
		}
	}

	function buildJsonQueue() {
		importError = '';
		if (!jsonText.trim()) {
			importError = 'Paste JSON or upload a .json file first.';
			return;
		}
		const products = parseJson(jsonText);
		queue = products.length > 0 ? products : [emptyProduct()];
	}

	async function onJsonFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		try {
			jsonText = await file.text();
			buildJsonQueue();
		} catch {
			queue = [emptyProduct()];
		} finally {
			input.value = '';
		}
	}

	const tabs: { id: Tab; label: string }[] = [
		{ id: 'inputs', label: 'Inputs' },
		{ id: 'xlsx', label: 'XLSX' },
		{ id: 'json', label: 'JSON' }
	];
</script>

<Topbar
	crumbs={[
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Products', href: '/dashboard/products' },
		{ label: 'New' }
	]}
	title="New Product"
	subtitle="Create catalog items manually or import from XLSX/JSON."
	mobileSubtitle="Manage catalog • IDR pricing"
>
	{#snippet actions()}
		{#if queue}
			<Button variant="outline" class="shrink-0 px-4" type="button" onclick={resetQueue}>
				Back to import
			</Button>
		{:else}
			<Button
				variant="outline"
				class="shrink-0 px-4"
				onclick={() => void goto(resolve('/dashboard/products'))}
			>
				Cancel
			</Button>
		{/if}
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-4 pb-6 md:px-6 lg:px-8">
	{#if !queue}
		<div class="mb-4 flex w-fit items-center gap-1 rounded-[10px] border bg-white p-1" style="border-color: var(--border);">
			{#each tabs as t (t.id)}
				<button
					type="button"
					class="rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition {tab === t.id
						? 'bg-[#242424] text-white'
						: 'text-[#5A5A5A] hover:text-[#242424]'}"
					onclick={() => (tab = t.id)}
				>
					{t.label}
				</button>
			{/each}
		</div>

		{#if tab === 'inputs'}
			<ProductForm product={emptyProduct()} mode="create" />
		{:else if tab === 'xlsx'}
			<div class="rounded-[12px] border bg-white p-5" style="border-color: var(--border);">
				<div class="flex items-start gap-3">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F4]">
						<FileSpreadsheet class="h-5 w-5" />
					</div>
					<div class="min-w-0 flex-1">
						<h3 class="text-[14px] font-semibold">Import from spreadsheet</h3>
						<p class="mt-1 text-[12px] text-[#5A5A5A]">
							Upload an .xlsx/.xls/.csv file. Each row becomes a product slide you can review and
							complete — nothing is rejected for missing data. Images are added later via Edit.
						</p>
						<p class="mt-2 text-[11px] text-[#636363]">
							Recognised columns (flexible): name, slug, price, compare_at, sku, stock, low_stock,
							category, description, short_description, material, featured, track_inventory, seo_title,
							seo_description.
						</p>
						<input
							bind:this={xlsxInput}
							type="file"
							accept=".xlsx,.xls,.csv"
							class="hidden"
							onchange={onXlsx}
						/>
						<div class="mt-4 flex items-center gap-2">
							<Button variant="default" type="button" onclick={() => xlsxInput?.click()}>
								<Upload class="h-4 w-4" /> Choose file
							</Button>
						</div>
						{#if importError}<p class="mt-2 text-[12px] text-[#D9534F]">{importError}</p>{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-[12px] border bg-white p-5" style="border-color: var(--border);">
				<div class="flex items-start gap-3">
					<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F4]">
						<FileJson class="h-5 w-5" />
					</div>
					<div class="min-w-0 flex-1">
						<h3 class="text-[14px] font-semibold">Import from JSON</h3>
						<p class="mt-1 text-[12px] text-[#5A5A5A]">
							Paste a JSON object or array, or upload a .json file. Every entry becomes a review slide
							— missing fields are filled in the form, nothing is rejected.
						</p>
						<div class="mt-3">
							<Textarea
								rows={10}
								font="mono"
								bind:value={jsonText}
								placeholder={'[\n  { "name": "Canvas Tote", "price": 890000, "sku": "TOTE-01" }\n]'}
							></Textarea>
						</div>
						<input
							bind:this={jsonInput}
							type="file"
							accept=".json,application/json"
							class="hidden"
							onchange={onJsonFile}
						/>
						<div class="mt-3 flex flex-wrap items-center gap-2">
							<Button variant="default" type="button" onclick={buildJsonQueue}>
								Review &amp; import
							</Button>
							<Button variant="outline" type="button" onclick={() => jsonInput?.click()}>
								<Upload class="h-4 w-4" /> Upload .json
							</Button>
						</div>
						{#if importError}<p class="mt-2 text-[12px] text-[#D9534F]">{importError}</p>{/if}
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<ImportQueue products={queue} />
	{/if}
</div>
