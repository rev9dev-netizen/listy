# Listy: Amazon Listing Builder — Full Technical Specification

This document describes a complete blueprint for a production-ready Amazon Listing Builder application. It is optimized for implementation by AI coding assistants. It includes front-end, back-end, APIs, data flow, UI/UX behavior, libraries, and architectural guidance.

---

## 1. Overview

**Product name:** Listy
**One-liner:** AI-powered Amazon listing builder that generates compliant, keyword-smart titles, bullets, and descriptions without stuffing.

A web application that provides:

* Keyword generation (via ASIN, competitor ASINs, seed phrases)
* Amazon-style listing generator (title, bullet points, description)
* Keyword weaving (primary/secondary clustering and non-stuffed insertion)
* Compliance checks and character limits
* UI for editing, saving, exporting listings
* Light/Dark mode support using *shadcn/ui*
* Modern tech stack: **Next.js**, **TypeScript**, **Tailwind**, **shadcn**, **OpenAI GPT-5**, **FastAPI/NestJS**, **PostgreSQL**, **Redis**, **S3**

---

## 2. High-Level Architecture

### 2.1 Frontend

* Framework: **Next.js (App Router)**
* Language: **TypeScript**
* Styling: **TailwindCSS**
* Component System: **shadcn/ui**
* Theme: Light/Dark mode via *next-themes*
* State Management: TanStack Query
* Form Validation: Zod
* Auth: Clerk/Auth0

### 2.2 Backend

Option A: **FastAPI (Python)**
Option B: **NestJS (TypeScript)**

Components:

* REST API + optional WebSocket for long-running tasks
* Services: ingest, keywords, generator, validator, export
* Database: **PostgreSQL**
* Cache: **Redis**
* File Storage: **S3** (DigitalOcean Spaces or AWS)
* Queue: **Celery / RQ** or **BullMQ**

### 2.3 Integrations

* **OpenAI GPT-5**
* **Amazon SP-API** (catalog + product data)
* Optional legal data providers for keyword volume (Helium10 partner API, KeywordTool API, etc.)

---

## 3. API Contracts

### 3.1 POST /auth/login

Authentication endpoint.

### 3.2 POST /keywords/generate

```json
{
  "marketplace": "US",
  "asin_list": ["B0XXXX"],
  "seeds": ["wireless charger"],
  "category": "Electronics"
}
```

**Response:**

```json
{
  "keywords": [
    { "term": "magsafe charger", "score": 0.87, "cluster_id": "c1", "class": "primary" },
    { "term": "wireless charging pad", "score": 0.71, "cluster_id": "c1", "class": "secondary" }
  ]
}
```

### 3.3 POST /listing/draft

```json
{
  "marketplace": "US",
  "brand": "Voltix",
  "product_type": "MagSafe Charging Pad",
  "attributes": {
    "wattage": "15W",
    "material": "aluminum",
    "compatibility": "iPhone 12-16"
  },
  "tone": "standard",
  "disallowed": ["FDA", "cure"],
  "keywords": {
    "primary": ["magsafe charger"],
    "secondary": ["fast charging"]
  },
  "limits": {
    "title": 180,
    "bullet": 220,
    "description": 1500
  }
}
```

**Response:**

```json
{
  "title": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "description": "..."
}
```

### 3.4 POST /listing/validate

Returns compliance issues.

### 3.5 POST /listing/export

Exports to Amazon template or CSV.

---

## 4. Backend Logic

### 4.1 Keyword Generation Pipeline

1. Ingest product/competitor data
2. Extract tokens from titles, bullets, descriptions
3. Normalize (lowercase, lemmatize, ASCII fold)
4. Score keywords using formula:

```
score(k) = 0.35 * z(freq_competitors) +
           0.25 * z(pos_weight) +
           0.20 * z(est_volume) +
           0.20 * z(relevance)
```

5. Cluster via trigram similarity
6. Classify (primary/secondary/tertiary)
7. Provide structured output for generator

### 4.2 Listing Generator Pipeline

1. Compose system instructions
2. Compose developer constraints (limits, disallowed terms)
3. Include user-provided product details
4. Insert keyword strategy rules
5. GPT-5 generates draft
6. Validate (character limit, policy violations, keyword stuffing)
7. Auto-correct if issues found

