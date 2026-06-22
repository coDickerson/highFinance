/**
 * Academic term filtering for budgets.
 *
 * The app currently focuses on FA26. Budgets are stored per (semester, year),
 * so every budget view resolves a single "active term" — driven by a `?term=`
 * URL param and a semester-switcher UI — and filters its DB queries to it.
 *
 * `DEFAULT_TERM` is FA26. To add past/future terms, append to `TERMS`; the
 * switcher and all queries pick them up automatically.
 */

export type Semester = "fall" | "spring";

export type Term = {
  /** URL-safe key used in `?term=` (e.g. "fa26"). */
  key: string;
  semester: Semester;
  year: number;
  /** Human label for the switcher (e.g. "Fall 2026"). */
  label: string;
  /** Short label (e.g. "FA26"). */
  short: string;
};

// Newest first. The first entry is the default.
export const TERMS: Term[] = [
  { key: "fa26", semester: "fall", year: 2026, label: "Fall 2026", short: "FA26" },
  { key: "sp26", semester: "spring", year: 2026, label: "Spring 2026", short: "SP26" },
];

export const DEFAULT_TERM: Term = TERMS[0];

/** Resolve a `?term=` value to a known term, falling back to the default (FA26). */
export function resolveTerm(key?: string | string[]): Term {
  const k = Array.isArray(key) ? key[0] : key;
  return TERMS.find((t) => t.key === k) ?? DEFAULT_TERM;
}
