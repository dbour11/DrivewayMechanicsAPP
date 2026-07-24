# Driveway Mechanics

> On-demand **mobile auto repair** — a licensed mechanic drives to the customer's home and fixes the car in their driveway. Upfront fixed-price quoting, live technician tracking, and in-app payment, across South Florida (Miami · West Palm Beach · Port St. Lucie).

**Value proposition:** *See your exact price before we touch your car, and never lose a day at the shop.*

---

## Status

🟡 **Pre-build / planning complete.** No application code yet — this repository currently holds the research, product spec, and project configuration. The next step is scaffolding the monorepo and the first vertical slice (auth → quote → book).

## Planning docs

Start here — the [`research/`](./research) folder is the source of truth for what we're building:

| Doc | What's in it |
|---|---|
| [Viability analysis](./research/viability-analysis.md) | Market/competitive analysis, unit-economics reality, go/no-go |
| [Tech stack](./research/tech-stack.md) | Stack decision, costs, MCP servers |
| [PRD](./research/PRD.md) | Product requirements: features, DB schema, API spec, success metrics |
| [Skills inventory](./research/skills.md) | Buildable capabilities mapped to the PRD |
| [Agent architecture](./research/agents.md) | Subagent design for building the app |
| [CLAUDE.md](./.claude/CLAUDE.md) | Persistent project context & conventions |

## Planned tech stack

- **Mobile (customer + technician):** Expo / React Native · Expo Router · NativeWind
- **Web (marketing + admin):** Next.js (App Router) on Vercel
- **Backend / DB / Auth / Realtime / Storage / Functions:** Supabase (PostgreSQL + PostGIS, Edge Functions in TypeScript)
- **Integrations:** Stripe (payments) · Twilio (SMS/OTP) · Mapbox (maps/routing/ETA)
- **Language:** TypeScript end-to-end

See [tech-stack.md](./research/tech-stack.md) for the full rationale.

## Getting started

> The app isn't scaffolded yet. For now:

```bash
git clone https://github.com/dbour11/DrivewayMechanicsAPP.git
cd DrivewayMechanicsAPP
cp .env.example .env.local   # then fill in your secrets (never commit .env.local)
```

Environment variables are documented in [`.env.example`](./.env.example) and [CLAUDE.md](./.claude/CLAUDE.md) §6. Only public values (Supabase URL + publishable key) are committed; all secrets stay local.

## Service area

Miami · West Palm Beach · Port St. Lucie (South Florida)

---

Developed by **Davidson B.**