### 4.3 Validator Rules

* Length enforcement per field
* No competitor brand names
* No medical claims
* Keyword repetition <= 2 times total
* Regex to prevent keyword stuffing
* Description readability threshold

### 4.4 Export Service

* Transform title/bullets/description into Amazon-compliant flat-file format
* Optional: CSV, JSON, plain text

---

## 5. Database Schema (PostgreSQL)

```sql
table users (
  id uuid primary key,
  email text unique,
  plan text,
  created_at timestamp
);

table projects (
  id uuid primary key,
  user_id uuid references users(id),
  marketplace text,
  brand text,
  product_type text,
  created_at timestamp
);

table ingests (
  id uuid primary key,
  project_id uuid references projects(id),
  asin text,
  raw_json jsonb,
  created_at timestamp
);

table keywords (
  id uuid primary key,
  project_id uuid references projects(id),
  term text,
  score float,
  cluster_id text,
  class text,
  source text,
  created_at timestamp
);

table drafts (
  id uuid primary key,
  project_id uuid references projects(id),
  title text,
  bullets jsonb,
  description text,
  backend_terms text,
  version int,
  created_at timestamp
);

table constraints (
  id uuid primary key,
  project_id uuid references projects(id),
  title_limit int,
  bullet_limit int,
  desc_limit int,
  disallowed jsonb,
  locale text
);
```

---

## 6. Frontend Implementation (Next.js)

### 6.1 Folder Structure

```
/app
  /dashboard
  /keywords
  /listing
  /api
/components
  ui (shadcn)
  forms
  tables
  editors
/lib
/styles
```

### 6.2 Pages

#### Keywords Page

Inputs:

* Marketplace
* ASIN list
* Seed phrases
* Category selector

Outputs:

* Keyword table (term, class, score, cluster)
* Include/exclude toggles
* Cluster visualization

#### Listing Builder Page

Left panel:

* Title field + live counter
* 5 bullet fields + counters
* Description editor + counter

Right panel:

* Keyword groups with usage indicator (used/unused)
* Disallowed terms
* Policy warnings
* Auto-fix buttons ("Remove repetition", "Shorten title", etc.)

### 6.3 Theming

* Use **next-themes** with shadcn's built-in dark/light components
* Tailwind config for themes

### 6.4 Key Components

* `KeywordTable` (sortable, filterable)
* `ListingEditor` (title/bullets/description, counters)
* `KeywordSidebar` (usage tracking)
* `GenerationButton` (loading state, pipeline steps)
* `PolicyWarnings` (list of violations)

---

## 7. UX Flow

1. User creates a project
2. Enters ASINs and/or seed phrases
3. Clicks "Generate Keywords"
4. Reviews keyword list, toggles inclusion
5. Proceeds to Listing Builder
6. Enters brand, product type, attributes
7. Clicks "Write for Me"
8. Draft appears in editor with keyword highlights
9. User manually edits
10. Validator runs automatically
11. User exports listing

---

## 8. GPT-5 Prompt Templates

### System Prompt

```
You generate Amazon product listings that follow policy, character limits, and keyword rules. Maintain natural tone, avoid keyword stuffing, and do not exceed limits.
```

### Developer Prompt

```
Format:
TITLE <= {title_limit}
5 BULLETS <= {bullet_limit} each
DESCRIPTION <= {desc_limit}
Do not use: {disallowed_terms}
Primary keywords (include once): {primary}
Secondary keywords (at most once): {secondary}
Avoid repetition. Maintain natural readability.
```

### User Prompt

```
Brand: {brand}
Product type: {product_type}
Attributes: {attributes}
Audience: {audience}
Tone: {tone}
```

---

## 9. Deployment

* Frontend: Vercel
* Backend: AWS EC2/Elastic Beanstalk or Fly.io
* DB: RDS or Supabase
* Cache: Redis Cloud
* Storage: S3-compatible

---

## 10. Future Enhancements

* A/B testing mode
* Rank tracking
* Competitor gap analysis report
* Image prompt generator for product photos

---

This document provides all required details for implementing the complete system front-to-back.
