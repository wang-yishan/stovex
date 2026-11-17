<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { pickUploadedImage } from '#lib/admin/upload.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import { Textarea } from '#lib/components/ui/textarea/index.ts';
	import { Image, Save, Trash2, User } from '@lucide/svelte';
	import {
		profileDisplayName,
		profileImageUrl,
		profileInitials,
		type ProfileUser
	} from '#lib/admin/user.ts';

	let user = $derived(page.data.user as ProfileUser | null);
	let displayName = $derived(profileDisplayName(user));
	let initials = $derived(profileInitials(user));
	let image = $state(user?.image ?? '');

	let nickname = $state(user?.nickname ?? '');
	let name = $state(user?.name ?? '');
	let phone = $state(user?.phone ?? '');
	let address = $state(user?.address ?? '');

	let saving = $state(false);
	let uploading = $state(false);

	const savedSnapshot = $derived(
		JSON.stringify({
			nickname: user?.nickname ?? '',
			name: user?.name ?? '',
			phone: user?.phone ?? '',
			address: user?.address ?? '',
			image: user?.image ?? ''
		})
	);
	const draftSnapshot = $derived(JSON.stringify({ nickname, name, phone, address, image }));
	const dirty = $derived(savedSnapshot !== draftSnapshot);

	async function onUpload(event: Event) {
		uploading = true;
		try {
			const url = await pickUploadedImage(event);
			if (url) image = url;
		} catch (cause) {
			admin.showToast(cause instanceof Error ? cause.message : 'Upload failed', 'error');
		} finally {
			uploading = false;
		}
	}

	function clearImage() {
		image = '';
	}

	async function save() {
		saving = true;
		try {
			const res = await fetch('/api/profile', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, nickname, phone, address, image })
			});
			const payload = (await res.json().catch(() => null)) as {
				errors?: Record<string, string>;
				message?: string;
			} | null;
			if (!res.ok) {
				throw new Error(
					payload?.errors
						? Object.values(payload.errors).join(' • ')
						: (payload?.message ?? 'Failed to save the profile.')
				);
			}
			admin.showToast('Profile saved', 'success');
			await invalidateAll();
		} catch (cause) {
			admin.showToast(
				cause instanceof Error ? cause.message : 'Failed to save the profile.',
				'error'
			);
		} finally {
			saving = false;
		}
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
	title="Profile"
	subtitle="Your personal details and profile photo."
	mobileSubtitle="Profile • personal info"
>
	{#snippet actions()}
		<Button onclick={() => void save()} disabled={saving || !dirty}>
			<Save class="h-4 w-4 shrink-0" />
			<span class="hidden sm:inline">{saving ? 'Saving…' : 'Save changes'}</span><span
				class="sm:hidden">Save</span
			>
		</Button>
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
	<div class="grid gap-4">
		<div class="space-y-4">
			<!-- Profile photo -->
			<section
				class="rounded-[12px] border bg-white p-4 md:p-5"
				style="border-color: var(--border);"
			>
				<div class="mb-4 flex items-center gap-2">
					<Image class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Profile photo</h2>
				</div>

				<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
					<div
						class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F5F5F4]"
					>
						{#if image}
							<img src={image} alt={displayName} class="h-24 w-24 rounded-full object-cover" />
						{:else}
							<span class="text-[28px] font-semibold text-muted-foreground">{initials}</span>
						{/if}
					</div>
					<div class="flex flex-wrap gap-2">
						<label
							class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-card px-3 text-[11px] font-medium transition-colors hover:bg-muted"
						>
							<Image class="h-3.5 w-3.5" />
							{uploading ? 'Uploading…' : 'Upload photo'}
							<input
								id="profile-image"
								type="file"
								accept="image/png,image/jpeg,image/webp,image/svg+xml"
								class="sr-only"
								onchange={(e) => void onUpload(e)}
							/>
						</label>
						{#if image}
							<Button variant="ghost" size="sm" onclick={clearImage}>
								<Trash2 class="h-3.5 w-3.5" />
								Remove
							</Button>
						{/if}
					</div>
				</div>
				<p class="mt-3 text-[11px] text-muted-foreground">
					Fetched from your Google account when signed in with Google, otherwise an initial avatar
					is used.
				</p>
			</section>

			<!-- Personal details -->
			<section
				class="rounded-[12px] border bg-white p-4 md:p-5"
				style="border-color: var(--border);"
			>
				<div class="mb-4 flex items-center gap-2">
					<User class="h-4 w-4 text-muted-foreground" />
					<h2 class="text-[13px] font-semibold">Personal details</h2>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1.5">
						<Label for="nickname">Nickname</Label>
						<Input
							id="nickname"
							value={nickname}
							placeholder="Budi"
							oninput={(e) => {
								nickname = e.currentTarget.value;
							}}
						/>
						<p class="text-[11px] text-muted-foreground">Shown as the avatar fallback initial.</p>
					</div>

					<div class="space-y-1.5">
						<Label for="name">Full name</Label>
						<Input
							id="name"
							value={name}
							placeholder="Budi Santoso"
							oninput={(e) => {
								name = e.currentTarget.value;
							}}
						/>
						<p class="text-[11px] text-muted-foreground">Required.</p>
					</div>

					<div class="space-y-1.5">
						<Label for="email">Email</Label>
						<Input id="email" value={user?.email ?? ''} disabled />
						<p class="text-[11px] text-muted-foreground">
							Contact support to change the sign-in email.
						</p>
					</div>

					<div class="space-y-1.5">
						<Label for="phone">Phone</Label>
						<Input
							id="phone"
							value={phone}
							placeholder="6281234567890"
							oninput={(e) => {
								phone = e.currentTarget.value;
							}}
						/>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<Label for="address">Address</Label>
						<Textarea
							id="address"
							rows={3}
							value={address}
							placeholder="Street, city, province, postal code"
							oninput={(e) => {
								address = e.currentTarget.value;
							}}
						/>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>
