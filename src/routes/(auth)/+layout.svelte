<script lang="ts">
	import type { LayoutProps } from './$types';
	import { admin } from '#lib/admin/state.svelte.ts';
	import { PHOTO_POOL } from '#lib/catalog/photos.ts';
	import BrandWordmark from '#lib/components/storefront/BrandWordmark.svelte';

	let { children }: LayoutProps = $props();

	const brand = $derived(admin.settings.brand);
	const seo = $derived(admin.settings.defaultSeo);

	// Stand-in editorial frame for the auth panel — swap for the merchant's
	// own photograph (e.g. /images/auth.jpg) when one is available.
	const panelPhoto = PHOTO_POOL[1]!;

	const year = new Date().getFullYear();
</script>

<!--
	Auth shell — editorial split: a brand panel on the left (photograph,
	wordmark, tagline) and the form column on the right.

	Light and dark both render from the global tokens (`bg-background`,
	`text-foreground`, `border-border`, …), so the surface stays bright in
	light mode and inverts with `.dark`. The display face comes from the
	merchant's brand font (`font-display`).
-->
<div class="flex min-h-screen bg-background font-brand-body text-foreground">
	<aside class="relative hidden w-1/2 lg:block">
		<img
			src={panelPhoto}
			alt=""
			loading="eager"
			decoding="async"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/40 dark:bg-black/55"></div>

		<div class="relative flex h-full flex-col justify-between p-10 xl:p-14">
			<a href="/" class="inline-block w-fit">
				<BrandWordmark class="font-display text-xl tracking-[0.22em] text-white" />
			</a>

			<div class="max-w-md">
				<p class="mb-4 text-[10px] tracking-[0.32em] text-white/70 uppercase">
					{brand.name}
				</p>
				<h2 class="font-display text-4xl leading-[1.15] text-white xl:text-5xl">
					{brand.tagline}
				</h2>
				<p class="mt-5 text-sm leading-6 text-white/85">{seo.description}</p>
			</div>

			<p class="text-[10px] tracking-[0.24em] text-white/60 uppercase">
				© {year} {brand.name}
			</p>
		</div>
	</aside>

	<section class="flex flex-1 items-center justify-center px-6 py-12">
		<div class="w-full max-w-[400px]">
			<div class="mb-10 text-center lg:hidden">
				<a href="/" class="inline-block">
					<BrandWordmark class="font-display text-2xl tracking-[0.2em] text-foreground" />
				</a>
				<p class="mt-2 text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
					{brand.tagline}
				</p>
			</div>

			{@render children()}
		</div>
	</section>
</div>
