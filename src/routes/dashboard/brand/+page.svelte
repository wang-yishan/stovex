<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { uploadImages } from '#lib/admin/api.ts';
	import { SEED_BRAND } from '#lib/admin/data.ts';
	import {
		BRAND_COLOR_ROLES,
		BRAND_FONT_OPTIONS,
		contrastRatio,
		formatRatio,
		gradeRatio,
		meetsAaText,
		type BrandColorRole
	} from '#lib/admin/brand.ts';
	import type { BrandFontKey, BrandIdentity } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { Image, Palette, RotateCcw, Save, Type } from '@lucide/svelte';

	/**
	 * A draft copy of the saved brand — edits land here until Save.
	 * `$state.snapshot` unwraps the reactive proxy: `structuredClone` cannot
	 * clone a proxy and would throw a DataCloneError in the browser.
	 */
	let draft = $state<BrandIdentity>($state.snapshot(admin.settings.brand) as BrandIdentity);
	let saving = $state(false);
	let uploading = $state<'logo' | 'favicon' | null>(null);

	// Unsaved edits: the draft differs from what the server holds. After a
	// successful save the store catches up, so this flips back to false.
	let dirty = $derived(JSON.stringify(draft) !== JSON.stringify(admin.settings.brand));

	const surface = $derived(draft.colors.surface);

	/** Contrast of a colour role against the page surface. */
	function ratioFor(role: BrandColorRole): number {
		return contrastRatio(draft.colors[role], surface);
	}

	/** Roles where the colour is used as body copy. */
	const TEXT_ROLES: BrandColorRole[] = ['ink', 'muted'];

	function setColor(role: BrandColorRole, value: string) {
		draft.colors[role] = value;
	}

	function setFont(role: 'display' | 'body', value: BrandFontKey) {
		draft.fonts[role] = value;
	}

	function setField<K extends keyof BrandIdentity>(key: K, value: BrandIdentity[K]) {
		draft[key] = value;
	}

	async function uploadImage(kind: 'logo' | 'favicon', event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = kind;
		try {
			const [uploaded] = await uploadImages([file]);
			if (uploaded) {
				setField(kind === 'logo' ? 'logoUrl' : 'faviconUrl', uploaded.url);
				admin.showToast(`${kind === 'logo' ? 'Logo' : 'Favicon'} uploaded`, 'success');
			}
		} catch (cause) {
			admin.showToast(cause instanceof Error ? cause.message : 'Upload failed', 'error');
		} finally {
			uploading = null;
			input.value = '';
		}
	}

	function clearImage(kind: 'logo' | 'favicon') {
		setField(kind === 'logo' ? 'logoUrl' : 'faviconUrl', '');
	}

	function resetToDefault() {
		// SEED_BRAND is a plain module constant — safe to clone directly.
		draft = structuredClone(SEED_BRAND);
	}

	async function save() {
		saving = true;
		await admin.saveSettings({ brand: draft });
		saving = false;
	}
</script>

<!--
	@component
	Brand Identity (ref): store name, wordmark, tagline, logo/favicon uploads,
	the merchant-editable palette (with live WCAG contrast checks), the display
	and body fonts, and a live storefront preview.
-->

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Brand Identity' }]}
	title="Brand Identity"
	subtitle="Store name, logo, palette and typography for the storefront."
	mobileSubtitle="Brand name • palette • fonts"
