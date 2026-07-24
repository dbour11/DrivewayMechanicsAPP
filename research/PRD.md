# Driveway Mechanics — Product Requirements Document (MVP)

**Version:** 1.0
**Date:** 2026-07-24
**Status:** Draft for build
**Related docs:** [`viability-analysis.md`](./viability-analysis.md) · [`tech-stack.md`](./tech-stack.md)

> **How to read this document.** It is written so a developer new to the project can build the MVP without additional context. Sections 1–3 define *what and for whom*; Sections 4–5 are the buildable spec (schema + API); Sections 6–8 define *done, out-of-scope, and success*. Where a decision is deliberately deferred, it is called out explicitly.

> **Architectural note on scope.** The viability analysis recommends launching as a **single mobile-mechanic operation in South Florida**. You have also asked for a **multi-organization (multi-tenant)** data model. These are reconciled as follows: the **database and API are multi-tenant from day one** (every row scoped to an `organization`), but the **MVP feature set and go-to-market target a single organization** ("Driveway Mechanics"). This keeps the door open to a multi-shop SaaS or franchise model later without a painful migration, at near-zero extra cost now. Multi-org *admin/onboarding* tooling is explicitly out of scope for MVP (§7).

---

## 1. Executive Summary

**What we're building.** A mobile-first booking and dispatch platform for **on-demand mobile auto repair** — a licensed mechanic drives to the customer's home and repairs the car in their driveway. The product has three surfaces: a **customer app** (book, get an upfront fixed-price quote, pay, and track the mechanic's live ETA and job status), a **technician app** (receive dispatch, share live location, update job status), and an **admin/ops console** (manage schedule, technicians, jobs, and pricing). It is built on a multi-tenant backend so additional repair organizations can operate on the same platform later.

**Primary value proposition.** *"See your exact price before we touch your car, and never lose a day at the shop."* Two promises in one: **radical price transparency** (the quoted number is the number paid — no "while I'm in here" upsells) and **zero time lost** (no drop-off, no waiting room, no arranging a ride). We remove the two things people hate most about car repair — *distrust of the bill* and *loss of a day* — for a segment that feels those costs most acutely.

**Target user persona (psychographic).**
Meet **"Maria," the Time-Poor Household Manager** (representative, not a demographic gate).
- **Who:** 32–48, manages a busy household (often with kids), juggles work and family logistics, owns one or two out-of-warranty vehicles the family depends on daily.
- **Motivations:** protect the family's time and safety; keep the car reliable without it eating a day; make a decision she won't be second-guessed or ripped off on.
- **Fears:** being overcharged or upsold by a shop that assumes she doesn't know cars; being stranded with the kids because of an ignored warning light; losing a half-day of work/childcare she can't spare.
- **Goals:** the check-engine light *handled*, on her schedule, at a price she was told in advance, by someone she'd trust in her driveway.
- **Emotional core:** she has been *putting the repair off* because every option costs her time or trust she doesn't have. The product's job is to remove the dread, not just book a mechanic.

---

## 2. User Avatar Deep Dive

### Who exactly is this for?
The **primary buyer** is the household's "logistics owner" — the person who notices the warning light, worries about it, and ultimately books the fix. Skews toward busy parents and dual-income households in the **Miami / West Palm Beach / Port St. Lucie** corridor who value time and convenience and have been burned (or fear being burned) by traditional shops. Secondary users: anyone time-constrained or shop-averse (remote workers, elderly customers who can't easily get to a shop, single-vehicle households).

The **secondary user** is the **technician** — a licensed, background-checked mobile mechanic who needs a dead-simple app to get jobs, navigate, and report status. And the **operator/admin** who runs the daily schedule.

### Their current painful workflow (the status quo we're replacing)
1. Warning light appears → low-grade dread sets in; the problem is unknown and possibly unsafe.
2. Procrastination — because every path costs time or trust.
3. Eventually: call around for quotes → each feels like the opening of a negotiation.
4. Arrange to drop the car off → book a ride / miss work / rearrange childcare.
5. Sit in a waiting room or wait all day for a callback.
6. Get the "while I'm in here…" call → the price balloons past the quote, with no easy way to verify or refuse.
7. Pay more than expected, still unsure it was necessary. Resolve to "find a better mechanic" — and dread the next light.

