# Comensaña Propiedades - Deployment Readiness Audit

**Date:** June 2, 2026  
**Repository:** Monorepo with 2 apps (web, api) + 1 shared package  
**Status:** ⚠️ **NOT READY FOR PRODUCTION** - Critical build errors must be resolved

---

## Executive Summary

The application is architecturally sound with good separation of concerns (monorepo structure, Prisma ORM, JWT auth), but **the current state has critical TypeScript compilation errors that prevent deployment**. Additionally, several security and configuration issues must be addressed before going live.

**Time to deployment:** 4-6 hours (assuming no database/infrastructure issues)

---

## 1. Environment Configuration

### Status: ⚠️ PARTIALLY CONFIGURED

#### What's in Place:
- ✅ `.env.example` files exist for both apps with clear documentation
- ✅ Environment variables are properly validated using Zod (`apps/api/src/lib/env.ts`)
- ✅ NEXT_PUBLIC_ variables correctly prefixed for client-side use
- ✅ Supabase PostgreSQL connection configured
- ✅ Cloudinary integration configured with API key in env

#### Issues Found:
- ⛔ **CRITICAL: Secrets committed to git**
  - Database URL with credentials (Supabase)
  - JWT secret
  - Cloudinary API key and secret
  - These are tracked in `.gitignore` but actively committed to repository
  
- ⚠️ Missing `NEXT_PUBLIC_SITE_URL` documentation (falls back to hardcoded URL)
- ⚠️ Admin credentials hardcoded in seed file - uses env vars but defaults to `comesana2025`

#### Required Actions:
```bash
# Immediately rotate all credentials
# Remove committed .env files from git history
git rm --cached apps/api/.env apps/web/.env .env
# Then force update history and recreate .env files with new secrets
```

---

## 2. Build Configuration

### Status: ⛔ CRITICAL ERRORS - BUILD FAILS

#### Current State:
- ✅ `pnpm` workspaces properly configured
- ✅ TypeScript targets ES2017 for all packages
- ✅ Source maps enabled for debugging
- ⛔ **Build process fails with 8 TypeScript errors**

#### Build Errors to Fix:

**Errors 1-5: Type portability issues** (appears 5 times)
```
TS2742: The inferred type of 'router'/'app' cannot be named without reference
```
Fix: Add explicit type annotations in route files

**Errors 6-7: Missing type declarations**
```
TS7016: Could not find a declaration file for module 'minimist'
```
Fix: Run `pnpm add -D @types/minimist`

**Error 8: Type mismatch**
```
TS2345: Argument of type 'string | string[]' is not assignable to 'string'
```
Fix: Update lookup.controller.ts to handle amenity.grupo array type

#### Scripts Status:
- `pnpm dev` - WORKS (starts both apps)
- `pnpm build` - FAILS (TypeScript errors)
- `pnpm db:migrate` - Requires API running
- `pnpm db:seed` - Requires API running

---

## 3. Dependencies & Versions

### Status: ⚠️ MOSTLY CURRENT - Minor issues

#### Key Versions:
- Next.js 14.2.35 ✅ (Current LTS)
- React 18.3.1 ✅ (Current)
- Node >=18 ✅ (Specified correctly)
- TypeScript 5.9.3 ✅ (Latest)
- Tailwind 3.4.19 ✅ (Current)
- Prisma 6.19.3 ✅ (Latest)
- Express 4.22.2 ✅ (Current)
- Zod 3.25.76 ✅ (Current)

#### Issues:
- ⚠️ Extraneous packages in API (not in package.json):
  - `@types/cors@2.8.19`
  - `cors@2.8.6` (Express handles via helmet)
  - Action: Remove these packages

---

## 4. Database & Data

### Status: ✅ WELL CONFIGURED

#### Database Setup:
- ✅ Supabase PostgreSQL properly configured
- ✅ Prisma schema comprehensive (11 models)
- ✅ Proper indexes on query fields
- ✅ Cascade deletes configured
- ✅ Seed file includes admin user with bcrypt hashing
- ✅ Sample data (4 properties)

#### Migration Path:
```bash
pnpm db:migrate    # Run migrations
pnpm db:seed       # Populate seed data
curl /api/health   # Verify connection
```

#### Issues:
- ⚠️ Seed defaults to hardcoded admin password
- ⚠️ No backup configuration documented

---

## 5. API & Backend

### Status: ✅ PRODUCTION-READY (once build errors fixed)

#### API Structure:
- Auth Routes: login, me, logout (JWT + httpOnly cookie, 24h)
- Property Routes: CRUD with admin protection
- Lookup Routes: cities, amenities, all data
- Inquiry Routes: create inquiry, list (admin), mark read
- Health Check: database connectivity included

