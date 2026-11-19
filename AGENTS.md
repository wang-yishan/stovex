# AGENTS.md

## Dev speed (user request)

- **Never run `bun run dev`, `bun run check`, `bun run build`, tests, or any verification command unless the user explicitly asks.** This includes starting the dev server and curl spot checks. Prioritize development speed; leave verification to the user.
- When the user does ask for verification, run only the specific command needed — not the full suite.

## Commands

- Package manager is **bun only** (`bun.lock`, `engine-strict` in `.npmrc`). Never use npm/pnpm/npx. `README.md` is the unmodified `sv` scaffold boilerplate (it says npm/npx) — ignore it; `package.json` + `bun.lock` are the source of truth.
- `bun run dev` — Vite dev server (auto adapter; no deploy adapter configured; don't start it on your own)
- `bun run check` — `svelte-kit sync` + `svelte-check` (typecheck; only on user request, see Dev speed)
- `bun run lint` — prettier check only (no eslint). `bun run format` to fix (tabs, single quotes, printWidth 100, trailingComma none)
- `bun run build` / `bun run preview`

There is **no test runner and no CI**. Verification only on user request (see Dev speed).

## Icons (Lucide)

- **Always use `class=` for Lucide icons — never `className=`.** In `@lucide/svelte` the styling prop is `class`; `className` is forwarded as a plain SVG attribute and Tailwind sizes/positioning silently never apply (icons fall back to 24px static, e.g. search icon ends up outside the input border).
- Size scale (Tailwind classes): 14px `h-3.5 w-3.5` (small row/menu actions) · 16px `h-4 w-4` (default: buttons with labels, section headers, search) · 20px `h-5 w-5` (nav: sidebar/tabs, standalone icon buttons, KPI tiles) · 24px `h-6 w-6` (empty states). No arbitrary sizes (`h-[18px]`, `h-[22px]`, `h-8`) for icons.
- Color: inherit by default; explicit only for muted `text-[#999]` (search/placeholder/empty), secondary `text-[#777]` (icon-only actions, inactive nav), active `text-[#242424]`, semantic (`#269B65`/`#1A7A52` success, `#D69A35`/`#8A6A24` warning, `#D9534F`/`#A33A37` danger). `strokeWidth={1.6}` for nav/KPI icons, default `2` elsewhere.

## Stack quirks

- **Runes mode is forced** for all non-`node_modules` components via `vite.config.ts` (`runes: true` in sveltekit plugin). Do not use legacy `export let` / `$:` reactive syntax in app code.
- Imports: `#lib/...` maps to `src/lib/...` (also `$lib`, `$app/*` for generated types). For custom runes modules (`.ts` / `.svelte.ts`), **explicit extensions are required** or `svelte-check` fails.
- Tailwind v4 via `@tailwindcss/vite` (plugins: forms, typography). **All global/Tailwind CSS lives in `src/routes/layout.css`** — it is the single source of truth (fonts, Tailwind core, dark variant, design tokens, `@theme inline` mapping, base layer, chrome). Never re-declare a token in another file; change it there. Prettier points at that file too — don't move it.
- **shadcn-svelte** is installed (`components.json`, UI kit in `src/lib/components/ui/`, `cn` from the `cn` package). The theme is wired to the Bag Store palette: shadcn's semantic tokens (`--background`, `--primary`, `--muted-foreground`, …) alias the brand tokens (`--bg`, `--surface`, `--text-*`, `--border`) in `layout.css`, so kit components render in the product design language in both light and dark mode. Add components with `bunx shadcn-svelte@latest add <name>`.
- **Form controls use the shadcn kit** — `Button`, `Input`, `Textarea`, `NativeSelect`, `Checkbox`, `Label` from `src/lib/components/ui/`. Import them with the explicit barrel path (`#lib/components/ui/button/index.ts`); `#lib/<dir>` does **not** resolve a directory index. Never write a raw `<input>`/`<select>`/`<textarea>`/`<button>` for app UI — use the kit so colours come from tokens and dark mode works for free.
- `Checkbox` is bits-ui-based: it renders a `<button role="checkbox">`, so use `checked={...}` + `onCheckedChange={(v) => ...}` (not `onchange`), and `bind:checked` for two-way state. `indeterminate` gives the select-all dash state.
- **Colour tokens, not hex, in components.** Use `bg-card`, `bg-field`, `bg-muted`, `bg-accent`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `text-destructive`, `border-border`, `bg-success`/`bg-warning`/`bg-danger` instead of `bg-white`, `bg-[#FBFBFA]`, `text-[#242424]`, etc. Hex classes need a hand-written `.dark` remap; tokens flip automatically. The `.dark` remap block in `layout.css` only exists for legacy hex markup.
- **Control borders follow the card border.** Inputs, selects, textareas, checkboxes and outline buttons use the same `--border` (#eaeaea) as the dashboard cards, via the `--input` token (`--input: var(--border)`) — visual consistency with the product cards wins over a 3:1 control boundary. `--border-control` (#8a8a8a) stays available as the emphasis border for hover/active states.
- `NativeSelect` wraps a native `<select>` in a `w-fit` div and injects a chevron — it needs an explicit closing tag (`</NativeSelect>`), and full-width usage needs `[&>div]:w-full` on the wrapper.
- `mdsvex` handles `.svx`/`.md` as Svelte components (see `vite.config.ts` extensions).
- **Paraglide i18n**: locales `en` (base) + `id`. `src/lib/paraglide/` is **generated and gitignored** — never edit it. Edit `messages/*.json` and `project.inlang/settings.json`; the Vite plugin regenerates on dev/build. Global `reroute` lives in `src/hooks.ts` — don't remove it.
- **Auth / DB**: Better Auth (`better-auth/minimal` + `drizzleAdapter`, sqlite) in `src/lib/server/auth.ts`. `src/hooks.server.ts` chains `handleParaglide` then `handleBetterAuth` via `sequence()` — preserve order; `sveltekitCookies` must stay last in the plugins array. Env vars `DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET` are declared in `src/env.ts` (all required). `ORIGIN` — not `BETTER_AUTH_URL` — feeds Better Auth's `baseURL`; a missing/empty value fails startup validation. `drizzle.config.ts` throws if `DATABASE_URL` is missing (local default `file:local.db` in `.env`).
- DB commands: `bun run db:push` (schema push, runs `drizzle-kit push --force` so it works without a TTY), `bun run db:generate`, `bun run db:migrate`, `bun run db:studio`. `bun run auth:schema` regenerates `src/lib/server/db/auth.schema.ts` — run after changing Better Auth config.
- **Admin dashboard** (`/dashboard/*`): runes singleton `admin` in `src/lib/admin/state.svelte.ts`, seed data in `src/lib/admin/data.ts`. `ref/index.html` is the Bag Store prototype being converted; don't treat it as source of truth.
- **Brand & Store Settings (SQLite)**: the storefront brand and store settings live in the singleton `store_setting` row (table in `src/lib/server/db/schema.ts`, repository `src/lib/server/catalog/settings.ts`, API `/api/settings`). The unified page at `/dashboard/brand` (“Brand & Store Settings”) edits identity/branding, logos, palette/fonts, contact/social URLs, footer text/media links, default SEO and header links in one form (partial `PUT` merge in the API).(`/dashboard/store-settings` redirects there.)
- **Brand tokens**: the palette and fonts are `--brand-*` custom properties declared in `src/routes/layout.css` and injected at runtime by the root `+layout.svelte` (as an inline style on the app root) — so the first server-rendered paint already carries the saved brand. The storefront renders with `brand-*` utilities (`text-brand-ink`, `bg-brand-surface`, …); never hardcode the storefront hexes again. Merchant-chosen colours are unchecked, so the brand page shows a live WCAG ratio per role (`src/lib/admin/brand.ts`).
- **Brand-derived copy**: the store name is the only source of the wordmark. `admin.settings.brand.name` replaces every hardcoded brand string (sidebar wordmark, WhatsApp greetings, SEO suffix, shipment locations). The default SEO title and footer text follow a rename **only while they still match the auto-generated pattern** — a hand-written title is never overwritten.
- **Catalog persistence (SQLite)**: the product catalog lives in SQLite (`DATABASE_URL="file:local.db"`) via drizzle. Tables `product`, `product_image`, `product_variant`, `category`, `collection`, `stock_movement` are defined in `src/lib/server/db/schema.ts`; all reads/writes go through `src/lib/server/catalog/repository.ts` (`getCatalog`, `saveProduct`, `adjustStock`, …). `ensureSeeded()` fills an empty database from the prototype seeds exactly once.
- **The `admin` store is a mirror, not the source of truth.** The root `+layout.server.ts` loads the catalog from SQLite and `+layout.svelte` calls `admin.hydrateCatalog(data.catalog)`; store mutations (`upsertProduct`, `deleteProducts`, `setProductsStatus`, `adjustStock`, category/collection CRUD) are `async` and go through `src/lib/admin/api.ts` → `/api/*` → SQLite. New store mutations must stay async and update the cache only after the server confirms.
- **Uploads (Vercel Blob)**: images are uploaded to Vercel Blob by `POST /api/uploads` (implemented in `src/lib/server/catalog/upload.ts` via `@vercel/blob` `put`, `access: "public"`, using `process.env.WYSHANZZZ_STORE_ID` when set) and the returned public blob URL is stored/served directly. `GET /uploads/[...path]` remains only to serve legacy files previously saved to the local `uploads/` folder. Never use `URL.createObjectURL` for product images — it does not survive a reload.
- **Product imagery**: one product holds several images (`product_image` rows, one `isPrimary`). The storefront gallery renders the product's own images — primary frame first, thumbnails underneath (`ProductGallery.svelte`). `src/lib/catalog/photos.ts` only assigns fallback photography (from `PHOTO_POOL`) to products that have no uploads, keyed by product name so two products never get the same set. Seeded products get their own photos via `backfillSeedImages()` in the repository.
- Public storefront is `src/routes/+page.svelte`; demo routes under `src/routes/demo/` (Paraglide + Better Auth demos) — `DemoLinks` in root layout only renders on `/demo` paths. The storefront root class is **`.forma-root`** (dashboard is `.admin-root`); the chrome/dark-remap rules in `layout.css` are scoped to those two names — a third name silently loses all of them.

## Borders & surfaces (design system)

- **One border, one look.** Every surface, divider, card and control uses the `--border` token: `border-border` in new markup, or the legacy `style="border-color: var(--border)"` on panels that still carry hex classes. Never introduce a new border hex, never use `border-control` for a rest state, and never pair a bare `border` with an explicit dark `border-[#…]`.
- **Canonical card recipe** (copy it, don't invent variants) — the dashboard products page: `rounded-[12px] border bg-white` + `border-color: var(--border)`, `bg-[#F5F5F4]` for image/empty placeholders, `bg-[#FBFBFA]` for table headers and card footers. `src/routes/dashboard/products/+page.svelte` is the reference implementation; other dashboard pages should look identical.
- **Border tokens live in `layout.css` only.** New colours, radii or appearance go into the `:root` / `.dark` token blocks and the `@theme inline` mapping — never into a component file.
- **`@tailwindcss/forms` paints its own chevron on every `select`** (base-layer `background-image`). Any native `<select>` therefore needs `bg-none`, otherwise it shows two arrows next to the injected `NativeSelect` chevron.
- Border widths: 1px (`border`) for surfaces and dividers; 2px (`border-2`) only for the notification dot and the spinner ring.

## Text contrast (WCAG)

- **Text on light surfaces must reach 4.5:1** (AA, normal text); 3:1 is only enough for icons/borders. Check any new text color with `bun scripts/contrast.ts <fg> <bg> [backdrop]` — `bun run contrast --audit` prints the whole palette audit.
- Approved light-mode text roles: primary `#242424` (14.6:1 on `#f8f8f7`), secondary `#5A5A5A` (6.5:1), muted `#636363` (5.7:1), storefront warm muted `#6B6762` (4.9:1). Dark-mode counterparts `#F0F0F0` / `#A8A8A8` / `#8A8A8A` are remapped in `src/routes/layout.css`.
- **Hex vs rgba:** a hex is opaque → one fixed ratio. An `rgba()` background is _composited_ over what is behind it (`alpha*fg + (1-alpha)*backdrop`), so its contrast depends on the backdrop — a translucent sticky bar has no single ratio. Composite it against the worst case (dark content scrolling underneath) and keep alpha high enough (≥0.9) for the text to hold.
- Don't write `bg-[#XXXXXX]/80`-style classes for themed chrome: the opacity modifier produces a different class name, so the `.dark` remap rules in `layout.css` can't match it. Use a CSS variable token (`--chrome-bg`) instead.

## Svelte MCP & plugins

- `@sveltejs/opencode` is loaded in `.opencode/opencode.json`. When asked about Svelte/SvelteKit: call `list-sections` first, then `get-documentation` for relevant sections.
- Use `svelte-autofixer` on new/edited Svelte code before sending it to the user; repeat until no issues remain. `playground-link` only after user confirmation, never for code written into the project.
- For visual/UX polish on landing/storefront pages, load the `design-taste-frontend` skill (`.agents/skills/design-taste-frontend`).

## Browser testing

Playwright was removed from this project by user request — do not install, configure or suggest it. Don't start the dev server or run checks on your own; only when the user explicitly asks (see Dev speed).
