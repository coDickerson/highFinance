import { put } from "@vercel/blob";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Receipts are images or PDFs. We never trust the uploaded file name or its
// client-supplied MIME type: both the on-disk extension and the served
// content-type are derived from this allowlist, so a crafted name like
// `x.html` or `x.jpg/../../evil` can neither traverse the path nor cause the
// file to be served as an executable/inline-rendered type.
const ALLOWED_EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
};

/** Pick a safe extension + content-type from the file name, defaulting to jpg. */
function safeExtension(name: string): { ext: string; contentType: string } {
  const raw = name.match(/\.([a-z0-9]{1,5})$/i)?.[1]?.toLowerCase() ?? "";
  const ext = raw in ALLOWED_EXTENSIONS ? raw : "jpg";
  return { ext, contentType: ALLOWED_EXTENSIONS[ext] };
}

/**
 * Persist an uploaded receipt and return a URL that can be stored in the DB /
 * spreadsheet and rendered in an <img>/<a>.
 *
 * - In production (Vercel) a `BLOB_READ_WRITE_TOKEN` is present, so the file is
 *   uploaded to Vercel Blob and an absolute, durable URL is returned. This is
 *   required because the serverless filesystem is ephemeral.
 * - Locally there is usually no token, so we fall back to writing the file under
 *   `public/uploads` and return a `/uploads/...` path, keeping the dev flow
 *   working without any extra setup.
 */
export async function saveReceipt(file: File): Promise<string> {
  const { ext, contentType } = safeExtension(file.name);
  const filename = `${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`receipts/${filename}`, file, {
      access: "public",
      contentType,
    });
    return blob.url;
  }

  // Local-dev fallback.
  const uploadDir = join(process.cwd(), "public", "uploads");
  const bytes = await file.arrayBuffer();
  await writeFile(join(uploadDir, filename), Buffer.from(bytes));
  return `/uploads/${filename}`;
}
