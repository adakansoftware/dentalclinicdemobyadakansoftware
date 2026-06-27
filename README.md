# Adakan Dental Demo

Production-grade dental clinic demo and core booking system built with Next.js 15, Prisma, and PostgreSQL.

## Stack

- Next.js 15
- React 19
- TypeScript strict mode
- PostgreSQL + Prisma
- Tailwind CSS
- Vercel deployment

## Core Capabilities

- Public clinic website with services, specialists, reviews, FAQ, and contact
- 4-step appointment booking flow
- Appointment lookup and cancellation by full name + phone
- Admin panel for appointments, services, specialists, FAQ, reviews, working hours, blocked slots, and settings
- Bot protection, rate limiting, origin validation, request hardening, and observability
- Operational health endpoint and smoke-test coverage

## Local Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create your `.env` or `.env.local` file and fill production-like values.

Minimum required values:

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
SESSION_SECRET=your-32-char-or-longer-secret
NEXT_PUBLIC_APP_URL=https://your-domain.example
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password
SMS_ENABLED=false
```

Recommended additional values:

```env
CRON_SECRET=your-strong-cron-secret
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXTAUTH_URL=https://your-domain.example
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
```

### 3. Prepare database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Apply database hardening

This step is important for production-quality slot protection:

```bash
npm run db:hardening
```

This adds:

- Partial unique index for active appointment slot collisions
- Lookup indexes for appointment queries

### 5. Run locally

```bash
npm run dev
```

## Validation Commands

Run these before every production deploy:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:smoke
```

## Health Endpoint

`/api/health` now reports more than simple uptime.

It includes:

- database connectivity
- environment readiness
- canonical URL presence
- bot protection readiness
- cron secret readiness
- SMS mode
- DB hardening index presence

Response also includes:

- `status`: `ok`, `warn`, or `error`
- `checks`: individual diagnostic items
- `X-Health-Status` response header

## Slots API

`/api/slots` now exposes operational cache visibility with:

- `X-Slots-Cache: HIT`
- `X-Slots-Cache: MISS`

This helps smoke tests and live diagnostics.

## Admin Login

- URL: `/admin/login`
- Credentials are created from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optional `ADMIN_NAME` during `npm run db:seed`

Do not keep shared or demo credentials in real deployments.

## Production Release Checklist

Use this order for a real release:

1. Set all production environment variables in Vercel.
2. Confirm `NEXT_PUBLIC_APP_URL` and canonical domain are correct.
3. Run `npm run db:push` against the production database.
4. Run `npm run db:seed` only if demo data is intended.
5. Run `npm run db:hardening`.
6. Deploy to Vercel.
7. Verify `/api/health` returns `ok` or expected `warn` state.
8. Verify `/api/slots` returns `X-Slots-Cache`.
9. Run smoke tests against the deployed app if you have production-safe test data.
10. Check admin login, booking flow, appointment lookup, and cancellation manually once.

## Notes

- The repository is ready for production-style deployment.
- The remaining difference between demo and full production is mostly operational discipline, real client data, and real infrastructure verification.
