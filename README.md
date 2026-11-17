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
