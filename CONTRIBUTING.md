# Contributing to Listy

Thank you for your interest in contributing to Listy! This guide will help both human developers and AI assistants understand how to contribute effectively to this codebase.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Architecture](#code-architecture)
4. [Coding Standards](#coding-standards)
5. [Making Changes](#making-changes)
6. [Testing Guidelines](#testing-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (v20 recommended)
- **pnpm**: v8+ (package manager)
- **PostgreSQL**: 14+ (via Supabase or local)
- **Redis**: For caching (via Upstash)

### Required Accounts

1. **Supabase** - PostgreSQL database
2. **Clerk** - Authentication
3. **OpenAI** - AI features
4. **Upstash** - Redis caching
5. **DataForSEO** - Keyword data (optional but recommended)

---

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/listy.git
cd listy

# Install dependencies
pnpm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and fill in your credentials
# Required: DATABASE_URL, CLERK_*, OPENAI_API_KEY, UPSTASH_*
```

See [`.env.example`](.env.example) for detailed description of each variable.

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed database with test data
pnpm risma db seed
```

### 4. Start Development Server

```bash
# Start Next.js dev server
pnpm dev

# Server will be available at http://localhost:3000
```

### 5. Verify Setup

1. Visit `http://localhost:3000`
2. Sign up for a new account (Clerk)
3. Navigate to `/dashboard/keywords`
4. Try generating keywords from a seed phrase

---

## Code Architecture

### Directory Structure

```
listy/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── keywords/      # Keyword generation APIs
│   │   ├── listing/       # Listing builder APIs
│   │   └── ppc/           # PPC management APIs
│   └── dashboard/         # Protected dashboard routes
├── components/            # React components
│   └── ui/               # Shadcn/ui components
├── lib/                  # Business logic & utilities
│   ├── services/         # Core service layer
│   │   ├── keyword-service.ts
│   │   ├── listing-service.ts
│   │   └── ppc-ai-engine.ts
│   ├── databse/          # Data access layer
│   ├── models/           # External service clients
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema & migrations
└── public/               # Static assets
```

### Key Architectural Patterns

1. **API Routes → Services → Data Layer**

   - API routes handle HTTP and auth
   - Services contain business logic
   - Prisma handles data persistence

2. **Server-Side Rendering (SSR)**

   - Use `async` functions in page components
   - Fetch data server-side when possible

3. **Client State Management**

   - TanStack Query for async state
   - Local state for UI interactions

4. **Caching Strategy**
   - Redis for expensive operations (AI, API calls)
   - React Query for client-side caching

---

## Coding Standards

### TypeScript

- **Always use TypeScript** - no `.js` files
- **Enable strict mode** - already configured in `tsconfig.json`
- **Define types explicitly** for function parameters and returns
- **Use interfaces** for object shapes, **types** for unions/intersections

```typescript
// Good
interface KeywordRequest {
  marketplace: string;
  seeds: string[];
}

async function generateKeywords(request: KeywordRequest): Promise<Keyword[]> {
  // ...
}

// Avoid
function generateKeywords(request) {
  // ...
}
```

### Code Style

- **Formatting**: Prettier (auto-formatted)
- **Linting**: ESLint with Next.js config
- **Naming Conventions**:
  - `PascalCase` for components, types, interfaces
  - `camelCase` for functions, variables
  - `UPPER_SNAKE_CASE` for constants
  - `kebab-case` for file names (except components)

```typescript
// Good
const MAX_KEYWORDS = 1000;
const keywordService = new KeywordService();

interface KeywordCluster {
  id: string;
  keywords: Keyword[];
}

// Components
export function KeywordTable() {}
```

### React Best Practices

1. **Use Server Components by default**

   ```typescript
   // app/dashboard/page.tsx
   export default async function DashboardPage() {
     const data = await fetchData();
     return <Dashboard data={data} />;
   }
   ```

2. **Client Components only when needed**

   ```typescript
   "use client";

   export function InteractiveComponent() {
     const [state, setState] = useState();
     // ...
   }
   ```

3. **Extract reusable logic to custom hooks**
   ```typescript
   function useKeywordGeneration() {
     return useMutation({
       mutationFn: generateKeywords,
       // ...
     });
   }
   ```

---

## Making Changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

Examples:

- `feature/ppc-automation-rules`
- `fix/keyword-clustering-performance`
- `docs/api-documentation`

### Commit Messages

Follow conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```
feat(ppc): add AI bid prediction engine

fix(keywords): resolve clustering timeout for large datasets

docs(readme): update API documentation with new endpoints

refactor(listing): extract validation logic to separate service
```

### Database Changes

When modifying the database schema:

1. **Edit `prisma/schema.prisma`**
2. **Create migration**:
   ```bash
   pnpm dlx prisma migrate dev --name descriptive_name
   ```
3. **Update types**:
   ```bash
   pnpm dlx prisma generate
   ```
4. **Test migration** on a dev database first
5. **Document breaking changes** in PR description

---

## Testing Guidelines

### Testing Strategy

Currently, Listy has minimal automated tests. When adding tests:

1. **Unit Tests** - Service layer functions
2. **Integration Tests** - API routes
3. **E2E Tests** - Critical user flows (future)

### Writing Tests

```typescript
// lib/services/__tests__/keyword-service.test.ts
import { describe, it, expect } from "vitest";
import { calculateKeywordScore } from "../keyword-service";

describe("calculateKeywordScore", () => {
  it("should return higher score for frequent keywords", () => {
    const score = calculateKeywordScore({
      term: "wireless charger",
      frequency: 50,
      position: 1,
      source: "competitor",
    });

    expect(score).toBeGreaterThan(0.7);
  });
});
```

### Manual Testing Checklist

Before submitting a PR:

- [ ] Test in both light and dark mode
- [ ] Verify authentication flows work
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Test error states (network errors, validation errors)
- [ ] Verify database changes don't break existing data

---

## Pull Request Process

### Before Submitting

1. **Rebase on main**

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run quality checks**

   ```bash
   pnpm lint
   pnpm tsc --noEmit
   pnpm build
   ```

3. **Update documentation** if needed
   - README.md for major features
   - Code comments for complex logic
   - API documentation for new endpoints

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Checked responsive design
- [ ] Verified authentication

## Database Changes

- [ ] No database changes
- [ ] Migration included and tested

## Screenshots (if applicable)

[Add screenshots here]

## Related Issues

Fixes #123
```

### Review Process

1. **Automated checks** must pass (linting, type-checking)
2. **Code review** from at least one maintainer
3. **Testing** in staging environment
4. **Approval** before merge

---

## Common Tasks

### Adding a New API Endpoint

1. **Create route file**

   ```typescript
   // app/api/example/route.ts
   import { auth } from "@clerk/nextjs/server";
   import { NextResponse } from "next/server";

   export async function POST(request: Request) {
     const { userId } = await auth();
     if (!userId) {
       return new NextResponse("Unauthorized", { status: 401 });
     }

     const body = await request.json();
     // Process request

     return NextResponse.json({ success: true });
   }
   ```

2. **Add types**

   ```typescript
   // lib/types.ts
   export interface ExampleRequest {
     field: string;
   }

   export interface ExampleResponse {
     success: boolean;
   }
   ```

3. **Document in README** (Section 7: API Documentation)

### Adding a New Service Function

1. **Create/update service file**

   ```typescript
   // lib/services/example-service.ts
   export async function processExample(input: string): Promise<Result> {
     // Implementation
   }
   ```

2. **Add caching if expensive**

   ```typescript
   const cacheKey = `example:${input}`;
   const cached = await cache.get(cacheKey);
   if (cached) return cached;

   const result = await expensiveOperation();
   await cache.set(cacheKey, result, 3600); // 1 hour
   return result;
   ```

3. **Export from service index** if needed

### Adding a Database Model

1. **Edit Prisma schema**

   ```prisma
   model Example {
     id        String   @id @default(uuid())
     userId    String
     user      User     @relation(fields: [userId], references: [id])
     content   String
     createdAt DateTime @default(now())

     @@index([userId])
     @@map("examples")
   }
   ```

2. **Update relations**

   ```prisma
   model User {
     // ...
     examples Example[]
   }
   ```

3. **Create migration**
   ```bash
   pnpm dlx prisma migrate dev --name add_example_model
   ```

### Adding a UI Component

1. **Create component file**

   ```typescript
   // components/example-component.tsx
   interface ExampleProps {
     title: string;
     onAction: () => void;
   }

   export function ExampleComponent({ title, onAction }: ExampleProps) {
     return (
       <div>
         <h2>{title}</h2>
         <Button onClick={onAction}>Action</Button>
       </div>
     );
   }
   ```

2. **Use Shadcn components** when possible
3. **Follow responsive design** patterns
4. **Support dark mode** with CSS variables

---

## Additional Resources

- **README.md** - Complete technical documentation
- **Prisma Docs** - https://www.prisma.io/docs
- **Next.js Docs** - https://nextjs.org/docs
- **Radix UI** - https://www.radix-ui.com
- **TanStack Query** - https://tanstack.com/query

---

## Questions?

For questions or issues:

1. Check existing [Issues](https://github.com/yourusername/listy/issues)
2. Review the [README.md](README.md)
3. Create a new issue with detailed description

---

**Thank you for contributing to Listy! 🚀**
