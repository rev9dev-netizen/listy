# Listy - AI-Powered Amazon Listing & PPC Management Platform

> **For AI Assistants:** This README is optimized for AI comprehension. It provides complete architectural context, detailed feature documentation, and clear navigation of the codebase.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Core Features](#4-core-features)
5. [Database Schema](#5-database-schema)
6. [Service Layer Documentation](#6-service-layer-documentation)
7. [API Documentation](#7-api-documentation)
8. [Frontend Architecture](#8-frontend-architecture)
9. [AI Integration](#9-ai-integration)
10. [Data Providers](#10-data-providers)
11. [Authentication & Security](#11-authentication--security)
12. [Caching Strategy](#12-caching-strategy)
13. [Environment Configuration](#13-environment-configuration)
14. [Development Workflow](#14-development-workflow)
15. [Deployment](#15-deployment)
16. [File Structure](#16-file-structure)
17. [Roadmap & Known Limitations](#17-roadmap--known-limitations)

---

## 1. Executive Summary

**Listy** is a comprehensive AI-powered platform for Amazon sellers that combines three major capabilities:

### 1.1 Amazon Listing Optimization

- **Keyword Research & Generation**: Extract keywords from competitor ASINs, seed phrases, or use AI expansion
- **Smart Listing Builder**: AI-generated titles, bullet points, and descriptions with compliance validation
- **Keyword Intelligence**: Clustering, classification (primary/secondary/tertiary), and strategic placement
- **Compliance Checker**: Real-time validation against Amazon policies, character limits, and keyword stuffing rules

### 1.2 PPC Campaign Management

- **AI-Powered Bid Optimization**: Predictive bidding based on historical performance and profit margins
- **Keyword Quality Scoring**: Machine learning-based keyword evaluation with lifecycle tracking
- **Campaign Automation**: Rule-based automation for bid adjustments, keyword pausing, and budget allocation
- **Dayparting**: Hour-by-hour bid modifiers based on performance patterns
- **Profit Analytics**: Break-even ACOS calculation with COGS tracking

### 1.3 Keyword Research Tools

- **DataForSEO Integration**: Live Amazon keyword metrics, search volume, and competitor analysis
- **Reverse ASIN Lookup**: Discover keywords competitors rank for
- **Keyword Intersections**: Find common keywords across multiple ASINs
- **Related Keywords**: Expand keyword lists with semantic variations
- **Historical Tracking**: Monitor keyword performance trends over time

---

## 2. Technology Stack

### 2.1 Frontend

| Component        | Technology            | Version |
| ---------------- | --------------------- | ------- |
| Framework        | Next.js (App Router)  | 16.0.1  |
| Language         | TypeScript            | 5.x     |
| UI Library       | Radix UI + Shadcn/ui  | Latest  |
| Styling          | Tailwind CSS          | 4.x     |
| State Management | TanStack Query        | 5.90.7  |
| Forms            | React Hook Form + Zod | Latest  |
| Auth             | Clerk                 | 6.34.5  |
| Theme            | next-themes           | 0.4.6   |

### 2.2 Backend

| Component     | Technology                   | Purpose                       |
| ------------- | ---------------------------- | ----------------------------- |
| Runtime       | Node.js (Next.js API Routes) | Server-side logic             |
| ORM           | Prisma                       | Database abstraction          |
| Database      | PostgreSQL (Supabase)        | Primary data store            |
| Cache         | Upstash Redis                | Performance caching           |
| AI            | OpenAI GPT-4                 | Content generation & analysis |
| Data Provider | DataForSEO Labs API          | Amazon keyword metrics        |

### 2.3 Key Dependencies

```json
{
  "@clerk/nextjs": "Authentication & user management",
  "@prisma/client": "Type-safe database queries",
  "@tanstack/react-query": "Async state & caching",
  "@radix-ui/react-*": "Accessible UI primitives",
  "openai": "AI content generation",
  "ioredis": "Redis client"
}
```

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Keywords   │  │   Listing    │  │     PPC      │     │
│  │     Page     │  │   Builder    │  │  Dashboard   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/JSON
┌───────────────────────────┴─────────────────────────────────┐
│              Next.js API Routes (app/api/*)                 │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │  Keywords   │  │  Listing   │  │       PPC        │    │
│  │     API     │  │    API     │  │       API        │    │
│  └─────────────┘  └────────────┘  └──────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                  Service Layer (lib/services)               │
│  ┌─────────────────┐  ┌──────────────────────────────┐    │
│  │ Keyword Service │  │   Listing Service            │    │
│  │ - Extraction    │  │   - AI Generation            │    │
│  │ - Clustering    │  │   - Validation               │    │
│  │ - Scoring       │  │   - Compliance Check         │    │
│  └─────────────────┘  └──────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │   PPC AI Engine                                     │  │
│  │   - Bid Prediction                                  │  │
│  │   - Quality Scoring                                 │  │
│  │   - Campaign Strategy Generation                    │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐    ┌────────────────┐                    │
│  │  PostgreSQL  │    │  Redis Cache   │                    │
│  │   (Prisma)   │    │   (Upstash)    │                    │
│  └──────────────┘    └────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                  External Services                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐       │
│  │  OpenAI  │  │  DataForSEO  │  │     Clerk      │       │
│  │   GPT-4  │  │  Amazon API  │  │      Auth      │       │
│  └──────────┘  └──────────────┘  └────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

#### Keyword Generation Flow

```
User Input (ASINs/Seeds)
    ↓
DataForSEO API (Ranked Keywords)
    ↓
Keyword Service (Extraction, Normalization)
    ↓
Scoring & Clustering Algorithm
    ↓
Classification (Primary/Secondary/Tertiary)
    ↓
Store in PostgreSQL + Cache in Redis
    ↓
Return to Frontend
```

#### Listing Generation Flow

```
User Input (Keywords, Product Info)
    ↓
Build Multi-Role Prompt (System/Developer/User)
    ↓
OpenAI GPT-4 (JSON Response)
    ↓
Validation Engine (Length, Policy, Stuffing)
    ↓
Auto-Fix (If Issues Found)
    ↓
Store Draft in PostgreSQL
    ↓
Return to Frontend
```

---

## 4. Core Features

### 4.1 Keyword Research & Management

#### 4.1.1 Keyword Sources

- **Competitor ASIN Analysis**: Reverse lookup via DataForSEO `ranked_keywords` endpoint
- **Seed Keyword Expansion**: AI-powered generation of 30+ long-tail variations
- **Keyword Intersections**: Find common keywords across multiple ASINs
- **Related Keywords**: Semantic expansion with configurable depth

#### 4.1.2 Keyword Intelligence

```typescript
// Keyword Scoring Formula
score(k) = 0.35 × frequency_weight +
           0.25 × position_weight +
           0.20 × search_volume_weight +
           0.20 × relevance_weight
```

#### 4.1.3 Clustering Algorithm

- **Method**: Trigram similarity matching
- **Threshold**: 0.5 (configurable)
- **Output**: Cluster ID assignment + average cluster score

#### 4.1.4 Classification

- **Primary** (Top 20%): Must-include keywords for main product features
- **Secondary** (Next 30%): Supporting keywords for benefits/use cases
- **Tertiary** (Remaining 50%): Backend search terms

### 4.2 Listing Builder

#### 4.2.1 AI-Powered Generation

- **Model**: OpenAI GPT-4 (configurable)
- **Response Format**: Structured JSON
- **Prompt Engineering**: Multi-role architecture (System + Developer + User)

#### 4.2.2 Validation Rules

| Rule              | Description                        | Action                   |
| ----------------- | ---------------------------------- | ------------------------ |
| Length Check      | Enforce character limits per field | Auto-truncate            |
| Keyword Stuffing  | Max 2 occurrences per keyword      | Warning + highlight      |
| Policy Violations | Medical/FDA/therapeutic claims     | Reject + suggest fix     |
| Competitor Brands | Detect brand name mentions         | Remove automatically     |
| Excessive Caps    | >30% uppercase characters          | Convert to sentence case |

#### 4.2.3 Compliance Checker

```typescript
ValidationIssue {
  field: 'title' | 'bullets' | 'description'
  type: 'length' | 'policy' | 'stuffing' | 'disallowed'
  severity: 'error' | 'warning'
  message: string
  suggestion?: string
}
```

### 4.3 PPC Management

#### 4.3.1 Campaign Structure

```
Campaign
├── Ad Groups
│   ├── Keywords (Match Types: Exact, Phrase, Broad)
│   └── Product Targets (ASIN, Category)
├── Automation Rules
├── Dayparting Schedules
└── Performance Metrics
```

#### 4.3.2 AI Bid Prediction

```typescript
interface BidPrediction {
  predictedCPC: number
  predictedClicks: number
  predictedSales: number
  predictedAcos: number
  recommendedBid: number
  confidence: number (0-1)
  reasoning: string
}
```

**Prediction Algorithm:**

1. Analyze 30-day historical metrics
2. Calculate conversion probability curve
3. Factor in profit margin & target ACOS
4. Generate optimized bid recommendation
5. Provide confidence score based on data quality

#### 4.3.3 Keyword Quality Scoring

```typescript
interface KeywordQualityScore {
  overallScore: number (0-100)
  profitability: number
  conversionProbability: number
  competitionLevel: number
  trendingScore: number
  lifecycle: 'Discovery' | 'Growth' | 'Maturity' | 'Decline'
  recommendation: string
}
```

#### 4.3.4 Automation Rules

- **Types**: Bid Adjustment, Pause Keyword, Budget Shift, Conversion Guard
- **Conditions**: JSON-based complex rule evaluation
- **Actions**: Automated responses to metric thresholds
- **Priority**: Rule execution order (0-10)

#### 4.3.5 Dayparting

- **Granularity**: Hourly bid modifiers
- **Days**: 7-day schedule (Sunday-Saturday)
- **Modifier Range**: 0.5x - 2.0x base bid
- **Use Case**: Optimize for high-conversion time windows

---

## 5. Database Schema

### 5.1 Core Models

#### User

```prisma
model User {
  id           String   @id @default(uuid())
  clerkId      String   @unique
  email        String   @unique
  plan         String   @default("free")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### Keyword

```prisma
model Keyword {
  id        String   @id @default(uuid())
  userId    String
  term      String
  score     Float
  clusterId String?
  class     String   // primary, secondary, tertiary
  source    String   // competitor, seed, extracted
  included  Boolean  @default(true)
}
```

#### KeywordResearch (DataForSEO Integration)

```prisma
model KeywordResearch {
  id                 String   @id @default(uuid())
  userId             String
  asin               String
  marketplace        String   @default("US")
  keyword            String
  searchVolume       Int?
  organicRank        Int?
  sponsoredRank      Int?
  competingProducts  Int?
  titleDensity       Int?
  searchVolumeTrend  Float?
  matchType          String?  // O, SP, O+SP, AR
  cerebro_iq_score   Int?
  suggested_ppc_bid  Float?
  keyword_sales      Int?
}
```

#### Draft

```prisma
model Draft {
  id           String   @id @default(uuid())
  userId       String
  title        String   @db.Text
  bullets      Json     // Array of strings
  description  String   @db.Text
  backendTerms String?  @db.Text
  keywords     Json?    // UIKeyword[] from research
  finalized    Boolean  @default(true)
  contentHash  String?  // SHA256 for deduplication
  version      Int      @default(1)
  score        Int      @default(0)
  marketplace  String   @default("US")
}
```

### 5.2 PPC Models

#### Campaign Hierarchy

```
PpcCampaign (1)
    ├── PpcAdGroup (many)
    │   ├── PpcKeyword (many)
    │   └── PpcTarget (many)
    ├── PpcCampaignMetric (many)
    ├── PpcAutomationRule (many)
    └── PpcDaypartingSchedule (many)
```

#### Metrics Models

```prisma
model PpcKeywordMetric {
  id                String   @id
  keywordId         String
  date              DateTime
  hour              Int?     // For dayparting
  impressions       Int
  clicks            Int
  spend             Float
  sales             Float
  ctr               Float
  cpc               Float
  acos              Float
  roas              Float
  conversionRate    Float
}
```

#### AI Models

```prisma
model PpcAiBidPrediction {
  id                  String   @id
  keywordId           String
  predictedCPC        Float
  predictedClicks     Int
  predictedSales      Float
  predictedAcos       Float
  recommendedBid      Float
  confidence          Float
  reasoning           String?
  predictionDate      DateTime
}
```

---

## 6. Service Layer Documentation

### 6.1 Keyword Service (`lib/services/keyword-service.ts`)

#### Functions

| Function                  | Purpose                            | Caching   |
| ------------------------- | ---------------------------------- | --------- |
| `generateKeywords()`      | Main keyword pipeline orchestrator | Yes (24h) |
| `expandSeedKeywords()`    | AI-powered seed expansion          | Yes (24h) |
| `analyzeCompetitorASIN()` | DataForSEO ranked keywords fetch   | Yes (1h)  |
| `clusterKeywords()`       | Trigram similarity clustering      | No        |
| `classifyKeywords()`      | Percentile-based classification    | No        |
| `calculateKeywordScore()` | Weighted scoring algorithm         | No        |

#### Example Usage

```typescript
const keywords = await generateKeywords({
  marketplace: "US",
  asin_list: ["B07XYZ123"],
  seeds: ["wireless charger"],
  category: "Electronics",
});
// Returns: Keyword[] with scores, clusters, classifications
```

### 6.2 Listing Service (`lib/services/listing-service.ts`)

#### Functions

| Function                  | Purpose                    | Caching  |
| ------------------------- | -------------------------- | -------- |
| `generateListingDraft()`  | Orchestrates AI generation | Yes (1h) |
| `validateListing()`       | Compliance & policy checks | No       |
| `autoFixListing()`        | Auto-correct issues        | No       |
| `advancedListingScore()`  | Quality scoring (0-100)    | No       |
| `calculateKeywordUsage()` | Count keyword occurrences  | No       |

#### Prompt Architecture

```typescript
{
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },     // Policy rules
    { role: 'developer', content: buildDeveloperPrompt() }, // Constraints
    { role: 'user', content: buildUserPrompt() }    // Product details
  ],
  response_format: { type: 'json_object' }
}
```

### 6.3 PPC AI Engine (`lib/services/ppc-ai-engine.ts`)

#### Core Functions

##### `calculateKeywordQualityScore()`

**Inputs:**

- Current keyword metrics
- 30-day historical metrics
- Profit margin percentage

**Outputs:**

- Overall quality score (0-100)
- Profitability rating
- Conversion probability
- Competition level
- Lifecycle stage

##### `predictOptimalBid()`

**Inputs:**

- Keyword string
- Current bid
- Historical metrics array
- Target ACOS
- Profit margin

**Outputs:**

- Recommended bid
- Predicted performance (CPC, clicks, sales, ACOS)
- Confidence score
- AI-generated reasoning

##### `generateCampaignStrategy()`

**Inputs:**

- ASIN
- Target ACOS
- Monthly budget
- Product data (title, price, category, keywords)

**Outputs:**

- Complete campaign structure
- Ad groups with keyword groupings
- Recommended bids per keyword
- Budget allocation
- Performance estimates

---

## 7. API Documentation

### 7.1 Keyword APIs

#### POST `/api/keywords/generate`

**Purpose:** Generate keywords from ASINs or seeds

**Request:**

```json
{
  "marketplace": "US",
  "asin_list": ["B07XYZ123"],
  "seeds": ["wireless charger", "fast charging"],
  "category": "Electronics"
}
```

**Response:**

```json
{
  "keywords": [
    {
      "term": "magsafe charger",
      "score": 0.87,
      "clusterId": "c1",
      "class": "primary",
      "source": "competitor"
    }
  ]
}
```

#### GET `/api/keywords/research`

**Purpose:** Fetch detailed keyword metrics from DataForSEO

**Query Params:**

- `asin`: Target ASIN
- `marketplace`: US | UK | DE | etc.
- `limit`: Max keywords (default: 100)

**Response:**

```json
{
  "keywords": [
    {
      "keyword": "wireless charger",
      "searchVolume": 12500,
      "organicRank": 3,
      "sponsoredRank": 1,
      "competingProducts": 450,
      "cerebro_iq_score": 85
    }
  ]
}
```

### 7.2 Listing APIs

#### POST `/api/listing/draft`

**Purpose:** Generate AI listing draft

**Request:**

```json
{
  "marketplace": "US",
  "brand": "TechBrand",
  "product_type": "Wireless Charger",
  "attributes": {
    "wattage": "15W",
    "compatibility": "iPhone 12-16"
  },
  "keywords": {
    "primary": ["magsafe charger", "fast charging"],
    "secondary": ["wireless pad", "qi charging"]
  },
  "limits": {
    "title": 180,
    "bullet": 220,
    "description": 1500
  },
  "disallowed": ["FDA", "cure", "medical"]
}
```

**Response:**

```json
{
  "title": "15W MagSafe Charger for iPhone 12-16...",
  "bullets": [
    "Fast 15W Charging: Delivers...",
    "Universal Compatibility: Works with...",
    "..."
  ],
  "description": "Experience the future of wireless charging...",
  "score": 85,
  "issues": []
}
```

#### POST `/api/listing/validate`

**Purpose:** Validate listing for compliance

**Request:**

```json
{
  "draft": {
    "title": "...",
    "bullets": ["..."],
    "description": "..."
  },
  "request": {
    /* same as draft request */
  }
}
```

**Response:**

```json
{
  "valid": false,
  "issues": [
    {
      "field": "title",
      "type": "length",
      "severity": "error",
      "message": "Title exceeds 180 characters (195 chars)",
      "suggestion": "Remove repetitive keywords"
    }
  ]
}
```

### 7.3 PPC APIs

#### POST `/api/ppc/campaigns`

**Request:**

```json
{
  "asin": "B07XYZ123",
  "campaignName": "Launch Campaign",
  "campaignType": "Manual",
  "targetingType": "Keyword",
  "dailyBudget": 50.0,
  "targetAcos": 25.0
}
```

#### GET `/api/ppc/keywords/quality`

**Query Params:**

- `keywordId`: UUID
- `profitMargin`: number (%)

**Response:**

```json
{
  "overallScore": 78,
  "profitability": 0.85,
  "conversionProbability": 0.72,
  "lifecycle": "Growth",
  "recommendation": "Increase bid by 15% to capture more traffic"
}
```

#### POST `/api/ppc/bids/predict`

**Request:**

```json
{
  "keyword": "wireless charger",
  "currentBid": 1.25,
  "targetAcos": 25.0,
  "profitMargin": 35.0
}
```

**Response:**

```json
{
  "recommendedBid": 1.45,
  "predictedCPC": 1.38,
  "predictedClicks": 150,
  "predictedSales": 450.0,
  "predictedAcos": 23.5,
  "confidence": 0.82,
  "reasoning": "Historical data shows strong conversion..."
}
```

---

## 8. Frontend Architecture

### 8.1 Page Structure

```
/app
├── page.tsx                 # Landing page
├── layout.tsx              # Root layout (auth, theme providers)
├── /dashboard
│   ├── layout.tsx          # Dashboard layout (nav, sidebar)
│   ├── page.tsx            # Dashboard home
│   ├── /keywords
│   │   ├── page.tsx        # Keyword research interface
│   │   └── /[id]
│   │       └── page.tsx    # Keyword detail view
│   ├── /listing
│   │   ├── page.tsx        # Listing builder
│   │   └── /drafts
│   │       └── page.tsx    # Draft history
│   └── /ppc
│       ├── page.tsx        # PPC dashboard
│       ├── /campaigns
│       ├── /keywords
│       └── /automation
└── /api
    ├── /keywords
    ├── /listing
    └── /ppc
```

### 8.2 Key Components

#### `/components/ui/*` (Shadcn/ui)

- `button`, `dialog`, `dropdown-menu`, `table`, `tooltip`, etc.
- Radix UI primitives with Tailwind styling

#### Custom Components

| Component       | Purpose                               | Location                |
| --------------- | ------------------------------------- | ----------------------- |
| `KeywordTable`  | Sortable, filterable keyword grid     | `/components/keywords/` |
| `ListingEditor` | Multi-field editor with live counters | `/components/listing/`  |
| `PPCDashboard`  | Campaign metrics & charts             | `/components/ppc/`      |
| `BidOptimizer`  | AI bid recommendation UI              | `/components/ppc/`      |

### 8.3 State Management

#### React Query (TanStack Query)

```typescript
// Example: Fetch keywords
const { data, isLoading } = useQuery({
  queryKey: ["keywords", asin],
  queryFn: () => fetchKeywords(asin),
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

#### Local State (useState/useReducer)

- Form inputs
- UI toggles (modals, dropdowns)
- Draft editing state

---

## 9. AI Integration

### 9.1 OpenAI Configuration

```typescript
// lib/models/openai.ts
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

export const DEFAULT_MODEL = "gpt-4o";
export const MAX_TOKENS = 4000;
```

### 9.2 Prompt Templates

#### Listing Generation System Prompt

```
You are an expert Amazon listing copywriter. Generate product listings that:
- Follow Amazon's style guide and policies
- Use keywords naturally (no stuffing)
- Maintain readability and persuasive tone
- Never repeat keywords more than 2 times total
- Avoid prohibited claims (medical, therapeutic, FDA-related)
- Focus on features, benefits, and use cases
```

#### Keyword Expansion Prompt

```
Generate 30 long-tail keyword variations for: {seed}
Category: {category}
Marketplace: {marketplace}

Focus on:
- Natural search phrases customers would use
- Product features and specifications
- Use cases and applications
- Complementary products

Return as JSON array of strings.
```

### 9.3 Response Parsing

```typescript
const completion = await openai.chat.completions.create({
  model: DEFAULT_MODEL,
  messages: [...],
  response_format: { type: 'json_object' }
});

const parsed = JSON.parse(completion.choices[0].message.content);
// Guaranteed JSON structure
```

---

## 10. Data Providers

### 10.1 DataForSEO Integration (`lib/dataforseo.ts`)

#### Authentication

```typescript
const authHeader = () => {
  const auth =
    "Basic " +
    Buffer.from(
      `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
    ).toString("base64");
  return auth;
};
```

#### Available Functions

##### `fetchRankedKeywords(asin, marketplace, limit)`

**Returns:** Array of keywords the ASIN ranks for with search volume and position data

##### `fetchAmazonBulkVolumes(keywords, marketplace)`

**Returns:** Search volume for up to 1000 keywords (single API call)

##### `fetchProductCompetitors(asin, marketplace, limit)`

**Returns:** ASINs competing for the same keywords

##### `fetchKeywordIntersections(asins[], marketplace, limit, mode)`

**Returns:** Common or unique keywords across multiple ASINs

##### `fetchRelatedKeywords(keyword, marketplace, limit, depth)`

**Returns:** Semantically related keywords with search volume

#### Marketplace Resolution

```typescript
resolveLocationAndLanguage(marketplace: string): {
  location_code: number,
  language_code: string
}

// Supported: US, UK, CA, AU, DE, FR, IT, ES, JP, MX, IN
```

---

## 11. Authentication & Security

### 11.1 Clerk Integration

#### Middleware (`middleware.ts`)

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

#### Route Protection

```typescript
// In API routes
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ...
}
```

### 11.2 Authorization Patterns

#### Resource Ownership Check

```typescript
const draft = await prisma.draft.findUnique({
  where: { id: draftId },
});

if (draft.userId !== userId) {
  return new Response("Forbidden", { status: 403 });
}
```

---

## 12. Caching Strategy

### 12.1 Redis Cache (`lib/databse/redis.ts`)

#### Cache Keys

```typescript
const CACHE_KEYS = {
  SEED_EXPANSION: (seed, marketplace) => `seed:${marketplace}:${seed}`,
  ASIN_ANALYSIS: (asin, marketplace) => `asin:${marketplace}:${asin}`,
  LISTING_DRAFT: (requestHash) => `draft:${requestHash}`,
};
```

#### TTL Strategy

| Data Type       | TTL       | Rationale                            |
| --------------- | --------- | ------------------------------------ |
| Seed expansions | 24 hours  | Rarely change, expensive to generate |
| ASIN analysis   | 1 hour    | Updates with new reviews/rankings    |
| Listing drafts  | 1 hour    | Fast iteration, prevent staleness    |
| Metrics         | 5 minutes | Near real-time for PPC decisions     |

#### Cache Invalidation

```typescript
// Pattern-based invalidation
await cache.invalidatePattern(`draft:user:${userId}:*`);
```

---

## 13. Environment Configuration

### 13.1 Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."

# AI
OPENAI_API_KEY="sk-..."

# Cache
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Data Provider
DATAFORSEO_LOGIN="your_email@example.com"
DATAFORSEO_PASSWORD="your_password"

# Optional
SERPAPI_KEY="..."  # For Amazon product scraping
```

### 13.2 Marketplace Configuration

```typescript
// Supported marketplaces
type Marketplace =
  | "US"
  | "UK"
  | "CA"
  | "AU"
  | "DE"
  | "FR"
  | "IT"
  | "ES"
  | "JP"
  | "MX"
  | "IN";
```

---

## 14. Development Workflow

### 14.1 Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm dlx prisma generate

# Run migrations
pnpm dlx prisma migrate dev

# Start dev server
pnpm dev
```

### 14.2 Database Management

```bash
# Create new migration
pnpm dlx prisma migrate dev --name add_ppc_models

# Reset database (DEV ONLY)
pnpm dlx prisma migrate reset

# Open Prisma Studio
pnpm dlx prisma studio
```

### 14.3 Code Quality

```bash
# Lint
pnpm lint

# Type check
pnpm tsc --noEmit

# Format
pnpm prettier --write .
```

---

## 15. Deployment

### 15.1 Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

#### Environment Variables

Set all required env vars in Vercel dashboard under Settings → Environment Variables

### 15.2 Docker (Alternative)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

---

## 16. File Structure

```
listy/
├── app/
│   ├── api/              # API routes
│   │   ├── keywords/
│   │   ├── listing/
│   │   └── ppc/
│   ├── dashboard/        # Dashboard pages
│   │   ├── keywords/
│   │   ├── listing/
│   │   └── ppc/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # Shadcn components
│   └── providers.tsx
├── lib/
│   ├── services/         # Business logic
│   │   ├── keyword-service.ts
│   │   ├── listing-service.ts
│   │   ├── ppc-ai-engine.ts
│   │   └── ppc-keyword-quality.ts
│   ├── databse/
│   │   └── redis.ts
│   ├── models/
│   │   └── openai.ts
│   ├── dataforseo.ts     # DataForSEO API client
│   ├── types.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 17. Roadmap & Known Limitations

### 17.1 In Progress

- [ ] Real Amazon SP-API integration (currently using DataForSEO)
- [ ] Advanced AI keyword filtering
- [ ] Version comparison for drafts
- [ ] Bulk keyword operations
- [ ] Campaign performance forecasting

### 17.2 Known Limitations

| Area               | Current State          | Impact                  | Mitigation                           |
| ------------------ | ---------------------- | ----------------------- | ------------------------------------ |
| Keyword Clustering | O(n²) trigram matching | Slow for >5000 keywords | Switch to embedding-based clustering |
| Input Validation   | Minimal Zod usage      | Security risk           | Add comprehensive schemas            |
| Rate Limiting      | Not implemented        | API abuse potential     | Redis token bucket                   |
| Real-time Metrics  | Polling-based          | Not truly live          | WebSocket integration                |

### 17.3 Technical Debt

1. **Mock Prisma Client**: Some mocking still present (legacy from testing)
2. **Caching Invalidation**: Pattern-based invalidation not fully implemented
3. **Error Handling**: Inconsistent error response formats
4. **Testing**: No unit/integration test suite

---

## Appendix A: Glossary

| Term                 | Definition                                     |
| -------------------- | ---------------------------------------------- |
| **ASIN**             | Amazon Standard Identification Number          |
| **ACOS**             | Advertising Cost of Sale (Spend ÷ Sales × 100) |
| **ROAS**             | Return on Ad Spend (Sales ÷ Spend)             |
| **CTR**              | Click-Through Rate (Clicks ÷ Impressions)      |
| **CVR**              | Conversion Rate (Orders ÷ Clicks)              |
| **CPC**              | Cost Per Click                                 |
| **COGS**             | Cost of Goods Sold                             |
| **Backend Terms**    | Hidden search keywords (not customer-facing)   |
| **Cerebro IQ Score** | Helium 10's keyword quality metric             |

---

## Appendix B: Quick Reference

### Common Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:3000)
pnpm build           # Build for production
pnpm start           # Start production server

# Database
pnpm prisma studio   # GUI for database
pnpm prisma migrate dev  # Create & apply migration

# Quality
pnpm lint            # Run ESLint
pnpm type-check      # TypeScript validation
```

### API Base URLs

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

---

**Last Updated:** 2025-12-08  
**Version:** 2.0.0  
**Maintainer:** [Your Team]
