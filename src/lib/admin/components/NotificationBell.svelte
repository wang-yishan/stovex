<script lang="ts">
	import { admin } from '#lib/admin/state.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.ts';
	import {
		Card,
		CardAction,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/components/ui/card/index.ts';
	import { Separator } from '#lib/components/ui/separator/index.ts';
	import { resolvePath } from '#lib/admin/paths.ts';
	import { Bell, CheckCheck, Package, ShoppingCart, Truck, Info, X } from '@lucide/svelte';

	let open = $state(false);

	const unreadCount = $derived(admin.notifications.filter((n) => !n.read).length);
	const items = $derived(admin.notifications);

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function onWindowClick(event: MouseEvent) {
		if (!open) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('[data-notification-root]')) return;
		close();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}

	function kindIcon(kind: string) {
		if (kind === 'order') return ShoppingCart;
		if (kind === 'shipping') return Truck;
		if (kind === 'product') return Package;
		return Info;
	}

	function kindTone(kind: string): string {
		if (kind === 'order') return 'bg-[#FFF8E6] text-[#8A6A24] border-[#F3D9A0]';
		if (kind === 'shipping') return 'bg-[#E8F4FF] text-[#245B8A] border-[#BFDDF5]';
		if (kind === 'product') return 'bg-[#FFF0F0] text-[#A33A37] border-[#F2C2C0]';
		return 'bg-muted text-muted-foreground border-border';
	}

	function formatWhen(iso: string): string {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return '';
		const diff = Date.now() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'Just now';
		if (mins < 60) return `${mins}m ago`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		const days = Math.floor(hrs / 24);
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	async function openItem(id: string) {
		const item = admin.notifications.find((n) => n.id === id);
		if (item && !item.read) await admin.markNotificationRead(id);
		close();
	}

	async function markAll(event: MouseEvent) {
		event.stopPropagation();
		await admin.markAllNotificationsRead();
	}

	async function removeItem(event: MouseEvent, id: string) {
		event.stopPropagation();
		await admin.deleteNotification(id);
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="relative" data-notification-root>
	<Button
		variant="outline"
		size="icon"
		aria-label="Notifications"
		aria-expanded={open}
		class="relative"
		onclick={toggle}
	>
		<Bell class="h-5 w-5 text-foreground" strokeWidth={1.6} />
		{#if unreadCount > 0}
			<span
				class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-card bg-[#D9534F] px-0.5 text-[9px] font-semibold leading-none text-white"
			>
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</Button>

	{#if open}
		{#snippet panel(mobile: boolean)}
			<Card
				size="sm"
				class="{mobile
					? 'h-full rounded-none ring-0'
					: 'rounded-[12px] shadow-none'} gap-0 overflow-hidden py-0 [--card-spacing:0px]"
			>
				<CardHeader class="shrink-0 flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
					<div class="grid gap-0.5">
						<CardTitle class="text-[14px] leading-tight md:text-[13px]">Notifications</CardTitle>
						<CardDescription class="text-[11px]">
							{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
						</CardDescription>
					</div>
					<CardAction class="col-start-auto row-span-1 row-start-auto flex items-center justify-end gap-1 self-center justify-self-auto">
						{#if unreadCount > 0}
							<Button
								variant="ghost"
								size="sm"
								class="h-8 px-2 text-[11px] md:h-7"
								onclick={markAll}
								aria-label="Mark all as read"
							>
								<CheckCheck class="h-3.5 w-3.5" />
								<span class={mobile ? 'inline' : 'hidden sm:inline'}>Mark all read</span>
							</Button>
						{/if}
						{#if mobile}
							<Button
								variant="secondary"
								size="icon"
								class="h-8 w-8"
								onclick={close}
								aria-label="Close notifications"
							>
								<X class="h-4 w-4 text-muted-foreground" />
							</Button>
						{/if}
					</CardAction>
				</CardHeader>

				<CardContent class="min-h-0 flex-1 p-0 {mobile ? 'flex flex-col' : ''}">
					{#if items.length === 0}
						<div class="{mobile ? 'flex-1' : ''} px-4 py-10 text-center">
							<div
								class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted"
							>
								<Bell class="h-4 w-4 text-muted-foreground" />
							</div>
							<p class="text-[12px] font-medium text-foreground">No notifications</p>
							<p class="mt-0.5 text-[11px] text-muted-foreground">You're up to date.</p>
						</div>
					{:else}
						<div
							class={mobile
								? 'min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y'
								: 'max-h-[360px] overflow-y-auto overscroll-contain'}
						>
							{#each items as item, i (item.id)}
								{@const Icon = kindIcon(item.kind)}
								<div class="group relative {item.read ? 'bg-card' : 'bg-field'}">
									<a
										href={item.href ? resolvePath(item.href) : resolvePath('/dashboard')}
										class="flex gap-3 px-4 py-3 pr-12 hover:bg-muted md:pr-10"
										onclick={() => openItem(item.id)}
									>
										<div
											class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border {kindTone(
												item.kind
											)}"
										>
											<Icon class="h-4 w-4" strokeWidth={1.6} />
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-start justify-between gap-2">
												<p class="truncate text-[12px] font-medium text-foreground">{item.title}</p>
												{#if !item.read}
													<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#269B65]"></span>
												{/if}
											</div>
											<p class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
												{item.message}
											</p>
											<p class="mt-1 text-[10px] text-muted-foreground">{formatWhen(item.createdAt)}</p>
										</div>
									</a>
									<button
										type="button"
										class="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:h-6 md:w-6 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
										aria-label="Dismiss notification"
										onclick={(event) => removeItem(event, item.id)}
									>
										<X class="h-3.5 w-3.5" />
									</button>
								</div>
								{#if i < items.length - 1}
									<Separator />
								{/if}
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		{/snippet}

		<!-- Mobile: full-screen modal -->
		<div
			{@attach (node) => {
				document.body.appendChild(node);
				return () => node.remove();
			}}
			class="fixed inset-0 z-[150] flex h-dvh flex-col overflow-hidden overscroll-none bg-card md:hidden"
			role="dialog"
			aria-modal="true"
			aria-label="Notifications"
			style="padding-top: var(--safe-area-inset-top); padding-bottom: var(--safe-area-inset-bottom);"
		>
			{@render panel(true)}
		</div>

		<!-- Desktop: anchored dropdown -->
		<div
			class="absolute right-0 top-[calc(100%+8px)] z-[150] hidden w-[340px] max-w-[calc(100vw-2rem)] md:block"
		>
			<div class="overflow-hidden rounded-[12px] border border-border bg-card shadow-xl">
				{@render panel(false)}
			</div>
		</div>
	{/if}
</div>
