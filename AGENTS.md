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
- `server/routes/images.routes.js` - image upload/serve, see [Product images](#product-images)
- `public/images/` - brand logo, hero image and product photos

## Product images

Product photos can be uploaded from the admin panel (`/admin` → Productos) and are stored in **PostgreSQL**, not on disk: `product_images (id uuid, mime, size, data bytea)`, created idempotently by the `SCHEMA` block in `server/database.js`. `products.image` stores the URL returned by the upload.

- `POST /api/images` - `requireAdmin` + `multer.memoryStorage()`, 2 MB cap (`IMAGE_MAX_BYTES`), field name `file`
- `GET /api/images/:id` - **public on purpose**: `<img src>` cannot send the bearer token, so requiring auth would break every product image. Served with `Cache-Control: immutable`

The MIME check is done on the **magic bytes** (`server/utils/images.js`), not the `Content-Type` header, since the client controls that header.

Images uploaded by an admin cannot live in `public/`: the Astro build is static, so that folder is baked into `dist/` at build time and any runtime write is lost on the next deploy.

Set `PUBLIC_API_URL` in production when the API does not share an origin with the site. It is the **API origin** (`https://sb-api.onrender.com`, no `/api` suffix) and is read by both `src/lib/api.ts` and `server/config.js`, so the stored URL is absolute and `<img src>` resolves. A trailing `/api` is tolerated by both readers and never duplicated.

It is inlined into the client bundle at **build** time, so on a static deploy it has to be set on the build, not just at runtime. Missing it leaves `BASE = '/api'`, which 404s against a static host instead of reaching the API.

## Deploy

The site and the API live on **different origins**, so every call is cross-origin:

- **Vercel** serves the static Astro output (`santiago-beracochea-app.vercel.app`). There are no serverless functions and no rewrite, so Vercel answers `404 text/plain` for any `/api/*` request.
- **Render** serves the Express API (`npm start`, which also serves `dist/` when it exists).

`PUBLIC_API_URL` **must** be set in the Vercel project's environment variables (all environments) or the build inlines `""`, `BASE` stays `/api`, and login/registro/catalog fail with `Respuesta inesperada del servidor (404)`. The symptom to recognise: Vercel replies 404 on `/api/*` while `/login` returns 200 HTML.

`CORS_ORIGIN` on Render must include the site origin (it defaults to reflecting any origin, so cross-origin calls work without it).

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

PostgreSQL 18, database `sb_store`, role `sb_app`; credentials live in `.env` (`DATABASE_URL`) and must never be committed. Tables: `users`, `products`, `orders`, `order_items`, `product_images`. The schema is created idempotently on API startup. `server/data/db.json` is the pre-migration backup and is no longer read at runtime.

## Gotchas

- **Never** read and rewrite source files with PowerShell `Get-Content`/`Set-Content`. That already caused double encoding, a BOM and `U+FFFD` across several files. Use the editor tools, or `[IO.File]::WriteAllText` with an explicit UTF-8 encoding without BOM.
- The replacement character (U+FFFD) in terminal output is usually just the console codepage, not a corrupt file. Confirm with Node before "fixing" anything, and keep U+FFFD out of source files.
- Islands are server-rendered, so `window` is undefined during the build. Reading it during render fails `npm run build` even when `astro check` passes.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`; no `tailwind.config` file. Brand tokens live in the `@theme` block of `src/styles/global.css`. Use utilities directly in JSX/Astro markup.