#### Security Measures:
- ✅ Helmet middleware
- ✅ CORS from env variable
- ✅ JWT with 24h expiry
- ✅ bcryptjs password hashing
- ✅ Zod input validation
- ✅ Global error handler
- ✅ No-cache headers on API

#### Issues:
- ⚠️ No rate limiting (add before production)
- ⚠️ No external error tracking (Sentry, etc.)
- ⚠️ JWT_SECRET marked optional in validation but required

---

## 6. Frontend (Web App)

### Status: ✅ PRODUCTION-READY

#### Configuration:
- ✅ Next.js 14 App Router (modern, correct)
- ✅ Image optimization for Unsplash, Cloudinary, ArgEnProp
- ✅ Proper API client with error handling
- ✅ TypeScript strict mode
- ✅ All pages marked "use client"

#### Environment Variables:
- `NEXT_PUBLIC_API_URL` (default: http://localhost:4000)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `NEXT_PUBLIC_SITE_URL` (optional)

#### Assets:
- ✅ No local public assets (all CDN-based)
- ✅ Fonts self-hosted via next/font/google

---

## 7. Deployment Targets & CI/CD

### Status: ⚠️ PARTIALLY CONFIGURED

#### Deployment:
- ✅ `vercel.json` configured for serverless
- ✅ GitHub Actions workflow for build/test
- ✅ Tests on Node 18 and 22

#### Issues:
- ⚠️ **Build fails in CI** (same TS errors)
- ⚠️ No deployment step (manual required)
- ⚠️ No web app tests in workflow
- ⚠️ No linting step

---

## 8. SEO & Meta Configuration

### Status: ✅ COMPLETE

#### Implemented:
- ✅ robots.ts with sitemap reference
- ✅ Metadata: title, description, OG tags
- ✅ Twitter card configuration
- ✅ Locale: es_AR
- ✅ JSON-LD schema (RealEstateAgent)

#### Missing:
- ⚠️ No dynamic sitemap generation
- ⚠️ No per-property schema markup

---

## 9. Security Analysis

### Status: ⛔ CRITICAL ISSUES

#### Secrets Management:

**🔴 CRITICAL - Exposed in Repository:**
- Database credentials in git
- Cloudinary API secret in git
- JWT secret in git
- These bypass .gitignore protection

**Required Actions:**
```bash
# 1. Rotate ALL secrets immediately
# 2. Remove from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch apps/api/.env apps/web/.env' \
  -- --all
# 3. Push cleanup: git push origin --force --all
# 4. Update .env with new secrets
# 5. Store in Vercel/platform secrets only
```

#### Authentication:
- ✅ bcryptjs with 12 salt rounds
- ✅ JWT with 24h expiry
- ✅ httpOnly cookie for CSRF protection
- ✅ Route protection via middleware
- ⚠️ Admin password defaults to `comesana2025` in seed

#### Input Validation:
- ✅ Zod schemas for all inputs
- ✅ Validation middleware
- ✅ Error messages don't leak info

#### API Security:
- ✅ Helmet middleware
- ✅ CORS restricted to env origin
- ✅ No sensitive data in JWT
- ✅ Cache control headers
- ⚠️ No rate limiting
- ⚠️ No CSRF token (but using JWT correctly)

---

## 10. Monitoring & Error Handling

### Status: ⚠️ BASIC ONLY

#### Logging:
- ✅ Pino logger (pino-pretty in dev, JSON in prod)
- ✅ Request logging
- ✅ Error logging in handler
- ⚠️ Logs only go to stdout (not aggregated)

#### Error Handling:
- ✅ Global error handler
- ✅ Custom error classes
- ✅ Prod/dev message separation
- ✅ Health check endpoint

#### Missing - Production Monitoring:
- ⚠️ No Sentry or error tracking
- ⚠️ No performance monitoring (APM)
- ⚠️ No log aggregation
- ⚠️ No health check for Cloudinary

#### Testing:
- ✅ Vitest configured
- ✅ Integration tests present
- ✅ Supertest for HTTP assertions
- ⚠️ Tests only run if INTEGRATION_TEST=1
- ⚠️ No web app tests
- ⚠️ Limited coverage

---

## 11. Pre-Deployment Checklist

### Critical (Blocking)
- [ ] Fix all 8 TypeScript compilation errors
- [ ] Rotate database, JWT, and Cloudinary secrets
- [ ] Remove .env files from git history
- [ ] Verify no secrets leak via `git log -p | grep -i secret`
- [ ] Test build succeeds locally: `pnpm build`

### High Priority
- [ ] Add rate limiting middleware
- [ ] Set up error tracking (Sentry)
- [ ] Conf
