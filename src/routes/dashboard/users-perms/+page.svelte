<script lang="ts">
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { adminUsersApi, type AdminAccountDto } from '#lib/admin/api.ts';
	import { profileDisplayName, profileImageUrl } from '#lib/admin/user.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { BadgeCheck, CircleUser, Clock, ShieldCheck, Users, XCircle } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** Local overrides applied on top of server data after a status change. */
	let overrides = $state<Record<string, AdminAccountDto>>({});
	let busyId = $state<string | null>(null);
	let error = $state<string | null>(null);

	const admins = $derived(data.admins.map((a) => overrides[a.id] ?? a));

	const pendingCount = $derived(admins.filter((a) => a.status !== 'active').length);
	const activeCount = $derived(admins.filter((a) => a.status === 'active').length);
	const slotsLeft = $derived(Math.max(0, data.maxAdmins - admins.length));

	async function setStatus(account: AdminAccountDto, action: 'activate' | 'deactivate') {
		busyId = account.id;
		error = null;
		try {
			const { user } = await adminUsersApi.setStatus(account.id, action);
			overrides = { ...overrides, [user.id]: user };
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Gagal memperbarui status akun.';
		} finally {
			busyId = null;
		}
	}
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users & Permissions' }]}
	title="Users & Permissions"
	subtitle="Aktivasi akun admin dan kuota pendaftaran admin baru."
	mobileSubtitle="Admin • aktivasi"
/>

