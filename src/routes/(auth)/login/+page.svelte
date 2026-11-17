<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Log in</title>
</svelte:head>

<div class="rounded-[12px] border bg-white p-6 shadow-sm" style="border-color: var(--border);">
	<div class="mb-6 text-center">
		<h1 class="text-[22px] font-semibold tracking-tight text-[#242424]">Log in</h1>
		<p class="mt-1 text-[13px] text-[#5A5A5A]">Access your dashboard</p>
	</div>

	{#if data.pending}
		<div
			class="mb-4 rounded-md border border-[#f0d9a8] bg-[#fdf6e7] px-3 py-2 text-[13px] text-[#8A6A24]"
		>
			Pendaftaran berhasil — akun admin Anda <strong>menunggu aktivasi owner</strong>. Anda akan
			bisa masuk ke dashboard setelah owner mengaktifkan akun ini dari daftar admin.
		</div>
	{/if}

	{#if form?.message}
		<div
			class="mb-4 rounded-md border border-[#f0c2c0] bg-[#fef2f2] px-3 py-2 text-[13px] text-[#A33A37]"
		>
			{form.message}
		</div>
	{/if}

	{#if data.googleEnabled}
		<form method="POST" action="?/google" class="mb-4">
			<input type="hidden" name="next" value={data.next} />
			<Button type="submit" variant="outline" class="w-full">Continue with Google</Button>
		</form>
		<div class="mb-4 flex items-center gap-3 text-[12px] text-[#636363]">
			<div class="h-px flex-1 bg-[#EAEAEA]"></div>
			<span>or</span>
			<div class="h-px flex-1 bg-[#EAEAEA]"></div>
		</div>
	{/if}

	<form method="POST" action="?/signIn" class="space-y-4">
		<input type="hidden" name="next" value={data.next} />
		<div class="space-y-1.5">
			<Label for="identifier">Email or username</Label>
			<Input
				id="identifier"
				name="identifier"
				type="text"
				autocomplete="username"
				required
				value={form?.identifier ?? ''}
				placeholder="you@example.com or username"
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="password">Password</Label>
			<Input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/>
		</div>
		<Button type="submit" class="w-full">Log in</Button>
	</form>

	<p class="mt-5 text-center text-[13px] text-[#5A5A5A]">
		Don't have an account?
		<a href="/signup" class="font-medium text-[#242424] underline underline-offset-2">Sign up</a>
	</p>
</div>
