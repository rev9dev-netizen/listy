# Listy Architecture & Technical Overview

## 1. Executive Summary

Listy is an AI-powered Amazon listing optimization platform built with Next.js (App Router) and TypeScript. It enables sellers to:

- Generate and classify keywords from competitor ASINs and seed phrases
- Build optimized product listing drafts (title, bullets, description) using OpenAI
- Validate listings for compliance (length, policy, keyword stuffing)
- Export listings in multiple formats (Amazon text, CSV, JSON)
- Manage multiple projects with per-project constraints

The current implementation includes a functional UI with rich client-side interactions, mock data generation for several analytical features, and server-side API endpoints handling authentication (via Clerk), persistence (via Prisma/PostgreSQL), caching (Upstash Redis), and AI calls (OpenAI). Some areas are scaffolded or mocked (e.g., real Amazon SP-API ingestion, full Prisma client, advanced AI keyword filtering) and marked for future enhancement.

## 2. Technology Stack

| Layer            | Technology |
|------------------|------------|
| Framework        | Next.js 16 (App Router) |
| Language         | TypeScript (strict) |
| UI               | Radix UI primitives + custom Shadcn-style components |
| Styling          | Tailwind CSS v4 (PostCSS plugin) |
| Auth             | Clerk (@clerk/nextjs) |
| Data ORM         | Prisma (PostgreSQL datasource) |
| Cache            | Upstash Redis REST API (@upstash/redis) |
| AI               | OpenAI API (chat completions, gpt-4o) |
| State Mgmt (data)| React Query (@tanstack/react-query) |
| Validation/Schema| Zod (planned / minimal in current code) |
| Tooling          | ESLint (Next presets), TypeScript, PostCSS |

## 3. High-Level Architecture

```text
Browser (React + Next.js Pages/Components)
   ↕ fetch / mutations
Next.js API Route Handlers (app/api/*)
   - Auth enforced via Clerk middleware
   - Perform business logic via services
Services Layer (lib/services/*)
   - Keyword Pipeline (extraction, scoring, clustering, classification)
   - Listing Generation & Validation (OpenAI + rule-based checks)
   - Export formatting
Data Layer
   - Prisma Models (PostgreSQL)
   - Redis Caching (keyword expansion, listing drafts)
External Integrations
   - OpenAI (content & keyword expansion)
   - Clerk (Identity)
   - Upstash Redis (Cache)
   - Future: Amazon SP-API (competitive data ingestion)
```

## 4. Domain Concepts & Data Models

### User

Represents an authenticated seller (mapped from Clerk). Fields: plan, email, etc.

### Project

Grouping construct for listing work (keywords, drafts, constraints). Includes marketplace, brand, productType.

### Ingest (future-ready)

Stores raw JSON from competitor ASIN retrieval (currently mocked).

### Keyword

Stores a generated keyword with score, clusterId, class (primary/secondary/tertiary), source (competitor/seed), and inclusion flag.

### Draft

Versioned listing draft (title, bullets[], description, backendTerms?). Each generation increments version.

### Constraint

Per-project limits for title, bullet, description length, disallowed terms, locale. Enforced in generation & validation.

Prisma schema (simplified):

```text
User 1─* Project 1─* Keyword
                 1─* Draft
                 1─* Ingest
                 1─1 Constraint
```

## 5. Services Layer Details

### Keyword Service

Pipeline Steps:

1. Competitor ASIN analysis (mock) → RawKeywordData[] with term, frequency, position.
2. Seed expansion (OpenAI) → 30 long-tail variations (cached 24h).
3. Scoring (frequency, position, length weighting).
4. Clustering (trigram similarity, threshold 0.5) → cluster avg score.
5. Classification (percentile split: top 20% primary, next 30% secondary, rest tertiary).

Caching: Redis used for seed expansions and ASIN analyses.

### Listing Service

1. Constructs multi-role prompt (system/developer/user) enforcing formatting & compliance.
2. Calls OpenAI with response_format=json_object to get structured listing.
3. Post-process trimming per limits; stores draft if projectId supplied.
4. Validation (length checks, keyword stuffing (max 2 occurrences), disallowed terms, policy patterns (medical/FDA/caps)).
5. Auto-fix utilities (truncate at word/period boundaries, remove disallowed terms).
6. Keyword usage metrics (regex-based counting).

