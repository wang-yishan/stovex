<script lang="ts">
	import Modal from './Modal.svelte';

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

	const confirmClass = $derived(
		danger
			? 'bg-[#D9534F] text-white'
			: 'bg-[#242424] text-white'
	);
</script>

<!--
	@component
	Confirmation modal on the generic Modal (ref delete/confirm flows + arm checkbox).
-->

<Modal title={title}>
	<p class="text-[12px] text-[#777] mt-1">{body}</p>

	{#if note}
		<div class="bg-[#FFF0F0] border rounded-[8px] p-2 mt-3" style="border-color: #F2C2C0;">
			<p class="text-[11px] text-[#A33A37]">{note}</p>
		</div>
	{/if}

	{#if requireArm}
		<label class="flex items-center gap-2 mt-3 text-[12px]">
			<input
				type="checkbox"
				bind:checked={armed}
				class="rounded"
			/>
			{armLabel}
		</label>
	{/if}

	<div class="flex gap-2 mt-4">
		<button
			type="button"
			disabled={requireArm && !armed}
			class="flex-1 h-8 rounded-full text-[12px] font-medium transition disabled:opacity-50 {confirmClass}"
			onclick={() => {
				armed = false;
				onconfirm();
			}}
		>
			{confirmLabel}
		</button>
		<button
			type="button"
			class="flex-1 h-8 rounded-full border bg-white text-[12px] font-medium transition hover:border-[#242424]"
			style="border-color: var(--border);"
			onclick={oncancel}
		>
			Cancel
		</button>
	</div>
</Modal>
