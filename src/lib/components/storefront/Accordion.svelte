<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';

	export interface AccordionItem {
		id: string;
		title: string;
		paragraphs?: string[];
		facts?: { label: string; value: string }[];
	}

	interface Props {
		items: AccordionItem[];
		/** Id of the item open on first render. */
		open?: string | null;
	}

	let { items, open = null }: Props = $props();

	// `open` only seeds the first render; user toggles take over from there.
	let toggled = $state<string | null | undefined>(undefined);
	let expanded = $derived(toggled === undefined ? open : toggled);

	function toggle(id: string) {
		toggled = expanded === id ? null : id;
	}
</script>

<div class="border-t border-[#EAE8E4]">
	{#each items as item (item.id)}
		<div class="border-b border-[#EAE8E4]">
			<button
				type="button"
				class="flex w-full items-center justify-between gap-4 py-5 text-left"
				aria-expanded={expanded === item.id}
				onclick={() => toggle(item.id)}
			>
				<span class="text-[10px] tracking-[0.16em] uppercase">{item.title}</span>
				<ChevronDown
					class="h-4 w-4 shrink-0 transition-transform duration-200 {expanded === item.id
						? 'rotate-180'
						: ''}"
					strokeWidth={1.6}
				/>
			</button>

			{#if expanded === item.id}
				<div class="pb-6">
					{#if item.paragraphs}
						{#each item.paragraphs as paragraph, i (i)}
							<p class="text-[12px] leading-6 text-[#77736E] {i > 0 ? 'mt-3' : ''}">
								{paragraph}
							</p>
						{/each}
					{/if}

					{#if item.facts}
						<dl class="grid grid-cols-2 gap-y-4 text-[11px]">
							{#each item.facts as fact (fact.label)}
								<div>
									<dt class="mb-1 text-[#77736E]">{fact.label}</dt>
									<dd>{fact.value}</dd>
								</div>
							{/each}
						</dl>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