**The pain is two-dimensional: lost time *and* eroded trust.** Most competitors solve one. We must solve both, visibly.

### What does success look like for them?
- The mechanic arrives **in their driveway on schedule**; they never left home.
- The **price quoted up front is the price paid** — no surprises, in writing.
- They understood **what was wrong in plain language** and didn't feel talked down to.
- They could **see the ETA and job progress** the whole time (no all-day "window").
- Net result: *"The light's off, I didn't lose my day, and I wasn't ripped off."*

### What would make them tell a colleague (the referral trigger)?
The word-of-mouth moment is **emotional relief, not features**. The reviews in the landing page name it exactly: *"There was a man in my driveway fixing my car while the kids ate cereal. The price on the quote was the price I paid."* They refer when the experience **beat their (low) expectation of the whole category** — specifically when (a) the final price exactly matched the quote, and (b) they lost zero time. The product must make those two outcomes *reliable and obvious* (e.g., a clear quote-vs-final confirmation, an easy in-app share/referral prompt right after a 5-star job).

---

## 3. Feature Specification

Priorities: **P0** = MVP-critical (cannot launch without) · **P1** = important (fast-follow) · **P2** = nice-to-have.
Each feature: user story → acceptance criteria → priority → technical notes/dependencies.

### 3.1 Account & Authentication

**F-1. Phone-based signup/login (P0)**
- *As a customer, I want to sign up and log in with my phone number so that I can book without creating a complex account.*
- **Acceptance criteria:**
  - User enters phone → receives OTP via SMS → verifying creates/authenticates the account.
  - Returning users log in with the same flow; session persists across app restarts.
  - Basic profile (name) captured on first booking if missing.
  - Failed/expired OTP shows a clear retry path; rate-limited to prevent abuse.
- **Tech notes:** Supabase Auth phone OTP; SMS delivery via Twilio; sessions via Supabase JWT. Depends on **Twilio A2P 10DLC registration** (start early — days of lead time).

**F-2. Role-based access (customer / technician / admin) (P0)**
- *As the platform, I want each user scoped to a role and organization so that people only see data they're allowed to.*
- **Acceptance criteria:** a user's role determines app surface and data visibility; a technician sees only their assigned jobs; a customer sees only their own vehicles/appointments; admin sees the whole org.
- **Tech notes:** `profiles.role` + `organization_id` + Postgres **RLS** policies. Validate with Supabase advisors.

### 3.2 Booking & Quoting

**F-3. Upfront fixed-price quote estimator (P0)**
- *As a customer, I want to see an honest price range before booking so that I trust there won't be surprises.*
- **Acceptance criteria:**
  - Customer selects service type, vehicle type/details, and service area → sees a price **range** (e.g., `$99–$139`) and estimated time saved vs. a shop visit.
  - The range is deterministic from a configurable pricing table (service × vehicle_class × area).
  - Copy states the final price is confirmed before work begins.
- **Tech notes:** pricing rules in DB (`pricing_rules`); computed in an Edge Function (server-authoritative, never trust client math). Mirrors the landing-page estimator.

**F-4. Book an appointment with time-slot selection (P0)**
- *As a customer, I want to pick a date/time (including evenings/weekends) so that service fits my life.*
- **Acceptance criteria:**
  - Customer selects vehicle, service, address (validated in service area), and an available time slot.
  - Only slots with available technician capacity are shown; double-booking is prevented.
  - Booking creates an `appointment` in `requested`/`confirmed` state and sends an SMS confirmation.
  - Address outside any active service area is rejected with a helpful message + "notify me when you cover my area."
- **Tech notes:** availability logic in Edge Function; **PostGIS** point-in-polygon to validate address against `service_areas`. Depends on F-3, F-9.

