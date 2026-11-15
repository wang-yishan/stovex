<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { uploadImages } from '#lib/admin/api.ts';
	import type { StoreSettings } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { Plus, Save, Trash2 } from '@lucide/svelte';

	/** A draft copy of the saved settings — edits land here until Save. */
	let draft = $state({
		whatsappNumber: admin.settings.whatsappNumber,
		whatsappTemplate: admin.settings.whatsappTemplate,
		footerText: admin.settings.footerText,
		social: { ...admin.settings.social },
		defaultSeo: { ...admin.settings.defaultSeo },
		headerLinks: admin.settings.headerLinks.map((l) => ({ ...l }))
	});
	let saving = $state(false);
	let uploading = $state(false);

	// Unsaved edits: the draft differs from what the server holds. After a
	// successful save the store catches up, so this flips back to false.
	let dirty = $derived(
		JSON.stringify(draft) !==
			JSON.stringify({
				whatsappNumber: admin.settings.whatsappNumber,
				whatsappTemplate: admin.settings.whatsappTemplate,
				footerText: admin.settings.footerText,
				social: admin.settings.social,
				defaultSeo: admin.settings.defaultSeo,
				headerLinks: admin.settings.headerLinks
			})
	);

	function addLink() {
		draft.headerLinks = [
			...draft.headerLinks,
			{ id: `hl-${Date.now().toString(36)}`, label: 'New link', href: '#shop' }
		];
	}

	function removeLink(id: string) {
		draft.headerLinks = draft.headerLinks.filter((l) => l.id !== id);
	}

	function moveLink(index: number, dir: -1 | 1) {
		const next = [...draft.headerLinks];
		const target = index + dir;
		if (target < 0 || target >= next.length) return;
		[next[index], next[target]] = [next[target], next[index]];
		draft.headerLinks = next;
	}

	async function uploadSeoImage(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		try {
			const [uploaded] = await uploadImages([file]);
			if (uploaded) {
				draft.defaultSeo.image = uploaded.url;
				admin.showToast('OG image uploaded', 'success');
			}
		} catch (cause) {
			admin.showToast(cause instanceof Error ? cause.message : 'Upload failed', 'error');
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function save() {
		saving = true;
		await admin.saveSettings(draft as Partial<StoreSettings>);
		saving = false;
	}
</script>

<!--
	@component
	Store Settings: the contact channels, social handles, default SEO and the
	storefront navigation. The brand itself lives in Brand Identity.
-->

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Store Settings' }]}
	title="Store Settings"
	subtitle="Contact channels, social handles, default SEO and storefront navigation."
	mobileSubtitle="Contact • social • SEO"
>
	{#snippet actions()}
		<Button onclick={() => void save()} disabled={saving || !dirty}>
			<Save class="h-4 w-4 shrink-0" />
			<span class="hidden sm:inline">{saving ? 'Saving…' : 'Save settings'}</span><span
				class="sm:hidden">Save</span
			>
		</Button>
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
	<div class="grid gap-4 lg:grid-cols-2">
		<!-- Contact -->
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<div class="mb-4 flex items-center gap-2">
				<h2 class="text-[13px] font-semibold">Contact</h2>
			</div>

			<div class="space-y-4">
				<div class="space-y-1.5">
					<Label for="wa-number">WhatsApp number</Label>
					<Input
						id="wa-number"
						value={draft.whatsappNumber}
						placeholder="6281234567890"
						oninput={(e) => {
							draft.whatsappNumber = e.currentTarget.value;
						}}
					/>
					<p class="text-[11px] text-muted-foreground">
						Every enquiry button on the storefront opens a chat to this number.
					</p>
				</div>

				<div class="space-y-1.5">
					<Label for="wa-template">WhatsApp message template</Label>
					<Textarea
						id="wa-template"
						rows={4}
						value={draft.whatsappTemplate}
						oninput={(e) => {
							draft.whatsappTemplate = e.currentTarget.value;
						}}
					/>
					<p class="text-[11px] text-muted-foreground">
						Placeholders: {'{{productName}}'}, {'{{variant}}'}, {'{{sku}}'}, {'{{price}}'}, {'{{url}}'}.
					</p>
				</div>

				<div class="space-y-1.5">
					<Label for="footer-text">Footer text</Label>
					<Textarea
						id="footer-text"
						rows={3}
						value={draft.footerText}
						oninput={(e) => {
							draft.footerText = e.currentTarget.value;
						}}
					/>
				</div>
			</div>
		</section>

		<!-- Social + SEO -->
		<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
			<div class="mb-4 flex items-center gap-2">
				<h2 class="text-[13px] font-semibold">Social &amp; SEO</h2>
			</div>

			<div class="space-y-4">
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="space-y-1.5">
						<Label for="social-ig">Instagram</Label>
						<Input
							id="social-ig"
							value={draft.social.instagram}
							placeholder="@yourstore"
							oninput={(e) => {
								draft.social.instagram = e.currentTarget.value;
							}}
						/>
					</div>
					<div class="space-y-1.5">
						<Label for="social-fb">Facebook</Label>
						<Input
							id="social-fb"
							value={draft.social.facebook}
							placeholder="yourstore"
							oninput={(e) => {
								draft.social.facebook = e.currentTarget.value;
							}}
						/>
					</div>
					<div class="space-y-1.5">
						<Label for="social-tt">TikTok</Label>
						<Input
							id="social-tt"
							value={draft.social.tiktok}
							placeholder="@yourstore"
							oninput={(e) => {
								draft.social.tiktok = e.currentTarget.value;
							}}
						/>
					</div>
				</div>

				<div class="space-y-1.5">
					<Label for="seo-title">Default SEO title</Label>
					<Input
						id="seo-title"
						value={draft.defaultSeo.title}
						placeholder="Your store — your promise"
						oninput={(e) => {
							draft.defaultSeo.title = e.currentTarget.value;
						}}
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="seo-desc">Default SEO description</Label>
					<Textarea
						id="seo-desc"
						rows={3}
						value={draft.defaultSeo.description}
						oninput={(e) => {
							draft.defaultSeo.description = e.currentTarget.value;
						}}
					/>
				</div>

				<div class="space-y-1.5">
					<Label for="seo-image">Default share image</Label>
					<div class="flex items-center gap-3">
						<div
							class="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border bg-[#F5F5F4]"
							style="border-color: var(--border);"
						>
							{#if draft.defaultSeo.image}
								<img src={draft.defaultSeo.image} alt="" class="h-full w-full object-cover" />
							{:else}
								<span class="text-[11px] text-[#636363]">None</span>
							{/if}
						</div>
						<label
							class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted"
						>
							{uploading ? 'Uploading…' : 'Upload'}
							<input
								id="seo-image"
								type="file"
								accept="image/png,image/jpeg,image/webp"
								class="sr-only"
								onchange={(e) => void uploadSeoImage(e)}
							/>
						</label>
					</div>
				</div>
			</div>
		</section>
	</div>

	<!-- Navigation -->
	<section
		class="mt-4 rounded-[12px] border bg-white p-4 md:p-5"
		style="border-color: var(--border);"
	>
		<div class="mb-4 flex items-center justify-between gap-3">
			<div>
				<h2 class="text-[13px] font-semibold">Storefront navigation</h2>
				<p class="mt-0.5 text-[11px] text-muted-foreground">
					The links in the storefront header, in order.
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={addLink}>
				<Plus class="h-3.5 w-3.5" />
				Add link
			</Button>
		</div>

		{#if draft.headerLinks.length === 0}
			<div class="rounded-[10px] bg-[#F5F5F4] px-4 py-6 text-center text-[12px] text-[#636363]">
				No links yet — the storefront header will show only the catalogue link.
			</div>
		{:else}
			<div class="space-y-2">
				{#each draft.headerLinks as link, i (link.id)}
					<div
						class="grid items-center gap-2 rounded-[10px] border bg-[#FBFBFA] p-2.5 sm:grid-cols-[1fr_1fr_auto]"
						style="border-color: var(--border);"
					>
						<Input
							value={link.label}
							aria-label="Link label"
							placeholder="Label"
							oninput={(e) => {
								link.label = e.currentTarget.value;
							}}
						/>
						<Input
							value={link.href}
							aria-label="Link href"
							placeholder="#shop"
							oninput={(e) => {
								link.href = e.currentTarget.value;
							}}
						/>
						<div class="flex items-center justify-end gap-1">
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Move up"
								disabled={i === 0}
								onclick={() => moveLink(i, -1)}
							>
								<span aria-hidden="true" class="text-[13px]">↑</span>
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Move down"
								disabled={i === draft.headerLinks.length - 1}
								onclick={() => moveLink(i, 1)}
							>
								<span aria-hidden="true" class="text-[13px]">↓</span>
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Remove link"
								onclick={() => removeLink(link.id)}
							>
								<Trash2 class="h-3.5 w-3.5 text-destructive" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>
