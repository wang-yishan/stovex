/* Store settings repository — the brand identity + contact/social/SEO
   settings live in a single SQLite row so the storefront and the dashboard
   always read the same values the merchant saved.

   The row is written through a partial merge: the Brand page and the Store
   Settings page edit disjoint fields and neither can clobber the other. */

import { eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { storeSetting } from '#lib/server/db/schema.ts';
import { seedSettings } from '#lib/admin/data.ts';
import type { BrandColors, BrandFonts, BrandFontKey, StoreSettings } from '#lib/admin/types.ts';

const SETTINGS_ID = 'default';

/**
 * Older databases may be missing columns added after the initial schema.
 * Add them in-place so reads/writes keep working without a manual db:push.
 */
let columnsEnsured = false;
async function ensureStoreSettingColumns(): Promise<void> {
	if (columnsEnsured) return;
	try {
		const database = db as unknown as {
			all?: (q: unknown) => Promise<Array<{ name: string }>>;
			run?: (q: unknown) => Promise<unknown>;
		};
		if (typeof database.all !== 'function' || typeof database.run !== 'function') return;

		const info = await database.all(sql`PRAGMA table_info(store_setting)`);
		const names = new Set((info ?? []).map((c) => c.name));
		if (names.size === 0) {
			// Table not created yet — ensureSeeded/create path will handle it.
			columnsEnsured = true;
			return;
		}
		if (!names.has('facebook_url')) {
			await database.run(sql`ALTER TABLE store_setting ADD COLUMN facebook_url text NOT NULL DEFAULT ''`);
		}
		if (!names.has('instagram_url')) {
			await database.run(sql`ALTER TABLE store_setting ADD COLUMN instagram_url text NOT NULL DEFAULT ''`);
		}
		if (!names.has('whatsapp_url')) {
			await database.run(sql`ALTER TABLE store_setting ADD COLUMN whatsapp_url text NOT NULL DEFAULT ''`);
		}
		if (!names.has('footer_media_links')) {
			await database.run(
				sql`ALTER TABLE store_setting ADD COLUMN footer_media_links text NOT NULL DEFAULT '[]'`
			);
		}
		columnsEnsured = true;
	} catch {
		// Best-effort: if this fails we'll fall back to defaults on read.
	}
}

/** The fonts a merchant can pick. Every family ships with the project. */
export const BRAND_FONTS: { key: BrandFontKey; label: string }[] = [
	{ key: 'playfair', label: 'Playfair Display' },
	{ key: 'dm-sans', label: 'DM Sans' },
	{ key: 'inter', label: 'Inter' },
	{ key: 'geist', label: 'Geist' },
	{ key: 'mono', label: 'JetBrains Mono' }
];

const FONT_KEYS = BRAND_FONTS.map((f) => f.key);

const HEX = /^#[0-9a-fA-F]{6}$/;

/** A `#rrggbb` colour, or the fallback when the input is not one. */
function color(value: unknown, fallback: string): string {
	return typeof value === 'string' && HEX.test(value.trim())
		? value.trim().toLowerCase()
		: fallback;
}

/** A known font key, or the fallback. */
function font(value: unknown, fallback: BrandFontKey): BrandFontKey {
	return typeof value === 'string' && FONT_KEYS.includes(value as BrandFontKey)
		? (value as BrandFontKey)
		: fallback;
}

/** Trimmed string with a length cap; falls back when empty. */
function str(value: unknown, fallback = '', max = 500): string {
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	if (!trimmed) return fallback;
	return trimmed.slice(0, max);
}

/** Only digits survive — a WhatsApp number is dialled as-is. */
function phone(value: unknown, fallback: string): string {
	const digits = typeof value === 'string' ? value.replace(/[^\d]/g, '') : '';
	return digits ? digits.slice(0, 20) : fallback;
}

/**
 * Coerce an untrusted payload into a valid settings patch.
 * Unknown or malformed fields fall back to the current value, so a partial
 * PUT never blanks a field it did not mention.
 */
export function parseSettingsPatch(
	body: unknown,
	current: StoreSettings
): { patch: Partial<StoreSettings>; errors: Record<string, string> } {
	const raw = (body ?? {}) as Record<string, unknown>;
	const errors: Record<string, string> = {};
	const patch: Partial<StoreSettings> = {};

	const brandRaw = (raw.brand ?? {}) as Record<string, unknown>;
	const colorsRaw = (brandRaw.colors ?? {}) as Record<string, unknown>;
	const fontsRaw = (brandRaw.fonts ?? {}) as Record<string, unknown>;

	const colors: BrandColors = {
		accent: color(colorsRaw.accent, current.brand.colors.accent),
		ink: color(colorsRaw.ink, current.brand.colors.ink),
		surface: color(colorsRaw.surface, current.brand.colors.surface),
		border: color(colorsRaw.border, current.brand.colors.border),
		muted: color(colorsRaw.muted, current.brand.colors.muted)
	};

	for (const [key, value] of Object.entries(colorsRaw)) {
		if (value !== undefined && !HEX.test(String(value).trim())) {
			errors[`brand.colors.${key}`] = 'Use a hex colour like #D9534F';
		}
	}

	const fonts: BrandFonts = {
		display: font(fontsRaw.display, current.brand.fonts.display),
		body: font(fontsRaw.body, current.brand.fonts.body)
	};

	for (const [key, value] of Object.entries(fontsRaw)) {
		if (value !== undefined && !FONT_KEYS.includes(value as BrandFontKey)) {
			errors[`brand.fonts.${key}`] = 'Unknown font';
		}
	}

	patch.brand = {
		name: str(brandRaw.name, current.brand.name, 80),
		wordmark: str(brandRaw.wordmark, current.brand.wordmark, 40),
		tagline: str(brandRaw.tagline, current.brand.tagline, 160),
		logoUrl: str(brandRaw.logoUrl, current.brand.logoUrl, 400),
		faviconUrl: str(brandRaw.faviconUrl, current.brand.faviconUrl, 400),
		domain: str(brandRaw.domain, current.brand.domain, 200).replace(/^https?:\/\//i, ''),
		colors,
		fonts
	};

	// The SEO title and footer text start out derived from the brand. When
	// the merchant renames the brand and those two are still the untouched
	// defaults, they follow along — a hand-written title is never overwritten.
	const brandChanged =
		patch.brand.name !== current.brand.name ||
		patch.brand.tagline !== current.brand.tagline ||
		patch.brand.wordmark !== current.brand.wordmark;

	if (brandChanged) {
		const autoTitle = `${current.brand.name} — ${current.brand.tagline}`;
		if (raw.defaultSeo === undefined && current.defaultSeo.title === autoTitle) {
			patch.defaultSeo = {
				...current.defaultSeo,
				title: `${patch.brand.name} — ${patch.brand.tagline}`
			};
		}

		const autoFooter = `${current.brand.wordmark} — ${current.brand.tagline}. Enquiries via WhatsApp.`;
		if (raw.footerText === undefined && current.footerText === autoFooter) {
			patch.footerText = `${patch.brand.wordmark} — ${patch.brand.tagline}. Enquiries via WhatsApp.`;
		}
	}

	if (raw.whatsappNumber !== undefined) {
		patch.whatsappNumber = phone(raw.whatsappNumber, current.whatsappNumber);
	}
	if (raw.whatsappTemplate !== undefined) {
		patch.whatsappTemplate = str(raw.whatsappTemplate, current.whatsappTemplate, 1000);
	}
	if (raw.footerText !== undefined) {
		patch.footerText = str(raw.footerText, current.footerText, 600);
	}

	if (raw.social !== undefined) {
		const social = (raw.social ?? {}) as Record<string, unknown>;
		patch.social = {
			instagram: str(social.instagram, current.social.instagram, 120),
			facebook: str(social.facebook, current.social.facebook, 120),
			tiktok: str(social.tiktok, current.social.tiktok, 120)
		};
	}

	if (raw.facebookUrl !== undefined) {
		patch.facebookUrl = str(raw.facebookUrl, current.facebookUrl, 300);
	}
	if (raw.instagramUrl !== undefined) {
		patch.instagramUrl = str(raw.instagramUrl, current.instagramUrl, 300);
	}
	if (raw.whatsappUrl !== undefined) {
		patch.whatsappUrl = str(raw.whatsappUrl, current.whatsappUrl, 300);
	}

	if (raw.footerMediaLinks !== undefined) {
		const list = Array.isArray(raw.footerMediaLinks) ? raw.footerMediaLinks : [];
		patch.footerMediaLinks = list
			.slice(0, 24)
			.map((item) => {
				const link = (item ?? {}) as Record<string, unknown>;
				return {
					id: str(link.id, '', 40) || `fm-${Math.random().toString(36).slice(2, 8)}`,
					logoUrl: str(link.logoUrl, '', 400),
					name: str(link.name, '', 80),
					url: str(link.url, '', 300)
				};
			})
			.filter((link) => link.name.length > 0 || link.url.length > 0 || link.logoUrl.length > 0);
	}

	if (raw.defaultSeo !== undefined) {
		const seo = (raw.defaultSeo ?? {}) as Record<string, unknown>;
		patch.defaultSeo = {
			title: str(seo.title, current.defaultSeo.title, 160),
			description: str(seo.description, current.defaultSeo.description, 320),
			image: str(seo.image, current.defaultSeo.image, 400)
		};
	}

	if (raw.headerLinks !== undefined) {
		const list = Array.isArray(raw.headerLinks) ? raw.headerLinks : [];
		patch.headerLinks = list
			.slice(0, 12)
			.map((item) => {
				const link = (item ?? {}) as Record<string, unknown>;
				return {
					id: str(link.id, '', 40) || `hl-${Math.random().toString(36).slice(2, 8)}`,
					label: str(link.label, '', 60),
					href: str(link.href, '#', 200)
				};
			})
			.filter((link) => link.label.length > 0);
	}

	return { patch, errors };
}

function rowToSettings(row: typeof storeSetting.$inferSelect): StoreSettings {
	const seed = seedSettings();
	return {
		brand: {
			name: row.brandName || seed.brand.name,
			wordmark: row.brandWordmark || seed.brand.wordmark,
			tagline: row.brandTagline || seed.brand.tagline,
			logoUrl: row.brandLogoUrl,
			faviconUrl: row.brandFaviconUrl,
			domain: row.brandDomain || seed.brand.domain,
			colors: { ...seed.brand.colors, ...(row.brandColors ?? {}) },
			fonts: { ...seed.brand.fonts, ...(row.brandFonts ?? {}) }
		},
		whatsappNumber: row.whatsappNumber || seed.whatsappNumber,
		whatsappTemplate: row.whatsappTemplate || seed.whatsappTemplate,
		headerLinks: row.headerLinks?.length ? row.headerLinks : seed.headerLinks,
		footerText: row.footerText || seed.footerText,
		social: { ...seed.social, ...(row.social ?? {}) },
		facebookUrl: (row as Record<string, unknown>).facebookUrl as string || seed.facebookUrl,
		instagramUrl: (row as Record<string, unknown>).instagramUrl as string || seed.instagramUrl,
		whatsappUrl: (row as Record<string, unknown>).whatsappUrl as string || seed.whatsappUrl,
		footerMediaLinks: Array.isArray((row as Record<string, unknown>).footerMediaLinks)
			? ((row as Record<string, unknown>).footerMediaLinks as StoreSettings['footerMediaLinks'])
			: seed.footerMediaLinks,
		defaultSeo: { ...seed.defaultSeo, ...(row.defaultSeo ?? {}) }
	};
}

/**
 * The saved settings. Seeds the row on first read.
 *
 * The storefront must never go down because of the brand table: if the
 * migration has not been applied yet (or the row cannot be read for any
 * reason), fall back to the seed defaults so the shop still renders.
 */
export async function getSettings(): Promise<StoreSettings> {
	try {
		await ensureStoreSettingColumns();
		await ensureSeeded();
		const rows = await db
			.select()
			.from(storeSetting)
			.where(eq(storeSetting.id, SETTINGS_ID))
			.limit(1);
		const row = rows[0];
		if (!row) return seedSettings();
		return rowToSettings(row);
	} catch (cause) {
		console.error('[settings] falling back to defaults:', cause);
		return seedSettings();
	}
}

/** Merge a patch into the stored settings and persist the result. */
export async function saveSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
	await ensureStoreSettingColumns();
	const current = await getSettings();
	const seed = seedSettings();
	const next: StoreSettings = {
		brand: { ...current.brand, ...(patch.brand ?? {}) },
		whatsappNumber: patch.whatsappNumber ?? current.whatsappNumber,
		whatsappTemplate: patch.whatsappTemplate ?? current.whatsappTemplate,
		headerLinks: patch.headerLinks ?? current.headerLinks,
		footerText: patch.footerText ?? current.footerText,
		social: { ...current.social, ...(patch.social ?? {}) },
		facebookUrl: patch.facebookUrl ?? current.facebookUrl ?? seed.facebookUrl,
		instagramUrl: patch.instagramUrl ?? current.instagramUrl ?? seed.instagramUrl,
		whatsappUrl: patch.whatsappUrl ?? current.whatsappUrl ?? seed.whatsappUrl,
		footerMediaLinks: patch.footerMediaLinks ?? current.footerMediaLinks ?? seed.footerMediaLinks,
		defaultSeo: { ...current.defaultSeo, ...(patch.defaultSeo ?? {}) }
	};

	await db
		.insert(storeSetting)
		.values({
			id: SETTINGS_ID,
			brandName: next.brand.name,
			brandWordmark: next.brand.wordmark,
			brandTagline: next.brand.tagline,
			brandLogoUrl: next.brand.logoUrl,
			brandFaviconUrl: next.brand.faviconUrl,
			brandDomain: next.brand.domain,
			brandColors: next.brand.colors,
			brandFonts: next.brand.fonts,
			whatsappNumber: next.whatsappNumber,
			whatsappTemplate: next.whatsappTemplate,
			footerText: next.footerText,
			social: next.social,
			facebookUrl: next.facebookUrl,
			instagramUrl: next.instagramUrl,
			whatsappUrl: next.whatsappUrl,
			footerMediaLinks: next.footerMediaLinks,
			defaultSeo: next.defaultSeo,
			headerLinks: next.headerLinks,
			updatedAt: new Date().toISOString()
		})
		.onConflictDoUpdate({
			target: storeSetting.id,
			set: {
				brandName: next.brand.name,
				brandWordmark: next.brand.wordmark,
				brandTagline: next.brand.tagline,
				brandLogoUrl: next.brand.logoUrl,
				brandFaviconUrl: next.brand.faviconUrl,
				brandDomain: next.brand.domain,
				brandColors: next.brand.colors,
				brandFonts: next.brand.fonts,
				whatsappNumber: next.whatsappNumber,
				whatsappTemplate: next.whatsappTemplate,
				footerText: next.footerText,
				social: next.social,
				facebookUrl: next.facebookUrl,
				instagramUrl: next.instagramUrl,
				whatsappUrl: next.whatsappUrl,
				footerMediaLinks: next.footerMediaLinks,
				defaultSeo: next.defaultSeo,
				headerLinks: next.headerLinks,
				updatedAt: new Date().toISOString()
			}
		});

	return next;
}

/**
 * Write the default row when the table is empty.
 *
 * Concurrent first-reads (a cold start serving several requests at once)
 * would all see an empty table and all try to insert the same singleton
 * row, so the insert is a no-op on conflict instead of a hard failure.
 */
export async function ensureSeeded(): Promise<void> {
	await ensureStoreSettingColumns();
	const existing = await db.select({ id: storeSetting.id }).from(storeSetting).limit(1);
	if (existing.length > 0) return;

	const seed = seedSettings();
	await db
		.insert(storeSetting)
		.values({
			id: SETTINGS_ID,
			brandName: seed.brand.name,
			brandWordmark: seed.brand.wordmark,
			brandTagline: seed.brand.tagline,
			brandLogoUrl: seed.brand.logoUrl,
			brandFaviconUrl: seed.brand.faviconUrl,
			brandDomain: seed.brand.domain,
			brandColors: seed.brand.colors,
			brandFonts: seed.brand.fonts,
			whatsappNumber: seed.whatsappNumber,
			whatsappTemplate: seed.whatsappTemplate,
			footerText: seed.footerText,
			social: seed.social,
			facebookUrl: seed.facebookUrl,
			instagramUrl: seed.instagramUrl,
			whatsappUrl: seed.whatsappUrl,
			footerMediaLinks: seed.footerMediaLinks,
			defaultSeo: seed.defaultSeo,
			headerLinks: seed.headerLinks,
			updatedAt: new Date().toISOString()
		})
		.onConflictDoNothing({ target: storeSetting.id });
}
