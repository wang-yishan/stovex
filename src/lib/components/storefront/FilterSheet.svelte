<script lang="ts">
	import { X } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Whether the sheet is open. */
		open: boolean;
		/** Called when the sheet should close. */
		onclose: () => void;
		/** Panel contents. */
		children: Snippet;
		/** Sticky footer, usually the apply/reset actions. */
		footer?: Snippet;
	}

	let { open, onclose, children, footer }: Props = $props();

	let panel = $state<HTMLElement | null>(null);

	// Move focus into the sheet when it opens, and back to the control that
	// opened it when it closes. `panel` is read untracked so binding it does
	// not re-run the effect and capture the wrong element.
	$effect(() => {
		if (!open) return;
		const previous = document.activeElement as HTMLElement | null;
		untrack(() => panel?.focus());
		return () => {
			previous?.focus?.();
		};
	});

	// Lock the page behind the sheet so the list cannot scroll underneath.
	$effect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.preventDefault();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-brand-ink/40 backdrop-blur-[2px]"
			aria-label="Tutup filter"
			onclick={onclose}
		></button>

		<!-- Sheet -->
		<div
			bind:this={panel}
			class="relative flex max-h-[88vh] w-full max-w-lg flex-col bg-brand-surface shadow-[0_-18px_50px_rgba(36,36,36,0.18)]"
			role="dialog"
			aria-modal="true"
			aria-label="Filter produk"
			tabindex="-1"
		>
			<!-- Grab handle -->
			<div class="flex justify-center pt-3 pb-1">
				<span class="h-1 w-10 rounded-full bg-[#D8D5CC]"></span>
			</div>

			<header class="flex items-center justify-between border-b border-brand-border px-5 py-4">
				<h2 class="font-display text-xl">Filter</h2>
				<button
					type="button"
					class="-mr-2 p-2 text-brand-muted transition hover:text-brand-ink"
					aria-label="Tutup filter"
					onclick={onclose}
				>
					<X class="h-5 w-5" strokeWidth={1.6} />
				</button>
			</header>

			<div class="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
				{@render children()}
			</div>

			{#if footer}
				<div
					class="border-t border-brand-border bg-brand-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
