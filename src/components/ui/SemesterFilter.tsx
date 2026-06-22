import Link from "next/link";
import { TERMS } from "@/lib/term";

/**
 * Segmented control to switch the active budget term. Rendered as links so it
 * works without client JS; `?term=` drives server-side filtering.
 */
export function SemesterFilter({
  activeKey,
  basePath = "",
}: {
  activeKey: string;
  basePath?: string;
}) {
  return (
    <div className="inline-flex rounded-full bg-[var(--color-surface-container)] p-1 gap-1">
      {TERMS.map((t) => {
        const active = t.key === activeKey;
        return (
          <Link
            key={t.key}
            href={`${basePath}?term=${t.key}`}
            scroll={false}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
            }`}
          >
            {t.short}
          </Link>
        );
      })}
    </div>
  );
}
