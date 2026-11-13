<script lang="ts">
	import { SHIPMENT_STATUS_META } from '#lib/admin/data.ts';
	import type { ShipmentStatus } from '#lib/admin/types.ts';

	let { status }: { status: ShipmentStatus } = $props();

	const toneClass = $derived.by(() => {
		switch (SHIPMENT_STATUS_META[status].tone) {
			case 'success':
				return 'bg-[#F0FAF6] text-[#1A7A52] border-[#C7EBDB]';
			case 'warning':
				return 'bg-[#FFF8E6] text-[#8A6A24] border-[#F3D9A0]';
			case 'danger':
				return 'bg-[#FFF0F0] text-[#A33A37] border-[#F2C2C0]';
			case 'accent':
				return 'bg-[#F0F4FF] text-[#3A5AA3] border-[#C9D6F2]';
			default:
				return 'bg-[#F5F5F4] text-[#5A5A5A] border-[#EAEAEA]';
		}
	});
</script>

<span class="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium {toneClass}">
	{SHIPMENT_STATUS_META[status].label}
</span>