**F-5. Service-area ZIP/address check (P0)**
- *As a customer, I want to check if you serve my area before investing time so that I don't fill out a form for nothing.*
- **Acceptance criteria:** entering a ZIP or address returns in-area / out-of-area instantly; out-of-area optionally captures an email for waitlist.
- **Tech notes:** PostGIS `ST_Contains` against `service_areas.geom`.

**F-6. Manage vehicles (P1)**
- *As a customer, I want to save my vehicle(s) so that I don't re-enter details each booking.*
- **Acceptance criteria:** add/edit/remove vehicles (year/make/model); saved vehicles selectable at booking.
- **Tech notes:** `vehicles` table scoped to customer. P1 because MVP can capture vehicle inline on first booking (F-4).

### 3.3 Live Job Experience

**F-7. Live status & ETA tracking (P0)**
- *As a customer, I want to see when the mechanic will arrive and watch job progress so that I'm not stuck waiting all day.*
- **Acceptance criteria:**
  - After confirmation, customer sees status: `On the way → Diagnosing → Fixing → Complete (light's off)`.
  - When the technician is en route, customer sees live location + ETA on a map.
  - Status changes push a notification.
- **Tech notes:** technician app writes location via `expo-location`; **Supabase Realtime** broadcasts to the customer app; Mapbox renders map + ETA. Cost control: throttle location writes (e.g., every 10–15s while en route only). Highest-risk feature technically.

**F-8. Technician job app — accept & update jobs (P0)**
- *As a technician, I want to see my assigned jobs and update status/location so that the customer stays informed and I get paid.*
- **Acceptance criteria:**
  - Technician sees today's assigned jobs with address, service, vehicle, and customer contact.
  - One-tap status transitions (`en_route`, `arrived`, `diagnosing`, `fixing`, `completed`).
  - Background location sharing toggles on when `en_route`, off at `completed`.
  - Technician can enter the **final price** and mark payment due (must be ≤ agreed quote unless an admin-approved change order exists — see F-11).
- **Tech notes:** Expo background location + permissions handling (device-tested). RLS: technician can read/write only their `jobs`.

### 3.4 Payments

**F-9. In-app payment (P0)**
- *As a customer, I want to pay in the app at the quoted price so that the transaction is as frictionless as the service.*
- **Acceptance criteria:**
  - Customer pays via saved/entered card; receipt issued.
  - Charged amount equals the confirmed price; any change requires explicit customer approval (F-11).
  - Payment status reflected in customer and admin views; failed payments handled gracefully.
- **Tech notes:** Stripe PaymentIntents created server-side (Edge Function); client confirms with Stripe SDK; **Stripe webhooks → Edge Function → `payments`** (idempotent, signature-verified). PCI handled by Stripe (no raw card data touches our servers).

**F-10. Diagnostic fee & fee-toward-repair logic (P1)**
- *As the business, I want to charge a diagnostic fee that applies toward the repair if the customer proceeds so that we're paid for showing up.*
- **Acceptance criteria:** `$89` diagnostic fee configurable; credited to the repair total if the customer approves the repair.
- **Tech notes:** pricing/credit logic in Edge Function; reflected on the receipt.

**F-11. Change-order approval (P1)**
- *As a customer, I want to explicitly approve any price change before extra work so that "the quote is the price" stays true.*
- **Acceptance criteria:** any final price above the confirmed quote requires an in-app customer approval step before charge; declined change → job closes at original scope/price.
- **Tech notes:** `change_orders` table linked to `job`; blocks charge until `approved`.

### 3.5 Trust, Retention & Growth

**F-12. Post-job rating & review (P1)**
- *As a customer, I want to rate the job so that good mechanics are recognized and I feel heard.*
- **Acceptance criteria:** after `completed`, customer prompted for a 1–5 rating + optional text; visible to admin; 5-star ratings trigger a referral/share prompt.
- **Tech notes:** `reviews` table linked to `job`.

**F-13. Notifications (SMS + push) (P0)**
- *As a customer, I want timely updates (confirmation, en-route, complete, receipt) so that I never have to chase information.*
- **Acceptance criteria:** SMS for booking confirmation and receipt; push for status transitions; user can opt out of non-essential messages.
- **Tech notes:** Twilio (SMS) + Expo push. Essential transactional messages separated from marketing (compliance).

