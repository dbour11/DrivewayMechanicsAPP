# Driveway Mechanics

<!-- Maintainer note: keep this file tight (~200 lines). Link to research docs for depth; don't duplicate them. Update the "Current State" section as work progresses. -->

On-demand **mobile auto repair** — a licensed mechanic drives to the customer's home and fixes the car in their driveway. Mobile-first booking, upfront fixed-price quoting, live technician tracking, and in-app payment, across South Florida (Miami / West Palm Beach / Port St. Lucie).

**Full context lives in the research docs — read them before non-trivial work:**
- `research/PRD.md` — product requirements, features, DB schema, API spec, success metrics (authoritative build spec)
- `research/tech-stack.md` — full stack rationale, costs, MCP servers
- `research/viability-analysis.md` — market/competitive analysis and why the MVP is scoped the way it is

---

## 1. Project Identity
- **Mission:** remove the two things people hate about car repair — *distrust of the bill* and *loss of a day* — by fixing the car in the driveway at a price quoted up front.
- **Value prop:** "See your exact price before we touch your car, and never lose a day at the shop."
- **MVP success = proving 3 things with real money, not scale:** (1) people book, (2) a single job is profitable (positive contribution margin), (3) the "quote = final price" promise holds (**≥95% quote accuracy**). See PRD §8.
- **North-star metric:** completed jobs per week. Launch-week target is deliberately tiny (5–10 jobs).

## 2. Technical Context
**Stack (see `research/tech-stack.md` for rationale):**
- **Language:** TypeScript end-to-end. (Python only reserved for future ML/route-optimization — not now.)
- **Mobile (customer + technician apps):** Expo / React Native, Expo Router, NativeWind.
- **Web (marketing + admin console):** Next.js (App Router) on Vercel.
- **Backend / DB / Auth / Realtime / Storage / Functions:** **Supabase**. Custom server logic → Supabase Edge Functions (Deno/TS).
- **Database:** PostgreSQL + **PostGIS** (geospatial is core: service-area geofencing, nearest-technician, ETA).
- **State:** TanStack Query for server state, Supabase Realtime for live data, Zustand only for small local UI state. No Redux.
- **External services:** Stripe (payments), Twilio (SMS/voice/OTP), Mapbox (maps/routing/ETA).

**Key architectural decisions & rationale:**
- **Postgres + PostGIS over Firebase/Mongo** — data is relational *and* geospatial; also money-adjacent (needs transactions + integrity). Firestore/Mongo would fight both.
- **Multi-tenant from day one** — every tenant table has `organization_id`; isolation via Postgres **RLS** (row-level, shared-schema). MVP runs a *single* org, but the schema is org-scoped so a multi-shop/franchise model needs no migration later. Multi-org onboarding UI is out of scope for MVP.
- **Server-authoritative pricing** — quotes/charges are always recomputed server-side from `pricing_rules`; the client value is display-only, never trusted for charging.
- **Supabase-first, thin custom code** — auto REST (PostgREST) for CRUD; Edge Functions only for secrets/third-parties/business invariants.
- **Manual dispatch in MVP** — admin assigns technicians by hand; automated routing is v2.

**Coding standards / conventions:**
- **Money:** always integer **cents** (`bigint`) + `currency` (default `'USD'`). Never floats for money.
- **Time:** `timestamptz`, UTC everywhere.
- **IDs:** `uuid` (`gen_random_uuid()`).
- **JSON / API:** camelCase in payloads; DB columns snake_case.
- **Every tenant table:** non-null `organization_id` + an RLS policy. Deny-by-default.
- **Enums/status/validation:** enforce with DB `CHECK` constraints, not just app code.
- **Secrets** live only in Edge Function env — never in client bundles. Clients use publishable/restricted keys only.
- **Financial records** (`payments`, `jobs`) are never hard-deleted — use status fields.
- **Types:** generate TS types from the Supabase schema; share `zod` schemas + generated types across mobile/web/functions so they never drift.
- **Formatting/lint:** Prettier + ESLint; typecheck must pass before commit. (Set up in repo scaffolding.)

## 3. Current State
<!-- UPDATE THIS SECTION AS WORK PROGRESSES -->
- **Phase: pre-build / planning complete.** No application code exists yet.
- **Done:** viability analysis, tech-stack decision, and full PRD (all in `research/`). A static marketing landing page exists as a design reference (`driveway-mechanics-landing-page.pdf`, originally a Vite build).
- **In progress:** nothing in code yet — next step is repo scaffolding + first vertical slice (org/profiles/auth → service areas → quote → book).
- **Known issues / tech debt:** none yet (no code). Open product tension to resolve with the user: *single-org MVP vs. true multi-org SaaS ambition* — schema supports both, feature scope currently assumes single-org.
- **Not a git repository yet** — initialize before first commit.

