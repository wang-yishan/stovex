# AGENTS.md

## Dev speed (user request)

- **Never run `bun run dev`, `bun run check`, `bun run build`, tests, or any verification command unless the user explicitly asks.** This includes starting the dev server and curl spot checks. Prioritize development speed; leave verification to the user.
- When the user does ask for verification, run only the specific command needed — not the full suite.

## Commands

- Package manager is **bun only** (`bun.lock`, `engine-strict` in `.npmrc`). Never use npm/pnpm/npx.
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
- **Colour tokens, not hex, in components.** Use `bg-card`, `bg-field`, `bg-muted`, `bg-accent`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `text-destructive`, `border-border`, `border-input`, `bg-success`/`bg-warning`/`bg-danger` instead of `bg-white`, `bg-[#FBFBFA]`, `text-[#242424]`, etc. Hex classes need a hand-written `.dark` remap; tokens flip automatically. The `.dark` remap block in `layout.css` only exists for legacy hex markup.
- **Control borders use `--border-control`, not `--border`.** `--border` (#eaeaea) is for decorative separators; an interactive control's boundary must reach 3:1 against its surface (WCAG 1.4.11), so form fields and checkboxes use `--border-control` (#8a8a8a) via the `--input` token.
- `NativeSelect` wraps a native `<select>` in a `w-fit` div and injects a chevron — it needs an explicit closing tag (`</NativeSelect>`), and full-width usage needs `[&>div]:w-full` on the wrapper.
- `mdsvex` handles `.svx`/`.md` as Svelte components (see `vite.config.ts` extensions).
- **Paraglide i18n**: locales `en` (base) + `id`. `src/lib/paraglide/` is **generated and gitignored** — never edit it. Edit `messages/*.json` and `project.inlang/settings.json`; the Vite plugin regenerates on dev/build. Global `reroute` lives in `src/hooks.ts` — don't remove it.
- **Auth / DB**: Better Auth (`better-auth/minimal` + `drizzleAdapter`, sqlite) in `src/lib/server/auth.ts`. `src/hooks.server.ts` chains `handleParaglide` then `handleBetterAuth` via `sequence()` — preserve order; `sveltekitCookies` must stay last in the plugins array. Env vars `DATABASE_URL`, `ORIGIN`, `BETTER_AUTH_SECRET` are declared in `src/env.ts` (all required). `ORIGIN` — not `BETTER_AUTH_URL` — feeds Better Auth's `baseURL`; a missing/empty value fails startup validation. `drizzle.config.ts` throws if `DATABASE_URL` is missing (local default `file:local.db` in `.env`).
- DB commands: `bun run db:push` (schema push), `bun run db:generate`, `bun run db:migrate`, `bun run db:studio`. `bun run auth:schema` regenerates `src/lib/server/db/auth.schema.ts` — run after changing Better Auth config.
- **Admin dashboard** (`/dashboard/*`): runes singleton `admin` in `src/lib/admin/state.svelte.ts`, seed data in `src/lib/admin/data.ts`. Data is **in-memory only** — no DB persistence. `ref/index.html` is the Bag Store prototype being converted; don't treat it as source of truth.
- Public storefront is `src/routes/+page.svelte`; demo routes under `src/routes/demo/` (Paraglide + Better Auth demos) — `DemoLinks` in root layout only renders on `/demo` paths. The storefront root class is **`.forma-root`** (dashboard is `.admin-root`); the chrome/dark-remap rules in `layout.css` are scoped to those two names — a third name silently loses all of them.

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
