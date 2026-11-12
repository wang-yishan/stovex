#!/usr/bin/env bun
/**
 * WCAG 2.1 contrast calculator for hex / rgb / rgba colors.
 *
 * Usage:
 *   bun scripts/contrast.ts <fg> <bg> [backdrop]
 *   bun scripts/contrast.ts --audit            # audits the dashboard palette
 *
 * Why this exists
 * ---------------
 * A hex color is opaque, so its contrast against a parent background is a
 * single fixed number. An `rgba()` color is NOT: the browser composites it
 * over whatever is painted behind it
 *
 *     composite = alpha * fg + (1 - alpha) * backdrop      (per channel, sRGB)
 *
 * so the contrast of translucent text/backgrounds depends on the backdrop.
 * A translucent *background* (e.g. a sticky bar with `backdrop-blur`) has no
 * single ratio at all — you must pick a worst-case backdrop and composite it.
 * This tool does that instead of guessing.
 *
 * Rules (WCAG 2.1):
 *   normal text  (< 18pt / < 14pt bold)  -> 4.5:1  (AA), 7:1 (AAA)
 *   large text  (>= 18pt / >= 14pt bold) -> 3:1    (AA), 4.5:1 (AAA)
 *   UI components / icons / borders       -> 3:1    (AA, 1.4.11)
 */

type RGBA = { r: number; g: number; b: number; a: number };

/* ---------- parsing ---------- */

function parseColor(input: string): RGBA {
	const s = input.trim().toLowerCase();

	if (s.startsWith('#')) {
		const hex = s.slice(1);
		if (hex.length === 3 || hex.length === 4) {
			const [r, g, b, a] = hex.split('').map((c) => parseInt(c + c, 16));
			return { r, g, b, a: a === undefined ? 1 : a / 255 };
		}
		if (hex.length === 6 || hex.length === 8) {
			const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
			return {
				r: n(0),
				g: n(2),
				b: n(4),
				a: hex.length === 8 ? n(6) / 255 : 1
			};
		}
		throw new Error(`bad hex: ${input}`);
	}

	const m = s.match(/^rgba?\(([^)]+)\)$/);
	if (m) {
		const parts = m[1].split(/[\s,/]+/).filter(Boolean);
		const chan = (v: string) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v));
		const r = chan(parts[0]);
		const g = chan(parts[1]);
		const b = chan(parts[2]);
		let a = 1;
		if (parts[3] !== undefined) {
			a = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
		}
		return { r, g, b, a };
	}

	throw new Error(`unsupported color: ${input} (use #hex, #rrggbbaa, rgb() or rgba())`);
}

/* ---------- math ---------- */

/** Simple source-over composite in sRGB space (what browsers do). */
export function composite(fg: RGBA, backdrop: RGBA): RGBA {
	const a = fg.a + backdrop.a * (1 - fg.a);
	if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
	return {
		r: (fg.r * fg.a + backdrop.r * backdrop.a * (1 - fg.a)) / a,
		g: (fg.g * fg.a + backdrop.g * backdrop.a * (1 - fg.a)) / a,
		b: (fg.b * fg.a + backdrop.b * backdrop.a * (1 - fg.a)) / a,
		a
	};
}

