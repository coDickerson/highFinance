import "server-only";
import { unstable_cache } from "next/cache";
import { readRange, appendRows, writeRange, batchRead } from "./sheets";
import { isDemoMode } from "./demo";
import { DEMO_POSITION_BUDGETS, DEMO_FEES_AND_INCOME, DEMO_ROSTER } from "./ledger-demo";

/**
 * Domain mapping between the app and the "FA26 Budget & Roster" spreadsheet.
 *
 * Ownership split (see project-pivot):
 *   - Sheet owns (app reads): officer-position budgets, fees & income, dues/roster.
 *   - App owns (app writes): reimbursements, roster signups, officer spend.
 *
 * All tab names and cell coordinates below were verified against the live sheet.
 */

// ── Officer Allocations tab ────────────────────────────────────────────────
// Positions are laid out across even columns; each spans a 2-column block.
// "Planned Officer Budgets": Total Budget on row 13.
// "Officer Budget Tracking": line items rows 21–58, Total Spent row 59, Remaining row 60.
const ALLOC_TAB = "Officer Allocations";
const PLANNED_TOTAL_ROW = 13;
const TRACKING_FIRST_ROW = 21;
const TRACKING_LAST_ROW = 58;
const TRACKING_TOTAL_ROW = 59;
const TRACKING_REMAINING_ROW = 60;

/** Sheet position name → its amount column in Officer Allocations. */
export const POSITION_COLUMN: Record<string, string> = {
  "Psi (Social)": "B",
  Brotherhood: "D",
  Rush: "F",
  Housing: "H",
  Kitchen: "J",
  Iota: "L",
  Risk: "N",
  Sustainability: "P",
  Misc: "R",
  Emergency: "T",
  Philo: "V",
  President: "X",
  "Retreat/Formal": "Z",
  IM: "AB",
};

export type Position = keyof typeof POSITION_COLUMN;

/**
 * Map an app department name (or a reimbursement's "which budget" answer) to a
 * sheet position. Kept as an explicit lookup per the "keep app departments + map"
 * decision. Extend as app departments are aligned to positions.
 */
export const DEPARTMENT_TO_POSITION: Record<string, Position> = {
  Social: "Psi (Social)",
  "Psi (Social)": "Psi (Social)",
  Brotherhood: "Brotherhood",
  Rush: "Rush",
  Housing: "Housing",
  Kitchen: "Kitchen",
  Iota: "Iota",
  Risk: "Risk",
  Sustainability: "Sustainability",
  Misc: "Misc",
  Emergency: "Emergency",
  Philo: "Philo",
  President: "President",
  "Retreat/Formal": "Retreat/Formal",
  Formal: "Retreat/Formal",
  Retreat: "Retreat/Formal",
  IM: "IM",
};

