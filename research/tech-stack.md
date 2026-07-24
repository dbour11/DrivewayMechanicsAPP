# Driveway Mechanics — Recommended Tech Stack

**Prepared:** 2026-07-24
**Builds on:** [`viability-analysis.md`](./viability-analysis.md)
**Guiding principle:** This is a *geospatial, two-sided, operations* product on a tight pre-revenue budget. The stack is chosen to (a) minimize backend code you have to write and maintain, (b) put location/geofencing on first-class infrastructure, and (c) maximize Claude Code MCP leverage. **One language (TypeScript) end-to-end, one managed backend (Supabase), thin custom code.**

## TL;DR — the recommended stack

| Layer | Choice | Why in one line |
|---|---|---|
| Mobile apps (customer + technician) | **Expo (React Native)** | One codebase → iOS + Android; first-class background GPS for the tech app |
| Web (marketing + admin) | **Next.js (React)** on Netlify | Reuses the existing landing page; SSR for SEO on the marketing site |
| Backend / BaaS | **Supabase** (Postgres, Auth, Realtime, Storage, Edge Functions) | Replaces ~80% of custom backend; **MCP server already connected** |
| Database | **Postgres + PostGIS** | Relational data + real geospatial queries (geofencing, ETA) in one DB |
| Auth | **Supabase Auth — phone OTP** | Matches "book by phone/text"; row-level security built in |
| Custom logic | **Supabase Edge Functions (Deno/TS)** | Secure server-side for Stripe/Twilio/dispatch; no separate server to run |
| Payments | **Stripe** | Industry standard; **official MCP server** |
| SMS / voice | **Twilio** | "Call or Text" + booking notifications |
| Maps / routing | **Mapbox** | Cheaper than Google for continuous live tracking |
| Hosting | Supabase + Netlify + Expo EAS | All have real free tiers; **MVP fits under $50/mo easily** |
| CI/CD | **GitHub Actions + Netlify + EAS Build** | Git-push deploys; **GitHub MCP server** |

---

## 1. Frontend Recommendation

### Framework: Expo (React Native) for mobile, Next.js for web

You have **three distinct front-end surfaces**, and one framework does not serve all three well:

1. **Customer app** — book, quote, pay, track live ETA. Phone-first.
2. **Technician app** — receive dispatch, push live GPS location, update job status. **Requires reliable background location** — this is a native capability, and the single biggest reason to go native mobile rather than a mobile website.
3. **Marketing site + admin dashboard** — the landing page you already have (currently a Vite build at `localhost:5173`) plus an internal ops console.

