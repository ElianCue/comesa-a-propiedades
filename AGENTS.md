# AGENTS.md — Comensaña Propiedades

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS v3
- pnpm (see `pnpm-lock.yaml`)
- **No API routes, no database.** Data is seed + Zustand store persisted to `localStorage` under key `comesana-properties`
- Admin auth: hardcoded `admin` / `comesana2025` in `localStorage` (key `comesana.auth`)
- Leaflet map loaded from CDN (`unpkg.com`) on `/mapa`, not an npm dep

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |

No test, lint, or typecheck scripts exist.

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/` | HomePage | Property grid with client-side filters (tab, operación, tipo, barrio, max price) |
| `/propiedad/[id]` | PropertyPage | Detail view with gallery, specs, WhatsApp contact |
| `/mapa` | MapaPage | Leaflet map with filtered markers + sidebar list |
| `/admin` | AdminPage | CRUD panel. Login required. |

## Key files

- `src/lib/properties.ts` — `Property` type, seed data (10 properties), `BARRIOS`, `formatPrice`, `WHATSAPP` number
- `src/lib/store.ts` — Zustand store with `persist` middleware
- `src/hooks/useProperties.ts` — Client hook wrapping store + hydration guard
- `src/lib/utils.ts` — `cn()` helper (`clsx` + `tailwind-merge`)
- `src/components/ui/button.tsx` — shadcn-style Button with variants (default, destructive, outline, ghost, link)
- `src/components/ui/card.tsx` — shadcn-style Card components

## Conventions

- Path alias `@/*` → `./src/*` (from `tsconfig.json`)
- All pages are `"use client"` except root layout
- CSS uses `oklch()` color space for theming; custom properties in `globals.css`
- Custom fonts via `next/font/google`: Playfair Display (`--font-display`), DM Sans (`--font-sans`)
- Images from Unsplash; `next.config.mjs` allows `images.unsplash.com` remote pattern
- No `mdx` files despite being in Tailwind `content` globs (safe to ignore)
- WhatsApp number: `5492215551234` (hardcoded in `properties.ts`)
- `@radix-ui/react-slot` available but only used in `ui/button.tsx`
- `class-variance-authority` +  `clsx` + `tailwind-merge` available

## Gotchas

- **Data is local only.** Refreshing the admin page returns to seed data unless changes were persisted in localStorage before reload.
- **No i18n** — hardcoded Spanish throughout.
- **Max price filter on home page** defaults to USD 300k and only applies when `moneda === "USD"`.
- **Map page** dynamically imports Leaflet — ensure `window.L` check before usage. No Leaflet types exist (`declare global` used).
- **Property form** auto-assigns a fallback Unsplash photo if all photo URLs are cleared.