/** WCAG 2.1 relative luminance. */
export function luminance(c: RGBA): number {
	const f = (v: number) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG 2.1 contrast ratio between two opaque colors. */
export function ratio(a: RGBA, b: RGBA): number {
	const l1 = luminance(a);
	const l2 = luminance(b);
	const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
	return (hi + 0.05) / (lo + 0.05);
}

export function hex(c: RGBA): string {
	const h = (v: number) =>
		Math.round(Math.max(0, Math.min(255, v)))
			.toString(16)
			.padStart(2, '0');
	return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** Resolve a possibly-translucent color against a known backdrop. */
export function over(color: RGBA, backdrop: RGBA): RGBA {
	return color.a >= 1 ? color : composite(color, backdrop);
}

/* ---------- reporting ---------- */

export interface Result {
	fg: string;
	bg: string;
	ratio: number;
	aa: boolean;
	aaa: boolean;
	ui: boolean;
}

export function check(fgStr: string, bgStr: string, backdropStr = '#f8f8f7'): Result {
	const fg = parseColor(fgStr);
	const bg = parseColor(bgStr);
	const bd = parseColor(backdropStr);

	// Compositing fg over the (possibly translucent) bg, which is composited
	// over the backdrop. This is what the user actually sees.
	const bgFlat = over(bg, bd);
	const fgFlat = over(fg, bgFlat);

	const r = ratio(fgFlat, bgFlat);
	return {
		fg: hex(fgFlat),
		bg: hex(bgFlat),
		ratio: Math.round(r * 100) / 100,
		aa: r >= 4.5,
		aaa: r >= 7,
		ui: r >= 3
	};
}

function grade(r: Result): string {
	if (r.aaa) return 'AAA';
	if (r.aa) return 'AA';
	if (r.ui) return 'UI-only (fails AA text)';
	return 'FAIL';
}

/* ---------- CLI ---------- */

const [, , ...argv] = process.argv;

if (argv[0] === '--audit') {
	// The dashboard palette: text roles on the light surfaces they sit on.
	const surfaces = {
		'page bg #f8f8f7': '#f8f8f7',
		'card bg #ffffff': '#ffffff',
		'table head #fbfbfa': '#fbfbfa',
		'badge #f5f5f4': '#f5f5f4'
	};
	const texts = {
		'primary #242424': '#242424',
		'secondary #5a5a5a': '#5a5a5a',
		'muted #636363': '#636363'
	};
	console.log('DASHBOARD PALETTE AUDIT (light mode, WCAG AA normal text = 4.5:1)\n');
	for (const [tName, t] of Object.entries(texts)) {
		for (const [sName, s] of Object.entries(surfaces)) {
			const r = check(t, s);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  ${tName.padEnd(20)} on ${sName.padEnd(20)} ${String(r.ratio).padStart(5)}:1  ${grade(r)}`
			);
		}
	}
	console.log('\nDARK MODE\n');
	const darkSurfaces = { 'page bg #101010': '#101010', 'card bg #1c1c1c': '#1c1c1c' };
	const darkTexts = {
		'primary #f0f0f0': '#f0f0f0',
		'secondary #a8a8a8': '#a8a8a8',
		'muted #8a8a8a': '#8a8a8a'
	};
	for (const [tName, t] of Object.entries(darkTexts)) {
		for (const [sName, s] of Object.entries(darkSurfaces)) {
			const r = check(t, s);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  ${tName.padEnd(20)} on ${sName.padEnd(20)} ${String(r.ratio).padStart(5)}:1  ${grade(r)}`
			);
		}
	}
	console.log('\nFORM FIELDS (shadcn Input / Select / Textarea)\n');
	// Light: --field-bg #fbfbfa, --field-bg-focus #ffffff
	// Dark:  --field-bg #161616, --field-bg-focus #1c1c1c
	// The control border (--border-control #8a8a8a) must reach 3:1 against
	// the surface it sits on — WCAG 1.4.11 (non-text contrast).
	const controlBorders = {
		'border-control #8a8a8a on card #ffffff': ['#8a8a8a', '#ffffff'],
		'border-control #8a8a8a on field #fbfbfa': ['#8a8a8a', '#fbfbfa'],
		'border-control #8a8a8a on card #1c1c1c': ['#8a8a8a', '#1c1c1c'],
		'border-control #8a8a8a on field #161616': ['#8a8a8a', '#161616']
	};
	for (const [label, [fg, bg]] of Object.entries(controlBorders)) {
		const r = check(fg, bg);
		const mark = r.ratio >= 3 ? 'PASS' : 'FAIL';
		console.log(`  ${mark}  ${label.padEnd(44)} ${String(r.ratio).padStart(5)}:1`);
	}
	const fieldLight = {
		'text #242424': '#242424',
		'placeholder #5a5a5a': '#5a5a5a',
		'placeholder #636363': '#636363'
	};
	const fieldLightSurfaces = {
		'field bg #fbfbfa': '#fbfbfa',
		'field focus #ffffff': '#ffffff'
	};
	for (const [tName, t] of Object.entries(fieldLight)) {
		for (const [sName, s] of Object.entries(fieldLightSurfaces)) {
			const r = check(t, s);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  ${tName.padEnd(22)} on ${sName.padEnd(22)} ${String(r.ratio).padStart(5)}:1  ${grade(r)}`
			);
		}
	}
	const fieldDark = {
		'text #f0f0f0': '#f0f0f0',
		'placeholder #a8a8a8': '#a8a8a8',
		'placeholder #8a8a8a': '#8a8a8a'
	};
	const fieldDarkSurfaces = {
		'field bg #161616': '#161616',
		'field focus #1c1c1c': '#1c1c1c'
	};
	for (const [tName, t] of Object.entries(fieldDark)) {
		for (const [sName, s] of Object.entries(fieldDarkSurfaces)) {
			const r = check(t, s);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  ${tName.padEnd(22)} on ${sName.padEnd(22)} ${String(r.ratio).padStart(5)}:1  ${grade(r)}`
			);
		}
	}

	console.log('\nSTATUS TONES (text roles — used on tinted badge backgrounds)\n');
	// Light: --success-text #1a7a52, --warning-text #8a6a24, --danger-text #a33a37
	// Dark:  --success-text #7ed3ab, --warning-text #e8b95c, --danger-text #f0a3a0
	const statusLight = {
		'success #1a7a52': '#1a7a52',
		'warning #8a6a24': '#8a6a24',
		'danger #a33a37': '#a33a37'
	};
	const statusLightSurfaces = {
		'page bg #f8f8f7': '#f8f8f7',
		'card bg #ffffff': '#ffffff',
		'badge #f0faf6': '#f0faf6',
		'badge #fff8e6': '#fff8e6',
		'badge #fff0f0': '#fff0f0'
	};
	for (const [tName, t] of Object.entries(statusLight)) {
		for (const [sName, s] of Object.entries(statusLightSurfaces)) {
			const r = check(t, s);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  ${tName.padEnd(20)} on ${sName.padEnd(20)} ${String(r.ratio).padStart(5)}:1  ${grade(r)}`
			);
		}
	}
	const statusDark = {
		'success #7ed3ab': '#7ed3ab',
		'warning #e8b95c': '#e8b95c',
		'danger #f0a3a0': '#f0a3a0'
	};
	const statusDarkSurfaces = {
		'page bg #101010': '#101010',
		'card bg #1c1c1c': '#1c1c1c',
		'surface #242424': '#242424'
	};
	for (const [tName, t] of Object.entries(statusDark)) {
		for (const [sName, s] of Object.entries(statusDarkSurfaces)) {
			const r = check(t, s);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  ${tName.padEnd(20)} on ${sName.padEnd(20)} ${String(r.ratio).padStart(5)}:1  ${grade(r)}`
			);
		}
	}
	console.log('\nTRANSLUCENT CHROME (topbar) — ratio depends on what scrolls under it\n');
	const chrome = 'rgba(248,248,247,0.92)';
	for (const under of ['#ffffff', '#f8f8f7', '#fbfbfa', '#242424', '#000000']) {
		for (const t of ['#636363', '#5a5a5a', '#242424']) {
			const r = check(t, chrome, under);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  text ${t.padEnd(8)} over ${chrome} above ${under.padEnd(8)} -> ${r.fg} on ${r.bg}  ${String(r.ratio).padStart(5)}:1`
			);
		}
	}
	console.log('\nSTOREFRONT PALETTE (light, warm surfaces)\n');
	const storeSurfaces = {
		'page #fbfbfa': '#fbfbfa',
		'band #f5f3ef': '#f5f3ef',
		'band #f2f0ec': '#f2f0ec'
	};
	const storeTexts = { 'primary #242424': '#242424', 'warm muted #6b6762': '#6b6762' };
	for (const [tName, t] of Object.entries(storeTexts)) {
		for (const [sName, s] of Object.entries(storeSurfaces)) {
			const r = check(t, s);
			const mark = r.aa ? 'PASS' : 'FAIL';
			console.log(
				`  ${mark}  ${tName.padEnd(20)} on ${sName.padEnd(20)} ${String(r.ratio).padStart(5)}:1  ${grade(r)}`
			);
		}
	}
} else if (argv.length >= 2) {
	const [fg, bg, backdrop] = argv;
	const r = check(fg, bg, backdrop);
	const warnings: string[] = [];
	if (parseColor(fg).a < 1)
		warnings.push('foreground is translucent — ratio depends on the backdrop');
	if (parseColor(bg).a < 1)
		warnings.push('background is translucent — ratio depends on what is painted behind it');
	console.log(
		`${fg} on ${bg}${backdrop ? ` (backdrop ${backdrop})` : ''}\n` +
			`  resolved: ${r.fg} on ${r.bg}\n` +
			`  ratio:    ${r.ratio}:1  -> ${grade(r)}\n` +
			`  AA normal text: ${r.aa ? 'pass' : 'FAIL'}   AAA: ${r.aaa ? 'pass' : 'FAIL'}   UI/icon (3:1): ${r.ui ? 'pass' : 'FAIL'}`
	);
	for (const w of warnings) console.log(`  ! ${w}`);
} else {
	console.log('usage: bun scripts/contrast.ts <fg> <bg> [backdrop] | --audit');
}
