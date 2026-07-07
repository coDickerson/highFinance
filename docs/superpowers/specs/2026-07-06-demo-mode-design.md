# Demo Mode — Linkable Resume Demo Design

**Date:** 2026-07-06
**Status:** Approved, pending implementation plan

## Goal

Provide a public, interactive demo of highFinance that can be linked from a resume.
A visitor clicks the link, logs in with one click, and explores a fully populated
app — **without** exposing real data, real user accounts, or any real secrets
(Google service account, real database).

## Key Decisions

- **Interactive live app** (not a video or static mock).
- **Host on Vercel + Neon (free Postgres).** Vercel is the lowest-friction host
  for this exact stack — the code already speaks `@vercel/blob`. The thing being
  avoided is pointing a public link at real data/secrets, not Vercel itself.
- **Stub the Google Sheets integration** behind a `DEMO_MODE` flag rather than
  running a real (even isolated) demo sheet. Rationale: the sheet backend is
  invisible to a demo viewer, and a real sheet would require a fragile nightly
  restore for zero visible payoff.
- **One-click demo login** ("Try as Officer" / "Try as Admin") reusing the
  existing credentials auth — no changes to `auth.ts` or middleware.
- **Nightly reset** via Vercel Cron keeps the demo self-healing and
  low-maintenance.

## Architecture

### The `DEMO_MODE` stub (ledger seam)

The Google Sheets integration is layered as:
`sheets.ts` (raw cell I/O) → `ledger.ts` (domain functions) → consumers
(dashboard/budget pages + API routes).

Consumers call ~9 `ledger.ts` functions. The stub lives at this **domain
boundary** (not raw cells):

- **Read functions** — return sheet-owned data the DB does not own
  (`getPositionBudgets` / `getPositionBudgetsCached`, `getPlannedBudgetMap`,
  `plannedBudgetForDepartment`, `getFeesAndIncome`, `getRoster`). Each gets a
  one-line guard: `if (isDemoMode()) return demoX;`, returning seeded data from
  a new `src/lib/ledger-demo.ts` (fake position budgets, fees/income, roster).
- **Write functions** — `appendReimbursement`, `recordSpend`,
  `updateReimbursementStatus`, `appendRosterSignup` become no-ops in demo mode
  (`if (isDemoMode()) return;`). This is safe because the DB is already the
  source of truth for app-owned data: e.g. reimbursement submission does
  `prisma.reimbursementRequest.create(...)` and the sheet append is a
  best-effort `after()` side-effect already wrapped in try/catch that "never
  delays or fails the submission." No-opping it changes nothing visible.
- `sheets.ts` / `googleapis` are never called in demo mode. **No Google env
  vars are set on the demo deployment.** Consumers are untouched.

`isDemoMode()` helper: `process.env.DEMO_MODE === "1"`.

### Seeded demo data + one-click login

- `prisma/seed-demo.ts`: populates departments, a `Demo Officer` and
  `Demo Admin` user (known passwords), and sample requests / transactions /
  members so the app looks alive on first load.
- Login page gains two buttons that submit the demo credentials through the
  **existing** credentials provider. No auth/middleware changes.

### Receipts

- Vercel Blob works out of the box (`BLOB_READ_WRITE_TOKEN` auto-provisioned by
  adding Blob storage to the Vercel project). Uploaded demo receipts render and
  are cleared on reset. No code change to `storage.ts`.

### Deployment + freshness

- **Vercel** project, **Neon** free Postgres (one-click Vercel integration),
  seeded via `seed-demo.ts`.
- **Vercel Cron** nightly → secret-protected `POST /api/demo/reset` that
  truncates and re-runs the demo seed. Protected by a `DEMO_RESET_SECRET`
  header/token check so only Cron can trigger it.

### Demo affordance

- A small persistent banner: "Demo — sample data, resets nightly."

## Environment (demo deployment)

Set on Vercel:
- `DEMO_MODE=1`
- `DATABASE_URL` / `DIRECT_URL` → Neon
- `AUTH_SECRET`, `NEXTAUTH_URL`
- `BLOB_READ_WRITE_TOKEN` (auto)
- `DEMO_RESET_SECRET`

**Not set:** `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEETS_KEY_FILE`,
`GOOGLE_SHEETS_SPREADSHEET_ID`.

## Out of Scope (do not touch)

- Real `.env.local`, real database, real spreadsheet, real production deploy plan.
- The real Google/Blob code paths — DEMO_MODE only *bypasses* them; it does not
  modify their behavior when the flag is off.

## Success Criteria

1. With `DEMO_MODE=1` and no Google env vars set, the app builds and every
   dashboard/budget page renders with seeded data (no "credentials missing"
   crash).
2. Officer flow: log in via button → view budgets → submit a reimbursement →
   it appears in the requests list.
3. Admin flow: log in via button → approve a pending reimbursement → status
   updates. No unhandled sheet errors.
4. `POST /api/demo/reset` with the correct secret restores pristine seed state;
   without the secret it is rejected.
5. `DEMO_MODE` off (default) leaves all real behavior byte-for-byte unchanged.
