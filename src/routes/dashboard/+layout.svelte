<script lang="ts">
	import Sidebar from '#lib/admin/components/Sidebar.svelte';
	import MobileTabs from '#lib/admin/components/MobileTabs.svelte';
	import MoreSheet from '#lib/admin/components/MoreSheet.svelte';
	import Toast from '#lib/admin/components/Toast.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!--
	@component
	Admin chrome shell under /dashboard (converted from ref dashboard root).
-->

<div
	class="admin-root min-h-screen w-full flex flex-col"
	style="background: var(--bg); padding-top: var(--safe-area-inset-top); box-sizing: border-box;"
>
	<div class="flex flex-1 w-full overflow-x-clip relative">
		<Sidebar />
		<main class="flex-1 min-w-0 bg-[#F8F8F7] relative">
			{@render children()}
		</main>
	</div>

	<MobileTabs />
	<MoreSheet />
	<Toast />
</div>
