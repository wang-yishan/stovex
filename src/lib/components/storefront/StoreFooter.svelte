<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { generalWaLinkWithGreeting } from '#lib/catalog/wa.ts';
	import { catalogHref } from '#lib/catalog/links.ts';
	import IconInstagram from '#lib/components/IconInstagram.svelte';
	import BrandWordmark from '#lib/components/storefront/BrandWordmark.svelte';
	import { ArrowUpRight, LayoutDashboard, Link2, MessageCircle } from '@lucide/svelte';

	interface Props {
		/** Prefix for in-page anchors. '' on the landing page, '/' elsewhere. */
		base?: string;
	}

	let { base = '' }: Props = $props();

	const facebookUrl = $derived(admin.settings.facebookUrl ?? '');
	const instagramUrl = $derived(admin.settings.instagramUrl ?? '');
	const whatsappUrl = $derived(admin.settings.whatsappUrl ?? '');
	const instagramHref = $derived(
		instagramUrl ||
			(admin.settings.social.instagram
				? `https://instagram.com/${admin.settings.social.instagram.replace(/^@/, '')}`
				: '')
	);
	const mediaLinks = $derived((admin.settings.footerMediaLinks ?? []).filter((l) => l.name || l.url));
</script>

<!-- Storefront footer shared by the landing page and the /catalog routes. -->

<footer id="kontak" class="border-t border-brand-border">
	<div class="mx-auto max-w-[1400px] px-5 pt-12 pb-8 sm:px-8 lg:px-12">
		<div class="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
			<div class="lg:col-span-2">
				<BrandWordmark image class="text-[25px] font-semibold tracking-[0.18em]" />
				<p class="mt-4 max-w-sm text-sm leading-7 text-brand-muted">
					{admin.settings.footerText}
				</p>
				{#if instagramHref || facebookUrl || whatsappUrl}
					<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
						{#if instagramHref}
							<a
								href={instagramHref}
								target="_blank"
								rel="noopener"
								class="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent"
							>
								<IconInstagram class="h-4 w-4" strokeWidth={1.6} />
								Instagram
							</a>
						{/if}
						{#if facebookUrl}
							<a
								href={facebookUrl}
								target="_blank"
								rel="noopener"
								class="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent"
							>
								<Link2 class="h-4 w-4" strokeWidth={1.6} />
								Facebook
							</a>
						{/if}
						{#if whatsappUrl}
							<a
								href={whatsappUrl}
								target="_blank"
								rel="noopener"
								class="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent"
							>
								<MessageCircle class="h-4 w-4" strokeWidth={1.6} />
								WhatsApp
							</a>
						{/if}
					</div>
				{:else if admin.settings.social.instagram}
					<a
						href={`https://instagram.com/${admin.settings.social.instagram.replace(/^@/, '')}`}
						target="_blank"
						rel="noopener"
						class="mt-4 inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-accent"
					>
						<IconInstagram class="h-4 w-4" strokeWidth={1.6} />
						{admin.settings.social.instagram}
					</a>
				{/if}

				{#if mediaLinks.length}
					<div class="mt-5 flex flex-wrap items-center gap-3">
						{#each mediaLinks as link (link.id)}
							<a
								href={link.url || '#'}
								target={link.url ? '_blank' : undefined}
								rel={link.url ? 'noopener' : undefined}
								class="inline-flex items-center gap-2 rounded-full border border-brand-border px-3 py-1.5 text-sm text-brand-muted hover:text-brand-accent"
							>
								{#if link.logoUrl}
									<img src={link.logoUrl} alt="" class="h-4 w-4 object-contain" />
								{/if}
								<span>{link.name || link.url}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
			<div>
				<p class="mb-5 text-xs font-semibold tracking-wider uppercase">Explore</p>
				<div class="flex flex-col gap-3 text-sm text-brand-muted">
					<a class="hover:text-brand-accent" href={`${base}#koleksi`}>Koleksi tas</a>
					<a class="hover:text-brand-accent" href={catalogHref()}>Katalog lengkap</a>
					<a class="hover:text-brand-accent" href={`${base}#cerita`}>Tentang kami</a>
					<a class="hover:text-brand-accent" href={`${base}#pilihan`}>Inspirasi gaya</a>
				</div>
			</div>
			<div>
				<p class="mb-5 text-xs font-semibold tracking-wider uppercase">Customer care</p>
				<div class="flex flex-col gap-3 text-sm text-brand-muted">
					<a class="hover:text-brand-accent" href={`${base}#kontak`}>Bantuan &amp; FAQ</a>
					<a class="hover:text-brand-accent" href={`${base}#kontak`}>Informasi pengiriman</a>
					<a
						class="inline-flex items-center gap-1.5 hover:text-brand-accent"
						href={generalWaLinkWithGreeting('saya butuh bantuan.')}
						target="_blank"
						rel="noopener"
					>
						WhatsApp
						<ArrowUpRight class="h-3.5 w-3.5" strokeWidth={1.6} />
					</a>
				</div>
			</div>
		</div>
		<div
			class="flex flex-col justify-between gap-3 border-t border-brand-border pt-6 text-[10px] tracking-wide text-brand-muted sm:flex-row"
		>
			<p>© {new Date().getFullYear()} WYSHANZ. Powered by Mulasenta Group.</p>
			<div class="flex items-center gap-4">
				<span>Designed for everyday, made to be remembered.</span>
				<a href="/dashboard" class="inline-flex items-center gap-1.5 hover:text-brand-ink">
					<LayoutDashboard class="h-3.5 w-3.5" strokeWidth={1.6} />
					Admin
				</a>
			</div>
		</div>
	</div>
</footer>
