<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import { Button } from '#lib/components/ui/button/index.ts';
</script>

<!--
	@component
	Theme toggle (shadcn-svelte pattern, via mode-watcher):
	Sun shows in light mode, Moon in dark mode. Persists via mode-watcher
	localStorage and adds the `dark` class on <html>.
-->

<Button
	variant="outline"
	size="icon"
	onclick={toggleMode}
	aria-label="Toggle theme"
	class="relative shrink-0 overflow-hidden"
>
	<span
		class="absolute inset-0 flex items-center justify-center transition-all duration-300 {mode.current ===
		'dark'
			? 'scale-0 rotate-90 opacity-0'
			: 'scale-100 rotate-0 opacity-100'}"
	>
		<Sun class="h-4 w-4" strokeWidth={1.6} />
	</span>
	<span
		class="absolute inset-0 flex items-center justify-center transition-all duration-300 {mode.current ===
		'dark'
			? 'scale-100 rotate-0 opacity-100'
			: 'scale-0 -rotate-90 opacity-0'}"
	>
		<Moon class="h-4 w-4" strokeWidth={1.6} />
	</span>
	<span class="sr-only">Toggle theme</span>
</Button>
