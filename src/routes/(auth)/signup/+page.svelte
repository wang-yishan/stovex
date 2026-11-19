<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Input } from '#lib/components/ui/input/index.ts';
	import { Label } from '#lib/components/ui/label/index.ts';
	import type { ActionData, PageData } from './$types';
	import { admin } from '#lib/admin/state.svelte.ts';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const brand = $derived(admin.settings.brand);
</script>

<svelte:head>
	<title>Sign up</title>
</svelte:head>

<div class="mb-9">
	<h1 class="font-display text-[32px] leading-tight text-foreground">Create an account</h1>
	<p class="mt-3 text-sm leading-6 text-muted-foreground">
		Set up access to your {brand.name} dashboard.
	</p>
</div>

{#if form?.message}
	<div
		class="mb-5 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger-text"
	>
		{form.message}
	</div>
{/if}

{#if data.googleEnabled}
	<form method="POST" action="?/google" class="mb-5">
		<Button
			type="submit"
			variant="outline"
			class="h-12 w-full gap-3 rounded-[4px] text-[13px] sm:h-12"
		>
			<svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
				<path
					fill="#4285F4"
					d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45c-.28 1.5-1.12 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
				/>
				<path
					fill="#34A853"
					d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1C3.26 21.3 7.31 24 12 24z"
				/>
				<path
					fill="#FBBC05"
					d="M5.29 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29v-3.1H1.29C.47 8.25 0 10.07 0 12s.47 3.75 1.29 5.4l4-3.11z"
				/>
				<path
					fill="#EA4335"
					d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l4 3.1c.94-2.83 3.59-4.94 6.71-4.94z"
				/>
			</svg>
			Continue with Google
		</Button>
	</form>

	<div class="mb-6 flex items-center gap-4">
		<div class="h-px flex-1 bg-border"></div>
		<span class="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
			Or continue with email
		</span>
		<div class="h-px flex-1 bg-border"></div>
	</div>
{/if}

<form method="POST" action="?/signUp" class="space-y-4">
	<div>
		<Label for="name" class="mb-2 block">Name</Label>
		<Input
			id="name"
			name="name"
			type="text"
			autocomplete="name"
			required
			value={form?.name ?? ''}
			size="lg"
			class="rounded-[4px]"
		/>
	</div>
	<div>
		<Label for="username" class="mb-2 block">Username</Label>
		<Input
			id="username"
			name="username"
			type="text"
			autocomplete="username"
			required
			value={form?.username ?? ''}
			size="lg"
			class="rounded-[4px]"
		/>
	</div>
	<div>
		<Label for="email" class="mb-2 block">Email</Label>
		<Input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			required
			value={form?.email ?? ''}
			size="lg"
			class="rounded-[4px]"
		/>
	</div>
	<div>
		<Label for="password" class="mb-2 block">Password</Label>
		<Input
			id="password"
			name="password"
			type="password"
			autocomplete="new-password"
			required
			minlength={8}
			size="lg"
			class="rounded-[4px]"
		/>
	</div>
	<Button
		type="submit"
		class="h-12 w-full rounded-[4px] text-[11px] tracking-[0.2em] uppercase sm:h-12"
	>
		Create account
	</Button>
</form>

<p class="mt-8 text-center text-sm text-muted-foreground">
	Already have an account?
	<a href="/login" class="ml-2 font-medium text-foreground underline underline-offset-4">Log in</a>
</p>
