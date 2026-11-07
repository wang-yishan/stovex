# AGENTS.md

## Dev speed (user request)

- **Do NOT run `bun run check` / `bun run build` unless the user explicitly asks.** Prioritize development speed; defer typecheck and build verification to the user.
- Verify UI work visually via the dev server when needed; only run checks on request.

## Commands

- Package manager is **bun only** (`bun.lock`, `engine-strict` in `.npmrc`). Never use npm/pnpm/npx.
- `bun run dev` — Vite dev server (auto adapter; no deploy adapter configured)
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
- Tailwind v4 via `@tailwindcss/vite` (plugins: forms, typography). Stylesheet entry is `src/routes/layout.css`, which imports `admin.css`. Prettier points at that file too — don't move it.
- `mdsvex` handles `.svx`/`.md` as Svelte components (see `vite.config.ts` extensions).
- **Paraglide i18n**: locales `en` (base) + `id`. `src/lib/paraglide/` is **generated and gitignored** — never edit it. Edit `messages/*.json` and `project.inlang/settings.json`; the Vite plugin regenerates on dev/build. Global `reroute` lives in `src/hooks.ts` — don't remove it.
- **Auth / DB**: Better Auth (`better-auth/minimal` + `drizzleAdapter`, sqlite) in `src/lib/server/auth.ts`. `src/hooks.server.ts` chains `handleParaglide` then `handleBetterAuth` via `sequence()` — preserve order; `sveltekitCookies` must stay last in the plugins array. Env vars `DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET` are declared in `src/env.ts`; `drizzle.config.ts` throws if `DATABASE_URL` is missing (local default `file:local.db` in `.env`).
- DB commands: `bun run db:push` (schema push), `bun run db:generate`, `bun run db:migrate`, `bun run db:studio`. `bun run auth:schema` regenerates `src/lib/server/db/auth.schema.ts` — run after changing Better Auth config.
- **Admin dashboard** (`/dashboard/*`): runes singleton `admin` in `src/lib/admin/state.svelte.ts`, seed data in `src/lib/admin/data.ts`. Data is **in-memory only** — no DB persistence. `ref/index.html` is the Bag Store prototype being converted; don't treat it as source of truth.
- Public storefront is `src/routes/+page.svelte`; demo routes under `src/routes/demo/` (Paraglide + Better Auth demos) — `DemoLinks` in root layout only renders on `/demo` paths.

## Svelte MCP & plugins

- `@sveltejs/opencode` is loaded in `.opencode/opencode.json`. When asked about Svelte/SvelteKit: call `list-sections` first, then `get-documentation` for relevant sections.
- Use `svelte-autofixer` on new/edited Svelte code before sending it to the user; repeat until no issues remain. `playground-link` only after user confirmation, never for code written into the project.
- For visual/UX polish on landing/storefront pages, load the `design-taste-frontend` skill (`.agents/skills/design-taste-frontend`).

## Browser testing

Playwright was removed from this project by user request — do not install, configure or suggest it. Verify UI work via the dev server (curl spot checks); run `bun run check` / `bun run build` only on user request (see Dev speed).
