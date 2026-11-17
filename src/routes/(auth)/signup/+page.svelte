<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign up</title>
</svelte:head>

<div class="rounded-[12px] border bg-white p-6 shadow-sm" style="border-color: var(--border);">
	<div class="mb-6 text-center">
		<h1 class="text-[22px] font-semibold tracking-tight text-[#242424]">Create account</h1>
		<p class="mt-1 text-[13px] text-[#5A5A5A]">Set up access to your dashboard</p>
	</div>

	{#if form?.message}
		<div
			class="mb-4 rounded-md border border-[#f0c2c0] bg-[#fef2f2] px-3 py-2 text-[13px] text-[#A33A37]"
		>
			{form.message}
		</div>
	{/if}

	{#if data.googleEnabled}
		<form method="POST" action="?/google" class="mb-4">
			<Button type="submit" variant="outline" class="w-full">Continue with Google</Button>
		</form>
		<div class="mb-4 flex items-center gap-3 text-[12px] text-[#636363]">
			<div class="h-px flex-1 bg-[#EAEAEA]"></div>
			<span>or</span>
			<div class="h-px flex-1 bg-[#EAEAEA]"></div>
		</div>
	{/if}

	<form method="POST" action="?/signUp" class="space-y-4">
		<div class="space-y-1.5">
			<Label for="name">Name</Label>
			<Input
				id="name"
				name="name"
				type="text"
				autocomplete="name"
				required
				value={form?.name ?? ''}
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="username">Username</Label>
			<Input
				id="username"
				name="username"
				type="text"
				autocomplete="username"
				required
				value={form?.username ?? ''}
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="email">Email</Label>
			<Input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="password">Password</Label>
			<Input
				id="password"
				name="password"
				type="password"
				autocomplete="new-password"
				required
				minlength={8}
			/>
		</div>
		<Button type="submit" class="w-full">Create account</Button>
	</form>

	<p class="mt-5 text-center text-[13px] text-[#5A5A5A]">
		Already have an account?
		<a href="/login" class="font-medium text-[#242424] underline underline-offset-2">Log in</a>
	</p>
</div>