**F-14. Membership plan (Family Maintenance Plan) (P2)**
- *As a frequent customer, I want a monthly membership so that I get priority booking and member pricing.*
- **Acceptance criteria:** `$29/mo` subscription; member benefits (priority slots, member pricing) applied at booking.
- **Tech notes:** Stripe Subscriptions; `memberships` table. P2 — retention lever, not needed to validate core demand.

**F-15. Referral prompt (P2)**
- *As a happy customer, I want to easily share the service so that my friends benefit (and I might too).*
- **Acceptance criteria:** shareable link/code surfaced after a positive job.
- **Tech notes:** simple attribution; deep link. P2.

### 3.6 Admin / Operations

**F-16. Admin console — schedule & dispatch (P0)**
- *As an operator, I want to see incoming bookings and assign technicians so that the day runs smoothly.*
- **Acceptance criteria:** list/calendar of appointments; assign a technician to an appointment (creating a `job`); see live job statuses; manual reassignment.
- **Tech notes:** Next.js web app; org-scoped. MVP dispatch is **manual** (auto-optimization is out of scope — §7).

**F-17. Admin — manage pricing, service areas, technicians (P1)**
- *As an operator, I want to configure prices, coverage areas, and technician roster so that the business is self-serviceable.*
- **Acceptance criteria:** CRUD for `pricing_rules`, `service_areas`, `technicians`.
- **Tech notes:** admin-only RLS; PostGIS polygon editing for areas (can start with predefined polygons).

---

## 4. Database Schema

**Engine:** PostgreSQL (Supabase) with **PostGIS**. All timestamps `timestamptz` (UTC). All IDs `uuid` (default `gen_random_uuid()`). Money stored as integer **cents** (`bigint`) to avoid float errors, plus a `currency` char(3) default `'USD'`.

### 4.1 Multi-tenancy architecture
- **Model:** shared-database, shared-schema, **row-level tenancy**. Every tenant-owned table carries a non-null `organization_id uuid REFERENCES organizations(id)`.
- **Isolation:** enforced by **Postgres RLS**. The user's `organization_id` and `role` are resolved from their `profiles` row (and/or JWT claims); RLS policies restrict every query to the caller's org. Cross-org access is impossible at the database layer, not just the app layer.
- **Why row-level (not schema-per-tenant or db-per-tenant):** at MVP-to-early-growth scale, row-level tenancy is simplest to operate, cheapest, and migrates cleanly; schema/db-per-tenant is premature. Revisit only at large scale or hard compliance-isolation requirements.
- **The customer↔org relationship:** a `profiles` row belongs to exactly one org in MVP. (A future world where one consumer books across multiple orgs is a v2 concern — noted in §7.)

### 4.2 Entity-relationship overview
```
organizations 1───∞ profiles            (users: customer | technician | admin)
organizations 1───∞ service_areas        (PostGIS polygons)
organizations 1───∞ pricing_rules
organizations 1───∞ technicians ─1:1─ profiles(role=technician)
profiles(customer) 1───∞ vehicles
profiles(customer) 1───∞ appointments ─∞:1 vehicles
                                       ─∞:1 service_areas
                                       ─∞:1 pricing_rules (quoted)
appointments 1───1 jobs ─∞:1 technicians
jobs 1───∞ change_orders
jobs 1───1 payments
jobs 1───1 reviews
profiles(customer) 1───0..1 memberships
```

### 4.3 Tables

**organizations**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | |
| slug | text UNIQUE NOT NULL | url-safe |
| phone | text | public contact |
| status | text NOT NULL DEFAULT 'active' | enum: active, suspended |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**profiles** (extends `auth.users`; `id` = auth user id)
| field | type | notes |
|---|---|---|
| id | uuid PK → auth.users(id) | |
| organization_id | uuid NOT NULL → organizations | tenant scope |
| role | text NOT NULL | enum: customer, technician, admin |
| full_name | text | |
| phone | text NOT NULL | E.164 |
| email | text | optional |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**vehicles**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| customer_id | uuid NOT NULL → profiles | |
| year | smallint | CHECK 1980–(current+1) |
| make | text | |
| model | text | |
| vehicle_class | text NOT NULL | enum: sedan, suv_crossover, truck, van (drives pricing) |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**service_areas**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| name | text NOT NULL | e.g., "Port St. Lucie" |
| geom | geography(Polygon,4326) NOT NULL | PostGIS coverage polygon |
| active | boolean NOT NULL DEFAULT true | |

