<script lang="ts">
	import { Label as LabelPrimitive } from 'bits-ui';
	import { cn } from '#lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: LabelPrimitive.RootProps = $props();
</script>

<!--
	Bag Store form label — 11px uppercase tracked caption, matching the
	dashboard's field captions (`--muted-foreground` for AA contrast).
-->
<LabelPrimitive.Root
	bind:ref
	data-slot="label"
	class={cn(
		'text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
		className
	)}
	{...restProps}
/>
