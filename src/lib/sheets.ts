import "server-only";
import { google, type sheets_v4 } from "googleapis";
import { readFileSync } from "fs";

/**
 * Low-level Google Sheets access for the FA26 Budget & Roster spreadsheet.
 *
 * Auth uses a Google service account (no per-user OAuth). The spreadsheet must
 * be shared with the service account's client_email as Editor.
 *
 * Credentials are loaded from, in order of preference:
 *   1. GOOGLE_SERVICE_ACCOUNT_JSON — full JSON key as a string (use on Vercel)
 *   2. GOOGLE_SHEETS_KEY_FILE      — path to the JSON key file (use locally)
 *
 * This module is server-only: it must never be imported into client components
 * or edge middleware (it reads the filesystem and a private key).
 */

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function loadCredentials(): { client_email: string; private_key: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim().length > 0) {
    const parsed = JSON.parse(raw);
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  }

  const keyFile = process.env.GOOGLE_SHEETS_KEY_FILE;
  if (keyFile) {
    const parsed = JSON.parse(readFileSync(keyFile, "utf8"));
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  }

  throw new Error(
    "Google Sheets credentials missing: set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEETS_KEY_FILE."
  );
}

let cachedClient: sheets_v4.Sheets | null = null;

function client(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const { client_email, private_key } = loadCredentials();
  const auth = new google.auth.JWT({
    email: client_email,
    // Normalize escaped newlines (Vercel env vars store \n literally).
    key: private_key.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

export function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set.");
  return id;
}

/** Read a rectangular range; returns rows of raw cell values (may be ragged). */
export async function readRange(range: string): Promise<unknown[][]> {
  const res = await client().spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range,
  });
  return (res.data.values as unknown[][]) ?? [];
}

/** Append one or more rows to the bottom of a tab's data table. */
export async function appendRows(tab: string, rows: unknown[][]): Promise<void> {
  await client().spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows as never[][] },
  });
}

/** Overwrite a specific range (e.g. a single cell "Tab!B25"). */
export async function writeRange(range: string, rows: unknown[][]): Promise<void> {
  await client().spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows as never[][] },
  });
}

/** Batch-read several ranges in one round trip. Returns rows per range, in order. */
export async function batchRead(ranges: string[]): Promise<unknown[][][]> {
  const res = await client().spreadsheets.values.batchGet({
    spreadsheetId: spreadsheetId(),
    ranges,
  });
  return (res.data.valueRanges ?? []).map((vr) => (vr.values as unknown[][]) ?? []);
}
