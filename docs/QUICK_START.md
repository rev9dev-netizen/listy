# 🚀 Quick Start Guide - Listy

## ⚡ 5-Minute Setup

### 1. Configure Environment (.env.local)

```env
# Database (choose one option below)
DATABASE_URL="postgresql://user:pass@localhost:5432/listy"

# Clerk (get from https://clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY

# OpenAI (get from https://platform.openai.com)
OPENAI_API_KEY=sk-YOUR_KEY

# Redis (optional, improves performance)
REDIS_URL="redis://localhost:6379"
```

### 2. Setup Database

```powershell
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

### 3. Run Application

```powershell
pnpm dev
```

Visit **<http://localhost:3000>**

---

## 📦 Database Options

### Option A: PostgreSQL with Docker

```powershell
docker run --name listy-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=listy -p 5432:5432 -d postgres
```

Then use: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/listy"`

### Option B: Free Cloud Database

- **Neon** (recommended): <https://neon.tech>
- **Supabase**: <https://supabase.com>  
- **Railway**: <https://railway.app>

---

## 🔑 Get API Keys

### Clerk (Free)

1. Go to <https://clerk.com>
2. Create account → New application
3. Copy both keys from "API Keys" tab

### OpenAI (Pay-as-you-go)

1. Go to <https://platform.openai.com>
2. Create account → API Keys
3. Create new secret key

---

## ✅ Verify Setup

### Check Landing Page

```
http://localhost:3000
```

Should see: Listy landing page

### Check Dashboard (after sign up)

```
http://localhost:3000/dashboard
```

Should see: Dashboard with sidebar

### Check Database

```powershell
npx prisma studio
```

Should open: Database viewer in browser

---

## 🧪 Test API Endpoints

### Test Keyword Generation

```powershell
curl -X POST http://localhost:3000/api/keywords/generate `
  -H "Content-Type: application/json" `
  -d '{"marketplace":"US","seeds":["wireless charger"],"category":"Electronics"}'
```

### Test Listing Generation

```powershell
curl -X POST http://localhost:3000/api/listing/draft `
  -H "Content-Type: application/json" `
  -d '{"marketplace":"US","brand":"TestBrand","product_type":"Charger","attributes":{"wattage":"15W"},"keywords":{"primary":["wireless charger"],"secondary":["fast charging"]}}'
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env.local` | Your secret keys |
| `prisma/schema.prisma` | Database structure |
| `lib/services/keyword-service.ts` | Keyword logic |
| `lib/services/listing-service.ts` | Listing logic |
| `app/api/*` | API endpoints |
| `app/dashboard/*` | Dashboard pages |

---

## 🆘 Troubleshooting

### "Database connection failed"

→ Check DATABASE_URL in .env.local
→ Ensure PostgreSQL is running

### "Clerk authentication error"

→ Verify both Clerk keys in .env.local
→ Check Clerk dashboard settings

### "OpenAI API error"

→ Verify OPENAI_API_KEY in .env.local
→ Check API usage limits

### "Module not found"

→ Run: `pnpm install`

---

## 📊 What's Working

✅ Authentication (Clerk)
✅ Landing page
✅ Dashboard
✅ Keyword generation API
✅ Listing generation API
✅ Validation API
✅ Export API
✅ Projects API
✅ Database (Prisma)
✅ Caching (Redis)
✅ Dark mode

---

## 🎯 What To Build Next

1. **Keywords Page** (app/dashboard/keywords/page.tsx)
   - Form for ASIN/seed input
   - Results table
   - Filters and sorting

2. **Listing Builder** (app/dashboard/listing/page.tsx)
   - Editor form
   - Character counters
   - Keyword sidebar
   - Generate button

3. **Projects Page** (app/dashboard/projects/page.tsx)
   - Project list
   - Create modal
   - Project details

---

## 📚 Full Documentation

- **SETUP.md** - Complete setup instructions
- **PROJECT_STATUS.md** - What's done and what's left
- **IMPLEMENTATION_SUMMARY.md** - Full feature list
- **idea.md** - Original specification

---

## 🎨 Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- PostgreSQL + Prisma ORM
- Redis (caching)
- Clerk (auth)
- OpenAI GPT-4 (AI)
- TanStack Query (state)

---

## 💡 Quick Commands

```powershell
# Start development
pnpm dev

# View database
npx prisma studio

# Format code
npx prettier --write .

# Type check
npx tsc --noEmit

# Lint
pnpm lint
```

---

**Ready to build! 🚀**

For detailed help, see SETUP.md