**Recommendation:**
- **Expo (React Native)** for the customer and technician apps — one TypeScript/React codebase compiles to both iOS and Android, satisfying your cross-platform preference. Expo's managed workflow gives you background geolocation, push notifications, and maps without wrestling native toolchains. → [Expo docs](https://docs.expo.dev/) · [React Native docs](https://reactnative.dev/docs/getting-started)
- **Next.js (React)** for marketing + admin, deployed on Netlify (via its Next.js/OpenNext runtime). SSR/SSG gives the marketing page real SEO (important for a local-search business), and you can migrate the existing landing page into it. → [Next.js docs](https://nextjs.org/docs) · [Netlify + Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)

> **Why not one React Native codebase for everything (via React Native Web)?** The marketing site needs SEO and fast first paint that RN-Web doesn't do well, and the admin console is desktop-first. Splitting mobile (Expo) from web (Next.js) while sharing types/logic in a monorepo is the pragmatic path.

> **Why Expo over bare React Native?** For a small team pre-revenue, Expo's EAS Build removes the need to maintain Xcode/Android Studio pipelines. You can `eject` later if you ever need a custom native module Expo doesn't support. → [Expo EAS Build](https://docs.expo.dev/build/introduction/)

### Key libraries for our specific features

| Feature | Library | Docs |
|---|---|---|
| Background/live location (tech app) | `expo-location` | [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) |
| Maps + live markers/ETA | `@rnmapbox/maps` (mobile), `react-map-gl` (web) | [rnmapbox](https://github.com/rnmapbox/maps) · [react-map-gl](https://visgl.github.io/react-map-gl/) |
| Push notifications | `expo-notifications` | [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| Server state / data fetching | **TanStack Query** | [TanStack Query](https://tanstack.com/query/latest) |
| Supabase client (auth, data, realtime) | `@supabase/supabase-js` | [supabase-js](https://supabase.com/docs/reference/javascript/introduction) |
| Payments UI | `@stripe/stripe-react-native` (mobile), Stripe.js (web) | [Stripe RN](https://docs.stripe.com/payments/accept-a-payment?platform=react-native) |
| Forms + validation | `react-hook-form` + `zod` | [react-hook-form](https://react-hook-form.com/) · [zod](https://zod.dev/) |
| Navigation | Expo Router (mobile), Next.js App Router (web) | [Expo Router](https://docs.expo.dev/router/introduction/) |
| Component styling | NativeWind (Tailwind for RN) — matches the landing page's Tailwind look | [NativeWind](https://www.nativewind.dev/) |

### State management approach
**Deliberately minimal — most "state" here is server state, not client state.**
- **TanStack Query** for all server data (appointments, quotes, job status) — handles caching, refetching, and loading/error states so you don't hand-roll a store.
- **Supabase Realtime subscriptions** for anything live (technician location, job-status changes) — pushes updates into the Query cache; no polling.
- **Zustand** only for small, genuinely-local UI state (booking-wizard steps, filters). → [Zustand](https://zustand-demo.pmnd.rs/)
- **No Redux.** It's overkill for this app and adds boilerplate you'd regret at this stage.

---

## 2. Backend Recommendation

### Runtime & framework: Supabase-first, with Edge Functions for custom logic

**Recommendation: use Supabase as the backend, not a from-scratch server.** For an MVP with a small team, standing up and operating your own Node/Express or Python/FastAPI server (plus auth, plus a Postgres box, plus file storage) is avoidable cost and toil. Supabase gives you Postgres, Auth, Storage, Realtime, and serverless functions as one managed product. → [Supabase docs](https://supabase.com/docs)

- **Auto-generated data API:** Supabase exposes your Postgres tables as a secure REST API via **PostgREST** — no controller code for standard CRUD. → [PostgREST / Data API](https://supabase.com/docs/guides/api)
- **Custom server logic → Supabase Edge Functions** (Deno, TypeScript): Stripe webhooks, Twilio sends, the dispatch/assignment logic, quote calculation. Keeps you in **one language (TS)** across the whole stack. → [Edge Functions](https://supabase.com/docs/guides/functions)

> **Node vs. Python (your stated choice):** Go **Node/TypeScript**. Your entire frontend is TS, Supabase Edge Functions are TS/Deno, and you share types (via `zod` + generated Supabase types) across client and server. Python's advantage would be data-science/ML libraries — you don't need those for booking, dispatch, payments, and messaging. Introduce a small Python service *only later* if you build route-optimization or demand-forecasting models.

> **When to add a dedicated server:** If dispatch/route-optimization grows beyond what Edge Functions comfortably handle (long-running jobs, heavy compute), add a single **Node service (Fastify)** or a Python **FastAPI** worker then — not now. → [Fastify](https://fastify.dev/docs/latest/) · [FastAPI](https://fastapi.tiangolo.com/)

### API architecture: REST (PostgREST) + Edge Functions now; tRPC optional later
- **Primary: auto-generated REST** via PostgREST for CRUD — zero code, secured by row-level security.
- **Custom endpoints: Edge Functions** (HTTP handlers) for anything involving secrets or third parties (Stripe, Twilio, Mapbox server calls, dispatch).
- **Skip GraphQL.** It adds a schema/resolver layer with no payoff at this scale. Supabase *does* offer `pg_graphql` if you ever want it. → [pg_graphql](https://supabase.com/docs/guides/graphql)
- **tRPC** is a great fit *if and when* you add a Next.js/Node backend for the admin app and want end-to-end typesafe calls — note it as a future option, not an MVP need. → [tRPC](https://trpc.io/docs)

### Authentication strategy: Supabase Auth with phone OTP
- **Phone-number OTP** as the primary method — it matches your product ("call, login, or send a message to schedule") and is the lowest-friction path for non-technical local customers. Email/password and Apple/Google sign-in are available as options. → [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Row-Level Security (RLS)** enforces that a customer sees only their vehicles/appointments and a technician sees only their assigned jobs — enforced at the database, not just the app layer. This is a major security win and a reason to prefer Postgres/Supabase here. → [RLS](https://supabase.com/docs/guides/auth/row-level-security)
- **Roles:** `customer`, `technician`, `admin` via a `profiles` table + RLS policies and (optionally) custom JWT claims.
- Phone OTP delivery is powered by an SMS provider — wire it to **Twilio** so you consolidate messaging with one vendor.

---

## 3. Database Recommendation

### Primary database: PostgreSQL (via Supabase) + PostGIS

**This is the highest-conviction choice in the whole stack.** Your core features are relational *and* geospatial:
- Relational: customers ↔ vehicles ↔ appointments ↔ jobs ↔ technicians ↔ payments ↔ reviews. These are join-heavy with real integrity constraints — a natural fit for SQL and a poor fit for a document store.
- Geospatial: "is this ZIP in our service area?", "which available technician is nearest?", "compute ETA/route". **PostGIS** does radius/geofence/nearest-neighbor queries natively. → [PostGIS](https://postgis.net/documentation/) · [Supabase + PostGIS](https://supabase.com/docs/guides/database/extensions/postgis)

> **Why not Firebase or MongoDB (your other two options)?**
> - **Firebase/Firestore** is a document DB — modeling these relations means denormalization and manual consistency, and its geo-querying is weak (bounding-box hacks vs. true PostGIS). Great for chat apps, wrong shape for a booking/dispatch system with money in it.
> - **MongoDB Atlas** has geospatial indexes and would work, but you'd give up SQL joins, transactional integrity across bookings/payments, and RLS. For a payments-adjacent relational domain, Postgres is the safer default.
> - **Supabase (Postgres)** also uniquely gives you the **connected MCP server** for your MCP-priority constraint (see §5).

**Schema approach:** normalized relational schema, managed as **version-controlled SQL migrations** (see below), with RLS policies co-located. Generate TypeScript types from the schema so the client and Edge Functions are type-safe end to end. → [Generate types](https://supabase.com/docs/guides/api/rest/generating-types)

Sketch of core tables:
```
profiles (id → auth.users, role, name, phone)
vehicles (id, customer_id → profiles, year, make, model)
service_areas (id, name, geom(Polygon))        -- PostGIS geofence
technicians (id → profiles, status, last_location geography(Point))
appointments (id, customer_id, vehicle_id, service_type, status, scheduled_at, quote_low, quote_high, service_area_id)
jobs (id, appointment_id, technician_id, status, started_at, completed_at, final_price)
payments (id, job_id, stripe_payment_intent, amount, status)
reviews (id, job_id, rating, body, source)
```

### Secondary data stores
**Keep it lean — you likely need none at MVP.**
- **Cache (Redis):** *not needed initially.* Postgres + TanStack Query client caching is enough. Add **Upstash Redis** (serverless, free tier) only if you build rate limiting or hot-path caching later. → [Upstash](https://upstash.com/docs/redis)
- **Search:** Postgres **full-text search** covers review/FAQ search for a long time. Don't add Elasticsearch/Algolia now. → [Postgres FTS](https://supabase.com/docs/guides/database/full-text-search)
- **Live location stream:** handled by **Supabase Realtime** (Postgres change feeds / broadcast), not a separate store. → [Realtime](https://supabase.com/docs/guides/realtime)
- **File storage** (photos of the car/part, per the reviews): **Supabase Storage**. → [Storage](https://supabase.com/docs/guides/storage)

### Backup & migration strategy
- **Migrations:** author schema changes as SQL files with the **Supabase CLI**, checked into git, applied per-environment. This is also exactly what the **Supabase MCP server's `apply_migration`/`list_migrations`** tools drive — Claude Code can propose and apply migrations directly. → [Supabase CLI / migrations](https://supabase.com/docs/guides/local-development)
- **Environments:** use **Supabase Branching** (or a separate staging project) so schema changes are tested before hitting production. → [Branching](https://supabase.com/docs/guides/deployment/branching)
- **Backups:** the **Free tier has *no* backups** — a real limitation. On **Pro ($25/mo)** you get daily automated backups; enable **Point-in-Time Recovery** once you have live customer/payment data (it's worth the add-on the moment money is involved). → [Backups](https://supabase.com/docs/guides/platform/backups)

---

## 4. Infrastructure & Hosting

### Deployment platforms
| Component | Platform | Notes |
|---|---|---|
| Backend, DB, Auth, Storage, Realtime, Functions | **Supabase** | One managed platform. → [Supabase](https://supabase.com/docs) |
| Marketing site + admin dashboard | **Netlify** | Git-push deploys + Deploy Previews for Next.js; $0 free tier. → [Netlify](https://docs.netlify.com/) |
| Mobile app builds + OTA updates | **Expo EAS** | Cloud iOS/Android builds; over-the-air updates. → [EAS](https://docs.expo.dev/eas/) |
| Payments | **Stripe** | No monthly fee; ~2.9% + 30¢/txn. → [Stripe](https://docs.stripe.com/) |
| SMS/voice | **Twilio** | Usage-based; A2P 10DLC registration required for US business SMS. → [Twilio](https://www.twilio.com/docs) |
| Maps | **Mapbox** | Free monthly tier; cheaper than Google for continuous tracking. → [Mapbox](https://docs.mapbox.com/) |

### CI/CD approach
- **GitHub** as source of truth (monorepo: `apps/mobile`, `apps/web`, `supabase/`). → [GitHub](https://docs.github.com/)
- **Netlify** auto-deploys the web app on every push/PR (Deploy Preview per PR). → [Netlify deploys](https://docs.netlify.com/deploy/create-deploys/)
- **GitHub Actions** runs lint/typecheck/tests and applies Supabase migrations to staging→prod on merge. → [GitHub Actions](https://docs.github.com/actions)
- **EAS Build** (triggered manually or via Actions) for store builds; **EAS Update** ships JS-only fixes over-the-air without an app-store review. → [EAS Update](https://docs.expo.dev/eas-update/introduction/)

### Estimated monthly cost (grounded in current 2026 pricing)

| Stage | Supabase | Netlify | Expo EAS | Twilio | Mapbox | Stripe | **Total (fixed)** |
|---|---|---|---|---|---|---|---|
| **MVP / pre-launch** | Free ($0) | Free ($0) | Free ($0, 30 builds/mo) | ~$5–10 usage | Free tier | % per txn | **~$0–15/mo ✅** |
| **~1,000 users** | Pro ($25) | Free–Pro ($0–20) | Free–Starter ($0–19) | ~$15–30 usage | Free–low | % per txn | **~$25–50/mo ✅** |
| **~10,000 users** | Pro + overages ($25 + ~$50–150 compute/egress) | Pro ($20) | Starter+ ($19–199) | ~$100–300 usage | ~$50–200 | % per txn | **~$250–600/mo** |

Notes and sources:
- **Supabase Free:** 500 MB DB, 50k MAUs, 500k Edge Function calls, **no backups**, projects **pause after 7 days idle** — fine for pre-launch, *not* for live customers. **Pro is $25/mo** (first project) with usage-based overages. → [Supabase pricing](https://supabase.com/pricing)
- **Your <$50/mo MVP budget is comfortably met** — pre-launch is ~$0, and you stay under $50 through roughly your first ~1k users. Plan for the step-up to a few hundred dollars/month around 10k users, driven mostly by Supabase compute/egress, Twilio volume, and Mapbox tracking calls.
- **Cost watch-items:** (1) Mapbox/Maps calls from naive high-frequency live tracking — throttle location writes; (2) Twilio SMS at volume; (3) Supabase egress. None are surprises if you monitor them. → [Netlify pricing](https://www.netlify.com/pricing/) · [Expo pricing](https://expo.dev/pricing) · [Twilio pricing](https://www.twilio.com/en-us/pricing) · [Mapbox pricing](https://www.mapbox.com/pricing) · [Stripe pricing](https://stripe.com/pricing)

---

## 5. MCP Server Availability

Your constraint was to *prioritize services with MCP servers for Claude Code* — this stack scores well, and **one is already live in this session.**

| Service | MCP server | Status here | What it enables |
|---|---|---|---|
| **Supabase** | Official | **✅ Already connected in this session** | Apply/list migrations, run SQL, generate TS types, inspect logs, run security/perf **advisors**, manage branches — Claude Code builds and evolves your schema directly. → [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) |
| **Stripe** | Official | Available to add | Create products/prices, inspect payments, scaffold Checkout/webhooks, search Stripe docs from the editor. → [Stripe MCP](https://docs.stripe.com/mcp) |
| **GitHub** | Official | Available to add | Manage repos/PRs/issues/Actions from Claude Code. → [GitHub MCP](https://github.com/github/github-mcp-server) |
| **Netlify** | Official | Available to add | Create/manage/deploy sites, env vars, and deploy status. → [Netlify MCP](https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/) |

**What this enables for your workflow:**
- **Schema-first, AI-driven data layer.** With the Supabase MCP already connected, Claude Code can propose a migration, apply it, regenerate TypeScript types, and run the **advisors** to catch missing RLS policies or slow queries — a tight loop that normally spans several manual CLI steps.
- **Payments scaffolding with fewer context switches.** The Stripe MCP lets Claude set up products/prices and reason about webhook events without you leaving the editor.
- **End-to-end from code to deploy.** GitHub + Netlify MCPs mean branch → PR → deploy status is inspectable in-loop.
- **Net effect:** Supabase being both the backend *and* an MCP-first platform is the reason it wins your "prioritize MCP" constraint over Firebase (no first-party Claude MCP server of the same depth) and MongoDB.

> ⚠️ **Security note on MCP:** MCP servers that touch production data/keys are powerful. Use **read-only / restricted keys** where offered (Supabase supports read-only mode; Stripe supports restricted keys), scope them to **dev/staging**, and never point a write-enabled MCP at production without review. Treat MCP-driven schema/payment changes with the same care as any migration.

---

## 6. Integration Map

### How the pieces connect
```
                       ┌─────────────────────────────────────────────┐
                       │                   CLIENTS                     │
                       │                                               │
   Customer app        │  Technician app          Marketing + Admin   │
   (Expo / RN)         │  (Expo / RN)            (Next.js on Netlify)  │
        │              │       │                          │           │
        │  supabase-js │       │ supabase-js + expo-location          │
        └──────┬───────┴───────┴──────────────┬───────────┘           │
               │                               │                       │
               ▼                               ▼                       │
        ┌───────────────────────────────────────────────────┐         │
        │                    SUPABASE                        │         │
        │  Auth (phone OTP + RLS)   Realtime (live location) │         │
        │  Postgres + PostGIS       Storage (job photos)     │         │
        │  Edge Functions (TS/Deno) ── secure server logic ──┼──┐      │
        └───────────────────────────────────────────────────┘  │      │
                                                                │      │
                     server-to-server (secrets held in Functions)     │
                 ┌──────────────┬──────────────┬─────────────────┐    │
                 ▼              ▼              ▼                  ▼    │
             Stripe         Twilio          Mapbox         Push (Expo)│
          (payments)    (SMS/voice/OTP)  (geocode/route)  (notifs)    │
                 │
                 └── Stripe webhooks ──► Supabase Edge Function ──► Postgres (payment status)
```

**Flow examples:**
- **Booking:** customer app → PostgREST insert into `appointments` (RLS-guarded) → Edge Function computes quote (service × vehicle × PostGIS service-area) → Twilio confirmation SMS.
- **Live tracking:** tech app writes `last_location` via `expo-location` → Supabase Realtime broadcasts → customer app updates the map (the PDF's "18 min away / On the way → Diagnosing → Fixing").
- **Payment:** Edge Function creates a Stripe PaymentIntent → client confirms with Stripe SDK → Stripe webhook → Edge Function updates `payments`/`jobs`.

### Potential integration pain points (and mitigations)
1. **Background location on the tech app.** iOS/Android background-location permissions and battery optimization are the trickiest part of the build. Test on real devices early; throttle update frequency (also controls Mapbox cost). → [expo-location background](https://docs.expo.dev/versions/latest/sdk/location/#background-location-methods)
2. **Stripe webhook ↔ Edge Function reliability.** Verify signatures, make handlers idempotent (same event may arrive twice), and reconcile against Stripe as source of truth. → [Stripe webhooks](https://docs.stripe.com/webhooks)
3. **Twilio A2P 10DLC registration.** US business SMS requires brand/campaign registration before you can reliably send OTP/booking texts — start this early; approval takes days. → [A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc)
4. **RLS policy correctness.** RLS is powerful but easy to get subtly wrong (e.g., a technician seeing another's jobs). Use the **Supabase advisors** (via MCP) and write policy tests. → [RLS](https://supabase.com/docs/guides/auth/row-level-security)
5. **Realtime scaling / cost.** Free tier caps concurrent Realtime connections; live tracking is connection-hungry. Only subscribe when a job is active; unsubscribe on completion.
6. **Free-tier project pausing.** A Supabase Free project **pauses after 7 days idle** — do *not* run anything customer-facing on Free. Move to Pro before real launch.
7. **Monorepo type-sharing.** Keep generated Supabase types + `zod` schemas in a shared package so mobile, web, and Edge Functions never drift. → [pnpm workspaces](https://pnpm.io/workspaces)
8. **App Store / Play review latency.** Native apps mean store review cycles; lean on **EAS Update** for JS-only fixes to avoid waiting on review for small changes. → [EAS Update](https://docs.expo.dev/eas-update/introduction/)

---

## Summary

| Requirement | Met? | How |
|---|---|---|
| React / React Native | ✅ | Expo (RN) mobile + Next.js (React) web |
| Node **or** Python | ✅ | Node/TypeScript (Edge Functions); Python reserved for future ML only |
| Managed DB w/ good DX (Supabase/Firebase/Mongo) | ✅ | **Supabase (Postgres + PostGIS)** — best fit for relational + geospatial |
| Prioritize MCP-server services | ✅✅ | **Supabase MCP already connected**; Stripe/GitHub/Netlify MCPs available |
| Cost-effective MVP→growth | ✅ | Free tiers → predictable step-ups |
| **Under $50/mo until revenue** | ✅ | **~$0–15/mo MVP; under $50 through ~1k users** |
| Official docs for every tech | ✅ | Linked throughout |

**The stack in one sentence:** TypeScript everywhere, Supabase (Postgres + PostGIS) as the backend so you write almost no server code, Expo + Next.js on the front, Stripe/Twilio/Mapbox for the three external capabilities that matter — chosen so Claude Code's MCP servers (Supabase already live) drive the build.

---

### Sources
- [Supabase pricing 2026 breakdown (UI Bakery)](https://uibakery.io/blog/supabase-pricing) · [Supabase pricing (official)](https://supabase.com/pricing)
- [Supabase MCP server](https://supabase.com/docs/guides/getting-started/mcp)
- [Stripe MCP documentation](https://docs.stripe.com/mcp)
- [Expo EAS pricing 2026 (checkthat.ai)](https://checkthat.ai/brands/expo/pricing) · [Expo pricing (official)](https://expo.dev/pricing)
- [Expo docs](https://docs.expo.dev/) · [React Native docs](https://reactnative.dev/docs/getting-started) · [Next.js docs](https://nextjs.org/docs)
- [PostGIS documentation](https://postgis.net/documentation/) · [Supabase PostGIS guide](https://supabase.com/docs/guides/database/extensions/postgis)
- [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://zustand-demo.pmnd.rs/)
- [Twilio A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc) · [Stripe webhooks](https://docs.stripe.com/webhooks) · [Mapbox pricing](https://www.mapbox.com/pricing)
