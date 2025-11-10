# Listy Setup Guide

## Complete Setup Instructions for Listy - AI-Powered Amazon Listing Builder

This guide will help you set up the entire application from scratch.

## Prerequisites

- Node.js 20+ installed
- pnpm package manager
- PostgreSQL database (local or cloud)
- Redis instance (local or cloud)
- Clerk account (sign up at <https://clerk.com>)
- OpenAI API key (get from <https://platform.openai.com>)

## Step 1: Install Dependencies

All dependencies are already installed. If you need to reinstall:

\`\`\`powershell
pnpm install
\`\`\`

## Step 2: Configure Environment Variables

The `.env.local` file has been created with placeholders. Fill in your actual values:

### Required Variables

1. **Database URL** - PostgreSQL connection string
   \`\`\`
   DATABASE_URL="postgresql://username:password@localhost:5432/listy?schema=public"
   \`\`\`

2. **Clerk Authentication**
   - Go to <https://clerk.com/dashboard>
   - Create a new application
   - Copy the API keys:
   \`\`\`
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   \`\`\`

3. **OpenAI API Key**
   - Go to <https://platform.openai.com/api-keys>
   - Create a new secret key:
   \`\`\`
   OPENAI_API_KEY=sk-...
   \`\`\`

4. **Redis URL** (if using local Redis):
   \`\`\`
   REDIS_URL="redis://localhost:6379"
   \`\`\`

## Step 3: Set Up Local Services

### PostgreSQL

**Option A: Using Docker**
\`\`\`powershell
docker run --name listy-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=listy -p 5432:5432 -d postgres
\`\`\`

**Option B: Local Installation**

- Install PostgreSQL from <https://www.postgresql.org/download/windows/>
- Create a database named \`listy\`

**Option C: Use Cloud Service**

- Railway: <https://railway.app>
- Supabase: <https://supabase.com>
- Neon: <https://neon.tech>

### Redis

**Option A: Using Docker**
\`\`\`powershell
docker run --name listy-redis -p 6379:6379 -d redis
\`\`\`

**Option B: WSL Installation**
\`\`\`bash
sudo apt-get install redis-server
sudo service redis-server start
\`\`\`

**Option C: Use Redis Cloud**

- Sign up at <https://redis.io/try-free/>
- Get connection string

## Step 4: Initialize Database

Generate Prisma client:
\`\`\`powershell
npx prisma generate
\`\`\`

Push schema to database:
\`\`\`powershell
npx prisma db push
\`\`\`

View database (optional):
\`\`\`powershell
npx prisma studio
\`\`\`

## Step 5: Configure Clerk

1. Go to your Clerk Dashboard
2. Configure the following URLs:
   - Homepage URL: \`<http://localhost:3000\`>
   - Sign in URL: \`<http://localhost:3000/sign-in\`>
   - Sign up URL: \`<http://localhost:3000/sign-up\`>
   - After sign in: \`<http://localhost:3000/dashboard\`>
   - After sign up: \`<http://localhost:3000/dashboard\`>

3. Enable email/password authentication (or other providers)

## Step 6: Run Development Server

\`\`\`powershell
pnpm dev
\`\`\`

Visit <http://localhost:3000>

## Project Structure

\`\`\`
listy/
├── app/
│   ├── api/                 # API routes
│   │   ├── keywords/generate/  # Keyword generation
│   │   ├── listing/           # Listing CRUD
│   │   │   ├── draft/        # Draft generation
│   │   │   ├── validate/     # Validation
│   │   │   └── export/       # Export functionality
│   │   └── projects/         # Project management
│   ├── dashboard/           # Protected dashboard pages
│   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   ├── page.tsx         # Main dashboard
│   │   ├── keywords/        # Keywords UI (to be built)
│   │   ├── listing/         # Listing builder UI (to be built)
│   │   └── projects/        # Projects UI (to be built)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── providers.tsx        # App providers
├── lib/
│   ├── services/            # Business logic
│   │   ├── keyword-service.ts    # Keyword generation logic
│   │   └── listing-service.ts    # Listing generation logic
│   ├── prisma.ts            # Database client
│   ├── redis.ts             # Cache client
│   ├── openai.ts            # AI client
│   ├── types.ts             # TypeScript types
│   └── utils.ts             # Utility functions
├── prisma/
│   └── schema.prisma        # Database schema
└── middleware.ts            # Clerk auth middleware
\`\`\`

## Testing the Setup

### 1. Test Landing Page

- Visit <http://localhost:3000>
- Should see the Listy landing page

### 2. Test Authentication

- Click "Get Started" or "Sign In"
- Create an account
- Should redirect to /dashboard

### 3. Test Dashboard

- Should see dashboard with stats
- Navigation sidebar should work
- Theme toggle should work

### 4. Test API (using curl or Postman)

**Create Project:**
\`\`\`powershell
curl -X POST <http://localhost:3000/api/projects> `
-H "Content-Type: application/json" `
  -d '{"marketplace":"US","brand":"Test Brand"}'
\`\`\`

**Generate Keywords:**
\`\`\`powershell
curl -X POST <http://localhost:3000/api/keywords/generate> `
-H "Content-Type: application/json" `
  -d '{"marketplace":"US","seeds":["wireless charger"],"category":"Electronics"}'
\`\`\`

## Next Steps

Now that the foundation is set up, you can:

1. Build out the Keywords page UI (app/dashboard/keywords/page.tsx)
2. Build out the Listing Builder UI (app/dashboard/listing/page.tsx)
3. Build out the Projects page UI (app/dashboard/projects/page.tsx)
4. Add more features as needed

## Architecture Overview

### Backend Services

1. **Keyword Service** (lib/services/keyword-service.ts)
   - Extract keywords from text
   - Calculate keyword scores
   - Cluster similar keywords
   - Classify into primary/secondary/tertiary
   - AI-powered seed expansion

2. **Listing Service** (lib/services/listing-service.ts)
   - Generate listing drafts using GPT-4
   - Validate against Amazon policies
   - Auto-fix common issues
   - Calculate keyword usage statistics

### Frontend Architecture

1. **Pages**: Next.js App Router
2. **State**: TanStack Query for server state
3. **Forms**: React Hook Form + Zod
4. **Styling**: Tailwind CSS + shadcn/ui
5. **Auth**: Clerk

### Data Flow

1. User creates project → Stored in PostgreSQL
2. User generates keywords → AI processes → Cache in Redis → Store in DB
3. User generates listing → AI creates draft → Validate → Store version in DB
4. User exports → Format conversion → Download

## Troubleshooting

### Issue: Prisma can't connect to database

**Solution**: Verify DATABASE_URL is correct and database is running

### Issue: Clerk authentication not working

**Solution**: Check Clerk dashboard settings and API keys

### Issue: OpenAI API errors

**Solution**: Verify API key and check usage limits

### Issue: Redis connection failed

**Solution**: Ensure Redis is running on specified port

### Issue: TypeScript errors

**Solution**: Run \`npx tsc --noEmit\` to see detailed errors

## Production Deployment

### Vercel (Frontend)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Railway (Database + Redis)

1. Create new project
2. Add PostgreSQL service
3. Add Redis service
4. Copy connection strings to Vercel

## API Documentation

### POST /api/keywords/generate

Generate keywords from ASINs and seeds

**Request:**
\`\`\`json
{
  "marketplace": "US",
  "asin_list": ["B08N5WRWNW"],
  "seeds": ["wireless charger"],
  "category": "Electronics"
}
\`\`\`

**Response:**
\`\`\`json
{
  "keywords": [
    {
      "term": "wireless charger",
      "score": 0.87,
      "cluster_id": "c1",
      "class": "primary",
      "source": "seed"
    }
  ]
}
\`\`\`

### POST /api/listing/draft

Generate listing draft

**Request:**
\`\`\`json
{
  "marketplace": "US",
  "brand": "Voltix",
  "product_type": "Wireless Charger",
  "attributes": {
    "wattage": "15W",
    "compatibility": "iPhone 12-16"
  },
  "keywords": {
    "primary": ["magsafe charger"],
    "secondary": ["fast charging"]
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "title": "Voltix 15W MagSafe Charger...",
  "bullets": ["Fast 15W charging...", "..."],
  "description": "Experience premium wireless charging..."
}
\`\`\`

## Support

For issues, check:

1. Console logs
2. Network tab in DevTools
3. Prisma Studio for database
4. Redis CLI for cache

---

Happy building! 🚀
