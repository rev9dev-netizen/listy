# Copilot Instructions for Listy

## Project Overview
- Listy is an AI-powered Amazon listing optimization platform built with Next.js (App Router), TypeScript, Prisma (PostgreSQL), and OpenAI.
- Major features: keyword generation/classification, AI-powered listing builder, compliance validation, and project/draft management.
- Key directories: 
  - `app/` (Next.js App Router, API routes, UI)
  - `lib/services/` (keyword and listing logic, OpenAI integration)
  - `lib/types.ts` (core types)
  - `prisma/schema.prisma` (data model)

## Architecture & Data Flow
- UI (React/Next.js) calls API routes in `app/api/*`, which use service functions from `lib/services/*`.
- Authentication is enforced via Clerk middleware (`middleware.ts`).
- Data is persisted with Prisma/PostgreSQL; caching via Upstash Redis.
- AI listing/keyword generation uses OpenAI (multi-role prompt, JSON output enforced).
- Drafts and keywords are versioned and linked to projects/users.

## Key Patterns & Conventions
- **Keyword pipeline:** Extraction, scoring, clustering, and classification (see `keyword-service.ts`).
- **Listing builder:** Multi-step prompt (system/developer/user), strict format, post-process validation (see `listing-service.ts`).
- **Validation:** Length, stuffing, policy regex, and auto-fix utilities. Use `validateListing` and `autoFixListing`.
- **Scoring:** Use `advancedListingScore` for listing quality (see `listing-service.ts`).
- **API:** All non-public routes require Clerk auth; ownership checks on sensitive data.
- **State:** React Query for async data, local state for UI interactions.
- **UI:** Custom Shadcn-style components, Tailwind CSS, Radix UI primitives.

## Developer Workflow
- Install: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Prisma: `pnpm dlx prisma generate` and `pnpm dlx prisma migrate dev`
- Environment: Set all required env vars (see `README.md`)

## Integration Points
- OpenAI: Used for both keyword expansion and listing generation (see `lib/services/`)
- Redis: Used for caching keyword expansions and listing drafts
- Clerk: Used for authentication and user management
- Amazon/SerpApi: For ASIN import (see fetch mode in listing creation)

## Examples
- To add a new validation rule, update `validateListing` in `listing-service.ts`.
- To change listing scoring, edit `advancedListingScore` in `listing-service.ts`.
- To add a new API endpoint, create a handler in `app/api/` and use service functions from `lib/services/`.

## Special Notes
- All business logic should be in `lib/services/`, not in API handlers or UI.
- Drafts are versioned; always increment version on major changes.
- Use strict types from `lib/types.ts` for all data models and API contracts.

Refer to `README.md` for more details on architecture, environment, and workflows.
