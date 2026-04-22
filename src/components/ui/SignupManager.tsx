"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

interface Department {
  id: string;
  name: string;
}

interface SignupRequest {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role: string;
  status: string;
  createdAt: string;
  department: { name: string } | null;
}

interface Props {
  requests: SignupRequest[];
  departments: Department[];
}

export function SignupManager({ requests, departments }: Props) {
  const [tab, setTab] = useState<"pending" | "approved" | "denied">("pending");
  const [selected, setSelected] = useState<string | null>(
    requests.find((r) => r.status === "pending")?.id ?? null
  );
  const [localRequests, setLocalRequests] = useState(requests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = localRequests.filter((r) => r.status === tab);
  const selectedReq = localRequests.find((r) => r.id === selected);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editRole, setEditRole] = useState<"officer" | "executive">("officer");

  function selectRequest(req: SignupRequest) {
    setSelected(req.id);
    setEditName(req.name);
    setEditEmail(req.email);
    setEditDeptId(req.departmentId ?? "");
    setEditRole(req.role === "executive" ? "executive" : "officer");
    setError("");
  }

  async function handleAction(action: "approved" | "denied") {
    if (!selected) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/signup/${selected}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: action,
        name: editName,
        email: editEmail,
        departmentId: editDeptId || null,
        role: editRole,
      }),
    });
    if (res.ok) {
      setLocalRequests((prev) =>
        prev.map((r) =>
          r.id === selected
            ? {
                ...r,
                status: action,
                name: editName,
                email: editEmail,
                departmentId: editDeptId || null,
                role: editRole,
                department: departments.find((d) => d.id === editDeptId) ?? null,
              }
            : r
        )
      );
      setSelected(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
    }
    setLoading(false);
  }

  const tabCounts = {
    pending: localRequests.filter((r) => r.status === "pending").length,
    approved: localRequests.filter((r) => r.status === "approved").length,
    denied: localRequests.filter((r) => r.status === "denied").length,
  };

  const inputClass =
    "w-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] text-sm px-4 py-3 rounded-xl outline-none border-b-2 border-transparent focus:border-[var(--color-primary)] transition-colors";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1.5";

  return (
    <div className="flex gap-5 h-full">
      {/* Left pane */}
      <div className="w-5/12 flex flex-col gap-4">
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

        <div className="space-y-2 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-[var(--color-on-surface-variant)] text-sm text-center py-8">
              No {tab} requests.
            </p>
          )}
          {filtered.map((req) => (
            <button
              key={req.id}
              onClick={() => selectRequest(req)}
              className={`w-full text-left p-4 rounded-xl border-l-4 transition-all ${
                selected === req.id
                  ? "bg-[var(--color-surface-container-lowest)] shadow-sm ring-1 ring-[var(--color-primary)]/10 border-[var(--color-primary)]"
                  : "bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container)] border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[16px]">
                    person_add
                  </span>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {req.department?.name ?? "No department"}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-sm font-semibold text-[var(--color-on-surface)] line-clamp-1 mb-1">
                {req.name}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  {req.email}
                </p>
                <p className="text-xs text-[var(--color-on-surface-variant)] capitalize">
                  {new Date(req.createdAt).toLocaleDateString()}
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
              <span className="material-symbols-outlined text-[48px] mb-2 block">person_search</span>
              <p className="text-sm">Select a request to review</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">
                  Membership Request
                </p>
                <h3 className="font-display font-bold text-lg text-[var(--color-on-surface)]">
                  {selectedReq.name}
                </h3>
              </div>
              <StatusBadge status={selectedReq.status} />
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                {selectedReq.status === "pending" ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-sm text-[var(--color-on-surface)] px-4 py-3 bg-[var(--color-surface-container-low)] rounded-xl">
                    {selectedReq.name}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Email</label>
                {selectedReq.status === "pending" ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-sm text-[var(--color-on-surface)] px-4 py-3 bg-[var(--color-surface-container-low)] rounded-xl">
                    {selectedReq.email}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Department</label>
                {selectedReq.status === "pending" ? (
                  <select
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                    className={inputClass + " cursor-pointer"}
                  >
                    <option value="">No department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-[var(--color-on-surface)] px-4 py-3 bg-[var(--color-surface-container-low)] rounded-xl">
                    {selectedReq.department?.name ?? "No department"}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Access Level</label>
                {selectedReq.status === "pending" ? (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as "officer" | "executive")}
                    className={inputClass + " cursor-pointer"}
                  >
                    <option value="officer">Officer</option>
                    <option value="executive">Executive</option>
                  </select>
                ) : (
                  <p className="text-sm text-[var(--color-on-surface)] px-4 py-3 bg-[var(--color-surface-container-low)] rounded-xl capitalize">
                    {selectedReq.role}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[var(--color-surface-container-low)] rounded-xl p-3">
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-0.5">Submitted</p>
              <p className="text-sm font-medium text-[var(--color-on-surface)]">
                {new Date(selectedReq.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {error && (
              <p className="text-[var(--color-error)] text-sm bg-[var(--color-error-container)] px-4 py-2 rounded-lg">
                {error}
              </p>
            )}

            {selectedReq.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction("approved")}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                  style={{ background: "#006d37" }}
                >
                  Approve & Create Account
                </button>
                <button
                  onClick={() => handleAction("denied")}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-[var(--color-error)] disabled:opacity-60 transition-colors"
                >
                  Deny Request
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
