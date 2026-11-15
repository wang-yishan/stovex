/* Brand identity helpers — the mapping between the settings the merchant
   edits and the CSS custom properties the storefront renders with.

   The colour + font values live in `src/routes/layout.css` as `--brand-*`
   custom properties (the single source of truth for the tokens). This module
   owns the runtime side: the font stacks, the CSS the root layout injects so
   the first server-rendered paint already carries the brand, and the
   contrast helpers the brand editor uses to warn about unreadable colours. */

import type { BrandFontKey, BrandIdentity } from '#lib/admin/types.ts';

/** The font stack each brand font key resolves to. */
export const BRAND_FONT_STACKS: Record<BrandFontKey, string> = {
	playfair: "'Playfair Display Variable', 'Playfair Display', Georgia, serif",
	'dm-sans': "'DM Sans Variable', 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
	inter: "'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
	geist: "'Geist Variable', 'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif",
	mono: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace"
};

/** The font keys a merchant can pick, with their display labels. */
export const BRAND_FONT_OPTIONS: { key: BrandFontKey; label: string }[] = [
	{ key: 'playfair', label: 'Playfair Display' },
	{ key: 'dm-sans', label: 'DM Sans' },
	{ key: 'inter', label: 'Inter' },
	{ key: 'geist', label: 'Geist' },
	{ key: 'mono', label: 'JetBrains Mono' }
];

/** The palette roles a merchant can change. */
export const BRAND_COLOR_ROLES = [
	{ key: 'accent', label: 'Accent', hint: 'Links, hovers, highlights, the wordmark dot.' },
	{ key: 'ink', label: 'Ink', hint: 'Headings and body copy.' },
	{ key: 'muted', label: 'Muted', hint: 'Secondary copy and captions.' },
	{ key: 'surface', label: 'Surface', hint: 'The storefront page background.' },
	{ key: 'border', label: 'Border', hint: 'Hairlines, dividers, card edges.' }
] as const;

export type BrandColorRole = (typeof BRAND_COLOR_ROLES)[number]['key'];

/**
 * The CSS the root layout injects into `<head>` so the storefront renders
 * with the saved brand on the very first server-rendered paint — no flash of
 * the default palette, no client-only flash on hydration.
 */
export function brandStyleTag(brand: BrandIdentity): string {
	const c = brand.colors;
	const display = BRAND_FONT_STACKS[brand.fonts.display] ?? BRAND_FONT_STACKS.playfair;
	const body = BRAND_FONT_STACKS[brand.fonts.body] ?? BRAND_FONT_STACKS['dm-sans'];

	return (
		`:root{--brand-accent:${c.accent};--brand-ink:${c.ink};--brand-muted:${c.muted};` +
		`--brand-surface:${c.surface};--brand-border:${c.border};` +
		`--brand-font-display:${display};--brand-font-body:${body};}`
	);
}

/** The same declarations, ready to be spread onto a `style` attribute. */
export function brandStyleVars(brand: BrandIdentity): string {
	const c = brand.colors;
	const display = BRAND_FONT_STACKS[brand.fonts.display] ?? BRAND_FONT_STACKS.playfair;
	const body = BRAND_FONT_STACKS[brand.fonts.body] ?? BRAND_FONT_STACKS['dm-sans'];

	return [
		`--brand-accent:${c.accent}`,
		`--brand-ink:${c.ink}`,
		`--brand-muted:${c.muted}`,
		`--brand-surface:${c.surface}`,
		`--brand-border:${c.border}`,
		`--brand-font-display:${display}`,
		`--brand-font-body:${body}`
	].join(';');
}

/* ---------- contrast ---------- */

/** Parse a `#rgb` / `#rrggbb` colour into its channels. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
	const value = hex.trim().replace(/^#/, '');
	const full =
		value.length === 3
			? value
					.split('')
					.map((c) => c + c)
					.join('')
			: value;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16)
	};
}

/** WCAG relative luminance. */
function luminance(rgb: { r: number; g: number; b: number }): number {
	const channel = (value: number) => {
		const srgb = value / 255;
		return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * The WCAG contrast ratio between two hex colours (1–21).
 * Returns 1 when either colour cannot be parsed.
 */
export function contrastRatio(foreground: string, background: string): number {
	const fg = parseHex(foreground);
	const bg = parseHex(background);
	if (!fg || !bg) return 1;
	const light = Math.max(luminance(fg), luminance(bg));
	const dark = Math.min(luminance(fg), luminance(bg));
	return (light + 0.05) / (dark + 0.05);
}

/** 4.5:1 is the AA threshold for normal-size text. */
export function meetsAaText(ratio: number): boolean {
	return ratio >= 4.5;
}

/** 3:1 is the AA threshold for large text, icons and UI borders. */
export function meetsAaUi(ratio: number): boolean {
	return ratio >= 3;
}

/** A short, human-readable grade for the ratio badge. */
export function gradeRatio(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
	if (ratio >= 7) return 'AAA';
	if (ratio >= 4.5) return 'AA';
	if (ratio >= 3) return 'AA Large';
	return 'Fail';
}

/** The ratio formatted for the badge, e.g. "5.4:1". */
export function formatRatio(ratio: number): string {
	return `${ratio.toFixed(1)}:1`;
}