**pricing_rules**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| service_type | text NOT NULL | enum: diagnostic, brakes, oil_maintenance, battery, ac, other |
| vehicle_class | text NOT NULL | matches vehicles.vehicle_class |
| price_low_cents | bigint NOT NULL | CHECK ≥ 0 |
| price_high_cents | bigint NOT NULL | CHECK ≥ price_low_cents |
| active | boolean NOT NULL DEFAULT true | |
| UNIQUE(organization_id, service_type, vehicle_class) where active | | |

**technicians** (1:1 with a `profiles` row of role=technician)
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| profile_id | uuid NOT NULL UNIQUE → profiles | |
| status | text NOT NULL DEFAULT 'offline' | enum: offline, available, on_job |
| last_location | geography(Point,4326) | latest GPS ping |
| last_location_at | timestamptz | |
| license_verified | boolean NOT NULL DEFAULT false | |

**appointments**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| customer_id | uuid NOT NULL → profiles | |
| vehicle_id | uuid → vehicles | nullable if captured inline |
| service_type | text NOT NULL | |
| service_area_id | uuid → service_areas | resolved from address |
| address_line | text NOT NULL | |
| location | geography(Point,4326) NOT NULL | geocoded |
| scheduled_start | timestamptz NOT NULL | |
| scheduled_end | timestamptz | |
| quote_low_cents | bigint NOT NULL | snapshot at booking |
| quote_high_cents | bigint NOT NULL | |
| status | text NOT NULL DEFAULT 'requested' | enum: requested, confirmed, cancelled, completed |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**jobs**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| appointment_id | uuid NOT NULL UNIQUE → appointments | |
| technician_id | uuid → technicians | assigned by admin/dispatch |
| status | text NOT NULL DEFAULT 'assigned' | enum: assigned, en_route, arrived, diagnosing, fixing, completed, cancelled |
| confirmed_price_cents | bigint | final agreed price |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**change_orders**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| job_id | uuid NOT NULL → jobs | |
| reason | text NOT NULL | |
| additional_cents | bigint NOT NULL | CHECK ≥ 0 |
| status | text NOT NULL DEFAULT 'pending' | enum: pending, approved, declined |
| approved_at | timestamptz | |

**payments**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| job_id | uuid NOT NULL UNIQUE → jobs | |
| stripe_payment_intent_id | text UNIQUE | |
| amount_cents | bigint NOT NULL | |
| currency | char(3) NOT NULL DEFAULT 'USD' | |
| status | text NOT NULL DEFAULT 'pending' | enum: pending, succeeded, failed, refunded |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**reviews**
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| job_id | uuid NOT NULL UNIQUE → jobs | |
| customer_id | uuid NOT NULL → profiles | |
| rating | smallint NOT NULL | CHECK 1–5 |
| body | text | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

**memberships** (P2)
| field | type | notes |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid NOT NULL → organizations | |
| customer_id | uuid NOT NULL UNIQUE → profiles | |
| stripe_subscription_id | text UNIQUE | |
| status | text NOT NULL | enum: active, past_due, cancelled |
| started_at | timestamptz NOT NULL DEFAULT now() | |

### 4.4 Indexing strategy (for common queries)
- **Every `organization_id`** → B-tree index (every query is org-scoped; this is the hottest filter).
- `appointments (organization_id, scheduled_start)` → admin day/calendar view + slot availability.
- `appointments (customer_id, created_at DESC)` → customer's booking history.
- `jobs (technician_id, status)` → technician's active/assigned jobs.
- `jobs (organization_id, status)` → admin live-ops board.
- `service_areas USING GIST (geom)` → PostGIS point-in-polygon (area check).
- `technicians USING GIST (last_location)` → nearest-technician queries.
- `pricing_rules (organization_id, service_type, vehicle_class)` → quote lookup (also the uniqueness constraint).
- `payments (stripe_payment_intent_id)` and `payments (job_id)` → webhook reconciliation.

