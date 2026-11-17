<script lang="ts">
	import { resolve } from '$app/paths';
	import Topbar from '#lib/admin/components/Topbar.svelte';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Check,
		Gem,
		Handbag,
		Link,
		PackageOpen,
		PersonStanding,
		Sparkles,
		Store,
		Shirt,
		Upload,
		Watch
	} from '@lucide/svelte';

	const slots = [
		{ id: 'shirt', label: 'Shirt', hint: 'Baju / tops', icon: Shirt },
		{ id: 'pants', label: 'Pants', hint: 'Celana / bottoms', icon: PersonStanding },
		{ id: 'watch', label: 'Watch', hint: 'Jam / wrist', icon: Watch },
		{ id: 'accessory', label: 'Accessories', hint: 'Aksesoris', icon: Gem },
		{ id: 'bag', label: 'Bag', hint: 'Tas', icon: Handbag }
	];

	const sources = [
		{ id: 'store', label: 'From Store', icon: Store },
		{ id: 'marketplace', label: 'Marketplace Link', icon: Link },
		{ id: 'upload', label: 'Upload Own', icon: Upload }
	];

	const plan = [
		'Bundle is published as 1 combined product with its own price, cover image and stock.',
		'Each slot is filled from your own store — product + its gallery images come along.',
		'Or paste a marketplace product link: title, price and image are pulled in as a reference item.',
		'Or upload your own image and type the item details manually.',
		'Bundle stock follows the most limited item, so you never oversell.'
	];
</script>

<Topbar
	crumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Product Bundles' }]}
	title="Product Bundles"
	subtitle="Combine several products into one bundle."
	mobileSubtitle="Bundle builder • Upcoming feature"
>
	{#snippet badge()}
		<span
			class="inline-flex items-center gap-1 rounded-full border bg-[#F5F5F4] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#5A5A5A] uppercase"
			style="border-color: var(--border);"
		>
			<Sparkles class="h-3 w-3" strokeWidth={2} />
			Upcoming
		</span>
	{/snippet}
</Topbar>

<div class="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 lg:px-8">
	<!-- intro -->
	<div
		class="mb-4 flex items-start gap-3 rounded-[12px] border bg-white p-4 sm:p-5"
		style="border-color: var(--border);"
	>
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#F5F5F4]"
			style="border-color: var(--border);"
		>
			<PackageOpen class="h-5 w-5 text-[#636363]" strokeWidth={1.6} />
		</div>
		<div class="min-w-0">
			<h2 class="text-[14px] font-semibold text-[#242424]">Bundle Builder — Module coming</h2>
			<p class="mt-1 text-[12px] text-[#5A5A5A]">
				Mockup of the upcoming product bundle feature. Fill one bundle from several sources — your
				store, other marketplaces, or your own uploads — and sell it as a single product.
			</p>
		</div>
	</div>

	<div class="grid gap-4 lg:grid-cols-[1fr_320px]">
		<!-- bundle builder mockup -->
		<div
			class="rounded-[12px] border bg-white p-4 sm:p-5"
			style="border-color: var(--border);"
		>
			<div class="mb-3 flex items-center justify-between gap-2">
				<h3 class="text-[13px] font-semibold text-[#242424]">Bundle slots</h3>
				<span class="text-[11px] text-[#636363]">0 / 5 filled</span>
			</div>

			<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
				{#each slots as slot (slot.id)}
					<div
						class="flex flex-col gap-2 rounded-[12px] border p-2.5"
						style="border-color: var(--border);"
					>
						<div
							class="flex aspect-square w-full items-center justify-center rounded-[8px] border border-dashed bg-[#F5F5F4]"
							style="border-color: var(--border);"
						>
							<slot.icon class="h-6 w-6 text-[#999]" strokeWidth={1.6} />
						</div>
						<div class="min-w-0">
							<div class="truncate text-[12px] font-medium text-[#242424]">{slot.label}</div>
							<div class="truncate text-[10px] text-[#636363]">{slot.hint}</div>
						</div>
						<div class="flex flex-wrap gap-1">
							{#each sources as source (source.id)}
								<span
									class="inline-flex items-center gap-1 rounded-full border bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#636363]"
									style="border-color: var(--border);"
								>
									<source.icon class="h-3 w-3" strokeWidth={1.6} />
									{source.label}
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- bundle summary mockup -->
		<div
			class="flex flex-col gap-3 rounded-[12px] border bg-white p-4 sm:p-5"
			style="border-color: var(--border);"
		>
			<h3 class="text-[13px] font-semibold text-[#242424]">Bundle summary</h3>

			<div
				class="flex aspect-video w-full items-center justify-center rounded-[8px] border border-dashed bg-[#F5F5F4]"
				style="border-color: var(--border);"
			>
				<span class="text-[11px] text-[#999]">Bundle cover image</span>
			</div>

			<div class="space-y-2 text-[12px]">
				<div class="flex items-center justify-between gap-2">
					<span class="text-[#636363]">Name</span>
					<span class="truncate font-medium text-[#999]">Not set yet</span>
				</div>
				<div class="flex items-center justify-between gap-2">
					<span class="text-[#636363]">Total (sum of items)</span>
					<span class="mono font-medium text-[#999]">—</span>
				</div>
				<div class="flex items-center justify-between gap-2">
					<span class="text-[#636363]">Bundle price</span>
					<span class="mono font-medium text-[#999]">—</span>
				</div>
				<div class="flex items-center justify-between gap-2">
					<span class="text-[#636363]">Stock</span>
					<span class="font-medium text-[#999]">Follows limited item</span>
				</div>
			</div>

			<Button variant="outline" class="w-full" disabled>
				<PackageOpen class="h-4 w-4" strokeWidth={1.6} />
				Not available yet
			</Button>
		</div>
	</div>

	<!-- planned feature bullets -->
	<div
		class="mt-4 rounded-[12px] border bg-white p-4 sm:p-5"
		style="border-color: var(--border);"
	>
		<h3 class="mb-3 text-[13px] font-semibold text-[#242424]">How it will work</h3>
		<ul class="grid gap-2 sm:grid-cols-2">
			{#each plan as item (item)}
				<li class="flex items-start gap-2 text-[12px] text-[#5A5A5A]">
					<span
						class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F5F5F4]"
					>
						<Check class="h-3 w-3 text-[#636363]" strokeWidth={2} />
					</span>
					{item}
				</li>
			{/each}
		</ul>
		<a
			href={resolve('/dashboard')}
			class="mt-4 inline-flex h-10 items-center justify-center rounded-full border bg-white px-4 text-[12px] font-medium transition hover:border-[#242424]"
			style="border-color: var(--border);"
		>
			Back to Overview
		</a>
	</div>
</div>
