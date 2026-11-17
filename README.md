# Wash It Izzy

Laundry booking foundation for Wash It Izzy in Calamba City, Laguna. The app uses Next.js App Router, TypeScript, Tailwind CSS 4 and Convex.

## Setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, `SITE_URL`, `ADMIN_EMAIL`, Google OAuth credentials, Resend key and verified sender address.
3. Run `npx convex dev` and follow its prompt to create or select a Convex deployment. Keep it running while developing.
4. Run `npm run dev` and open http://localhost:3000.
5. Configure Google OAuth with the callback URL shown by Convex Auth for the deployment. Verify the sender domain in Resend and use the matching `EMAIL_FROM`.
6. Run the internal seed mutation from the Convex dashboard after setting `ADMIN_EMAIL` in Convex environment variables. Set the first admin password through the normal sign-up flow using that email, then promote it through the seed operation.

## Scripts

- `npm run dev` starts Next.js.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
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

This repository contains the Part 1 foundation and public landing design. Routes for booking, operations, payments, notifications and later modules are placeholders. Connect a Convex deployment and complete the auth, seed, catalog UI and onboarding flows before treating the app as production ready.
