# santiago-beracochea-app

Astro + React + Tailwind CSS v4 ecommerce for **Santiago Beracochea Distribuidora**, backed by an Express API on PostgreSQL.

## Commands

- `npm run dev` - Astro (4321) + Express API (3001) via `concurrently`
- `npm run build` - static build to `dist/`
- `npm run preview` - preview the build
- `npm run check` - `astro check` (TypeScript + Astro diagnostics)
- `npm run db:setup` - verify the PostgreSQL connection and print row counts
- `npm run db:migrate` - (re)import `server/data/db.json`; idempotent
- `node --env-file=.env scripts/smoke.mjs` - 36 end-to-end API checks (auth, catalog, orders, permissions, metrics)

Both dev scripts rely on env vars, so they must keep the `--env-file=.env` flag.

## Project Structure

- `astro.config.mjs` - Astro config with `@astrojs/react` and the Tailwind v4 Vite plugin
- `src/styles/global.css` - global CSS entrypoint, `@theme` tokens (`sb-blue`, `sb-gold`, `sb-cream`, `font-display`, `font-body`)
- `src/lib/api.ts` - typed fetch wrapper; attaches the bearer token from `localStorage`
- `src/lib/types.ts` - shared `User`, `Product`, `CartLine`, `Order` types
- `src/lib/store.ts` - reactive stores via `useSyncExternalStore`. Products, session, orders and users come from the API; the **cart stays in `localStorage`** under `sb_cart`
- `src/lib/auth.ts` - pure helpers: `isProtectedPath`, `loginHref`, `registerHref`, `safeNext`
- `src/lib/useLocationState.ts` - SSR-safe URL hooks. `useLocationState` starts empty and fills in after mount; use it instead of reading `window` during render
- `src/layouts/BaseLayout.astro` - public shell; wraps `<slot />` in `AuthGuard`
- `src/layouts/AuthLayout.astro` - centered gradient shell for login/register
- `src/components/Header.astro`, `src/components/Footer.astro` - site chrome
- `src/components/react/` - React islands (`ProductCard`, `ProductFilters`, `CatalogExplorer`, `ShoppingCart`, `QuantitySelector`, `CheckoutForm`, `OrderHistory`, `AdminProductForm`, `AdminProductTable`, `AdminOrders`, `AdminPanel`, `AuthPanel`, `ProfilePanel`, `ProductPurchase`, `HeaderControls`, `NavLinks`, `AuthGuard`, `StoreHydrator`)
- `server/` - Express API: `database.js` (pool + DDL), `repositories/`, `routes/`, `mappers.js`, `seed.js`
- `public/images/` - brand logo, hero image and product photos

## Routes

| Route | Rendering |
| --- | --- |
| `/` | Astro static (hero, categories, featured `ProductCard` islands) |
| `/catalogo` | Astro + `CatalogExplorer` island (filters + grid) |
| `/producto/[slug]` | Static paths, `ProductPurchase` island |
| `/login`, `/registro` | `AuthPanel` island |
| `/checkout` | `CheckoutForm` island |
| `/perfil` | `ProfilePanel` island |
| `/pedidos` | `OrderHistory` island |
| `/admin` | `AdminPanel` island, Productos tab |
| `/admin/pedidos` | `AdminPanel` island, Pedidos tab |
| `/admin/metricas` | `AdminPanel` island, Métricas tab (`AdminMetrics`) |

Admin navigation uses **paths, not query strings**: Astro dev hands `Astro.url` to components without the query, so `?tab=` does not work. See `src/components/AdminTabs.astro`.

## Auth

`/pedidos`, `/perfil`, `/checkout` and `/admin` require a session. `AuthGuard` resolves the session and redirects to `/login?next=<path>` when anonymous; `safeNext` rejects anything that is not a local path, so `?next=` cannot be used for an open redirect. The API enforces permissions independently (`requireAuth` / `requireAdmin`), so the client guard is UX, not security.

Admin credentials: `admin@sb.com.uy` / `admin123`.

## Database

PostgreSQL 18, database `sb_store`, role `sb_app`; credentials live in `.env` (`DATABASE_URL`) and must never be committed. Tables: `users`, `products`, `orders`, `order_items`. The schema is created idempotently on API startup. `server/data/db.json` is the pre-migration backup and is no longer read at runtime.

## Gotchas

- **Never** read and rewrite source files with PowerShell `Get-Content`/`Set-Content`. That already caused double encoding, a BOM and `U+FFFD` across several files. Use the editor tools, or `[IO.File]::WriteAllText` with an explicit UTF-8 encoding without BOM.
- The replacement character (U+FFFD) in terminal output is usually just the console codepage, not a corrupt file. Confirm with Node before "fixing" anything, and keep U+FFFD out of source files.
- Islands are server-rendered, so `window` is undefined during the build. Reading it during render fails `npm run build` even when `astro check` passes.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`; no `tailwind.config` file. Brand tokens live in the `@theme` block of `src/styles/global.css`. Use utilities directly in JSX/Astro markup.
