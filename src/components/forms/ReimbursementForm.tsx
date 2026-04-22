"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  departments: { id: string; name: string }[];
  defaultDepartmentId?: string;
}

const PAYMENT_METHODS = [
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "check", label: "Check" },
];

export function ReimbursementForm({ departments, defaultDepartmentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsVenmoZelle = paymentMethod === "venmo" || paymentMethod === "zelle";

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!receiptFile) {
      setError("Please attach a receipt image.");
      setLoading(false);
      return;
    }

    const form = e.currentTarget;
    const data = new FormData();
    data.append("departmentId", (form.elements.namedItem("departmentId") as HTMLSelectElement).value);
    data.append("amount", (form.elements.namedItem("amount") as HTMLInputElement).value);
    data.append("paymentMethod", paymentMethod);
    const venmoZelleEl = form.elements.namedItem("venmoZelle") as HTMLInputElement | null;
    if (venmoZelleEl) data.append("venmoZelle", venmoZelleEl.value);
    data.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    data.append("receipt", receiptFile);

    const res = await fetch("/api/requests", { method: "POST", body: data });

    if (res.ok) {
      router.push("/requests");
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to submit request. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors";
  const labelClass =
    "block text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Department / Budget */}
      <div>
        <label className={labelClass}>Department Budget</label>
        <select
          name="departmentId"
          defaultValue={defaultDepartmentId}
          required
          className={inputClass + " cursor-pointer"}
        >
          <option value="">Select department…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className={labelClass}>Amount ($)</label>
        <input
          type="number"
          name="amount"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
          className={inputClass}
        />
      </div>

      {/* Payment method */}
      <div>
        <label className={labelClass}>Payment Method</label>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_METHODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPaymentMethod(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                paymentMethod === value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
                  : "border-transparent bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Venmo / Zelle address — only shown when relevant */}
      {needsVenmoZelle && (
        <div>
          <label className={labelClass}>
            {paymentMethod === "venmo" ? "Venmo" : "Zelle"} Address
          </label>
          <input
            type="text"
            name="venmoZelle"
            placeholder={paymentMethod === "venmo" ? "@username" : "email or phone"}
            required
            className={inputClass}
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className={labelClass}>Description of Purchase</label>
        <textarea
          name="description"
          rows={4}
          required
          placeholder="Describe the expense and its business purpose…"
          className={inputClass + " resize-none"}
        />
      </div>

      {/* Receipt upload */}
      <div>
        <label className={labelClass}>Receipt</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleReceiptChange}
          className="hidden"
        />
        {receiptPreview ? (
          <div className="relative rounded-xl overflow-hidden bg-[var(--color-surface-container)] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="w-full max-h-48 object-cover"
            />
            <button
              type="button"
              onClick={() => { setReceiptFile(null); setReceiptPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
            <div className="px-4 py-2 text-xs text-[var(--color-on-surface-variant)] truncate">
              {receiptFile?.name}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 rounded-xl border-2 border-dashed border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-all flex flex-col items-center gap-2"
          >
            <span className="material-symbols-outlined text-[32px]">upload_file</span>
            <span className="text-sm font-medium">Click to upload receipt</span>
            <span className="text-xs">PNG, JPG, or PDF</span>
          </button>
        )}
      </div>

      {error && (
        <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-container)] px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl text-[var(--color-on-surface)] text-sm font-semibold bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #002046 0%, #1b365d 100%)" }}
        >
          {loading ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
