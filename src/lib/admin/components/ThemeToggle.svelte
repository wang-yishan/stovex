<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';
</script>

<!--
	@component
	Theme toggle (shadcn-svelte pattern, via mode-watcher):
	Sun shows in light mode, Moon in dark mode. Persists via mode-watcher
	localStorage and adds the `dark` class on <html>.
-->

<button
	type="button"
	onclick={toggleMode}
	aria-label="Toggle theme"
	class="relative h-9 w-9 rounded-full border bg-white flex items-center justify-center overflow-hidden hover:border-[#242424] transition shrink-0"
	style="border-color: var(--border);"
>
	<span
		class="absolute inset-0 flex items-center justify-center transition-all duration-300 {mode.current === 'dark'
			? 'rotate-90 scale-0 opacity-0'
			: 'rotate-0 scale-100 opacity-100'}"
	>
		<Sun class="h-4 w-4" strokeWidth={1.6} />
	</span>
	<span
		class="absolute inset-0 flex items-center justify-center transition-all duration-300 {mode.current === 'dark'
			? 'rotate-0 scale-100 opacity-100'
			: '-rotate-90 scale-0 opacity-0'}"
	>
		<Moon class="h-4 w-4" strokeWidth={1.6} />
	</span>
	<span class="sr-only">Toggle theme</span>
</button>
