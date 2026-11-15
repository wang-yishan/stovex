<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '#lib/utils.js';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> = $props();
</script>

<!--
	Bag Store switch.

	Built on bits-ui, so it exposes `bind:checked`, proper `role="switch"` /
	`aria-checked` semantics, keyboard interaction, and an optional hidden
	input for form submission (when `name` is provided).

	Colours come from tokens (`--primary` / `--muted` for the track,
	`--card` for the thumb, `--ring` for focus) so it renders correctly in
	light and dark mode — see `src/routes/layout.css`.
-->
<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	class={cn(
		'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0.5 shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class={cn(
			'pointer-events-none block h-5 w-5 rounded-full bg-card shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
		)}
	/>
</SwitchPrimitive.Root>
