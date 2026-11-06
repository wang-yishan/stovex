<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { CircleCheckIcon } from '@lucide/svelte';

	/* Ref: 2800ms auto-dismiss, keyed on toast identity (docs' canonical timer-toast effect). */
	$effect(() => {
		const id = admin.toast?.id;
		if (!id) return;
		const t = setTimeout(() => {
			if (admin.toast?.id === id) admin.clearToast();
		}, 2800);
		return () => clearTimeout(t);
	});
</script>

<!--
	@component
	Global toast pill, bottom-center (converted from ref Toast host).
-->

{#if admin.toast}
	<div
		class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-full text-[12px] font-medium shadow-lg border backdrop-blur flex items-center gap-2 {admin
			.toast.type === 'success'
			? 'bg-[#F0FAF6] border-[#C7EBDB] text-[#1A7A52]'
			: 'bg-white border-[#EAEAEA] text-[#242424]'}"
	>
		<CircleCheckIcon className="h-4 w-4" />
		{admin.toast.msg}
	</div>
{/if}
