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

<div class="mb-9">
	<h1 class="font-display text-[32px] leading-tight text-foreground">Verify your email</h1>
	<p class="mt-3 text-sm leading-6 text-muted-foreground">
		Enter the 6-digit code sent to your email.
	</p>
</div>

{#if form?.message}
	<div
		class="mb-5 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger-text"
	>
		{form.message}
	</div>
{/if}

{#if form?.sent}
	<div
		class="mb-5 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-[13px] text-success-text"
	>
		A new code has been sent.
	</div>
{/if}

<form method="POST" action="?/verify" class="space-y-4">
	<div>
		<Label for="email" class="mb-2 block">Email</Label>
		<Input
			id="email"
			name="email"
			type="email"
			required
			value={email}
			size="lg"
			class="rounded-[4px]"
		/>
	</div>
	<div>
		<Label for="otp" class="mb-2 block">Verification code</Label>
		<Input
			id="otp"
			name="otp"
			type="text"
			inputmode="numeric"
			autocomplete="one-time-code"
			required
			maxlength={6}
			placeholder="123456"
			size="lg"
			class="rounded-[4px]"
		/>
	</div>
	<Button
		type="submit"
		class="h-12 w-full rounded-[4px] text-[11px] tracking-[0.2em] uppercase sm:h-12"
	>
		Verify
	</Button>
</form>

<form method="POST" action="?/resend" class="mt-3">
	<input type="hidden" name="email" value={email} />
	<Button
		type="submit"
		variant="outline"
		class="h-12 w-full rounded-[4px] text-[11px] tracking-[0.2em] uppercase sm:h-12"
	>
		Resend code
	</Button>
</form>

<p class="mt-8 text-center text-sm text-muted-foreground">
	<a href="/login" class="font-medium text-foreground underline underline-offset-4">
		Back to log in
	</a>
</p>
