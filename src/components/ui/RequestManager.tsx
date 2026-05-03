"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

interface Receipt {
  id: string;
  filename: string;
  url: string;
}

interface Request {
  id: string;
  description: string;
  amount: number;
  status: string;
  category: string;
  project: string | null;
  internalNote: string | null;
  createdAt: string;
  submittedBy: { name: string };
  department: { name: string };
  receipts: Receipt[];
}

interface Props {
  requests: Request[];
  isAdmin?: boolean;
}

export function RequestManager({ requests, isAdmin = false }: Props) {
  const [tab, setTab] = useState<"pending" | "approved" | "denied">("pending");
  const [selected, setSelected] = useState<string | null>(
    requests.find((r) => r.status === "pending")?.id ?? null
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [localRequests, setLocalRequests] = useState(requests);

  const filtered = localRequests.filter((r) => r.status === tab);
  const selectedReq = localRequests.find((r) => r.id === selected);

  async function handleAction(action: "approved" | "denied") {
    if (!selected) return;
    setLoading(true);
    const res = await fetch(`/api/requests/${selected}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action, internalNote: note }),
    });
    if (res.ok) {
      setLocalRequests((prev) =>
        prev.map((r) =>
          r.id === selected ? { ...r, status: action, internalNote: note } : r
        )
      );
      setNote("");
      setSelected(null);
    }
    setLoading(false);
  }

  const tabCounts = {
    pending: localRequests.filter((r) => r.status === "pending").length,
    approved: localRequests.filter((r) => r.status === "approved").length,
    denied: localRequests.filter((r) => r.status === "denied").length,
  };

  return (
    <div className="flex gap-5 h-full">
      {/* Left pane */}
      <div className="w-5/12 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--color-surface-container)] p-1 rounded-xl">
          {(["pending", "approved", "denied"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${
                tab === t
                  ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
              }`}
            >
              {t} ({tabCounts[t]})
            </button>
          ))}
        </div>

        {/* Request list */}
        <div className="space-y-2 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-[var(--color-on-surface-variant)] text-sm text-center py-8">
              No {tab} requests.
            </p>
          )}
          {filtered.map((req) => (
            <button
              key={req.id}
              onClick={() => setSelected(req.id)}
              className={`w-full text-left p-4 rounded-xl border-l-4 transition-all ${
                selected === req.id
                  ? "bg-[var(--color-surface-container-lowest)] shadow-sm ring-1 ring-[var(--color-primary)]/10 border-[var(--color-primary)]"
                  : "bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container)] border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[16px]">
                    request_page
                  </span>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {req.department.name}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-sm font-semibold text-[var(--color-on-surface)] line-clamp-1 mb-1">
                {req.description}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  {req.submittedBy.name} · {new Date(req.createdAt).toLocaleDateString()}
                </p>
                <p className="font-semibold text-sm text-[var(--color-on-surface)]">
                  {Number(req.amount).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right pane */}
      <div className="w-7/12 bg-[var(--color-surface-container-lowest)] rounded-2xl overflow-y-auto">
        {!selectedReq ? (
          <div className="flex items-center justify-center h-full text-[var(--color-on-surface-variant)]">
            <div className="text-center">
              <span className="material-symbols-outlined text-[48px] mb-2 block">inbox</span>
              <p className="text-sm">Select a request to review</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">
                  {selectedReq.category}
                  {selectedReq.project && ` · ${selectedReq.project}`}
                </p>
                <h3 className="font-display font-bold text-lg text-[var(--color-on-surface)]">
                  {selectedReq.description}
                </h3>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-extrabold text-[var(--color-on-surface)]">
                  {Number(selectedReq.amount).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </p>
                <StatusBadge status={selectedReq.status} />
              </div>
            </div>

            {/* Submitter info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Submitted by", value: selectedReq.submittedBy.name },
                { label: "Department", value: selectedReq.department.name },
                { label: "Date", value: new Date(selectedReq.createdAt).toLocaleDateString() },
                { label: "Category", value: selectedReq.category },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[var(--color-surface-container-low)] rounded-xl p-3">
                  <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">{value}</p>
                </div>
              ))}
            </div>

            {/* Receipts */}
            {selectedReq.receipts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2">
                  Attachments
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedReq.receipts.map((r) => (
                    <div
                      key={r.id}
                      className="relative group w-24 h-20 rounded-xl overflow-hidden bg-[var(--color-surface-container)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.url}
                        alt={r.filename}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                        <span className="material-symbols-outlined text-white text-[20px]">zoom_in</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Internal note + actions — only for admin on pending requests */}
            {isAdmin && selectedReq.status === "pending" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1.5">
                    Internal Note
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note for this decision…"
                    rows={3}
                    className="w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction("approved")}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                    style={{ background: "#006d37" }}
                  >
                    Confirm Approval
                  </button>
                  <button
                    onClick={() => handleAction("denied")}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-[var(--color-error)] disabled:opacity-60 transition-colors"
                  >
                    Deny Request
                  </button>
                </div>
              </div>
            )}

            {/* Show internal note for decided requests */}
            {selectedReq.status !== "pending" && selectedReq.internalNote && (
              <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1">
                  Internal Note
                </p>
                <p className="text-sm text-[var(--color-on-surface)]">{selectedReq.internalNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
