<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-[#F8F8F7] px-4 py-12">
	<div class="w-full max-w-[420px]">
		{@render children()}
	</div>
</div>