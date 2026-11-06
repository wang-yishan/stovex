import type { Category } from '#lib/admin/types.ts';
import { NAV_SECTIONS } from '#lib/admin/navSections.ts';
import { admin } from '#lib/admin/state.svelte.ts';
type X = Category;
export type Y = { a: typeof admin; b: X; c: typeof NAV_SECTIONS };
