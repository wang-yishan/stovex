# Shipped + Remaining Plan

**Objective:** Convert `ref/index.html` (“Bag Store Admin”) into idiomatic Svelte 5 + SvelteKit.

- `/` = public storefront landing for the bag store.
- `/dashboard/*` = admin dashboard converted from the reference prototype.
- Data remains in-memory only; no database.
- Copy is hardcoded in English.
- Icons use `@lucide/svelte`.

---

## Completed / Shipped

### P0 — Setup

- Installed `@lucide/svelte`.
- Created `src/routes/admin.css`:
  - Inter, Geist, and JetBrains Mono font imports
  - Bag Store CSS variables
  - Tailwind v4 border-color preflight patch
  - Custom scrollbar and `slideUp` keyframes
- Imported `admin.css` from `src/routes/layout.css`.
- Gated `DemoLinks` in the root layout to only render for `/demo` paths.
- Confirmed `innerWidth` behavior needs careful wrapper handling; a fix was started.

### P1 — Data layer

Created under `src/lib/admin/`:

- `types.ts`
  - `Product`, `ProductVariant`, `Category`, `Collection`
  - `StockMovement`, `ToastMsg`, `AttributeDraft`
  - `OrderRow`, `ActivityRow`, `AdjustStockInput`
  - status, stock, and toast unions
- `data.ts`
  - `SEED_CATEGORIES`
  - `SEED_COLLECTIONS`
  - `SEED_PRODUCTS`
  - `SEED_MOVEMENTS`
  - `SEED_ORDERS`
  - `SEED_ACTIVITY`
  - helpers: `slugify`, `formatIDR`, `nowISO`, `uid`, `effectiveStock`, `lowThreshold`, `stockStatus`, `generateCombinations`, `emptyProduct`, `isProductVariant`
- `state.svelte.ts`
  - Runes-based `AdminStore`
  - Singleton export: `admin`
  - products, categories, collections, movements
  - `sidebarCollapsed`, `moreSheetOpen`, `toast`
  - `showToast`, `clearToast`
  - `slugUnique`, `skuUnique`
  - `toggleSidebar`, `toggleMoreSheet`
  - `upsertProduct`, `deleteProducts`, `duplicateProduct`
  - `setProductsStatus`, `archiveProduct`
  - `adjustStock`
  - category create/update/delete with reassignment
  - collection create/update/delete
  - `moveCollection`
- `navSections.ts`
  - `NavId`
  - `NAV_SECTIONS`
  - `ROUTE_BY_NAV_ID` under `/dashboard`
  - `navIdFromPath`
  - `DASHBOARD_ROOT = '/dashboard'`

Important implementation note:

- This project uses `#lib/...` subpath imports.
- For files importing the custom TS/runes modules, explicit `.ts` / `.svelte.ts` extensions were required by `svelte-check`.

### P2 — Dashboard shell/components

Created under `src/lib/admin/components/`:

- `StatusBadge.svelte`
- `StockBadge.svelte`
- `Toast.svelte`
- `Modal.svelte`
- `ConfirmModal.svelte`
- `Sidebar.svelte`
- `Topbar.svelte`
- `MobileTabs.svelte`
- `MoreSheet.svelte`
- `PlaceholderContent.svelte`

Created:

- `src/routes/dashboard/+layout.svelte`

Created all 8 placeholder module routes:

- `/dashboard/orders`
- `/dashboard/customers`
- `/dashboard/pages`
- `/dashboard/media`
- `/dashboard/promotions`
- `/dashboard/navigation`
- `/dashboard/store-settings`
- `/dashboard/users-perms`

P2 was checked clean with Svelte autofixer + `bun run check` before later edits.

### P3 — Partially built; needs validation/finish

Written current files:

- `src/routes/+page.svelte`
  - Storefront landing
  - Sticky storefront header
  - Hero
  - Featured bags
  - Shop by collection
  - Browse by category
  - Trusted feature strip
  - Footer
  - WhatsApp enquiry CTA does **not** copy message
  - “Copy message” button uses clipboard path
  - Storefront reads live `admin.products`, `admin.collections`, `admin.categories`
  - Only `status === 'active'` products are shown

- `src/routes/dashboard/+page.svelte`
  - Full Overview draft
  - KPI cards
  - Orders table/cards
  - Activity stream
  - Live counts from the in-memory store
  - Uses `SEED_ORDERS` and `SEED_ACTIVITY`

Known current validation issue:

- `bun run check` previously reported:
  - `<svelte:head>` placement issue in `src/routes/+page.svelte`
  - `innerWidth` wrapper/type issue in `src/routes/dashboard/+page.svelte`
  - an invalid `href="#"` warning
- A fix was started by moving `<svelte:head>` to root level, but the final check after the last edit was still pending.
- Run `bun run check` again before relying on P3.

Key WhatsApp reference format found:

