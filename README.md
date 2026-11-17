# Wash It Izzy

Laundry booking foundation for Wash It Izzy in Calamba City, Laguna. The app uses Next.js App Router, TypeScript, Tailwind CSS 4 and Convex.

## Setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local`. Set the frontend Convex URL, deployment name and site URL.
3. Run `npx convex dev` and follow its prompt to create or select a Convex deployment. Keep it running while developing.
4. Run `npm run dev` and open http://localhost:3000.
5. Set `ADMIN_EMAIL`, `SITE_URL`, `AUTH_RESEND_KEY` and `EMAIL_FROM` on Convex before sign-up. A verified account whose email matches `ADMIN_EMAIL` is assigned the admin role during onboarding. Configure Google credentials on Convex with `npx convex env set AUTH_GOOGLE_CLIENT_ID <client-id>` and `npx convex env set AUTH_GOOGLE_CLIENT_SECRET <client-secret>`. Google’s redirect URL is `https://<your-convex-site-host>/oauth/google/callback`. Verify the sender domain in Resend.
6. Seed catalog and shop data with `npx convex run seed:seed`.

## Scripts

- `npm run dev` starts Next.js.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm test` runs the Vitest unit suite.
- `npm run typecheck` runs the TypeScript check.
- `npx convex dev` generates Convex bindings and syncs functions/schema to the selected deployment.

## Structure

- `convex/` schema, auth helpers and read-only catalog functions.
- `src/app/` public site, customer and admin route shells.
- `src/components/` shared UI and app components.
- `src/features/` feature-specific modules.
- `src/lib/` browser/server integration helpers.

## Assumptions

- Delivery is free only for the marked selected zones at two or more loads; every other active zone costs ₱30.
- `Mapagong` is a paid delivery zone. Barangay spellings use their plain names for exact lookup.
- Admin access is assigned by trusted setup after the account is created; public sign-up always creates a customer account.
- Convex deployment credentials and OAuth/Resend secrets are supplied by the operator and are not committed.

## Current scope

The current foundation includes email/password verification and recovery, Google OAuth wiring, customer onboarding, catalog and delivery queries, booking and order mutations, staff order transitions, intake uploads, timers, walk-in creation, and initial customer/admin screens. Payment review, in-app/email notifications, advanced admin filters and calendar/Kanban views, analytics, profile address editing, order rebooking/edit UI, and production OAuth/Resend credentials remain deployment/operator work or later scope. The notifications function is a logging stub. The booking UI displays availability for the selected date; it does not include the full month capacity calendar.

For the Part 2 unit tests, run `npm test`. The current suite covers pure pricing, status and Manila date helpers; Convex integration tests and Playwright E2E are not included yet. Convex Auth v2 applies its built-in rate limits; the requested custom 15-minute failed-login lockout is not configured. The local Convex deployment must be running for `npx convex run seed:seed` and interactive app flows.

## Part 3 implementation status

Implemented: GCash proof submission and review, cash payment recording, refunds, in-app notifications, admin/staff dashboards, shop/payment/capacity settings, daily completion statistics, the daily archive cron, and legacy export/mapping helpers. The Convex backend protects these operations by role and customer ownership. Configure the shop's GCash details before accepting payments.

Known gaps: outbound transactional emails and email previews/logging, complete analytics charts and exports, service/zone/staff/promo settings CRUD, promo and loyalty redemption, rush booking, review submission, receipts and QR bag labels, pickup reminders, full legacy import and rollback, PWA/offline shell, Filipino translations, command palette, accessibility audit, and Convex/Playwright integration suites. The app is not ready for live payment processing or legacy migration until these are completed and exercised.

## Go-live checklist

- [ ] Rotate every credential used by the legacy system.
- [ ] Set production Convex and Vercel environment variables, including `ADMIN_EMAIL`, `SITE_URL`, `AUTH_RESEND_KEY`, `EMAIL_FROM`, and Google OAuth credentials.
- [ ] Verify the email sender domain and test verification/password recovery.
- [ ] Replace placeholder GCash number, account name, QR image, shop details, delivery zones, prices, and capacity settings.
- [ ] Complete and rehearse the legacy importer on a disposable deployment; compare counts and totals and verify rollback before importing production data.
- [ ] Run build, type check, lint, unit, Convex, and browser end-to-end suites against the release candidate.
- [ ] Smoke-test signup, booking, proof upload, admin review, payment status, completion, notifications, and customer data access.
- [ ] Review the production deployment target, then deploy with `npx convex deploy` and deploy the web app to Vercel.
