# Quick Fix Guide - Deployment Blockers

## Priority 1: Build Failures (30-45 minutes)

### Fix 1: Add @types/minimist
```bash
cd apps/api
pnpm add -D @types/minimist
```

### Fix 2: Fix Express route type annotations
File: `apps/api/src/routes/auth.routes.ts`
```typescript
// ADD THIS
import type { Router } from 'express';

// CHANGE FROM:
export const authRoutes = express.Router();
// TO:
export const authRoutes: Router = express.Router();
```

Repeat for:
- `apps/api/src/routes/property.routes.ts`
- `apps/api/src/routes/inquiry.routes.ts`
- `apps/api/src/routes/lookup.routes.ts`

File: `apps/api/src/index.ts`
```typescript
// ADD EXPLICIT TYPE
import type { Express } from 'express';
const app: Express = express();
```

### Fix 3: Fix lookup.controller.ts type issue
File: `apps/api/src/controllers/lookup.controller.ts` (line 17)
```typescript
// The issue: amenity.grupo can be string | string[]
// But the function expects string

// SOLUTION: Check the Prisma schema
// amenity.grupo is String? (optional single value)
// If you need array, update schema or fix the usage
```

### Verify Build Works
```bash
pnpm build
# Should complete without errors
```

---

## Priority 2: Security - Secrets (30 minutes)

### Step 1: Rotate Credentials

Generate new secrets:
```bash
# New JWT Secret (minimum 32 chars)
openssl rand -base64 32
# Example: kh7mQ9XvZ2pL+w8nK3jRs5tYuP1aB4cD6eF9gH0iJ2

# Generate new database credentials via Supabase console
# Generate new Cloudinary credentials via Cloudinary console
```

### Step 2: Remove .env from Git History
```bash
# Remove files from git without deleting locally
git rm --cached apps/api/.env apps/web/.env .env

# Clean git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch apps/api/.env apps/web/.env .env' \
  -- --all

# Force push
git push origin --force --all

# Verify they're gone
git log --follow --diff-filter=D --summary apps/api/.env
```

### Step 3: Create New Local .env Files
File: `apps/api/.env`
```
DATABASE_URL=postgresql://[NEW_CREDENTIALS]@db.supabase.co:5432/postgres
JWT_SECRET=kh7mQ9XvZ2pL+w8nK3jRs5tYuP1aB4cD6eF9gH0iJ2
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@comesana.com
ADMIN_PASSWORD=[SECURE_RANDOM_PASSWORD]
CLOUDINARY_URL=cloudinary://[NEW_KEY]:[NEW_SECRET]@[CLOUD_NAME]
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[CLOUD_NAME]
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=comesana_preset
```

File: `apps/web/.env`
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=[CLOUD_NAME]
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=comesana_preset
```

### Step 4: Update .gitignore to Verify
File: `.gitignore` should contain:
```
.env
.env*.local
```

Test:
```bash
git status
# Should show .env files as untracked (not staged)
```

---

## Priority 3: JWT Secret Validation (5 minutes)

File: `apps/api/src/lib/env.ts`
```typescript
// CHANGE FROM:
JWT_SECRET: z.string().min(8).optional(),

// TO:
JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
```

Also ensure the middleware uses it safely:
```typescript
// apps/api/src/middleware/auth.middleware.ts
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set');
}
```

---

## Priority 4: Rate Limiting (30 minutes)

### Install Package
```bash
cd apps/api
pnpm add express-rate-limit
```

### Add to API
File: `apps/api/src/index.ts`
```typescript
import rateLimit from 'express-rate-limit';

// Add after other middleware, before routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Demasiadas solicitudes desde esta dirección IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to all /api routes
app.use('/api/', limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 min
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
```

---

## Priority 5: Remove Extraneous Dependencies (5 minutes)

```bash
cd apps/api
pnpm remove cors @types/cors
```

Verify in `package.json` - these should not appear.

---

## Priority 6: Add Error Tracking - Sentry (1 hour)

### Install
```bash
pnpm add @sentry/node
```

### Configure
File: `apps/api/src/index.ts` - at the very top
```typescript
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn, environment: env.nodeEnv });
}

// AFTER all middleware
app.use(Sentry.expressErrorHandler());
```

### Get Sentry DSN
1. Create account at sentry.io
2. Create project for "Node.js"
3. Copy DSN
4. Add to `.env`:
```
SENTRY_DSN=https://[key]@[domain].ingest.sentry.io/[project]
```

---

## Testing the Fixes

### Local Build
```bash
pnpm build
# Should succeed
```

### Local Run
```bash
pnpm dev
# Should start both apps without errors
```

### Database
```bash
pnpm db:migrate
pnpm db:seed
```

### API Health Check
```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-06-02T15:30:00.000Z",
  "uptime": 42.5,
  "database": {
    "connected": true,
    "responseTime": 12,
    "propertyCount": 4
  },
  "cloudinary": {
    "configured": true,
    "cloud": "dkwd8oqdh"
  },
  "env": "development"
}
```

### Admin Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@comesana.com",
    "password": "YOUR_ADMIN_PASSWORD"
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "admin": {
      "id": "cuid123",
      "email": "admin@comesana.com",
      "nombre": "Admin"
    }
  }
}
```

---

## Deployment Checklist

After all fixes:

- [ ] Local build succeeds: `pnpm build`
- [ ] Tests pass: `pnpm test`
- [ ] Git history is clean: `git log --oneline | head -5`
- [ ] No secrets in commits: `git log -p | grep -i "password\|secret\|token" | wc -l` (should be 0)
- [ ] New .env files created with rotated secrets
- [ ] .env files are ignored: `git status` (not shown)
- [ ] Vercel projects created
- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Admin user created via seed
- [ ] API health check works
- [ ] Frontend loads
- [ ] Admin login works

---

## If Build Still Fails

### Check TypeScript Errors
```bash
pnpm -r run build 2>&1 | grep -A 2 "error TS"
```

### Debug Express Types
```bash
# Reinstall @types/express
cd apps/api
pnpm remove @types/express
pnpm add -D @types/express@latest
pnpm build
```

### Debug Minimist
```bash
cd apps/api
pnpm list minimist @types/minimist
```

---

## Timeline Summary

| Task | Time | Difficulty |
|------|------|-----------|
| Install @types/minimist | 2 min | Easy |
| Fix Express route types | 10 min | Easy |
| Fix type annotation in index.ts | 5 min | Easy |
| Fix lookup.controller.ts | 5 min | Medium |
| Rotate secrets | 10 min | Easy |
| Clean git history | 5 min | Medium |
| Update env validation | 3 min | Easy |
| Add rate limiting | 15 min | Easy |
| Remove extraneous deps | 2 min | Easy |
| Add Sentry | 15 min | Easy |
| Test everything | 20 min | Easy |
| **TOTAL** | **92 min** | |

**You can be deployment-ready in ~90 minutes.**

---

Need help? Check DEPLOYMENT_AUDIT.md for detailed context.
