<script lang="ts">
	import Modal from './Modal.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import { Checkbox } from '#lib/components/ui/checkbox/index.ts';

	let {
		title,
		body,
		note,
		confirmLabel = 'Confirm',
		danger = false,
		requireArm = false,
		armLabel = 'I understand this action is permanent',
		onconfirm,
		oncancel
	}: {
		title: string;
		body: string;
		/** Optional highlighted note rendered as a red box (ref delete-note variant). */
		note?: string;
		confirmLabel?: string;
		danger?: boolean;
		requireArm?: boolean;
		armLabel?: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	let armed = $state(false);
</script>

<!--
	@component
	Confirmation modal on the generic Modal (ref delete/confirm flows + arm checkbox).
-->

<Modal {title}>
	<p class="mt-1 text-[12px] text-muted-foreground">{body}</p>

	{#if note}
		<div class="mt-3 rounded-[8px] border border-destructive/30 bg-destructive/10 p-2">
			<p class="text-[11px] text-destructive">{note}</p>
		</div>
	{/if}

	{#if requireArm}
		<label class="mt-3 flex items-center gap-2 text-[12px]">
			<Checkbox bind:checked={armed} />
			{armLabel}
		</label>
	{/if}

	<div class="mt-4 flex gap-2">
		<Button
			variant={danger ? 'destructive' : 'default'}
			class="flex-1"
			disabled={requireArm && !armed}
			onclick={() => {
				armed = false;
				onconfirm();
			}}
		>
			{confirmLabel}
		</Button>
		<Button variant="outline" class="flex-1" onclick={oncancel}>Cancel</Button>
	</div>
</Modal>