export function resolvePosition(departmentOrBudget: string): Position | null {
  const exact = DEPARTMENT_TO_POSITION[departmentOrBudget.trim()];
  return exact ?? null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const n = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cell(rows: unknown[][], r: number, c: number): unknown {
  return rows[r]?.[c] ?? "";
}

// ── Reads (sheet → app) ──────────────────────────────────────────────────────

export type PositionBudget = {
  position: Position;
  column: string;
  planned: number;
  spent: number;
  remaining: number;
};

/** Read planned / spent / remaining for every officer position. */
export async function getPositionBudgets(): Promise<PositionBudget[]> {
  if (isDemoMode()) return DEMO_POSITION_BUDGETS;
  const [planned, spent, remaining] = await batchRead([
    `${ALLOC_TAB}!A${PLANNED_TOTAL_ROW}:AB${PLANNED_TOTAL_ROW}`,
    `${ALLOC_TAB}!A${TRACKING_TOTAL_ROW}:AB${TRACKING_TOTAL_ROW}`,
    `${ALLOC_TAB}!A${TRACKING_REMAINING_ROW}:AB${TRACKING_REMAINING_ROW}`,
  ]);
  const colIndex = (col: string) =>
    col.split("").reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;

  return (Object.entries(POSITION_COLUMN) as [Position, string][]).map(
    ([position, column]) => {
      const i = colIndex(column);
      return {
        position,
        column,
        planned: toNumber(cell(planned, 0, i)),
        spent: toNumber(cell(spent, 0, i)),
        remaining: toNumber(cell(remaining, 0, i)),
      };
    }
  );
}

/**
 * Cached (~60s) position budgets, so officer page loads don't hit the Sheets
 * API on every render (the service account shares a 60 reads/min quota).
 */
export const getPositionBudgetsCached = unstable_cache(
  () => getPositionBudgets(),
  ["officer-position-budgets"],
  { revalidate: 60 }
);

/** Cached map of sheet position → planned budget total (from Officer Allocations row 13). */
export async function getPlannedBudgetMap(): Promise<Map<string, number>> {
  if (isDemoMode()) return new Map(DEMO_POSITION_BUDGETS.map((b) => [b.position, b.planned]));
  const list = await getPositionBudgetsCached();
  return new Map(list.map((b) => [b.position, b.planned]));
}

/**
 * Resolve a department's planned budget from the sheet. Returns the sheet total
 * when present (> 0), otherwise null so callers can fall back to the DB value.
 */
export async function plannedBudgetForDepartment(
  departmentName: string
): Promise<number | null> {
  const position = resolvePosition(departmentName);
  if (!position) return null;
  const planned = (await getPlannedBudgetMap()).get(position);
  return planned && planned > 0 ? planned : null;
}

export type FeeIncomeLine = {
  category: string;
  item: string;
  perMember: number;
  estTotal: number;
  notes: string;
};

/** Read the Income and Expenses tables from the Overview tab. */
export async function getFeesAndIncome(): Promise<{
  income: FeeIncomeLine[];
  expenses: FeeIncomeLine[];
}> {
  if (isDemoMode()) return DEMO_FEES_AND_INCOME;
  const [income, expenses] = await batchRead([
    "Overview!A5:E18",
    "Overview!A23:E36",
  ]);
  const parse = (rows: unknown[][]): FeeIncomeLine[] =>
    rows
      .filter((r) => r && (r[1] ?? "") !== "")
      .map((r) => ({
        category: String(r[0] ?? ""),
        item: String(r[1] ?? ""),
        perMember: toNumber(r[2]),
        estTotal: toNumber(r[3]),
        notes: String(r[4] ?? ""),
      }));
  return { income: parse(income), expenses: parse(expenses) };
}

export type RosterEntry = {
  name: string;
  year: string;
  baseRate: number;
  amtPaid: number;
  amtLeft: number;
  complete: boolean;
};

/** Read the member roster + dues status from the Dues tab. */
export async function getRoster(): Promise<RosterEntry[]> {
  if (isDemoMode()) return DEMO_ROSTER;
  const rows = await readRange("Dues!A3:F200");
  return rows
    .filter((r) => r && String(r[0] ?? "").trim() !== "")
    .map((r) => ({
      name: String(r[0] ?? ""),
      year: String(r[1] ?? ""),
      baseRate: toNumber(r[2]),
      amtPaid: toNumber(r[3]),
      amtLeft: toNumber(r[4]),
      complete: String(r[5] ?? "").trim().toUpperCase() === "YES",
    }));
}

// ── Writes (app → sheet) ─────────────────────────────────────────────────────

// Reimbursements tab: form columns A–K, plus app-added Status (L) and a hidden
// App Request ID (M) used to locate a row when its status changes.
const REIMB_TAB = "Reimbursements";
const REIMB_STATUS_COL = "L";
const REIMB_ID_COL = "M";

export type ReimbursementRow = {
  email: string;
  name: string;
  berkeleyEmail: string;
  phone: string;
  venmo: string;
  amount: number;
  paymentMethod: string;
  budget: string;
  purpose: string;
  receiptUrl: string;
  status: string;
  requestId: string;
};

/** Append a reimbursement to the Reimbursements tab (columns A–M). */
export async function appendReimbursement(r: ReimbursementRow): Promise<void> {
  if (isDemoMode()) return;
  await appendRows(REIMB_TAB, [
    [
      new Date().toLocaleString("en-US"),
      r.email,
      r.name,
      r.berkeleyEmail,
      r.phone,
      r.venmo,
      r.amount,
      r.paymentMethod,
      r.budget,
      r.purpose,
      r.receiptUrl,
      r.status,
      r.requestId,
    ],
  ]);
}

/**
 * Update the Status cell for an app-submitted reimbursement, located by its
 * App Request ID in column M. Returns true if a matching row was found.
 */
export async function updateReimbursementStatus(
  requestId: string,
  status: string
): Promise<boolean> {
  if (isDemoMode()) return true;
  const ids = await readRange(`${REIMB_TAB}!${REIMB_ID_COL}2:${REIMB_ID_COL}`);
  const idx = ids.findIndex((r) => String(r?.[0] ?? "") === requestId);
  if (idx === -1) return false;
  const row = idx + 2; // data starts at row 2 (row 1 is headers)
  await writeRange(`${REIMB_TAB}!${REIMB_STATUS_COL}${row}`, [[status]]);
  return true;
}

export type RosterSignupRow = {
  name: string;
  email: string;
  phone: string;
  year: string;
  major: string;
  pledgeClass: string;
  guardianName: string;
  guardianPhone: string;
  active: string;
  shirtSize: string;
};

/** Append a new-member signup to the Roster Form tab (columns A–K). */
export async function appendRosterSignup(r: RosterSignupRow): Promise<void> {
  if (isDemoMode()) return;
  await appendRows("Roster Form", [
    [
      new Date().toLocaleString("en-US"),
      r.name,
      r.email,
      r.phone,
      r.year,
      r.major,
      r.pledgeClass,
      r.guardianName,
      r.guardianPhone,
      r.active,
      r.shirtSize,
    ],
  ]);
}

/**
 * Record an officer's spend into the Officer Budget Tracking matrix: write the
 * amount into the next empty row of the position's column (the Total Spent /
 * Remaining cells below are sheet formulas that update automatically).
 * Returns the A1 cell written, or null if the position is unknown / column full.
 */
export async function recordSpend(
  position: Position,
  amount: number,
  description?: string
): Promise<string | null> {
  if (isDemoMode()) return null;
  const col = POSITION_COLUMN[position];
  if (!col) return null;

  const existing = await readRange(
    `${ALLOC_TAB}!${col}${TRACKING_FIRST_ROW}:${col}${TRACKING_LAST_ROW}`
  );
  let offset = existing.findIndex((r) => (r?.[0] ?? "") === "");
  if (offset === -1) {
    if (existing.length >= TRACKING_LAST_ROW - TRACKING_FIRST_ROW + 1) return null;
    offset = existing.length; // all returned rows are filled; next is just past them
  }
  const row = TRACKING_FIRST_ROW + offset;
  await writeRange(`${ALLOC_TAB}!${col}${row}`, [[amount]]);

  // Best-effort: write a label in the paired column to the right (e.g. C for B).
  if (description) {
    const labelCol = String.fromCharCode(col.charCodeAt(col.length - 1) + 1);
    const prefix = col.length > 1 ? col.slice(0, -1) : "";
    try {
      await writeRange(`${ALLOC_TAB}!${prefix}${labelCol}${row}`, [[description]]);
    } catch {
      /* paired cell may be merged; the amount is what matters */
    }
  }
  return `${col}${row}`;
}
