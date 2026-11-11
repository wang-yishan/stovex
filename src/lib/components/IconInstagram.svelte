<script lang="ts">
	/**
	 * Instagram glyph.
	 * Lucide dropped brand icons in v1, so this lives locally.
	 */
	interface Props {
		class?: string;
		strokeWidth?: number | string;
		size?: number | string;
	}

	let { class: className = '', strokeWidth = 2, size = 24, ...rest }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	{...rest}
>
	<path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Z" />
	<circle cx="12" cy="12" r="4" />
	<circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
</svg>