### 4.5 Data validation rules
- **Enforced in DB** (not just app): enum `CHECK` constraints on all status/type fields; `price_high ≥ price_low`; `rating BETWEEN 1 AND 5`; money `≥ 0`; `phone` E.164 format (app-validated, stored canonical).
- **Referential integrity:** FKs with sensible `ON DELETE` (e.g., restrict deleting an org with data; cascade child rows only where safe). Payments/jobs are **never hard-deleted** (financial records) — use status, not deletion.
- **Business invariants (Edge Functions):** an appointment's address must fall inside an active `service_area` of its org; `confirmed_price_cents` may exceed `quote_high_cents` only if an `approved` `change_order` exists; a slot is bookable only if technician capacity exists.
- **Server-authoritative pricing:** quotes/prices are always recomputed server-side from `pricing_rules`; the client value is display-only and never trusted for charging.

---

## 5. API Specification

**Style:** two layers — (a) **auto-generated REST via PostgREST** for standard reads/simple writes (RLS-secured), and (b) **Edge Function endpoints** for anything involving secrets, third parties, or business invariants. All examples below describe the **logical contract**; JSON bodies use camelCase, money in cents.

**Auth:** all endpoints require a Supabase JWT (`Authorization: Bearer <token>`) **except** F-5 area check and F-3 quote, which may be called anonymously (public). Every authenticated call is additionally constrained by RLS to the caller's org and role.

### 5.1 Public / pre-auth
| Endpoint | Method | Auth | Purpose | Request → Response |
|---|---|---|---|---|
| `/functions/v1/check-area` | POST | none | F-5 service-area check | `{ zip? , address? }` → `{ inArea: bool, serviceAreaId?, serviceAreaName? }` |
| `/functions/v1/quote` | POST | none | F-3 price estimate | `{ serviceType, vehicleClass, serviceAreaId }` → `{ priceLowCents, priceHighCents, estTimeSavedHours }` |

### 5.2 Auth
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/auth/v1/otp` | POST | none | F-1 request OTP (Supabase Auth) → `{ phone }` |
| `/auth/v1/verify` | POST | none | F-1 verify OTP → session `{ accessToken, refreshToken }` |
| `/rest/v1/profiles?id=eq.me` | GET/PATCH | customer/tech/admin | read/update own profile (RLS) |

### 5.3 Customer
| Endpoint | Method | Auth | Purpose | Notes |
|---|---|---|---|---|
| `/rest/v1/vehicles` | GET/POST/PATCH/DELETE | customer | F-6 manage vehicles | RLS: own rows only |
| `/functions/v1/appointments` | POST | customer | F-4 create booking | Validates area (PostGIS), capacity, recomputes quote; returns `{ appointmentId, status, quoteLowCents, quoteHighCents }` |
| `/rest/v1/appointments?customer_id=eq.me` | GET | customer | booking history/status | RLS |
| `/functions/v1/appointments/:id/cancel` | POST | customer | cancel a booking | state-machine guarded |
| `/functions/v1/jobs/:id/track` | GET (or Realtime sub) | customer | F-7 live status + technician location | Prefer **Realtime subscription** over polling |
| `/functions/v1/payments/intent` | POST | customer | F-9 create PaymentIntent for a job | returns `{ clientSecret }` |
| `/functions/v1/change-orders/:id/respond` | POST | customer | F-11 approve/decline change | `{ decision: 'approved'|'declined' }` |
| `/rest/v1/reviews` | POST | customer | F-12 submit review | RLS: only for own completed job |

### 5.4 Technician
| Endpoint | Method | Auth | Purpose | Notes |
|---|---|---|---|---|
| `/rest/v1/jobs?technician_id=eq.me` | GET | technician | F-8 my jobs | RLS: assigned only |
| `/functions/v1/jobs/:id/status` | POST | technician | F-8 update status | validates allowed transitions |
| `/functions/v1/technicians/me/location` | POST | technician | F-7 push GPS ping | throttled; writes `last_location` + broadcasts Realtime |
| `/functions/v1/jobs/:id/final-price` | POST | technician | F-8 set final price | must be ≤ quote unless approved change_order |
| `/functions/v1/change-orders` | POST | technician | F-11 raise change order | creates `pending` order |

### 5.5 Admin
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/rest/v1/appointments` | GET | admin | F-16 all org appointments (calendar) |
| `/functions/v1/jobs/assign` | POST | admin | F-16 assign technician → creates/updates `job` |
| `/rest/v1/pricing_rules` | GET/POST/PATCH | admin | F-17 manage pricing |
| `/rest/v1/service_areas` | GET/POST/PATCH | admin | F-17 manage coverage |
| `/rest/v1/technicians` | GET/POST/PATCH | admin | F-17 manage roster |