Caching: Listing drafts keyed by serialized request (1h TTL).

## 6. API Endpoints

| Route | Method | Purpose | Auth | Query Params | Body | Response |
|-------|--------|---------|------|--------------|------|----------|
| /api/projects | POST | Create project & default constraints | Required | — | { marketplace, brand?, productType? } | Project JSON |
| /api/projects | GET | List user projects | Required | — | — | { projects: Project[] } |
| /api/keywords/generate | POST | Generate keywords (seeds + ASINs) and optionally persist | Required | projectId? | KeywordGenerationRequest | { keywords } |
| /api/keywords/generate | GET | Retrieve stored keywords for project | Required | projectId | — | { keywords } |
| /api/listing/draft | POST | Generate listing draft, optionally version & persist | Required | projectId? | ListingDraftRequest | ListingDraft |
| /api/listing/draft | GET | Fetch latest draft for project | Required | projectId | — | ListingDraft |
| /api/listing/validate | POST | Validate a draft against request constraints | Required | — | { draft, request } | { valid, issues[] } |
| /api/listing/export | POST | Export listing in chosen format | Required | — | { format, listing, productData? } | { data, filename } |

All non-public routes are protected by `middleware.ts` using Clerk; public routes: `/`, auth pages, webhooks.

## 7. Authentication & Authorization

- Clerk middleware wraps all requests; `auth.protect()` blocks unauthenticated access except designated public paths.
- Endpoint-level ownership checks ensure `projectId` belongs to current user before mutating or reading sensitive data.

## 8. Caching Strategy

Redis (Upstash REST) caches:

- Expanded seed keywords: 24h TTL to avoid repeated OpenAI calls.
- Competitor ASIN mock analysis: 1h TTL.
- Listing drafts: 1h TTL per identical request payload.

Helper wrapper provides get/set/del/invalidatePattern. Pattern invalidation planned for future selective cache busting.

## 9. Front-End Architecture & UX

- App Router with layouts: `RootLayout` sets fonts & providers; `DashboardLayout` supplies navigation and theme toggle.
- Providers: ClerkProvider, ReactQueryProvider, ThemeProvider, Toaster.
- Feature Screens:
  - Home (marketing + CTA)
  - Dashboard (project stats & quick actions)
  - Keywords Page (two-stage flow: input → results with filtering, currently enriched with mock metrics)
  - Listing Builder (large interactive editor; keyword bank upload, manual additions, AI generation per section, scoring & best practices panel)
- State Management: React Query for async data (projects, keyword generation); local `useState` for complex draft-building interactions.
- Design System: Custom components wrap Radix primitives (button, dialog, tooltip, table, collapsible, etc.) plus utility helpers `cn`.

## 10. AI Prompt Engineering

Listing Generation:

- Multi-role separation for guardrails (system: policy & style, developer: strict formatting/limits, user: product specifics).
- JSON response enforced to simplify parsing.

Keyword Expansion:

- Focus: long-tail, natural phrases, product features, use cases.
- Output normalization (sanitization + dedupe) before scoring/clustering.

## 11. Validation & Compliance Logic

- Length enforcement both pre- and post-generation.
- Keyword stuffing heuristic: >2 occurrences triggers warning.
- Policy regex patterns catch medical/FDA terms & excessive capitalization.
- Auto-fix ensures drafts do not exceed character limits and removes disallowed terms.

## 12. Environment Variables (Expected)

```env
# Prisma (Supabase Postgres)
DATABASE_URL="postgresql://postgres.kdaercjabzvyagjcojif:<password>@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Supabase (public client)
NEXT_PUBLIC_SUPABASE_URL="https://kdaercjabzvyagjcojif.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"

OPENAI_API_KEY=sk-...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
CLERK_SECRET_KEY=...
CLERK_PUBLISHABLE_KEY=...
```

After setting envs:

- Install deps: pnpm install
- Generate Prisma client and run migrations:

```bash
pnpm dlx prisma generate
pnpm dlx prisma migrate deploy # or migrate dev during development
```

(Ensure all are set for production; Prisma currently uses a mock client until engines install.)

## 13. Build & Run Workflow

Development:

- `pnpm install`
- `pnpm dev` to start Next.js with App Router.
- Prisma: Migrate once real database connected (`npx prisma migrate dev`).

