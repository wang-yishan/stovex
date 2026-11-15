<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { cart } from '#lib/catalog/cart.svelte.ts';
	import { formatIDR } from '#lib/admin/data.ts';
	import { generalWaLinkWithGreeting } from '#lib/catalog/wa.ts';
	import { catalogHref } from '#lib/catalog/links.ts';
	import BrandWordmark from '#lib/components/storefront/BrandWordmark.svelte';
	import { Menu, MessageCircle, Search, ShoppingBag, Trash2, X } from '@lucide/svelte';

	interface Props {
		/**
		 * Prefix for in-page anchors. '' on the landing page (same page),
		 * '/' on the /catalog routes (must go back to the landing page).
		 */
		base?: string;
	}

	let { base = '' }: Props = $props();

	let mobileMenuOpen = $state(false);

	const ANCHOR_MAP: Record<string, string> = {
		'#shop': 'koleksi',
		'#categories': 'koleksi',
		'#about': 'cerita',
		'#products': 'koleksi',
		'#contact': 'kontak'
	};

	let navLinks = $derived(
		admin.settings.headerLinks.map((l) => {
			const anchor = ANCHOR_MAP[l.href] ?? l.href.replace('#', '');
			return { ...l, href: `${base}#${anchor}` };
		})
	);
</script>

<!--
	Storefront header — shared by the landing page and the /catalog routes.
	Announcement strip, wordmark, section nav, search, cart and WhatsApp.
-->

<div class="bg-brand-ink px-4 py-2 text-center text-[11px] tracking-[0.12em] text-white sm:text-xs">
	FREE SHIPPING untuk pembelian di atas Rp750.000
	<span class="mx-1 text-[#D69A35]">✦</span>
	Pengiriman ke seluruh Indonesia
</div>

<header class="sticky top-0 z-40 border-b border-brand-border bg-brand-surface/95 backdrop-blur">
	<div
		class="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12"
	>
		<button
			type="button"
			class="-ml-2 p-2 lg:hidden"
			aria-label="Buka menu"
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
		>
			<Menu class="h-5 w-5" strokeWidth={1.6} />
		</button>

		<a href={base || '/'} class="flex shrink-0 items-center gap-2 overflow-hidden">
			<BrandWordmark
				image
				class="text-[25px] leading-none font-semibold tracking-[0.18em]"
			/>
		</a>

		<nav class="hidden items-center gap-9 text-[13px] tracking-wide text-brand-ink/80 lg:flex">
			{#each navLinks as link (link.id)}
				<a class="nav-link" href={link.href}>{link.label}</a>
			{/each}
			<a class="nav-link" href={catalogHref()}>Katalog</a>
		</nav>

		<div class="flex items-center gap-4 sm:gap-5">
			<a
				href={catalogHref()}
				class="hidden items-center gap-2 text-[13px] text-brand-ink/80 transition hover:text-brand-accent sm:flex"
			>
				<Search class="h-4 w-4" strokeWidth={1.6} />
				Cari tas
			</a>

			<a
				href={generalWaLinkWithGreeting('saya butuh bantuan.')}
				target="_blank"
				rel="noopener"
				class="inline-flex items-center gap-2 text-[13px] text-brand-ink/80 transition hover:text-brand-accent"
			>
				<MessageCircle class="h-4 w-4" strokeWidth={1.6} />
				<span class="hidden sm:inline">WhatsApp</span>
			</a>

			<div class="relative">
				<button
					type="button"
					class="relative p-1"
					aria-label="Keranjang belanja"
					aria-expanded={cart.open}
					onclick={() => cart.toggle()}
				>
					<ShoppingBag class="h-5 w-5" strokeWidth={1.6} />
					{#if cart.count > 0}
						<span
							class="absolute -top-2 -right-2 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-brand-accent text-[9px] text-white"
						>
							{cart.count}
						</span>
					{/if}
				</button>

				{#if cart.open}
					<div
						class="absolute top-full right-0 z-50 mt-3 w-[300px] border border-brand-border bg-white p-4 shadow-[0_14px_45px_rgba(36,36,36,0.12)]"
					>
						<div class="mb-3 flex items-center justify-between">
							<p class="text-[11px] tracking-[0.18em] text-brand-muted uppercase">Keranjang</p>
							<button
								type="button"
								class="text-brand-muted hover:text-brand-ink"
								aria-label="Tutup keranjang"
								onclick={() => (cart.open = false)}
							>
								<X class="h-4 w-4" strokeWidth={1.6} />
							</button>
						</div>

						{#if cart.lines.length === 0}
							<p class="py-3 text-[12px] text-brand-muted">Keranjang masih kosong.</p>
						{:else}
							<ul class="flex max-h-[220px] flex-col gap-2 overflow-y-auto">
								{#each cart.lines as line (line.id)}
									<li class="flex items-start justify-between gap-3 text-[12px]">
										<span class="leading-snug text-brand-ink">
											{line.name}
											{#if line.variant}<span class="text-brand-muted">· {line.variant}</span>{/if}
										</span>
										<span class="flex items-center gap-2 whitespace-nowrap">
											<span>{formatIDR(line.price)}</span>
											<button
												type="button"
												class="text-[#636363] hover:text-brand-accent"
												aria-label={`Hapus ${line.name}`}
												onclick={() => cart.remove(line.id)}
											>
												<Trash2 class="h-3.5 w-3.5" strokeWidth={1.6} />
											</button>
										</span>
									</li>
								{/each}
							</ul>
							<div class="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
								<span class="text-[11px] tracking-[0.18em] text-brand-muted uppercase">Total</span>
								<span class="text-[13px] font-semibold">{formatIDR(cart.total)}</span>
							</div>
							<button
								type="button"
								class="mt-3 w-full bg-brand-ink px-5 py-3 text-[11px] tracking-[0.12em] text-white uppercase transition hover:bg-brand-accent"
								onclick={() => cart.checkout()}
							>
								Pesan via WhatsApp
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if mobileMenuOpen}
		<nav
			class="flex flex-col gap-4 border-t border-brand-border bg-brand-surface px-6 py-5 text-sm lg:hidden"
		>
			{#each navLinks as link (link.id)}
				<a href={link.href} class="text-brand-ink/80" onclick={() => (mobileMenuOpen = false)}>
					{link.label}
				</a>
			{/each}
			<a href={catalogHref()} class="text-brand-ink/80" onclick={() => (mobileMenuOpen = false)}>
				Katalog
			</a>
		</nav>
	{/if}
</header>

<style>
	.nav-link {
		position: relative;
	}

	.nav-link::after {
		content: '';
		display: block;
		height: 1px;
		width: 0;
		background: #d9534f;
		transition: width 0.25s;
	}

	.nav-link:hover::after {
		width: 100%;
	}
</style>
