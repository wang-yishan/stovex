<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Download, FileJson, FileSpreadsheet, Upload } from '@lucide/svelte';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import ProductForm from '#lib/admin/components/ProductForm.svelte';
	import ImportQueue from '#lib/admin/components/ImportQueue.svelte';
	import { emptyProduct } from '#lib/admin/data.ts';
	import { downloadXlsxTemplate, parseJson, parseXlsx } from '#lib/admin/import/parse.ts';
	import type { Product } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';

	type Tab = 'inputs' | 'xlsx' | 'json';
	let tab = $state<Tab>('inputs');

	let queue = $state<Product[] | null>(null);
	let importError = $state('');
	let jsonText = $state('');
	let xlsxInput: HTMLInputElement | null = null;
	let jsonInput: HTMLInputElement | null = null;

	const jsonTemplate = JSON.stringify(
		[
			{
				name: 'Everyday Canvas Tote',
				slug: 'everyday-canvas-tote',
				basePrice: 890000,
				compareAtPrice: 1150000,
				sku: 'ECT-BGE-M',
				stock: 18,
				lowStockThreshold: 5,
				category: 'Tote',
				shortDescription: 'Lightweight canvas tote for daily essentials.',
				fullDescription: 'Organic canvas tote with reinforced handles and an interior pocket.',
				material: 'Organic cotton canvas',
				featured: true,
				trackInventory: true,
				seoTitle: 'Everyday Canvas Tote',
				seoDescription: 'Shop the Everyday Canvas Tote in organic cotton.'
			},
			{
				name: 'Mini Shoulder Bag Cream',
				slug: 'mini-shoulder-bag-cream',
				basePrice: 1240000,
				compareAtPrice: null,
				sku: 'MSB-CRM-OS',
				stock: 3,
				lowStockThreshold: 5,
				category: 'Shoulder',
				shortDescription: 'Compact shoulder bag with a chain strap.',
				fullDescription: 'Cream textured mini shoulder bag with interior card slots.',
				material: 'Textured leather',
				featured: false,
				trackInventory: true,
				seoTitle: '',
				seoDescription: ''
			},
			{
				name: 'Crossbody Classic Black',
				slug: '',
				basePrice: 950000,
				compareAtPrice: 1100000,
				sku: 'CCB-BLK-S',
				stock: 0,
				lowStockThreshold: 3,
				category: 'Crossbody',
				shortDescription: 'Classic black crossbody for everyday use.',
				fullDescription: 'Pebbled leather crossbody with adjustable strap and zip closure.',
				material: 'Pebbled leather',
				featured: false,
				trackInventory: true,
				seoTitle: '',
				seoDescription: ''
			}
		],
		null,
		2
	);
	let jsonCopied = $state(false);

	async function copyJsonTemplate() {
		try {
			await navigator.clipboard.writeText(jsonTemplate);
			jsonCopied = true;
			setTimeout(() => (jsonCopied = false), 1500);
		} catch {
			// Fallback: load into textarea so the user can copy manually.
			jsonText = jsonTemplate;
		}
	}

	function loadJsonTemplate() {
		jsonText = jsonTemplate;
		importError = '';
	}

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
				<div>
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F5F5F4]">
						<FileSpreadsheet class="h-5 w-5" />
					</div>
					<div class="min-w-0">
						<h3 class="text-[14px] font-semibold">Import from spreadsheet</h3>
						<p class="mt-1 text-[12px] text-[#5A5A5A]">
							Download the template, fill in your products, then upload it back. Each row becomes a
							product slide you can review and complete — nothing is rejected for missing data. Images
							are added later via Edit.
						</p>
						<p class="mt-2 text-[11px] text-[#636363]">
							Template includes 3 example rows and an Info sheet marking each column as
							<strong>Required</strong> or <strong>Optional</strong> (name and basePrice required;
							slug auto-generated from name if empty). Keep the header row unchanged when you
							re-upload.
						</p>
						<input
							{@attach (el) => {
								xlsxInput = el as HTMLInputElement;
							}}
							type="file"
							accept=".xlsx,.xls,.csv"
							class="hidden"
							onchange={onXlsx}
						/>
						<div class="mt-4 flex flex-wrap items-center gap-2">
							<Button variant="outline" type="button" onclick={downloadXlsxTemplate}>
								<Download class="h-4 w-4" /> Download template
							</Button>
							<Button variant="default" type="button" onclick={() => xlsxInput?.click()}>
								<Upload class="h-4 w-4" /> Upload filled file
							</Button>
						</div>
						{#if importError}<p class="mt-2 text-[12px] text-[#D9534F]">{importError}</p>{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="overflow-hidden rounded-[12px] border bg-white p-5" style="border-color: var(--border);">
				<div class="min-w-0">
					<div class="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F5F5F4]">
						<FileJson class="h-5 w-5" />
					</div>
					<div class="min-w-0">
						<h3 class="text-[14px] font-semibold">Import from JSON</h3>
						<p class="mt-1 text-[12px] text-[#5A5A5A]">
							Copy the template, fill in your products, then paste it back (or upload a .json file).
							Every entry becomes a review slide — missing fields are filled in the form, nothing is
							rejected.
						</p>
						<p class="mt-2 break-words text-[11px] text-[#636363]">
							Template includes 3 example rows with all properties.
							<strong>Required:</strong> <code>name</code>, <code>basePrice</code> (&gt; 0).
							<strong>Optional:</strong> <code>slug</code> (auto from name if empty),
							<code>compareAtPrice</code>, <code>sku</code>, <code>stock</code>,
							<code>lowStockThreshold</code>, <code>category</code>, <code>shortDescription</code>,
							<code>fullDescription</code>, <code>material</code>, <code>featured</code>,
							<code>trackInventory</code>, <code>seoTitle</code>, <code>seoDescription</code>. Images are
							added later via Edit.
						</p>
						<div class="mt-3 min-w-0">
							<Textarea
								rows={12}
								font="mono"
								class="w-full max-w-full"
								bind:value={jsonText}
								placeholder={jsonTemplate}
							></Textarea>
						</div>
						<input
							{@attach (el) => {
								jsonInput = el as HTMLInputElement;
							}}
							type="file"
							accept=".json,application/json"
							class="hidden"
							onchange={onJsonFile}
						/>
						<div class="mt-3 flex flex-wrap items-center gap-2">
							<Button variant="default" type="button" onclick={buildJsonQueue}>
								Review &amp; import
							</Button>
							<Button variant="outline" type="button" onclick={loadJsonTemplate}>
								Use template
							</Button>
							<Button variant="outline" type="button" onclick={copyJsonTemplate}>
								{jsonCopied ? 'Copied' : 'Copy template'}
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