Testing (future): Add unit tests for services (keyword scoring, clustering, validation).

Lint: `pnpm lint` (ESLint config uses Next core-web-vitals + TS rules).

## 14. Deployment Considerations

- Likely target: Vercel (compatible with Next.js & Edge Middleware). Ensure environment variables configured.
- Redis (Upstash) is serverless-friendly.
- OpenAI calls should be monitored for cost; introduce rate limiting & retries.
- Replace mock Prisma client with real `new PrismaClient()` (remove temporary mock) after confirming engine availability.
- Consider moving heavy AI operations to Server Actions / Edge Functions if latency-sensitive.

## 15. Security & Privacy

- Auth mandatory for all data-modifying operations.
- Input validation minimal—should harden with Zod schemas for each API route.
- Avoid logging sensitive user inputs (current code only logs errors generically).
- Rate limiting not yet implemented (add Redis-based token bucket for AI & keyword endpoints).

## 16. Performance & Scalability

Current bottlenecks / opportunities:

- Keyword clustering is O(n^2); acceptable for modest lists (< a few thousand). For scale: adopt embedding-based clustering (OpenAI / local model) + dimensionality reduction.
- Listing scoring performed client-side; consider memoization or worker offload for very large keyword sets.
- CSV parsing naive; upgrade to streaming parser for huge files (e.g., `papaparse`).
- Cache invalidation coarse; add project-scoped key namespaces.

## 17. Planned / Missing Features (Roadmap)

- Real Amazon SP-API integration for ASIN ingestion (replace mock `analyzeCompetitorASIN`).
- Advanced AI keyword relevance filtering (Listing page TODO placeholder).
- Version comparison & diff between Drafts.
- Constraint editing UI per project.
- User plan enforcement (limits on projects, keyword generations, listings).
- Bulk keyword tagging & cluster visualization.
- Export direct to Amazon Seller Central via API ("Sync to Amazon" button currently stubbed).
- Unit & integration test suite (Jest / Vitest + Testing Library).
- Observability (structured logging, tracing, metrics dashboards).

## 18. Risks & Technical Debt

| Area | Current State | Risk | Mitigation |
|------|---------------|------|-----------|
| Prisma Client | Mock implementation | Runtime divergence | Install engines & enable real client, add migrations |
| Input Validation | Minimal | Invalid/unsafe input | Add Zod schemas & sanitize |
| AI Cost Control | No rate limits | Cost spikes | Add rate limiting & caching strategy review |
| Keyword Relevance | Heuristic & mock data | Lower quality suggestions | Introduce embeddings + semantic clustering |
| Security | No explicit rate limit | Abuse potential | Redis token bucket / Cloudflare WAF |

## 19. How to Contribute / Extend

1. Replace mock Prisma client: create `lib/prisma.ts` with real `PrismaClient` instance + pooling logic.
2. Add Zod request schemas in each API route: parse & return 400 on failure.
3. Implement Amazon SP-API ingestion: create `lib/services/ingest-service.ts` with product detail retrieval and keyword extraction from bullet points/descriptions.
4. Add tests: `__tests__/keyword-service.test.ts` for scoring & clustering; `listing-service.test.ts` for validation logic.
5. Introduce background job queue (e.g., Using Vercel Cron or separate worker) for long-running AI tasks.

## 20. Quick Start (Developer)

1. Copy `.env.example` (create it) and populate required environment variables.
2. `pnpm install`
3. Ensure PostgreSQL accessible and set `DATABASE_URL`.
4. Run `npx prisma migrate dev`.
5. Start dev server: `pnpm dev`.
6. Sign up via UI; create a project; generate keywords; build a listing.

## 21. Glossary

- ASIN: Amazon Standard Identification Number.
- Draft: Generated Amazon listing content pending validation/export.
- Cluster: Group of semantically similar keywords.
- Constraint: Character limits & disallowed terms per project.

## 22. Appendix: Improvement Ideas

- Embed-based similarity using cosine distance for more robust clustering.
- Real-time collaborative editing (WebSocket / Liveblocks).
- Accessibility audit & ARIA improvements for complex interactive tables.
- Dark mode theming enhancements for high-contrast compliance.

---
Last Updated: 2025-11-10
