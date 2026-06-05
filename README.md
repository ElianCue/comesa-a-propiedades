# Comesaña Propiedades

Inmobiliaria digital con cobertura en La Plata y Mar del Plata.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS v3 |
| Backend | Express + serverless-http |
| ORM | Prisma |
| DB | Supabase Postgres |
| Auth | JWT + bcryptjs + httpOnly cookies (24h expiry) |
| Validación | Zod |
| Imágenes | Cloudinary (upload preset con restricciones) |
| Deploy | Vercel (2 proyectos: web + api) |
| Paquetería | pnpm workspaces |
| Shared | `packages/shared/` compilado con `tsc` |

## Estructura

```
comesana-propiedades/
├── apps/
│   ├── web/                    # Next.js
│   │   ├── src/
│   │   │   ├── app/            # Pages
│   │   │   ├── components/     # UI components
│   │   │   ├── hooks/          # useProperties y otros
│   │   │   └── lib/
│   │   │       └── api-client.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                    # Express
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── src/
│       │   ├── routes/         # property.routes, auth.routes
│       │   ├── controllers/    # property.controller, auth.controller
│       │   ├── services/       # property.service, auth.service
│       │   ├── middleware/     # auth, validation, error-handler
│       │   ├── validators/    # property.validator, auth.validator
│       │   ├── lib/           # prisma.ts, errors.ts, api-response.ts
│       │   └── index.ts       # Express app + serverless-export
│       ├── vercel.json
│       └── package.json
│
├── packages/
│   └── shared/                  # types, CIUDADES, BARRIOS, helpers
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
└── README.md
```

## Base de datos

### Diagrama entidad-relación

```
cities ──┬── barrios
          │
property_types ──┐
                 │
operations ──────┤──→ properties ──┬── property_photos
                 │                 │
currencies ──────┘                 ├── property_amenities ── amenities
                                   └── inquiries
```

### Schema (resumido)

8 tablas: `cities`, `barrios`, `property_types`, `operations`, `currencies`, `amenities` (lookup) + `properties`, `property_amenities`, `property_photos` (data) + `admins` + `inquiries`.

IDs con `cuid()` (string, serializable a JSON). Precios como `Int` (enteros). Metros cuadrados como `Decimal` (soporta decimales tipo 87.5 m²).

## API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | /api/properties | — | Listar con filtros + cursor pagination |
| GET | /api/properties/:id | — | Detalle de propiedad |
| POST | /api/properties | admin | Crear propiedad |
| PUT | /api/properties/:id | admin | Editar propiedad |
| DELETE | /api/properties/:id | admin | Eliminar propiedad |
| GET | /api/cities | — | Ciudades con sus barrios |
| GET | /api/amenities | — | Amenities disponibles |
| GET | /api/lookup | — | Todos los lookup data |
| POST | /api/auth/login | — | Login → httpOnly cookie JWT (24h) |
| POST | /api/auth/logout | — | Clear cookie |
| GET | /api/auth/me | — | Verificar sesión |
| POST | /api/inquiries | — | Crear consulta desde propiedad |
| GET | /api/inquiries | admin | Listar consultas |
| PUT | /api/inquiries/:id | admin | Marcar como leída |

## Scripts

```bash
pnpm dev          # Arranca web (3000) + api (4000) en paralelo
pnpm build        # Compila shared, web y api
pnpm db:migrate   # Prisma migrate dev (en api)
pnpm db:seed      # Prisma seed (en api)
pnpm db:studio    # Prisma Studio
```

## Fases de construcción

### Fase 0 — Monorepo setup
- [ ] pnpm-workspace.yaml
- [ ] packages/shared/ con tsc
- [ ] Migrar src/ actual a apps/web/
- [ ] apps/api/ con package.json + tsconfig.json
- [ ] Dependencias instaladas

### Fase 1 — Prisma schema + seed
- [ ] schema.prisma con todas las tablas
- [ ] prisma/seed.ts (lookup tables + admin por env vars + properties seed)
- [ ] Migración aplicada a Supabase

### Fase 2 — Backend core
- [ ] lib/prisma.ts (singleton)
- [ ] lib/errors.ts (AppError, NotFoundError, etc.)
- [ ] lib/api-response.ts (success, error, paginated)
- [ ] middleware/error-handler.ts (global)
- [ ] middleware/auth.middleware.ts (JWT verify)
- [ ] middleware/validation.middleware.ts (Zod wrapper)

### Fase 3 — Auth endpoints
- [ ] validators/auth.validator.ts
- [ ] services/auth.service.ts (bcrypt + JWT)
- [ ] controllers/auth.controller.ts
- [ ] routes/auth.routes.ts

### Fase 4 — Property CRUD
- [ ] validators/property.validator.ts
- [ ] services/property.service.ts
- [ ] controllers/property.controller.ts
- [ ] routes/property.routes.ts

### Fase 5 — Lookup endpoints
- [ ] GET /api/cities (con barrios)
- [ ] GET /api/amenities
- [ ] GET /api/lookup (todo junto)

### Fase 6 — Frontend: store → API
- [ ] lib/api-client.ts (fetch wrapper)
- [ ] Reemplazar usePropertyStore por fetch API
- [ ] Actualizar hooks

### Fase 7 — Admin page + Cloudinary
- [ ] Login real contra API
- [ ] CRUD properties contra API
- [ ] Cloudinary upload widget (preset con restricciones)

### Fase 8 — Inquiries
- [ ] Formulario de consulta en property detail
- [ ] Listado en admin

### Fase 9 — Deploy
- [ ] Proyecto Vercel web
- [ ] Proyecto Vercel api
- [ ] Env vars + vercel.json
- [ ] Deploy inicial +测试

### Fase 10 — Post-deploy
- [ ] Testing de filtros, admin, mapa
- [ ] Correcciones
- [ ] Opcional: migrar a Railway si cold starts molestan

## Variables de entorno

### apps/api

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@comesana.com
ADMIN_PASSWORD=...
CLOUDINARY_CLOUD_NAME=...
```

### apps/web

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
```