<div class="mx-auto w-full max-w-[1280px] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
	<!-- KPI tiles -->
	<div class="grid gap-4 sm:grid-cols-3">
		<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
			<div class="flex items-center gap-2">
				<Users class="h-5 w-5 text-[#777]" strokeWidth={1.6} />
				<span class="text-[11px] font-semibold tracking-[0.08em] text-[#636363] uppercase"
					>Admin aktif</span
				>
			</div>
			<p class="mt-2 text-[22px] font-semibold">{activeCount}</p>
			<p class="text-[11px] text-[#5A5A5A]">Punya akses operasional toko</p>
		</div>
		<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
			<div class="flex items-center gap-2">
				<Clock class="h-5 w-5 text-[#8A6A24]" strokeWidth={1.6} />
				<span class="text-[11px] font-semibold tracking-[0.08em] text-[#636363] uppercase"
					>Menunggu aktivasi</span
				>
			</div>
			<p class="mt-2 text-[22px] font-semibold">{pendingCount}</p>
			<p class="text-[11px] text-[#5A5A5A]">Belum bisa akses dashboard</p>
		</div>
		<div class="rounded-[12px] border bg-white p-4" style="border-color: var(--border);">
			<div class="flex items-center gap-2">
				<ShieldCheck class="h-5 w-5 text-[#777]" strokeWidth={1.6} />
				<span class="text-[11px] font-semibold tracking-[0.08em] text-[#636363] uppercase"
					>Kuota admin</span
				>
			</div>
			<p class="mt-2 text-[22px] font-semibold">
				{admins.length}<span class="text-[14px] text-[#636363]"> / {data.maxAdmins}</span>
			</p>
			<p class="text-[11px] text-[#5A5A5A]">
				{slotsLeft} slot tersisa • diatur di
				<a href="/dashboard/brand" class="underline underline-offset-2">Store Settings</a>
			</p>
		</div>
	</div>

	{#if error}
		<div
			class="mt-4 rounded-md border border-[#f0c2c0] bg-[#fef2f2] px-3 py-2 text-[13px] text-[#A33A37]"
		>
			{error}
		</div>
	{/if}

	<!-- Admin list -->
	<div
		class="mt-4 overflow-hidden rounded-[12px] border bg-white"
		style="border-color: var(--border);"
	>
		<div class="border-b bg-[#FBFBFA] px-4 py-3" style="border-color: var(--border);">
			<h2 class="text-[13px] font-semibold">Admin accounts</h2>
			<p class="text-[11px] text-[#5A5A5A]">
				Admin baru mendaftar sebagai <em>pending</em> — klik “Aktifkan Akun” untuk membuka akses dashboard
				(produk, order, inventory).
			</p>
		</div>

		{#if admins.length === 0}
			<div class="px-6 py-16 text-center">
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-[#F5F5F4]"
					style="border-color: var(--border);"
				>
					<CircleUser class="h-6 w-6 text-[#636363]" />
				</div>
				<h3 class="text-[14px] font-semibold">Belum ada admin</h3>
				<p class="mx-auto mt-1 max-w-[320px] text-[12px] text-[#5A5A5A]">
					Admin baru mendaftar lewat halaman Sign up, lalu muncul di sini untuk diaktifkan.
				</p>
			</div>
		{:else}
			<ul class="divide-y" style="border-color: var(--border);">
				{#each admins as admin (admin.id)}
					{@const name = profileDisplayName(admin)}
					{@const avatar = profileImageUrl(admin)}
					{@const pending = admin.status !== 'active'}
					<li class="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-[#F5F5F4]"
							style="border-color: var(--border);"
						>
							{#if avatar}
								<img src={avatar} alt="" class="h-full w-full object-cover" />
							{:else}
								<span class="text-[13px] font-semibold text-[#5A5A5A]"
									>{name.charAt(0).toUpperCase()}</span
								>
							{/if}
						</div>

						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<span class="truncate text-[13px] font-semibold">{name}</span>
								{#if pending}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#f0d9a8] bg-[#fdf6e7] px-2 py-0.5 text-[10px] font-semibold text-[#8A6A24]"
									>
										<Clock class="h-3 w-3" /> Menunggu aktivasi
									</span>
								{:else}
									<span
										class="inline-flex items-center gap-1 rounded-full border border-[#c4e5d3] bg-[#eef8f2] px-2 py-0.5 text-[10px] font-semibold text-[#1A7A52]"
									>
										<BadgeCheck class="h-3 w-3" /> Aktif
									</span>
								{/if}
							</div>
							<p class="truncate text-[11px] text-[#5A5A5A]">
								{admin.email}{admin.username ? ` • @${admin.username}` : ''}
							</p>
						</div>

						<div class="flex items-center gap-2">
							{#if pending}
								<Button
									size="sm"
									disabled={busyId === admin.id}
									onclick={() => void setStatus(admin, 'activate')}
								>
									{busyId === admin.id ? 'Memproses…' : 'Aktifkan Akun'}
								</Button>
							{:else}
								<Button
									variant="outline"
									size="sm"
									disabled={busyId === admin.id}
									onclick={() => void setStatus(admin, 'deactivate')}
								>
									<XCircle class="h-3.5 w-3.5" />
									{busyId === admin.id ? 'Memproses…' : 'Nonaktifkan'}
								</Button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Owner row -->
	{#if data.owner}
		{@const name = profileDisplayName(data.owner)}
		<div
			class="mt-4 flex flex-wrap items-center gap-3 rounded-[12px] border bg-white px-4 py-3"
			style="border-color: var(--border);"
		>
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-[#F5F5F4]"
				style="border-color: var(--border);"
			>
				{#if profileImageUrl(data.owner)}
					<img src={profileImageUrl(data.owner)} alt="" class="h-full w-full object-cover" />
				{:else}
					<span class="text-[13px] font-semibold text-[#5A5A5A]"
						>{name.charAt(0).toUpperCase()}</span
					>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<span class="truncate text-[13px] font-semibold">{name}</span>
					<span
						class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
						style="border-color: var(--border); background: #f5f5f4; color: #242424;"
					>
						<ShieldCheck class="h-3 w-3" /> Owner
					</span>
				</div>
				<p class="truncate text-[11px] text-[#5A5A5A]">
					{data.owner.email}{data.owner.username ? ` • @${data.owner.username}` : ''} • akses penuh, tidak
					bisa dinonaktifkan
				</p>
			</div>
		</div>
	{/if}
</div>