## 4. Agent Instructions
**How to approach this codebase:**
- Treat `research/PRD.md` as the source of truth for *what* to build; this file is the source of truth for *how* (conventions/decisions). If they conflict, flag it — don't silently pick one.
- Build the **end-to-end money-making loop first** (auth → quote → book → assign → track → pay → notify) before polish or P1/P2 features. Respect the P0/P1/P2 priorities in PRD §3.
- Keep custom backend code minimal; prefer Supabase primitives (RLS, PostgREST, Realtime, Edge Functions) over hand-rolled servers.
- The **Supabase MCP server is connected** — use it for migrations, SQL, type generation, and running security/perf **advisors** (check RLS coverage before shipping).

**Ask the user before:**
- Committing to **multi-org SaaS features** vs. staying single-org (materially changes roadmap).
- Choosing the business model if ambiguity resurfaces — MVP is **mobile-mechanic**, *not* the car-pickup/valet model (explicitly out of scope).
- Adding any new third-party service, paid tier, or dependency that affects the **<$50/mo** MVP hosting budget.
- Changing pricing logic, the quote/charge flow, or anything touching the "quote = final price" guarantee.
- Data model changes that alter tenancy/RLS or financial tables.

**Never do without explicit approval:**
- Point a **write-enabled MCP server at production**, or run destructive SQL/migrations against prod. Use dev/staging + restricted keys.
- Commit secrets/API keys, or move secrets into client bundles.
- Hard-delete financial records or bypass RLS.
- Deploy/publish, push to a remote, purchase/upgrade paid services, or send real SMS/emails/payments on the user's behalf.
- Weaken auth, RLS, or payment-verification (Stripe webhook signature + idempotency) to "make it work."

## 5. File Structure Map
<!-- Update as the repo takes shape. Planned monorepo layout: -->
```
/research/            # Planning docs (PRD, tech-stack, viability) — read-first context
/.claude/CLAUDE.md    # This file — persistent project memory
driveway-mechanics-landing-page.pdf   # Design reference for the marketing site
--- planned (not yet created) ---
/apps/mobile/         # Expo app — customer + technician surfaces
/apps/web/            # Next.js — marketing site + admin console
/packages/shared/     # Shared zod schemas + generated Supabase types
/supabase/            # migrations/, functions/ (Edge Functions), config
```
**Naming conventions:** files/dirs kebab-case; React components PascalCase; DB tables/columns snake_case (plural tables); API payload fields camelCase; Edge Functions named by action (e.g., `quote`, `check-area`, `webhooks/stripe`).

## 6. External Dependencies
| Service | Purpose | Docs |
|---|---|---|
| Supabase | Postgres+PostGIS, Auth, Realtime, Storage, Edge Functions | https://supabase.com/docs |
| Stripe | Payments (PaymentIntents), subscriptions (membership, P2) | https://docs.stripe.com/ |
| Twilio | SMS/voice + OTP delivery; needs **A2P 10DLC registration** (start early) | https://www.twilio.com/docs |
| Mapbox | Maps, geocoding, routing, live ETA | https://docs.mapbox.com/ |
| Expo / EAS | Mobile builds + OTA updates | https://docs.expo.dev/ |
| Vercel | Web hosting / CI deploys | https://vercel.com/docs |

**Environment variables needed (names only — never commit values):**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client), `SUPABASE_SERVICE_ROLE_KEY` (server/functions only)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` (client)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`
- `MAPBOX_ACCESS_TOKEN` (server), `MAPBOX_PUBLIC_TOKEN` (client)
- `EXPO_PUBLIC_*` for any value that must reach the mobile client

## 7. User Avatar Reminder
**"Maria," the Time-Poor Household Manager** — busy parent/household logistics owner, 32–48, owns a daily-driver the family depends on. She's been *procrastinating* the repair because every option costs her time or trust. (Full persona: PRD §1–2.)
- **Fears:** being overcharged/upsold; being stranded with the kids; losing a half-day she can't spare.
- **Wants:** the light handled, on her schedule, at a price she was told in advance, by someone she'd trust in her driveway.

**UX principles for this audience:**
- **Radical transparency** — show price before commitment; make quote-vs-final obvious. Any price change needs explicit in-app approval.
- **Minimize time & friction** — phone-OTP login, few steps to book, evening/weekend slots, no jargon.
- **Plain language, never condescending** — explain issues like a normal person.
- **Always-visible status** — live ETA + job progress; never leave her wondering (no all-day "windows").
- **Accessible & mobile-first** — WCAG 2.1 AA, ≥44pt touch targets, status shown with text+icon (not color alone), one-handed use. Spanish localization is a strong v2 given the market.
- **The referral moment is emotional relief** — final price = quote and zero time lost. Surface a share prompt right after a 5-star job.
