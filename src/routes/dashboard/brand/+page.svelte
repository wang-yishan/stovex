<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { pickUploadedImage } from '#lib/admin/upload.ts';
	import { SEED_BRAND, seedSettings } from '#lib/admin/data.ts';
	import {
		BRAND_COLOR_ROLES,
		BRAND_FONT_OPTIONS,
		contrastRatio,
		formatRatio,
		gradeRatio,
		meetsAaText,
		type BrandColorRole
	} from '#lib/admin/brand.ts';
	import type { BrandFontKey, BrandIdentity, StoreSettings } from '#lib/admin/types.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { NativeSelect } from '#lib/components/ui/native-select/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { Image, Link2, Palette, Plus, RotateCcw, Save, Trash2, Type } from '@lucide/svelte';

	type FooterMediaLink = StoreSettings['footerMediaLinks'][number];

	const seed = seedSettings();

	/**
	 * Draft copies — edits land here until Save. `$state.snapshot` unwraps the
	 * reactive proxy: `structuredClone` cannot clone a proxy.
	 */
	let draftBrand = $state<BrandIdentity>($state.snapshot(admin.settings.brand) as BrandIdentity);
	let whatsappNumber = $state(admin.settings.whatsappNumber);
	let whatsappTemplate = $state(admin.settings.whatsappTemplate);
	let whatsappCartTemplate = $state(admin.settings.whatsappCartTemplate ?? '');
	let footerText = $state(admin.settings.footerText);
	let social = $state({ ...admin.settings.social });
	let defaultSeo = $state({ ...admin.settings.defaultSeo });
	let headerLinks = $state(admin.settings.headerLinks.map((l) => ({ ...l })));
	let facebookUrl = $state(admin.settings.facebookUrl ?? seed.facebookUrl);
	let instagramUrl = $state(admin.settings.instagramUrl ?? seed.instagramUrl);
	let whatsappUrl = $state(admin.settings.whatsappUrl ?? seed.whatsappUrl);
	let footerMediaLinks = $state<FooterMediaLink[]>(
		structuredClone(
			(($state.snapshot(admin.settings.footerMediaLinks) as FooterMediaLink[]) ?? []).length
				? ($state.snapshot(admin.settings.footerMediaLinks) as FooterMediaLink[])
				: seed.footerMediaLinks
		)
	);

	let saving = $state(false);
	let uploading = $state<'logo' | 'favicon' | 'seo' | null>(null);
	let uploadingMediaId = $state<string | null>(null);

	function snapshotDraft() {
		return {
			brand: draftBrand,
			whatsappNumber,
			whatsappTemplate,
			footerText,
			social,
			defaultSeo,
			headerLinks,
			facebookUrl,
			instagramUrl,
			whatsappUrl,
			footerMediaLinks
		};
	}

	function snapshotSaved() {
		return {
			brand: admin.settings.brand,
			whatsappNumber: admin.settings.whatsappNumber,
			whatsappTemplate: admin.settings.whatsappTemplate,
			whatsappCartTemplate: admin.settings.whatsappCartTemplate ?? '',
			footerText: admin.settings.footerText,
			social: admin.settings.social,
			defaultSeo: admin.settings.defaultSeo,
			headerLinks: admin.settings.headerLinks,
			facebookUrl: admin.settings.facebookUrl ?? seedSettings().facebookUrl,
			instagramUrl: admin.settings.instagramUrl ?? seedSettings().instagramUrl,
			whatsappUrl: admin.settings.whatsappUrl ?? seedSettings().whatsappUrl,
			footerMediaLinks: admin.settings.footerMediaLinks ?? seedSettings().footerMediaLinks
		};
	}

	// Unsaved edits: drafts differ from what the server holds.
	let dirty = $derived(JSON.stringify(snapshotDraft()) !== JSON.stringify(snapshotSaved()));

	const surface = $derived(draftBrand.colors.surface);

	function ratioFor(role: BrandColorRole): number {
		return contrastRatio(draftBrand.colors[role], surface);
	}

	const TEXT_ROLES: BrandColorRole[] = ['ink', 'muted'];

	function setColor(role: BrandColorRole, value: string) {
		draftBrand.colors[role] = value;
	}

	function setFont(role: 'display' | 'body', value: BrandFontKey) {
		draftBrand.fonts[role] = value;
	}

	function setBrandField<K extends keyof BrandIdentity>(key: K, value: BrandIdentity[K]) {
		draftBrand[key] = value;
	}

	async function uploadImage(kind: 'logo' | 'favicon', event: Event) {
		uploading = kind;
		try {
			const url = await pickUploadedImage(event);
			if (url) {
				setBrandField(kind === 'logo' ? 'logoUrl' : 'faviconUrl', url);
				admin.showToast(`${kind === 'logo' ? 'Logo' : 'Favicon'} uploaded`, 'success');
			}
		} catch (cause) {
			admin.showToast(cause instanceof Error ? cause.message : 'Upload failed', 'error');
		} finally {
			uploading = null;
		}
	}

	function clearImage(kind: 'logo' | 'favicon') {
		setBrandField(kind === 'logo' ? 'logoUrl' : 'faviconUrl', '');
	}

	function addMediaLink() {
		footerMediaLinks = [
			...footerMediaLinks,
			{ id: `fm-${Date.now().toString(36)}`, logoUrl: '', name: '', url: '' }
		];
	}

	function removeMediaLink(id: string) {
		footerMediaLinks = footerMediaLinks.filter((link) => link.id !== id);
	}

	async function uploadMediaLogo(id: string, event: Event) {
		uploadingMediaId = id;
		try {
			const url = await pickUploadedImage(event);
			if (url) {
				footerMediaLinks = footerMediaLinks.map((link) =>
					link.id === id ? { ...link, logoUrl: url } : link
				);
				admin.showToast('Media logo uploaded', 'success');
			}
		} catch (cause) {
			admin.showToast(cause instanceof Error ? cause.message : 'Upload failed', 'error');
		} finally {
			uploadingMediaId = null;
		}
	}

	async function uploadSeoImage(event: Event) {
		uploading = 'seo';
		try {
			const url = await pickUploadedImage(event);
			if (url) {
				defaultSeo.image = url;
				admin.showToast('OG image uploaded', 'success');
			}
		} catch (cause) {
			admin.showToast(cause instanceof Error ? cause.message : 'Upload failed', 'error');
		} finally {
			uploading = null;
		}
	}

	function addLink() {
		headerLinks = [
			...headerLinks,
			{ id: `hl-${Date.now().toString(36)}`, label: 'New link', href: '#shop' }
		];
	}

	function removeLink(id: string) {
		headerLinks = headerLinks.filter((l) => l.id !== id);
	}

	function moveLink(index: number, dir: -1 | 1) {
		const next = [...headerLinks];
		const target = index + dir;
		if (target < 0 || target >= next.length) return;
		[next[index], next[target]] = [next[target], next[index]];
		headerLinks = next;
	}

	function resetToDefault() {
		draftBrand = structuredClone(SEED_BRAND);
		const defaults = seedSettings();
		whatsappNumber = defaults.whatsappNumber;
		whatsappTemplate = defaults.whatsappTemplate;
		whatsappCartTemplate = defaults.whatsappCartTemplate ?? '';
		footerText = defaults.footerText;
		social = { ...defaults.social };
		defaultSeo = { ...defaults.defaultSeo };
		headerLinks = defaults.headerLinks.map((l) => ({ ...l }));
		facebookUrl = defaults.facebookUrl;
		instagramUrl = defaults.instagramUrl;
		whatsappUrl = defaults.whatsappUrl;
		footerMediaLinks = structuredClone(defaults.footerMediaLinks);
	}

	async function save() {
		saving = true;
		await admin.saveSettings({
			brand: draftBrand,
			whatsappNumber,
			whatsappTemplate,
			footerText,
			social,
			defaultSeo,
			headerLinks,
			facebookUrl,
			instagramUrl,
			whatsappUrl,
			footerMediaLinks
		});
		saving = false;
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Brand & Store Settings' }]}
	title="Brand & Store Settings"
	subtitle="Identity, contact, SEO and storefront navigation in one place."
	mobileSubtitle="Brand • contact • SEO"
>
	{#snippet actions()}
		<Button variant="outline" onclick={resetToDefault} disabled={saving}>
			<RotateCcw class="h-4 w-4 shrink-0" />
			<span class="hidden sm:inline">Reset to default</span><span class="sm:hidden">Reset</span>
		</Button>
		<Button onclick={() => void save()} disabled={saving || !dirty}>
			<Save class="h-4 w-4 shrink-0" />
			<span class="hidden sm:inline">{saving ? 'Saving…' : 'Save changes'}</span><span
				class="sm:hidden">Save</span
			>
		</Button>
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
	<div class="grid gap-4 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<!-- Identity -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center gap-2">
					<Palette class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Identity</h2>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="brand-name">Store name</Label>
						<Input
							id="brand-name"
							value={draftBrand.name}
							placeholder="Bag Store"
							oninput={(e) => setBrandField('name', e.currentTarget.value)}
						/>
						<p class="text-[11px] text-muted-foreground">
							Used in page copy, SEO titles, WhatsApp greetings and the footer.
						</p>
					</div>

					<div class="space-y-1.5">
						<Label for="brand-wordmark">Wordmark</Label>
						<Input
							id="brand-wordmark"
							value={draftBrand.wordmark}
							placeholder="BAG STORE"
							oninput={(e) => setBrandField('wordmark', e.currentTarget.value)}
						/>
						<p class="text-[11px] text-muted-foreground">The lockup in the storefront header and footer.</p>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<Label for="brand-tagline">Tagline</Label>
						<Input
							id="brand-tagline"
							value={draftBrand.tagline}
							placeholder="Minimal bags, made to last"
							oninput={(e) => setBrandField('tagline', e.currentTarget.value)}
						/>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<Label for="brand-domain">Store domain</Label>
						<Input
							id="brand-domain"
							value={draftBrand.domain}
							placeholder="bagstore.example"
							oninput={(e) => setBrandField('domain', e.currentTarget.value)}
						/>
						<p class="text-[11px] text-muted-foreground">Used for the product links inside WhatsApp messages.</p>
					</div>
				</div>
			</section>

			<!-- Logo & favicon -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center gap-2">
					<Image class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Logo &amp; favicon</h2>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="brand-logo">Logo image</Label>
						<div class="flex items-center gap-3 rounded-[10px] border bg-[#F5F5F4] p-3" style="border-color: var(--border);">
							<div class="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white">
								{#if draftBrand.logoUrl}
									<img src={draftBrand.logoUrl} alt="" class="max-h-12 w-auto object-contain" />
								{:else}
									<span class="px-2 text-center text-[11px] text-[#636363]">No logo</span>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								<label class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted">
									<Image class="h-3.5 w-3.5" />
									{uploading === 'logo' ? 'Uploading…' : 'Upload'}
									<input id="brand-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only" onchange={(e) => void uploadImage('logo', e)} />
								</label>
								{#if draftBrand.logoUrl}
									<Button variant="ghost" size="sm" onclick={() => clearImage('logo')}>Remove</Button>
								{/if}
							</div>
						</div>
						<p class="text-[11px] text-muted-foreground">Shown in the storefront header and footer. PNG, JPG, WebP or SVG.</p>
					</div>

					<div class="space-y-2">
						<Label for="brand-favicon">Favicon</Label>
						<div class="flex items-center gap-3 rounded-[10px] border bg-[#F5F5F4] p-3" style="border-color: var(--border);">
							<div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white">
								{#if draftBrand.faviconUrl}
									<img src={draftBrand.faviconUrl} alt="" class="max-h-11 w-11 object-contain" />
								{:else}
									<span class="px-2 text-center text-[11px] text-[#636363]">None</span>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								<label class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted">
									<Image class="h-3.5 w-3.5" />
									{uploading === 'favicon' ? 'Uploading…' : 'Upload'}
									<input id="brand-favicon" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon" class="sr-only" onchange={(e) => void uploadImage('favicon', e)} />
								</label>
								{#if draftBrand.faviconUrl}
									<Button variant="ghost" size="sm" onclick={() => clearImage('favicon')}>Remove</Button>
								{/if}
							</div>
						</div>
						<p class="text-[11px] text-muted-foreground">Shown in the browser tab. Falls back to the bundled icon.</p>
					</div>
				</div>
			</section>

			<!-- Palette -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center gap-2">
					<Palette class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Palette</h2>
				</div>

				<div class="space-y-3">
					{#each BRAND_COLOR_ROLES as role (role.key)}
						{@const value = draftBrand.colors[role.key]}
						{@const ratio = ratioFor(role.key)}
						{@const isText = TEXT_ROLES.includes(role.key)}
						<div class="grid items-center gap-3 rounded-[10px] border bg-[#FBFBFA] p-3 sm:grid-cols-[1fr_auto_auto] sm:gap-4" style="border-color: var(--border);">
							<div class="min-w-0">
								<div class="text-[12px] font-medium">{role.label}</div>
								<div class="truncate text-[11px] text-[#636363]">{role.hint}</div>
							</div>

							<div class="flex items-center gap-2">
								<input type="color" aria-label="{role.label} colour" class="h-9 w-11 shrink-0 cursor-pointer rounded-[8px] border bg-white p-1" style="border-color: var(--border);" {value} oninput={(e) => setColor(role.key, e.currentTarget.value)} />
								<Input {value} aria-label="{role.label} hex" class="w-28 font-mono" oninput={(e) => setColor(role.key, e.currentTarget.value)} />
							</div>

							<div class="flex items-center gap-2 sm:w-[132px] sm:justify-end">
								<span class="inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold {meetsAaText(ratio) ? 'bg-[#EAF6F0] text-[#1A7A52]' : 'bg-[#FDF3E7] text-[#8A6A24]'}">{formatRatio(ratio)} · {gradeRatio(ratio)}</span>
								{#if isText && !meetsAaText(ratio)}
									<span class="text-[11px] text-[#8A6A24]">Below AA for text</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<p class="mt-3 text-[11px] text-[#636363]">Ratios are measured against the page surface colour. Body copy needs 4.5:1 (AA); icons and borders need 3:1.</p>
			</section>

			<!-- Typography -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center gap-2">
					<Type class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Typography</h2>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="brand-font-display">Display font</Label>
						<NativeSelect id="brand-font-display" class="[&>div]:w-full" value={draftBrand.fonts.display} onchange={(e) => setFont('display', e.currentTarget.value as BrandFontKey)}>
							{#each BRAND_FONT_OPTIONS as font (font.key)}
								<option value={font.key}>{font.label}</option>
							{/each}
						</NativeSelect>
						<p class="text-[11px] text-muted-foreground">Headings and the hero display type.</p>
					</div>

					<div class="space-y-1.5">
						<Label for="brand-font-body">Body font</Label>
						<NativeSelect id="brand-font-body" class="[&>div]:w-full" value={draftBrand.fonts.body} onchange={(e) => setFont('body', e.currentTarget.value as BrandFontKey)}>
							{#each BRAND_FONT_OPTIONS as font (font.key)}
								<option value={font.key}>{font.label}</option>
							{/each}
						</NativeSelect>
						<p class="text-[11px] text-muted-foreground">Body copy, labels and navigation.</p>
					</div>
				</div>
			</section>

			<!-- Contact & Social -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center gap-2">
					<h2 class="text-[13px] font-semibold">Contact &amp; Social</h2>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<Label for="wa-number">WhatsApp number</Label>
						<Input id="wa-number" value={whatsappNumber} placeholder="6281234567890" oninput={(e) => { whatsappNumber = e.currentTarget.value; }} />
						<p class="text-[11px] text-muted-foreground">Every enquiry button on the storefront opens a chat to this number.</p>
					</div>

					<div class="space-y-1.5">
						<Label for="wa-template">WhatsApp message template (product inquiry)</Label>
						<Textarea id="wa-template" rows={4} value={whatsappTemplate} oninput={(e) => { whatsappTemplate = e.currentTarget.value; }} />
						<p class="text-[11px] text-muted-foreground">Placeholders: {'{{productName}}'}, {'{{variant}}'}, {'{{sku}}'}, {'{{price}}'}, {'{{url}}'}.</p>
					</div>

					<div class="space-y-1.5">
						<Label for="wa-cart-template">Cart checkout message template</Label>
						<Textarea id="wa-cart-template" rows={4} value={whatsappCartTemplate} oninput={(e) => { whatsappCartTemplate = e.currentTarget.value; }} />
						<p class="text-[11px] text-muted-foreground">Placeholders: {'{{brandName}}'}, {'{{items}}'}, {'{{total}}'}.</p>
					</div>

					<div class="grid gap-3 sm:grid-cols-3">
						<div class="space-y-1.5">
							<Label for="social-ig-handle">Instagram (handle)</Label>
							<Input id="social-ig-handle" value={social.instagram} placeholder="@yourstore" oninput={(e) => { social.instagram = e.currentTarget.value; }} />
						</div>
						<div class="space-y-1.5">
							<Label for="social-fb-handle">Facebook (handle)</Label>
							<Input id="social-fb-handle" value={social.facebook} placeholder="yourstore" oninput={(e) => { social.facebook = e.currentTarget.value; }} />
						</div>
						<div class="space-y-1.5">
							<Label for="social-tt-handle">TikTok (handle)</Label>
							<Input id="social-tt-handle" value={social.tiktok} placeholder="@yourstore" oninput={(e) => { social.tiktok = e.currentTarget.value; }} />
						</div>
					</div>

					<div class="grid gap-3 sm:grid-cols-3">
						<div class="space-y-1.5">
							<Label for="social-url-facebook">Facebook URL</Label>
							<Input id="social-url-facebook" value={facebookUrl} placeholder="https://facebook.com/yourstore" oninput={(e) => { facebookUrl = e.currentTarget.value; }} />
						</div>
						<div class="space-y-1.5">
							<Label for="social-url-instagram">Instagram URL</Label>
							<Input id="social-url-instagram" value={instagramUrl} placeholder="https://instagram.com/yourstore" oninput={(e) => { instagramUrl = e.currentTarget.value; }} />
						</div>
						<div class="space-y-1.5">
							<Label for="social-url-whatsapp">WhatsApp URL</Label>
							<Input id="social-url-whatsapp" value={whatsappUrl} placeholder="https://wa.me/6281234567890" oninput={(e) => { whatsappUrl = e.currentTarget.value; }} />
						</div>
					</div>
				</div>
			</section>

			<!-- Default SEO -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center gap-2">
					<h2 class="text-[13px] font-semibold">Default SEO</h2>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<Label for="seo-title">Default SEO title</Label>
						<Input id="seo-title" value={defaultSeo.title} placeholder="Your store — your promise" oninput={(e) => { defaultSeo.title = e.currentTarget.value; }} />
					</div>

					<div class="space-y-1.5">
						<Label for="seo-desc">Default SEO description</Label>
						<Textarea id="seo-desc" rows={3} value={defaultSeo.description} oninput={(e) => { defaultSeo.description = e.currentTarget.value; }} />
					</div>

					<div class="space-y-1.5">
						<Label for="seo-image">Default share image</Label>
						<div class="flex items-center gap-3">
							<div class="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border bg-[#F5F5F4]" style="border-color: var(--border);">
								{#if defaultSeo.image}
									<img src={defaultSeo.image} alt="" class="h-full w-full object-cover" />
								{:else}
									<span class="text-[11px] text-[#636363]">None</span>
								{/if}
							</div>
							<label class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted">
								{uploading === 'seo' ? 'Uploading…' : 'Upload'}
								<input id="seo-image" type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" onchange={(e) => void uploadSeoImage(e)} />
							</label>
						</div>
					</div>
				</div>
			</section>

			<!-- Footer -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center gap-2">
					<Link2 class="h-4 w-4 text-muted-foreground" />
					<div>
						<h2 class="text-[13px] font-semibold">Footer</h2>
						<p class="mt-0.5 text-[11px] text-muted-foreground">Footer text and optional media links.</p>
					</div>
				</div>

				<div class="space-y-4">
					<div class="space-y-1.5">
						<Label for="footer-text">Footer text</Label>
						<Textarea id="footer-text" rows={3} value={footerText} oninput={(e) => { footerText = e.currentTarget.value; }} />
					</div>

					<div class="border-t pt-4" style="border-color: var(--border);">
						<div class="mb-3 flex items-center justify-between gap-3">
							<div>
								<div class="text-[12px] font-medium">Custom media links</div>
								<div class="text-[11px] text-muted-foreground">Add a logo/media image, name and URL.</div>
							</div>
							<Button variant="outline" size="sm" onclick={addMediaLink}>
								<Plus class="h-3.5 w-3.5" />
								Add item
							</Button>
						</div>

						{#if footerMediaLinks.length === 0}
							<div class="rounded-[10px] bg-[#F5F5F4] px-4 py-6 text-center text-[12px] text-[#636363]">No custom media links yet.</div>
						{:else}
							<div class="space-y-3">
								{#each footerMediaLinks as link (link.id)}
									<div class="rounded-[10px] border bg-[#FBFBFA] p-3" style="border-color: var(--border);">
										<div class="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-start">
											<div class="space-y-1.5">
												<div class="text-[11px] font-medium text-[#636363]">Logo/media</div>
												<div class="flex items-center gap-2">
													<div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border bg-white" style="border-color: var(--border);">
														{#if link.logoUrl}
															<img src={link.logoUrl} alt="" class="h-full w-full object-contain" />
														{:else}
															<Image class="h-4 w-4 text-[#636363]" />
														{/if}
													</div>
													<label class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted">
														{uploadingMediaId === link.id ? 'Uploading…' : 'Upload'}
														<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only" onchange={(e) => void uploadMediaLogo(link.id, e)} />
													</label>
												</div>
											</div>
											<div class="space-y-1.5">
												<Label for={`media-name-${link.id}`}>Name</Label>
												<Input id={`media-name-${link.id}`} value={link.name} placeholder="Partner or link name" oninput={(e) => { link.name = e.currentTarget.value; }} />
											</div>
											<div class="space-y-1.5">
												<Label for={`media-url-${link.id}`}>URL</Label>
												<Input id={`media-url-${link.id}`} value={link.url} placeholder="https://example.com" oninput={(e) => { link.url = e.currentTarget.value; }} />
											</div>
											<div class="flex items-end justify-end md:pt-6">
												<Button variant="ghost" size="icon-sm" aria-label="Remove media link" onclick={() => removeMediaLink(link.id)}>
													<Trash2 class="h-3.5 w-3.5 text-destructive" />
												</Button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</section>

			<!-- Storefront navigation -->
			<section class="rounded-[12px] border bg-white p-4 md:p-5" style="border-color: var(--border);">
				<div class="mb-4 flex items-center justify-between gap-3">
					<div>
						<h2 class="text-[13px] font-semibold">Storefront navigation</h2>
						<p class="mt-0.5 text-[11px] text-muted-foreground">The links in the storefront header, in order.</p>
					</div>
					<Button variant="outline" size="sm" onclick={addLink}>
						<Plus class="h-3.5 w-3.5" />
						Add link
					</Button>
				</div>

				{#if headerLinks.length === 0}
					<div class="rounded-[10px] bg-[#F5F5F4] px-4 py-6 text-center text-[12px] text-[#636363]">No links yet — the storefront header will show only the catalogue link.</div>
				{:else}
					<div class="space-y-2">
						{#each headerLinks as link, i (link.id)}
							<div class="grid items-center gap-2 rounded-[10px] border bg-[#FBFBFA] p-2.5 sm:grid-cols-[1fr_1fr_auto]" style="border-color: var(--border);">
								<Input value={link.label} aria-label="Link label" placeholder="Label" oninput={(e) => { link.label = e.currentTarget.value; }} />
								<Input value={link.href} aria-label="Link href" placeholder="#shop" oninput={(e) => { link.href = e.currentTarget.value; }} />
								<div class="flex items-center justify-end gap-1">
									<Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onclick={() => moveLink(i, -1)}><span aria-hidden="true" class="text-[13px]">↑</span></Button>
									<Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === headerLinks.length - 1} onclick={() => moveLink(i, 1)}><span aria-hidden="true" class="text-[13px]">↓</span></Button>
									<Button variant="ghost" size="icon-sm" aria-label="Remove link" onclick={() => removeLink(link.id)}><Trash2 class="h-3.5 w-3.5 text-destructive" /></Button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>

		<!-- Live preview -->
		<div class="lg:col-span-1">
			<div class="sticky top-[84px] overflow-hidden rounded-[12px] border bg-white" style="border-color: var(--border);">
				<div class="border-b px-4 py-3" style="border-color: var(--border); background: #fbfbfa;">
					<div class="text-[11px] font-semibold tracking-[0.08em] text-[#636363] uppercase">Live preview</div>
				</div>

				<div class="p-5" style="background: {draftBrand.colors.surface}; color: {draftBrand.colors.ink};">
					<div class="text-[22px] leading-none font-semibold tracking-[0.18em]" style="font-family: {BRAND_FONT_OPTIONS.find((f) => f.key === draftBrand.fonts.display) ? `var(--brand-font-display)` : 'inherit'};">
						{#if draftBrand.logoUrl}
							<img src={draftBrand.logoUrl} alt="" class="max-h-8 w-auto object-contain" />
						{:else}
							{draftBrand.wordmark}<span style="color: {draftBrand.colors.accent}">.</span>
						{/if}
					</div>

					<p class="mt-6 text-[26px] leading-[1.1]" style="font-family: var(--brand-font-display);">{draftBrand.tagline || 'Your tagline here'}</p>
					<p class="mt-3 text-[13px] leading-6" style="color: {draftBrand.colors.muted};">Body copy renders in the body font at the muted colour, so long paragraphs stay comfortable to read.</p>

					<div class="mt-5 flex flex-wrap items-center gap-2">
						<span class="inline-flex h-9 items-center rounded-full px-4 text-[11px] font-medium tracking-[0.12em] uppercase" style="background: {draftBrand.colors.ink}; color: #ffffff;">Shop now</span>
						<span class="inline-flex h-9 items-center rounded-full border px-4 text-[11px] font-medium tracking-[0.12em] uppercase" style="border-color: {draftBrand.colors.border}; color: {draftBrand.colors.ink};">Collections</span>
					</div>

					<div class="mt-6 flex items-center gap-3 border-t pt-4" style="border-color: {draftBrand.colors.border};">
						<span class="h-3 w-3 rounded-full" style="background: {draftBrand.colors.accent};"></span>
						<span class="text-[11px]" style="color: {draftBrand.colors.muted};">Accent</span>
						<span class="h-3 w-3 rounded-full" style="background: {draftBrand.colors.ink};"></span>
						<span class="text-[11px]" style="color: {draftBrand.colors.muted};">Ink</span>
						<span class="h-3 w-3 rounded-full border" style="background: {draftBrand.colors.surface}; border-color: {draftBrand.colors.border};"></span>
						<span class="text-[11px]" style="color: {draftBrand.colors.muted};">Border</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