### 5.6 Webhooks
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/functions/v1/webhooks/stripe` | POST | Stripe signature | F-9 payment events → update `payments`/`jobs`; **idempotent**, signature-verified |
| `/functions/v1/webhooks/stripe-subscriptions` | POST | Stripe signature | F-14 membership lifecycle (P2) |

### 5.7 Rate limiting considerations
- **Public endpoints (`check-area`, `quote`)** are the abuse surface → rate-limit by IP (e.g., 30/min) at the edge; keep responses cheap/cacheable.
- **OTP request** → strict per-phone + per-IP limits (e.g., 5/hour/phone) to prevent SMS-bombing and cost blowouts; Supabase Auth provides baseline limits — tune them.
- **Technician location pings** → server enforces a minimum interval (e.g., ≥10s) regardless of client; protects DB write load and Mapbox cost.
- **Payments/webhooks** → idempotency keys; never rate-limit legitimate Stripe webhook retries (respond 2xx fast, process async).
- **General:** all authenticated traffic is org-scoped; add a coarse per-user limit to catch runaway clients. (Add **Upstash Redis** only if/when edge-native limits prove insufficient.)

---

## 6. Non-Functional Requirements

### 6.1 Performance targets
- Quote and area-check responses: **P95 < 500 ms**.
- Booking creation: **P95 < 1.5 s** end-to-end.
- Live-location update latency (technician ping → visible to customer): **< 5 s**.
- App cold start to interactive: **< 3 s** on a mid-range device.
- Support **~100 concurrent active jobs** at launch scale without degradation (well within Supabase Pro; monitor Realtime connection caps).

### 6.2 Security requirements
- **RLS on every tenant table**; deny-by-default policies; verified via Supabase advisors before launch.
- **No card data on our servers** — Stripe handles PCI; we store only Stripe references.
- **Secrets** (Stripe, Twilio, Mapbox server keys) only in Edge Function env, never in client bundles; clients use publishable/restricted keys only.
- **Stripe webhooks** signature-verified and idempotent.
- **PII minimization:** store only what's needed (name, phone, address, vehicle); never place PII in URLs/query strings; encrypt at rest (Supabase default) and in transit (TLS).
- **OTP/SMS abuse protection** (see §5.7); auth sessions expire and refresh.
- **Audit-friendly:** financial records (`payments`, `jobs`) are append/patch-only, never hard-deleted.
- **MCP hygiene:** MCP servers touching data use restricted/read-only keys scoped to dev/staging; no write-enabled MCP against prod without review.

### 6.3 Accessibility standards
- Target **WCAG 2.1 AA**: color contrast ≥ 4.5:1 (the landing page's green/dark palette must be checked), full screen-reader labels (VoiceOver/TalkBack) on all interactive elements, minimum 44×44pt touch targets, dynamic-type/font-scaling support, no color-only status signaling (pair the status colors with text/icons).
- Forms have clear labels, error messages, and focus order.

### 6.4 Mobile responsiveness requirements
- Native apps (Expo) are the primary customer/tech surface — support current iOS and Android (last 2 major OS versions), phones first; graceful on tablets.
- The **web** marketing + admin (Next.js) must be fully responsive (mobile → desktop), with the admin console usable on a laptop as the primary ops device.
- Live map/tracking usable one-handed; offline/poor-connectivity states handled with clear messaging (technician app must tolerate intermittent signal and resync).

---

## 7. Out of Scope (MVP) & v2 Considerations

### Explicitly NOT building in MVP
- **Automated dispatch / route optimization** — assignment is **manual** in the admin console. (Algorithmic dispatch is a scale problem, not a launch problem.)
- **Multi-organization onboarding/admin** — the schema is multi-tenant, but there is **no self-serve org signup, billing, or org-management UI**. MVP runs a single org.
- **Native iOS/Android parts inventory / supply-chain management.**
- **In-app chat** between customer and technician (use phone/SMS via the existing numbers for MVP).
- **Membership plan (F-14) and referral system (F-15)** — designed for but deferred (P2); not required to validate core demand.
- **Loaner-vehicle / car-pickup ("valet") logistics** — the alternate business model from the viability analysis is **not** in MVP; MVP is mobile-mechanic only.
- **Advanced analytics dashboards, financial reporting, payroll/technician payout automation.**
- **Multi-language UI** (English only at launch; Spanish is a strong fast-follow given the South Florida market — flagged for v2).

### v2 / future considerations
- Automated dispatch & ETA optimization (possible Python service).
- Self-serve **multi-org SaaS / franchise** onboarding and per-org billing.
- Spanish localization.
- Membership, referrals, loyalty.
- Car pickup/valet option as an add-on service line.
- Technician payout automation (Stripe Connect).
- Predictive-maintenance reminders using vehicle/telematics data.

---

## 8. Success Metrics

**North-star metric:** **Completed jobs per week** (real demand made real). Everything else supports it.

### Guardrail / trust metrics (these protect the value prop)
- **Quote accuracy:** % of jobs where final price = quoted price (target **≥ 95%**). This is the promise; if it slips, the business breaks regardless of volume.
- **On-time arrival:** % of jobs where technician arrives within the promised window (target **≥ 90%**).
- **CSAT / rating:** average post-job rating (target **≥ 4.7 / 5**).

### Funnel metrics
- Area-check → quote → booking → completed-job conversion at each step.
- Booking abandonment rate.

### Targets by horizon
| Metric | Launch week | Month 1 | Month 3 |
|---|---|---|---|
| Completed jobs | **5–10** (prove the loop end-to-end) | **40–60** | **150+** |
| Quote-accuracy rate | ≥ 95% | ≥ 95% | ≥ 97% |
| Avg. rating | ≥ 4.5 | ≥ 4.7 | ≥ 4.7 |
| On-time arrival | ≥ 85% | ≥ 90% | ≥ 90% |
| Repeat/return-visit rate | — | ≥ 15% | **≥ 25%** (landing page claims "9 in 10 rebook" — treat as aspiration, measure reality) |
| Referral share (post-job) | track only | ≥ 10% of 5-star jobs share | ≥ 20% |
| **Unit economics (critical)** | measure cost/job by hand | **positive contribution margin per job** | positive margin **and** improving with route density |

> **Tie-back to viability:** the launch-week target is deliberately tiny (5–10 jobs). The point of MVP is not scale — it's to prove, with real money, that (a) people book, (b) a job is profitable, and (c) the quote-accuracy promise holds. Those three, not app polish, are the go/no-go signals from the viability analysis.

---

## Appendix: Build sequence implied by priorities
1. **Foundations:** org/profiles/auth (F-1, F-2), schema + RLS, service areas (F-5).
2. **Core loop:** quote (F-3) → book (F-4) → assign (F-16) → technician status/location (F-8) → live tracking (F-7) → pay (F-9) → notifications (F-13).
3. **Trust & ops:** change orders (F-11), reviews (F-12), admin pricing/areas/roster (F-17), vehicles (F-6), diagnostic-fee logic (F-10).
4. **Growth (post-validation):** membership (F-14), referrals (F-15).

This sequence delivers the **end-to-end money-making loop first** (steps 1–2), which is exactly what must be validated before further investment.
