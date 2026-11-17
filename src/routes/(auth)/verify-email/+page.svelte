<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let email = $derived(form?.email ?? data.email ?? '');
</script>

<svelte:head>
	<title>Verify email</title>
</svelte:head>

<div class="rounded-[12px] border bg-white p-6 shadow-sm" style="border-color: var(--border);">
	<div class="mb-6 text-center">
		<h1 class="text-[22px] font-semibold tracking-tight text-[#242424]">Verify your email</h1>
		<p class="mt-1 text-[13px] text-[#5A5A5A]">Enter the 6-digit code sent to your email.</p>
	</div>

	{#if form?.message}
		<div
			class="mb-4 rounded-md border border-[#f0c2c0] bg-[#fef2f2] px-3 py-2 text-[13px] text-[#A33A37]"
		>
			{form.message}
		</div>
	{/if}

	{#if form?.sent}
		<div
			class="mb-4 rounded-md border border-[#b7e4c7] bg-[#f0fdf4] px-3 py-2 text-[13px] text-[#166534]"
		>
			A new code has been sent.
		</div>
	{/if}

	<form method="POST" action="?/verify" class="space-y-4">
		<div class="space-y-1.5">
			<Label for="email">Email</Label>
			<Input id="email" name="email" type="email" required value={email} />
		</div>
		<div class="space-y-1.5">
			<Label for="otp">Verification code</Label>
			<Input
				id="otp"
				name="otp"
				type="text"
				inputmode="numeric"
				autocomplete="one-time-code"
				required
				maxlength={6}
				placeholder="123456"
			/>
		</div>
		<Button type="submit" class="w-full">Verify</Button>
	</form>

	<form method="POST" action="?/resend" class="mt-3">
		<input type="hidden" name="email" value={email} />
		<Button type="submit" variant="outline" class="w-full">Resend code</Button>
	</form>

	<p class="mt-5 text-center text-[13px] text-[#5A5A5A]">
		<a href="/login" class="font-medium text-[#242424] underline underline-offset-2">Back to log in</a>
	</p>
</div>