- Preview format starts: `Halo, saya tertarik dengan produk:`
- Includes product name, variant, formatted price, compare-at price if present, SKU, availability.
- Copy path text: `Halo, saya tertarik dengan ${product.name} ${variant ? '- variant' : ''} ${price}`

---

## Remaining Plan

### P3 — Fix validation and verify storefront + Overview

- Fix `src/routes/+page.svelte` `<svelte:head>` placement and invalid root href.
- Fix `innerWidth` usage in Overview; keep `< 768` mobile breakpoint.
- Run Svelte autofixer on:
  - `src/routes/+page.svelte`
  - `src/routes/dashboard/+page.svelte`
- Run:
  - `bun run check`
- Smoke test:
  - `http://127.0.0.1:5199/`
  - `http://127.0.0.1:5199/dashboard`

### P4 — Products list

Implement `src/routes/dashboard/products/+page.svelte`:

- Full products list matching the reference
- Search/filter
- Pagination (10/page)
- Bulk actions
- Archive/reactivate
- Duplicate
- Delete with armed confirmation
- Storefront-style preview cards
- `WhatsAppModal.svelte`
- Mobile list/card behavior via `innerWidth < 768`

### P5 — Product form create/edit

Implement:

- `src/routes/dashboard/products/new/+page.svelte`
- `src/routes/dashboard/products/[id]/edit/+page.svelte`
- Shared `ProductForm.svelte`

Behavior required:

- Dirty guard with `beforeNavigate` Leave/Stay modal
- `<svelte:window onbeforeunload>` guard
- Slug auto-derive from name until user overrides
- Image upload validation: jpg/png/webp, ≤ 5MB
- Object URLs + simulated upload progress
- Variant builder
- `generateCombinations`
- Inline create category modal auto-select
- Inline create collection modal auto-select
- SEO preview and auto-backfill on save
- Right rail validation summary
- Publish/Save Draft/Archive actions
- On save: `upsertProduct`, then navigate
  - create → `/dashboard/products`
  - edit → `/dashboard/products/[id]`

### P6 — Product detail

Implement `src/routes/dashboard/products/[id]/+page.svelte`:

- Gallery with primary-image support
- Variant table
- Inventory movements, last 5
- Pricing/inventory panel
- Organization panel
- SEO/publishing panel
- Delete confirmation
- If product missing, redirect during `$effect` to `/dashboard/products`

### P7 — Categories, Collections, Inventory

Implement:

- `src/routes/dashboard/categories/+page.svelte`
  - search
  - product counts
  - create/edit/delete
  - reassign-to on delete
- `src/routes/dashboard/collections/+page.svelte`
  - search
  - sort by `order`
  - up/down reorder steppers
  - product multi-assign modal
- `src/routes/dashboard/inventory/+page.svelte`
  - search
  - stock status filter
  - low-stock alert strip
  - product/variant matrix
  - adjust-stock modal with clamp preview
  - movement history table
  - chip colors: restock green, corrected neutral, damaged red

### P8 — Final polish/QA

- Responsive pass at 375px and 1280px
- Match reference styling as closely as practical
- Run final:
  - `bun run check`
  - Svelte autofixer on every `.svelte` / `.svelte.ts` file
  - dev server smoke tests for all routes
- Compare against QA checklist in the plan at:
  - `/home/wyshanzzz/.opencode/plan/stovex-ref-to-svelte.md`

---

## Architecture / conventions to preserve

- SvelteKit routes under `src/routes/dashboard/`
- Storefront root is `src/routes/+page.svelte`
- Dashboard layout is `src/routes/dashboard/+layout.svelte`
- No database or persistence
- In-memory admin singleton:
  - `src/lib/admin/state.svelte.ts`
- Types:
  - `src/lib/admin/types.ts`
- Seeds/helpers:
  - `src/lib/admin/data.ts`
- Navigation:
  - `src/lib/admin/navSections.ts`
- Use concrete `PageProps` / `LayoutProps` from generated `$types`
- Use `as Path` casts for `resolve(...)` where SvelteKit typing requires it
- Keep `#lib/...` imports, not `$lib`
- Use explicit `.ts` / `.svelte.ts` extensions for `#lib/admin/*.ts` modules when importing from `.svelte` files
- For the authenticated/public provenance fields in structured output, use null/unknown rather than inventing provider details

---

## Important behavior decisions

- Admin routes live under `/dashboard`
- Home `/` is the storefront landing, not the dashboard
- Storefront shows only active products
- No cart; WhatsApp enquiry is the conversion CTA
- Product detail missing → redirect to `/dashboard/products`
- `available: true` was set for stocked variants where the minified reference omitted it
- Collection reorder swaps by ±1 then re-indexes `order`
- Collection delete strips dangling `collectionIds` from products
- Category delete can reassign products
- Stock adjustments clamp at 0 and create a movement record
- Dashboard remains intentionally in-memory / SSR-singleton for this prototype