>
	{#snippet actions()}
		<Button variant="outline" onclick={resetToDefault} disabled={saving}>
			<RotateCcw class="h-4 w-4 shrink-0" />
			<span class="hidden sm:inline">Reset to default</span><span class="sm:hidden">Reset</span>
		</Button>
		<Button onclick={() => void save()} disabled={saving || !dirty}>
			<Save class="h-4 w-4 shrink-0" />
			<span class="hidden sm:inline">{saving ? 'Saving…' : 'Save brand'}</span><span
				class="sm:hidden">Save</span
			>
		</Button>
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
	<div class="grid gap-4 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<!-- Identity -->
			<section
				class="rounded-[12px] border bg-white p-4 md:p-5"
				style="border-color: var(--border);"
			>
				<div class="mb-4 flex items-center gap-2">
					<Palette class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Identity</h2>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="brand-name">Store name</Label>
						<Input
							id="brand-name"
							value={draft.name}
							placeholder="Bag Store"
							oninput={(e) => setField('name', e.currentTarget.value)}
						/>
						<p class="text-[11px] text-muted-foreground">
							Used in page copy, SEO titles, WhatsApp greetings and the footer.
						</p>
					</div>

					<div class="space-y-1.5">
						<Label for="brand-wordmark">Wordmark</Label>
						<Input
							id="brand-wordmark"
							value={draft.wordmark}
							placeholder="BAG STORE"
							oninput={(e) => setField('wordmark', e.currentTarget.value)}
						/>
						<p class="text-[11px] text-muted-foreground">
							The lockup in the storefront header and footer.
						</p>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<Label for="brand-tagline">Tagline</Label>
						<Input
							id="brand-tagline"
							value={draft.tagline}
							placeholder="Minimal bags, made to last"
							oninput={(e) => setField('tagline', e.currentTarget.value)}
						/>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<Label for="brand-domain">Store domain</Label>
						<Input
							id="brand-domain"
							value={draft.domain}
							placeholder="bagstore.example"
							oninput={(e) => setField('domain', e.currentTarget.value)}
						/>
						<p class="text-[11px] text-muted-foreground">
							Used for the product links inside WhatsApp messages.
						</p>
					</div>
				</div>
			</section>

			<!-- Logo & favicon -->
			<section
				class="rounded-[12px] border bg-white p-4 md:p-5"
				style="border-color: var(--border);"
			>
				<div class="mb-4 flex items-center gap-2">
					<Image class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Logo &amp; favicon</h2>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="brand-logo">Logo image</Label>
						<div
							class="flex items-center gap-3 rounded-[10px] border bg-[#F5F5F4] p-3"
							style="border-color: var(--border);"
						>
							<div
								class="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white"
							>
								{#if draft.logoUrl}
									<img src={draft.logoUrl} alt="" class="max-h-12 w-auto object-contain" />
								{:else}
									<span class="px-2 text-center text-[11px] text-[#636363]">No logo</span>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								<label
									class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted"
								>
									<Image class="h-3.5 w-3.5" />
									{uploading === 'logo' ? 'Uploading…' : 'Upload'}
									<input
										id="brand-logo"
										type="file"
										accept="image/png,image/jpeg,image/webp,image/svg+xml"
										class="sr-only"
										onchange={(e) => void uploadImage('logo', e)}
									/>
								</label>
								{#if draft.logoUrl}
									<Button variant="ghost" size="sm" onclick={() => clearImage('logo')}
										>Remove</Button
									>
								{/if}
							</div>
						</div>
						<p class="text-[11px] text-muted-foreground">
							Shown in the storefront header and footer. PNG, JPG, WebP or SVG.
						</p>
					</div>

					<div class="space-y-2">
						<Label for="brand-favicon">Favicon</Label>
						<div
							class="flex items-center gap-3 rounded-[10px] border bg-[#F5F5F4] p-3"
							style="border-color: var(--border);"
						>
							<div
								class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white"
							>
								{#if draft.faviconUrl}
									<img src={draft.faviconUrl} alt="" class="max-h-11 w-11 object-contain" />
								{:else}
									<span class="px-2 text-center text-[11px] text-[#636363]">None</span>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								<label
									class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted"
								>
									<Image class="h-3.5 w-3.5" />
									{uploading === 'favicon' ? 'Uploading…' : 'Upload'}
									<input
										id="brand-favicon"
										type="file"
										accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
										class="sr-only"
										onchange={(e) => void uploadImage('favicon', e)}
									/>
								</label>
								{#if draft.faviconUrl}
									<Button variant="ghost" size="sm" onclick={() => clearImage('favicon')}
										>Remove</Button
									>
								{/if}
							</div>
						</div>
						<p class="text-[11px] text-muted-foreground">
							Shown in the browser tab. Falls back to the bundled icon.
						</p>
					</div>
				</div>
			</section>

			<!-- Palette -->
			<section
				class="rounded-[12px] border bg-white p-4 md:p-5"
				style="border-color: var(--border);"
			>
				<div class="mb-4 flex items-center gap-2">
					<Palette class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Palette</h2>
				</div>

				<div class="space-y-3">
					{#each BRAND_COLOR_ROLES as role (role.key)}
						{@const value = draft.colors[role.key]}
						{@const ratio = ratioFor(role.key)}
						{@const isText = TEXT_ROLES.includes(role.key)}
						<div
							class="grid items-center gap-3 rounded-[10px] border bg-[#FBFBFA] p-3 sm:grid-cols-[1fr_auto_auto] sm:gap-4"
							style="border-color: var(--border);"
						>
							<div class="min-w-0">
								<div class="text-[12px] font-medium">{role.label}</div>
								<div class="truncate text-[11px] text-[#636363]">{role.hint}</div>
							</div>

							<div class="flex items-center gap-2">
								<input
									type="color"
									aria-label="{role.label} colour"
									class="h-9 w-11 shrink-0 cursor-pointer rounded-[8px] border bg-white p-1"
									style="border-color: var(--border);"
									{value}
									oninput={(e) => setColor(role.key, e.currentTarget.value)}
								/>
								<Input
									{value}
									aria-label="{role.label} hex"
									class="w-28 font-mono"
									oninput={(e) => setColor(role.key, e.currentTarget.value)}
								/>
							</div>

							<div class="flex items-center gap-2 sm:w-[132px] sm:justify-end">
								<span
									class="inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold {meetsAaText(
										ratio
									)
										? 'bg-[#EAF6F0] text-[#1A7A52]'
										: 'bg-[#FDF3E7] text-[#8A6A24]'}"
								>
									{formatRatio(ratio)} · {gradeRatio(ratio)}
								</span>
								{#if isText && !meetsAaText(ratio)}
									<span class="text-[11px] text-[#8A6A24]">Below AA for text</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<p class="mt-3 text-[11px] text-[#636363]">
					Ratios are measured against the page surface colour. Body copy needs 4.5:1 (AA); icons and
					borders need 3:1.
				</p>
			</section>

			<!-- Typography -->
			<section
				class="rounded-[12px] border bg-white p-4 md:p-5"
				style="border-color: var(--border);"
			>
				<div class="mb-4 flex items-center gap-2">
					<Type class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Typography</h2>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="brand-font-display">Display font</Label>
						<NativeSelect
							id="brand-font-display"
							class="[&>div]:w-full"
							value={draft.fonts.display}
							onchange={(e) => setFont('display', e.currentTarget.value as BrandFontKey)}
						>
							{#each BRAND_FONT_OPTIONS as font (font.key)}
								<option value={font.key}>{font.label}</option>
							{/each}
						</NativeSelect>
						<p class="text-[11px] text-muted-foreground">Headings and the hero display type.</p>
					</div>

					<div class="space-y-1.5">
						<Label for="brand-font-body">Body font</Label>
						<NativeSelect
							id="brand-font-body"
							class="[&>div]:w-full"
							value={draft.fonts.body}
							onchange={(e) => setFont('body', e.currentTarget.value as BrandFontKey)}
						>
							{#each BRAND_FONT_OPTIONS as font (font.key)}
								<option value={font.key}>{font.label}</option>
							{/each}
						</NativeSelect>
						<p class="text-[11px] text-muted-foreground">Body copy, labels and navigation.</p>
					</div>
				</div>
			</section>
		</div>

		<!-- Live preview -->
		<div class="lg:col-span-1">
			<div
				class="sticky top-[84px] overflow-hidden rounded-[12px] border bg-white"
				style="border-color: var(--border);"
			>
				<div class="border-b px-4 py-3" style="border-color: var(--border); background: #fbfbfa;">
					<div class="text-[11px] font-semibold tracking-[0.08em] text-[#636363] uppercase">
						Live preview
					</div>
				</div>

				<div class="p-5" style="background: {draft.colors.surface}; color: {draft.colors.ink};">
					<div
						class="text-[22px] leading-none font-semibold tracking-[0.18em]"
						style="font-family: {BRAND_FONT_OPTIONS.find((f) => f.key === draft.fonts.display)
							? `var(--brand-font-display)`
							: 'inherit'};"
					>
						{#if draft.logoUrl}
							<img src={draft.logoUrl} alt="" class="max-h-8 w-auto object-contain" />
						{:else}
							{draft.wordmark}<span style="color: {draft.colors.accent}">.</span>
						{/if}
					</div>

					<p class="mt-6 text-[26px] leading-[1.1]" style="font-family: var(--brand-font-display);">
						{draft.tagline || 'Your tagline here'}
					</p>

					<p class="mt-3 text-[13px] leading-6" style="color: {draft.colors.muted};">
						Body copy renders in the body font at the muted colour, so long paragraphs stay
						comfortable to read.
					</p>

					<div class="mt-5 flex flex-wrap items-center gap-2">
						<span
							class="inline-flex h-9 items-center rounded-full px-4 text-[11px] font-medium tracking-[0.12em] uppercase"
							style="background: {draft.colors.ink}; color: #ffffff;"
						>
							Shop now
						</span>
						<span
							class="inline-flex h-9 items-center rounded-full border px-4 text-[11px] font-medium tracking-[0.12em] uppercase"
							style="border-color: {draft.colors.border}; color: {draft.colors.ink};"
						>
							Collections
						</span>
					</div>

					<div
						class="mt-6 flex items-center gap-3 border-t pt-4"
						style="border-color: {draft.colors.border};"
					>
						<span class="h-3 w-3 rounded-full" style="background: {draft.colors.accent};"></span>
						<span class="text-[11px]" style="color: {draft.colors.muted};">Accent</span>
						<span class="h-3 w-3 rounded-full" style="background: {draft.colors.ink};"></span>
						<span class="text-[11px]" style="color: {draft.colors.muted};">Ink</span>
						<span
							class="h-3 w-3 rounded-full border"
							style="background: {draft.colors.surface}; border-color: {draft.colors.border};"
						></span>
						<span class="text-[11px]" style="color: {draft.colors.muted};">Border</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
