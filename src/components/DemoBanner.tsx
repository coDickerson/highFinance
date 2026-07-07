/** Thin ribbon shown only in the public demo so viewers know data is sample data. */
export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "1") return null;
  return (
    <div className="fixed inset-x-0 bottom-16 md:bottom-0 z-30 w-full bg-[var(--color-primary)] text-black text-center text-xs font-medium py-1.5 px-4">
      Demo — sample data only. Anything you change resets nightly.
    </div>
  );
}
