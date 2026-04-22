@AGENTS.md

# highFinance — Fiscal Architect Treasury App

## Stack
- **Next.js 16** (App Router, TypeScript)
- **Prisma 7** (schema in `prisma/schema.prisma`, generated client at `src/generated/prisma`)
- **NextAuth v5** (credentials provider, JWT sessions)
- **Tailwind CSS v4** (custom design tokens in `src/app/globals.css`)
- **PostgreSQL** (connection string in `.env.local`)
- **Recharts** (spending trend charts)

## Development
```bash
npm run dev          # Start dev server
npx tsc --noEmit    # Type check
npx eslint . --fix  # Lint
```

## Database Setup
```bash
# 1. Set DATABASE_URL in .env.local
# 2. Run migrations
npx prisma migrate dev --name init
# 3. Seed test data
npx prisma db seed
# 4. View data
npx prisma studio
```

## Roles & Credentials (seed data)
| Role      | Email                          | Password     |
|-----------|--------------------------------|--------------|
| Admin     | admin@highfinance.test         | Admin1234    |
| Executive | exec@highfinance.test          | Exec1234     |
| Officer   | marketing@highfinance.test     | Officer1234  |
| Officer   | operations@highfinance.test    | Officer1234  |
| Officer   | events@highfinance.test        | Officer1234  |

## Key Files
- `src/auth.ts` — NextAuth config (credentials + JWT role embedding)
- `src/middleware.ts` — Edge role-gating (no DB calls)
- `src/lib/db.ts` — Prisma singleton (reads DATABASE_URL from env)
- `src/lib/permissions.ts` — `hasMinRole(role, required)` helper
- `src/app/(app)/layout.tsx` — Authenticated shell (Sidebar + TopHeader)
- `src/app/(auth)/login/page.tsx` — Login page

## Role Permission Matrix
| Feature                          | Officer | Executive | Admin |
|----------------------------------|:-------:|:---------:|:-----:|
| Own budget + transactions        | ✓       | ✓         | ✓     |
| Submit reimbursement             | ✓       | ✓         | ✓     |
| All department budgets           | ✗       | ✓         | ✓     |
| Approve/deny reimbursements      | ✗       | ✗         | ✓     |
| Analytics (login frequency)      | ✗       | ✗         | ✓     |
| Member dues + roster             | ✗       | ✗         | ✓     |

## Prisma 7 Notes
- Schema datasource has no `url` field — connection URL is in `prisma.config.ts` (for migrations) and passed to `PrismaClient` constructor in `src/lib/db.ts`
- Import types from `@/generated/prisma` (not `@prisma/client`)
- After schema changes: `npx prisma generate && npx prisma migrate dev`
