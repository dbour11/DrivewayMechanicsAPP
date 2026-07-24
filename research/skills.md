# Driveway Mechanics — Skills Inventory

**Version:** 1.0 · **Date:** 2026-07-24
**Derived from:** [`PRD.md`](./PRD.md) · [`tech-stack.md`](./tech-stack.md) · [`CLAUDE.md`](../.claude/CLAUDE.md)

## Purpose & how to read this

This is an exhaustive inventory of the **distinct capabilities ("skills") needed to build the MVP**, expressed as candidate [Claude Code Agent Skills](https://code.claude.com/docs/en/skills). Each would be authored as a `.claude/skills/<skill-name>/SKILL.md` (YAML frontmatter with `name` + `description` for auto-triggering, concise markdown body, optional supporting `templates/`, `scripts/`, `references/`). Skills are grouped by category; each entry uses the 8-field format requested.

**Complexity legend:** 🟢 Simple · 🟡 Moderate · 🔴 Complex.
**Build priority** mirrors PRD feature priorities (P0 = MVP-critical). "Skills we likely DON'T need for MVP" are listed at the end (§10) — deliberately, to bound scope.

### Summary table

| # | Skill | Category | Priority | Complexity |
|---|---|---|---|---|
| 1 | `supabase-migration` | Database | P0 | 🟡 |
| 2 | `rls-policy-authoring` | Database / Auth | P0 | 🔴 |
| 3 | `postgis-geo-query` | Database | P0 | 🔴 |
| 4 | `supabase-type-generation` | Database | P0 | 🟢 |
| 5 | `db-seed-data` | Database | P0 | 🟢 |
| 6 | `data-access-layer` | Database | P0 | 🟡 |
| 7 | `phone-otp-auth` | Auth | P0 | 🟡 |
| 8 | `role-based-access` | Auth | P0 | 🟡 |
| 9 | `quote-engine` | Business logic | P0 | 🟡 |
| 10 | `booking-availability` | Business logic | P0 | 🔴 |
| 11 | `dispatch-assignment` | Business logic | P0 | 🟡 |
| 12 | `change-order-flow` | Business logic | P1 | 🟡 |
| 13 | `stripe-payment-intent` | API integration | P0 | 🔴 |
| 14 | `stripe-webhook-handler` | API integration | P0 | 🔴 |
| 15 | `stripe-subscription` | API integration | P2 | 🟡 |
| 16 | `twilio-sms-notifications` | API integration | P0 | 🟡 |
| 17 | `mapbox-geocoding` | API integration | P0 | 🟡 |
| 18 | `mapbox-routing-eta` | API integration | P0 | 🟡 |
| 19 | `realtime-location-tracking` | API integration | P0 | 🔴 |
| 20 | `push-notifications` | API integration | P1 | 🟡 |
| 21 | `design-system-setup` | Frontend | P0 | 🟡 |
| 22 | `expo-screen-scaffold` | Frontend | P0 | 🟡 |
| 23 | `booking-flow-ui` | Frontend | P0 | 🔴 |
| 24 | `live-tracking-map-ui` | Frontend | P0 | 🔴 |
| 25 | `form-validation` | Frontend | P0 | 🟢 |
| 26 | `nextjs-admin-console` | Frontend | P0 | 🔴 |
| 27 | `marketing-site-port` | Frontend | P1 | 🟡 |
| 28 | `edge-function-error-handling` | Error/logging | P0 | 🟡 |
| 29 | `logging-observability` | Error/logging | P1 | 🟡 |
| 30 | `unit-testing` | Testing | P0 | 🟡 |
| 31 | `rls-policy-testing` | Testing | P0 | 🔴 |
| 32 | `edge-function-testing` | Testing | P1 | 🟡 |
| 33 | `e2e-testing` | Testing | P1 | 🔴 |
| 34 | `env-secrets-management` | Deployment | P0 | 🟢 |
| 35 | `cicd-pipeline` | Deployment | P0 | 🟡 |
| 36 | `supabase-deploy` | Deployment | P0 | 🟡 |
| 37 | `netlify-deploy` | Deployment | P0 | 🟢 |
| 38 | `eas-build` | Deployment | P0 | 🟡 |
| 39 | `api-doc-generation` | Documentation | P1 | 🟢 |
| 40 | `schema-doc-generation` | Documentation | P2 | 🟢 |

---

## 1. Database Operations

### 1. `supabase-migration`
1. **Name:** `supabase-migration`
2. **Description:** Author, apply, and roll back version-controlled SQL migrations for the Postgres schema (tables, enums, constraints, indexes) defined in PRD §4.
3. **Input:** desired schema change or PRD table spec; target environment (local/staging/prod); existing migration history.
4. **Output:** a timestamped SQL migration file in `supabase/migrations/`, applied to the target DB; updated migration list.
5. **Dependencies:** Supabase CLI; Postgres. External APIs: Supabase (project ref). Depends on: none (foundational). **Enables** most other skills. Can be driven by the **connected Supabase MCP** (`apply_migration`, `list_migrations`).
6. **Docs:** [Supabase local dev/migrations](https://supabase.com/docs/guides/local-development) · [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/supabase-migration create appointments table per PRD §4.3` → agent writes migration, applies to staging, runs advisors.

### 2. `rls-policy-authoring`
1. **Name:** `rls-policy-authoring`
2. **Description:** Write and verify Row-Level Security policies enforcing multi-tenant (`organization_id`) isolation and role scoping (customer/technician/admin) on every tenant table.
3. **Input:** table name; the access matrix (which role reads/writes which rows) from PRD §4.1 & §6.2.
4. **Output:** `CREATE POLICY` statements (deny-by-default) in a migration; advisor check confirming coverage.
5. **Dependencies:** Postgres RLS; Supabase Auth JWT claims (`auth.uid()`, org lookup). Depends on: `supabase-migration`, `phone-otp-auth`. Pairs with `rls-policy-testing`.
6. **Docs:** [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security) · [Postgres RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
7. **Complexity:** 🔴 Complex — subtle bugs (e.g., a technician seeing another's jobs) are high-impact; must be tested.
8. **Example:** `/rls-policy-authoring jobs — technician reads only own rows, admin reads whole org`

### 3. `postgis-geo-query`
1. **Name:** `postgis-geo-query`
2. **Description:** Build geospatial queries: point-in-polygon service-area checks, nearest-available-technician, and distance calculations.
3. **Input:** a geography point/polygon; the operation (contains / nearest / distance); relevant tables (`service_areas`, `technicians`).
4. **Output:** SQL (or an RPC/Edge Function) returning the geo result; a GIST index if missing.
5. **Dependencies:** PostGIS extension. Depends on: `supabase-migration` (enable PostGIS, GIST indexes). Consumed by `booking-availability`, `mapbox-*`.
6. **Docs:** [PostGIS](https://postgis.net/documentation/) · [Supabase + PostGIS](https://supabase.com/docs/guides/database/extensions/postgis) · [ST_Contains](https://postgis.net/docs/ST_Contains.html)
7. **Complexity:** 🔴 Complex — SRID/geography vs. geometry pitfalls; index tuning.
8. **Example:** `/postgis-geo-query is this lat/lng inside any active service_area for org X`

### 4. `supabase-type-generation`
1. **Name:** `supabase-type-generation`
2. **Description:** Generate TypeScript types from the live DB schema and publish them to the shared package so mobile/web/functions stay type-safe.
3. **Input:** current schema; target path (`packages/shared`).
4. **Output:** generated `database.types.ts`; updated shared exports.
5. **Dependencies:** Supabase CLI (`gen types`). Depends on: `supabase-migration`. Can use Supabase MCP `generate_typescript_types`.
6. **Docs:** [Generating types](https://supabase.com/docs/guides/api/rest/generating-types)
7. **Complexity:** 🟢 Simple
8. **Example:** `/supabase-type-generation regenerate after the latest migration`

### 5. `db-seed-data`
1. **Name:** `db-seed-data`
2. **Description:** Create deterministic seed data for dev/test: one organization, pricing_rules matrix, service-area polygons (Miami/WPB/Port St. Lucie), sample technicians/customers.
3. **Input:** target env; seed spec.
4. **Output:** `supabase/seed.sql` (or seed script) producing a known baseline.
5. **Dependencies:** Supabase CLI; PostGIS (polygons). Depends on: `supabase-migration`. Feeds `unit-testing`, `e2e-testing`.
6. **Docs:** [Seeding data](https://supabase.com/docs/guides/local-development/seeding-your-database)
7. **Complexity:** 🟢 Simple
8. **Example:** `/db-seed-data reset local DB with the standard South Florida org fixture`

### 6. `data-access-layer`
1. **Name:** `data-access-layer`
2. **Description:** Standardize client/server data access via the Supabase JS client and PostGREST — typed query helpers, consistent error mapping, and correct anon vs. service-role usage.
3. **Input:** the entity/operation; caller context (client vs. Edge Function).
4. **Output:** reusable typed query functions in `packages/shared`; usage docs.
5. **Dependencies:** `@supabase/supabase-js`, generated types, TanStack Query (client). Depends on: `supabase-type-generation`, `rls-policy-authoring`.
6. **Docs:** [supabase-js](https://supabase.com/docs/reference/javascript/introduction) · [PostgREST/Data API](https://supabase.com/docs/guides/api) · [TanStack Query](https://tanstack.com/query/latest)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/data-access-layer add typed getAppointmentsForCustomer with realtime option`

---

## 2. Authentication & Authorization

### 7. `phone-otp-auth`
1. **Name:** `phone-otp-auth`
2. **Description:** Implement phone-number OTP signup/login (F-1) end-to-end: request OTP, verify, create/attach `profiles` row, persist session.
3. **Input:** phone number (E.164); org context; SMS provider config.
4. **Output:** working auth flow in mobile app + session handling; profile bootstrap logic.
5. **Dependencies:** Supabase Auth; Twilio (OTP SMS delivery, A2P 10DLC). Depends on: `twilio-sms-notifications` (delivery), `supabase-migration` (profiles). Blocks `rls-policy-authoring`.
6. **Docs:** [Supabase Auth](https://supabase.com/docs/guides/auth) · [Phone login](https://supabase.com/docs/guides/auth/phone-login) · [A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc)
7. **Complexity:** 🟡 Moderate — rate-limiting and A2P registration are the sharp edges.
8. **Example:** `/phone-otp-auth wire up the login screen OTP request + verify`

### 8. `role-based-access`
1. **Name:** `role-based-access`
2. **Description:** Enforce role scoping (customer/technician/admin) across app surfaces: route guards, conditional navigation, and role-aware data queries backed by RLS.
3. **Input:** the surface/route; allowed roles.
4. **Output:** guard components/hooks; admin-only route protection; role resolution from `profiles`.
5. **Dependencies:** Supabase Auth; RLS. Depends on: `phone-otp-auth`, `rls-policy-authoring`.
6. **Docs:** [Supabase custom claims/RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/role-based-access protect the admin console routes to role=admin`

---

## 3. Business Logic (Edge Functions)

### 9. `quote-engine`
1. **Name:** `quote-engine`
2. **Description:** Server-authoritative pricing (F-3): compute price range from `pricing_rules` keyed on service × vehicle_class × area, plus est. time saved. Client value is display-only.
3. **Input:** `serviceType`, `vehicleClass`, `serviceAreaId`.
4. **Output:** an Edge Function returning `{ priceLowCents, priceHighCents, estTimeSavedHours }`; unit-tested.
5. **Dependencies:** Supabase Edge Functions (Deno/TS). Depends on: `supabase-migration` (pricing_rules), `postgis-geo-query` (area). Consumed by `booking-availability`, `booking-flow-ui`.
6. **Docs:** [Edge Functions](https://supabase.com/docs/guides/functions)
7. **Complexity:** 🟡 Moderate — correctness is business-critical (protects "quote = price").
8. **Example:** `/quote-engine implement the quote function per PRD §5.1`

### 10. `booking-availability`
1. **Name:** `booking-availability`
2. **Description:** Slot/capacity logic (F-4): show only bookable slots given technician capacity, prevent double-booking, validate address is inside an active service area, snapshot the quote onto the appointment.
3. **Input:** service, vehicle, address, requested time; org capacity rules.
4. **Output:** Edge Function creating an `appointment`; availability query for the UI.
5. **Dependencies:** Edge Functions; PostGIS. Depends on: `quote-engine`, `postgis-geo-query`, `mapbox-geocoding` (address→point). Consumed by `booking-flow-ui`.
6. **Docs:** [Edge Functions](https://supabase.com/docs/guides/functions) · [Postgres transactions](https://supabase.com/docs/guides/database/functions)
7. **Complexity:** 🔴 Complex — concurrency/double-booking and capacity math.
8. **Example:** `/booking-availability create appointment with area + slot validation`

### 11. `dispatch-assignment`
1. **Name:** `dispatch-assignment`
2. **Description:** Manual dispatch (F-16): admin assigns a technician to an appointment, creating/updating a `job`; supports reassignment. (Auto-optimization is out of scope — §10.)
3. **Input:** appointmentId, technicianId, admin identity.
4. **Output:** Edge Function/admin action producing a `job`; live-ops board data.
5. **Dependencies:** Edge Functions; RLS (admin). Depends on: `booking-availability`, `role-based-access`. Feeds `live-tracking-map-ui`.
6. **Docs:** [Edge Functions](https://supabase.com/docs/guides/functions)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/dispatch-assignment assign tech to appointment from the admin board`

### 12. `change-order-flow`
1. **Name:** `change-order-flow`
2. **Description:** Price-change approval (F-11): a final price above the quote requires explicit in-app customer approval before charge; declined → close at original scope. Protects the core promise.
3. **Input:** jobId, reason, additionalCents; customer decision.
4. **Output:** `change_orders` records; charge-blocking logic until approved.
5. **Dependencies:** Edge Functions. Depends on: `stripe-payment-intent`, `booking-availability`. 
6. **Docs:** [Edge Functions](https://supabase.com/docs/guides/functions)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/change-order-flow implement raise + approve/decline path`

---

## 4. API Integration (External Services)

### 13. `stripe-payment-intent`
1. **Name:** `stripe-payment-intent`
2. **Description:** Create PaymentIntents server-side and confirm on the client (F-9); charge equals confirmed price; issue receipts.
3. **Input:** jobId, amountCents, customer/payment method.
4. **Output:** Edge Function returning `clientSecret`; client confirmation via Stripe SDK; `payments` row.
5. **Dependencies:** `stripe` (server SDK), `@stripe/stripe-react-native` (client). External API: Stripe. Depends on: `edge-function-error-handling`. Pairs with `stripe-webhook-handler`. **MCP available** (Stripe MCP).
6. **Docs:** [Stripe PaymentIntents](https://docs.stripe.com/payments/payment-intents) · [Accept a payment (RN)](https://docs.stripe.com/payments/accept-a-payment?platform=react-native) · [Stripe MCP](https://docs.stripe.com/mcp)
7. **Complexity:** 🔴 Complex — money; PCI boundary (no raw card data on our servers).
8. **Example:** `/stripe-payment-intent create intent for a completed job and confirm in-app`

### 14. `stripe-webhook-handler`
1. **Name:** `stripe-webhook-handler`
2. **Description:** Receive Stripe webhooks in an Edge Function; verify signature; process idempotently; reconcile `payments`/`jobs` with Stripe as source of truth.
3. **Input:** raw Stripe event + signature header; webhook secret.
4. **Output:** verified, idempotent handler updating payment status; fast 2xx ack.
5. **Dependencies:** `stripe` SDK; Edge Functions. External API: Stripe. Depends on: `stripe-payment-intent`.
6. **Docs:** [Stripe webhooks](https://docs.stripe.com/webhooks) · [Webhook signatures](https://docs.stripe.com/webhooks/signatures)
7. **Complexity:** 🔴 Complex — idempotency + duplicate delivery + signature verification.
8. **Example:** `/stripe-webhook-handler implement /webhooks/stripe with idempotency keys`

### 15. `stripe-subscription` (P2)
1. **Name:** `stripe-subscription`
2. **Description:** Membership billing (F-14): $29/mo subscription lifecycle and member benefits (priority slots, member pricing).
3. **Input:** customerId, plan; subscription webhook events.
4. **Output:** `memberships` records; benefit application at booking.
5. **Dependencies:** Stripe Subscriptions. Depends on: `stripe-webhook-handler`.
6. **Docs:** [Stripe Subscriptions](https://docs.stripe.com/billing/subscriptions/overview)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/stripe-subscription add Family Maintenance Plan checkout + webhook`

### 16. `twilio-sms-notifications`
1. **Name:** `twilio-sms-notifications`
2. **Description:** Send transactional SMS (F-13): booking confirmation, receipt, and OTP delivery; keep transactional separate from marketing; handle A2P 10DLC compliance.
3. **Input:** recipient phone, message template, message type.
4. **Output:** SMS send helper (Edge Function); delivery status handling; A2P registration checklist.
5. **Dependencies:** Twilio SDK / Messaging API. External API: Twilio. Depends on: `edge-function-error-handling`. Feeds `phone-otp-auth`.
6. **Docs:** [Twilio Messaging](https://www.twilio.com/docs/messaging) · [A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc)
7. **Complexity:** 🟡 Moderate — A2P registration lead time; opt-out compliance.
8. **Example:** `/twilio-sms-notifications send booking-confirmation SMS on appointment create`

### 17. `mapbox-geocoding`
1. **Name:** `mapbox-geocoding`
2. **Description:** Convert a customer address/ZIP to a geography point (and reverse) for service-area checks and booking (F-4/F-5).
3. **Input:** address string or ZIP.
4. **Output:** `{ lat, lng, normalizedAddress }`; stored as PostGIS point.
5. **Dependencies:** Mapbox Geocoding API (server token). External API: Mapbox. Feeds `postgis-geo-query`, `booking-availability`.
6. **Docs:** [Mapbox Geocoding](https://docs.mapbox.com/api/search/geocoding/)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/mapbox-geocoding geocode the booking address before area validation`

### 18. `mapbox-routing-eta`
1. **Name:** `mapbox-routing-eta`
2. **Description:** Compute route + ETA from technician location to the customer for the live-tracking experience (F-7).
3. **Input:** technician point, destination point.
4. **Output:** ETA + route geometry for the map; throttled to control cost.
5. **Dependencies:** Mapbox Directions API. External API: Mapbox. Depends on: `realtime-location-tracking`. Feeds `live-tracking-map-ui`.
6. **Docs:** [Mapbox Directions](https://docs.mapbox.com/api/navigation/directions/) · [Mapbox pricing](https://www.mapbox.com/pricing)
7. **Complexity:** 🟡 Moderate — cost control on frequent recomputation.
8. **Example:** `/mapbox-routing-eta compute ETA when technician status = en_route`

### 19. `realtime-location-tracking`
1. **Name:** `realtime-location-tracking`
2. **Description:** Stream technician GPS to the customer (F-7/F-8): technician app pushes throttled location; Supabase Realtime broadcasts; customer app subscribes and updates the map/status.
3. **Input:** technician location pings; jobId; subscription lifecycle.
4. **Output:** live location writes + Realtime channel; subscribe/unsubscribe on job start/complete.
5. **Dependencies:** Supabase Realtime; `expo-location` (background). External API: Supabase. Depends on: `expo-screen-scaffold`. Feeds `live-tracking-map-ui`, `mapbox-routing-eta`.
6. **Docs:** [Supabase Realtime](https://supabase.com/docs/guides/realtime) · [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
7. **Complexity:** 🔴 Complex — background location permissions, battery, connection caps, throttling.
8. **Example:** `/realtime-location-tracking push + subscribe to tech location for an active job`

### 20. `push-notifications` (P1)
1. **Name:** `push-notifications`
2. **Description:** Deliver push notifications for status transitions (F-13) to customer/technician apps.
3. **Input:** device push tokens; event → message mapping.
4. **Output:** push registration + send helper; opt-out handling.
5. **Dependencies:** `expo-notifications`; Expo push service. Depends on: `expo-screen-scaffold`.
6. **Docs:** [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) · [Expo push](https://docs.expo.dev/push-notifications/overview/)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/push-notifications notify customer when job status → en_route`

---

## 5. Frontend Component Generation

### 21. `design-system-setup`
1. **Name:** `design-system-setup`
2. **Description:** Establish the shared design system from the landing page (green/dark palette, typography, spacing) as NativeWind/Tailwind tokens + base components; enforce WCAG AA contrast.
3. **Input:** landing-page reference (`driveway-mechanics-landing-page.pdf`); brand tokens.
4. **Output:** token config + reusable primitives (Button, Card, StatusBadge) for mobile + web.
5. **Dependencies:** NativeWind, Tailwind. Depends on: none. Foundational for all UI skills.
6. **Docs:** [NativeWind](https://www.nativewind.dev/) · [Tailwind](https://tailwindcss.com/docs)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/design-system-setup extract tokens from the landing page and scaffold primitives`

### 22. `expo-screen-scaffold`
1. **Name:** `expo-screen-scaffold`
2. **Description:** Scaffold Expo/React Native screens with Expo Router, navigation, and data wiring (TanStack Query) — the reusable pattern for both customer and technician apps.
3. **Input:** screen name/route; data needs; role.
4. **Output:** a screen file with routing, loading/error states, and typed queries.
5. **Dependencies:** Expo, Expo Router, TanStack Query. Depends on: `design-system-setup`, `data-access-layer`.
6. **Docs:** [Expo](https://docs.expo.dev/) · [Expo Router](https://docs.expo.dev/router/introduction/) · [React Native](https://reactnative.dev/docs/getting-started)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/expo-screen-scaffold create the technician "My Jobs" screen`

### 23. `booking-flow-ui`
1. **Name:** `booking-flow-ui`
2. **Description:** Build the multi-step booking wizard (F-3/F-4/F-5): service → vehicle → area check → live quote → slot → confirm, with the transparent-pricing UX.
3. **Input:** quote/availability APIs; design system.
4. **Output:** the customer booking flow screens + state (Zustand for wizard steps).
5. **Dependencies:** Zustand, TanStack Query, form-validation. Depends on: `quote-engine`, `booking-availability`, `mapbox-geocoding`, `expo-screen-scaffold`.
6. **Docs:** [Zustand](https://zustand-demo.pmnd.rs/) · [Expo Router](https://docs.expo.dev/router/introduction/)
7. **Complexity:** 🔴 Complex — multi-step state + server-authoritative quote reconciliation.
8. **Example:** `/booking-flow-ui build the end-to-end booking wizard`

### 24. `live-tracking-map-ui`
1. **Name:** `live-tracking-map-ui`
2. **Description:** Render the live map + status timeline (F-7): technician marker, ETA, and `On the way → Diagnosing → Fixing → Complete` progression.
3. **Input:** Realtime location stream; job status; ETA.
4. **Output:** map screen (mobile) and web map component; status timeline UI.
5. **Dependencies:** `@rnmapbox/maps` (mobile), `react-map-gl` (web). Depends on: `realtime-location-tracking`, `mapbox-routing-eta`, `design-system-setup`.
6. **Docs:** [rnmapbox/maps](https://github.com/rnmapbox/maps) · [react-map-gl](https://visgl.github.io/react-map-gl/)
7. **Complexity:** 🔴 Complex — smooth marker updates, map lifecycle, offline states.
8. **Example:** `/live-tracking-map-ui build the customer tracking screen`

### 25. `form-validation`
1. **Name:** `form-validation`
2. **Description:** Standardize forms with react-hook-form + zod; share zod schemas with the backend so client and server validate identically.
3. **Input:** the form fields + validation rules.
4. **Output:** typed form components with inline errors; shared zod schema in `packages/shared`.
5. **Dependencies:** react-hook-form, zod. Depends on: `design-system-setup`.
6. **Docs:** [react-hook-form](https://react-hook-form.com/) · [zod](https://zod.dev/)
7. **Complexity:** 🟢 Simple
8. **Example:** `/form-validation add vehicle-entry form with shared schema`

### 26. `nextjs-admin-console`
1. **Name:** `nextjs-admin-console`
2. **Description:** Build the Next.js admin/ops console (F-16/F-17): schedule/calendar, dispatch board, and CRUD for pricing/service-areas/technicians.
3. **Input:** admin APIs; role guard.
4. **Output:** responsive admin dashboard (desktop-first) on Netlify.
5. **Dependencies:** Next.js (App Router), TanStack Query, react-map-gl (area editing). Depends on: `role-based-access`, `dispatch-assignment`, `data-access-layer`, `design-system-setup`.
6. **Docs:** [Next.js](https://nextjs.org/docs) · [Next.js App Router](https://nextjs.org/docs/app)
7. **Complexity:** 🔴 Complex — the largest single UI surface.
8. **Example:** `/nextjs-admin-console build the dispatch board with live job statuses`

### 27. `marketing-site-port` (P1)
1. **Name:** `marketing-site-port`
2. **Description:** Port the existing landing page (currently a Vite build) into the Next.js app with real CTAs, SEO metadata, and the area/ZIP check + quote estimator wired to live APIs.
3. **Input:** landing-page reference; quote/area-check endpoints.
4. **Output:** SEO-optimized marketing site on Netlify.
5. **Dependencies:** Next.js, Tailwind. Depends on: `design-system-setup`, `quote-engine` (public), `postgis-geo-query` (area check).
6. **Docs:** [Next.js metadata/SEO](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/marketing-site-port migrate the landing page and wire the estimator`

---

## 6. Error Handling & Logging

### 28. `edge-function-error-handling`
1. **Name:** `edge-function-error-handling`
2. **Description:** A consistent error-response contract and try/catch pattern for all Edge Functions (typed error codes, no leaking internals, correct HTTP status), plus input validation with shared zod schemas.
3. **Input:** the function + its failure modes.
4. **Output:** shared error helper + standard response envelope; adopted across functions.
5. **Dependencies:** zod; Edge Functions. Depends on: none (foundational for API skills).
6. **Docs:** [Edge Functions](https://supabase.com/docs/guides/functions) · [zod](https://zod.dev/)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/edge-function-error-handling add the standard error envelope to the quote function`

### 29. `logging-observability` (P1)
1. **Name:** `logging-observability`
2. **Description:** Structured logging in Edge Functions and a routine to inspect Supabase logs and run security/perf **advisors**; define what to log (no PII/secrets) and alerting basics.
3. **Input:** the component to instrument; log level policy.
4. **Output:** logging helper; an advisor/log-review checklist.
5. **Dependencies:** Supabase logs/advisors (MCP: `get_logs`, `get_advisors`). Depends on: `edge-function-error-handling`.
6. **Docs:** [Supabase logging](https://supabase.com/docs/guides/telemetry/logs) · [Advisors](https://supabase.com/docs/guides/database/database-advisors)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/logging-observability review edge-function logs and run security advisors`

---

## 7. Testing & Validation

### 30. `unit-testing`
1. **Name:** `unit-testing`
2. **Description:** Unit tests for business logic (quote engine, availability math, change-order rules) and shared utilities.
3. **Input:** the unit under test + cases (incl. edge cases from PRD).
4. **Output:** Vitest test files + coverage on critical logic.
5. **Dependencies:** Vitest. Depends on: `db-seed-data` (fixtures) where needed.
6. **Docs:** [Vitest](https://vitest.dev/)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/unit-testing cover quote-engine pricing matrix incl. boundary vehicle classes`

### 31. `rls-policy-testing`
1. **Name:** `rls-policy-testing`
2. **Description:** Prove tenant/role isolation: assert a technician can't read another's jobs, a customer can't read another org, etc. — the highest-value security tests.
3. **Input:** the policy matrix; seeded multi-tenant fixtures.
4. **Output:** pgTAP (or integration) tests asserting allow/deny per role.
5. **Dependencies:** pgTAP / Supabase test tooling; seed data. Depends on: `rls-policy-authoring`, `db-seed-data`.
6. **Docs:** [pgTAP testing](https://supabase.com/docs/guides/database/extensions/pgtap) · [RLS](https://supabase.com/docs/guides/auth/row-level-security)
7. **Complexity:** 🔴 Complex — but essential; RLS bugs are silent and severe.
8. **Example:** `/rls-policy-testing assert cross-org and cross-technician denial on jobs`

### 32. `edge-function-testing` (P1)
1. **Name:** `edge-function-testing`
2. **Description:** Integration tests for Edge Functions (quote, booking, webhooks) against a local Supabase stack, including Stripe webhook signature/idempotency cases.
3. **Input:** function + request/response contracts + mocked external calls.
4. **Output:** Deno test suites; local CI hook.
5. **Dependencies:** Deno test; Supabase local; Stripe CLI (webhook fixtures). Depends on: the target function skills.
6. **Docs:** [Testing Edge Functions](https://supabase.com/docs/guides/functions/unit-test) · [Stripe CLI](https://docs.stripe.com/stripe-cli)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/edge-function-testing test stripe-webhook-handler idempotency`

### 33. `e2e-testing` (P1)
1. **Name:** `e2e-testing`
2. **Description:** End-to-end tests of the critical loop (book → assign → track → pay) on mobile and the admin web.
3. **Input:** user journeys from PRD; seeded env.
4. **Output:** Detox (mobile) / Playwright (web) suites for the golden path.
5. **Dependencies:** Detox, Playwright. Depends on: most UI + API skills; `db-seed-data`.
6. **Docs:** [Detox](https://wix.github.io/Detox/) · [Playwright](https://playwright.dev/docs/intro)
7. **Complexity:** 🔴 Complex — flaky-test management, device/browser matrix.
8. **Example:** `/e2e-testing cover the end-to-end booking-to-payment journey`

---

## 8. Deployment & Infrastructure

### 34. `env-secrets-management`
1. **Name:** `env-secrets-management`
2. **Description:** Define and wire environment variables/secrets per environment (names in CLAUDE.md §6); ensure secrets stay server-side (Edge Function env), clients get only publishable keys.
3. **Input:** the service/keys to configure; target env.
4. **Output:** `.env.example`, documented env matrix, configured secrets in Supabase/Netlify/EAS.
5. **Dependencies:** Supabase/Netlify/EAS secret stores. Depends on: none (foundational).
6. **Docs:** [Supabase secrets](https://supabase.com/docs/guides/functions/secrets) · [Netlify env vars](https://docs.netlify.com/build/environment-variables/overview/) · [EAS secrets](https://docs.expo.dev/build-reference/variables/)
7. **Complexity:** 🟢 Simple
8. **Example:** `/env-secrets-management set STRIPE_WEBHOOK_SECRET in staging only`

### 35. `cicd-pipeline`
1. **Name:** `cicd-pipeline`
2. **Description:** GitHub Actions pipeline: lint, typecheck, unit/RLS tests, and gated migration/deploy on merge; preview deploys per PR.
3. **Input:** repo layout; test/deploy steps.
4. **Output:** `.github/workflows/*.yml`; green-before-merge gate.
5. **Dependencies:** GitHub Actions. Depends on: `unit-testing`, `rls-policy-testing`, `supabase-deploy`, `netlify-deploy`. **GitHub MCP** available.
6. **Docs:** [GitHub Actions](https://docs.github.com/actions) · [Supabase CI/CD](https://supabase.com/docs/guides/deployment/managing-environments)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/cicd-pipeline add a CI workflow that blocks merge on failing RLS tests`

### 36. `supabase-deploy`
1. **Name:** `supabase-deploy`
2. **Description:** Promote schema migrations and deploy Edge Functions across staging→prod using branches/environments; guard against destructive prod changes.
3. **Input:** target env; migrations/functions to ship.
4. **Output:** deployed functions + applied migrations; environment parity.
5. **Dependencies:** Supabase CLI; Supabase Branching. Depends on: `supabase-migration`, `env-secrets-management`.
6. **Docs:** [Managing environments](https://supabase.com/docs/guides/deployment/managing-environments) · [Branching](https://supabase.com/docs/guides/deployment/branching)
7. **Complexity:** 🟡 Moderate
8. **Example:** `/supabase-deploy promote staging migrations to prod (with review)`

### 37. `netlify-deploy`
1. **Name:** `netlify-deploy`
2. **Description:** Configure Netlify deployment for the Next.js web/admin app with Deploy Previews and env wiring.
3. **Input:** project config; env vars.
4. **Output:** connected Netlify site; per-PR Deploy Previews; prod domain.
5. **Dependencies:** Netlify. Depends on: `nextjs-admin-console`/`marketing-site-port`, `env-secrets-management`. **Netlify MCP** available.
6. **Docs:** [Netlify deploys](https://docs.netlify.com/deploy/create-deploys/) · [Netlify + Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
7. **Complexity:** 🟢 Simple
8. **Example:** `/netlify-deploy connect the web app with Deploy Previews`

### 38. `eas-build`
1. **Name:** `eas-build`
2. **Description:** Configure EAS Build/Submit for iOS+Android and EAS Update for OTA JS fixes; manage build profiles and store credentials.
3. **Input:** app config; build profile; store credentials.
4. **Output:** `eas.json`; cloud builds; OTA update channel.
5. **Dependencies:** Expo EAS. Depends on: `expo-screen-scaffold`, `env-secrets-management`.
6. **Docs:** [EAS Build](https://docs.expo.dev/build/introduction/) · [EAS Update](https://docs.expo.dev/eas-update/introduction/)
7. **Complexity:** 🟡 Moderate — store credentials/provisioning are the friction.
8. **Example:** `/eas-build set up preview + production build profiles`

---

## 9. Documentation Generation

### 39. `api-doc-generation` (P1)
1. **Name:** `api-doc-generation`
2. **Description:** Generate/maintain API reference for Edge Functions and key PostgREST endpoints (request/response, auth, rate limits) from PRD §5 + code.
3. **Input:** endpoint definitions/handlers.
4. **Output:** `docs/api.md` (or OpenAPI) kept in sync.
5. **Dependencies:** optional OpenAPI tooling. Depends on: the API skills.
6. **Docs:** [OpenAPI](https://swagger.io/specification/) · [PostgREST API](https://supabase.com/docs/guides/api)
7. **Complexity:** 🟢 Simple
8. **Example:** `/api-doc-generation document the booking + payment endpoints`

### 40. `schema-doc-generation` (P2)
1. **Name:** `schema-doc-generation`
2. **Description:** Produce a human-readable ER diagram + data dictionary from the live schema.
3. **Input:** current schema.
4. **Output:** `docs/schema.md` with ERD + table/field descriptions.
5. **Dependencies:** schema-introspection/ERD tooling. Depends on: `supabase-migration`.
6. **Docs:** [Postgres information_schema](https://www.postgresql.org/docs/current/information-schema.html)
7. **Complexity:** 🟢 Simple
8. **Example:** `/schema-doc-generation regenerate the ER diagram after migrations`

---

## 10. Skills we likely DON'T need for MVP (explicitly out of scope)

Listed so scope stays bounded (mirrors PRD §7). Revisit for v2.

- **`auto-dispatch-optimization`** — algorithmic routing/assignment. MVP dispatch is manual (`dispatch-assignment`).
- **`multi-org-onboarding`** — self-serve org signup/billing/admin. Schema is multi-tenant, but MVP runs one org.
- **`stripe-connect-payouts`** — technician payout automation. Not needed until scaling the labor side.
- **`in-app-chat`** — customer↔technician messaging. Use phone/SMS in MVP.
- **`i18n-localization`** — Spanish localization is a strong v2 fast-follow, not MVP.
- **`analytics-dashboards` / `bi-reporting`** — beyond the launch success metrics; measure manually first.
- **`parts-inventory-management`** — supply-chain tracking; out of scope.
- **`referral-attribution`** (F-15) and **`car-pickup-valet-logistics`** — P2/alternate model, deferred.
- **`redis-caching` / `full-text-search-infra`** — Postgres FTS + client caching suffice at MVP scale; add Upstash/search only if proven necessary.
- **`telematics-integration`** — predictive maintenance from vehicle data; future.

---

## Dependency ordering (suggested build sequence)

1. **Foundations:** `supabase-migration` → `rls-policy-authoring` → `supabase-type-generation` → `db-seed-data` → `env-secrets-management` → `edge-function-error-handling` → `design-system-setup`.
2. **Auth:** `twilio-sms-notifications` → `phone-otp-auth` → `role-based-access` → `rls-policy-testing`.
3. **Core loop:** `quote-engine` → `mapbox-geocoding`/`postgis-geo-query` → `booking-availability` → `dispatch-assignment` → `realtime-location-tracking` → `mapbox-routing-eta` → `stripe-payment-intent` → `stripe-webhook-handler` → `twilio`/`push` notifications.
4. **UI:** `expo-screen-scaffold` → `form-validation` → `booking-flow-ui` → `live-tracking-map-ui` → `nextjs-admin-console` → `marketing-site-port`.
5. **Harden & ship:** `unit-testing` → `edge-function-testing` → `e2e-testing` → `logging-observability` → `cicd-pipeline` → `supabase-deploy`/`netlify-deploy`/`eas-build` → docs.

This ordering front-loads the **secured, end-to-end money-making loop** — the exact thing the viability analysis says must be validated before further investment.
