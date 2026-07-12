import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import {
  listMaintenanceAssets,
  listMaintenanceRequests,
  raiseMaintenanceRequest,
  updateMaintenanceStatus,
} from "../api/maintenance";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  Spinner,
  inputClass,
  timeAgo,
} from "../components/ui";

// The 5-state kanban per mockup Screen 7. Rejected is a side-exit (only
// reachable from Pending) and gets its own strip below the board instead of
// a 6th column — it's not part of the forward flow.
const COLUMNS = [
  { key: "Pending", label: "Pending", icon: "🕓" },
  { key: "Approved", label: "Approved", icon: "✅" },
  { key: "Technician Assigned", label: "Technician Assigned", icon: "🧑‍🔧" },
  { key: "In Progress", label: "In Progress", icon: "🔨" },
  { key: "Resolved", label: "Resolved", icon: "🏁" },
];

const NEXT_STATUS = {
  Pending: "Approved",
  Approved: "Technician Assigned",
  "Technician Assigned": "In Progress",
  "In Progress": "Resolved",
};

const PRIORITY_TONE = { Low: "info", Medium: "warning", High: "danger" };
const PRIORITY_BORDER = { Low: "border-l-sky-400", Medium: "border-l-amber-400", High: "border-l-red-400" };

export default function Maintenance() {
  const { user } = useAuth();
  const canManage = user?.role === "Asset Manager" || user?.role === "Admin";

  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // request open in detail modal
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [dragOverCol, setDragOverCol] = useState(null);

  async function refresh() {
    const [reqRes, assetRes, empRes] = await Promise.all([
      listMaintenanceRequests(),
      listMaintenanceAssets(),
      api("/employees"),
    ]);
    if (reqRes.ok) setRequests(reqRes.data);
    if (assetRes.ok) setAssets(assetRes.data);
    if (empRes.ok) setEmployees(empRes.data);
    if (!reqRes.ok) setError(reqRes.error);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const byColumn = useMemo(() => {
    const grouped = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    const rejected = [];
    for (const r of requests) {
      if (r.status === "Rejected") rejected.push(r);
      else if (grouped[r.status]) grouped[r.status].push(r);
    }
    return { grouped, rejected };
  }, [requests]);

  async function move(request, nextStatus, assignedToId) {
    setError("");
    const res = await updateMaintenanceStatus(request.id, {
      status: nextStatus,
      assigned_to_id: assignedToId ?? null,
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => (r.id === request.id ? res.data : r)));
      setSelected((prev) => (prev?.id === request.id ? res.data : prev));
    } else {
      setError(res.error);
    }
    return res.ok;
  }

  function handleDrop(columnKey, e) {
    e.preventDefault();
    setDragOverCol(null);
    if (!canManage) return;
    const requestId = Number(e.dataTransfer.getData("text/plain"));
    const request = requests.find((r) => r.id === requestId);
    if (!request || request.status === columnKey) return;
    if (NEXT_STATUS[request.status] !== columnKey) {
      setError(`Can't skip stages — move '${request.status}' forward one step at a time.`);
      return;
    }
    if (columnKey === "Technician Assigned") {
      setSelected(request); // ask who to assign via the detail modal instead
      return;
    }
    move(request, columnKey);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Maintenance</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {requests.length} request{requests.length === 1 ? "" : "s"} total
            {byColumn.rejected.length > 0 && ` · ${byColumn.rejected.length} rejected`}
          </p>
        </div>
        <Button onClick={() => setRaiseOpen(true)}>+ Raise Request</Button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner onDismiss={() => setError("")}>{error}</Banner>
        </div>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (canManage) setDragOverCol(col.key);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                onDrop={(e) => handleDrop(col.key, e)}
                className={`flex min-h-[200px] flex-col gap-3 rounded-2xl border border-dashed p-3 transition-colors ${
                  dragOverCol === col.key
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                    : "border-[var(--color-border)]"
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold">
                    {col.icon} {col.label}
                  </span>
                  <Badge>{byColumn.grouped[col.key].length}</Badge>
                </div>

                {byColumn.grouped[col.key].length === 0 && (
                  <p className="px-1 text-xs text-[var(--color-muted)]">No requests</p>
                )}

                {byColumn.grouped[col.key].map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    draggable={canManage}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", String(r.id))}
                    onClick={() => setSelected(r)}
                  />
                ))}
              </div>
            ))}
          </div>

          {byColumn.rejected.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-muted)]">
                Rejected ({byColumn.rejected.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {byColumn.rejected.map((r) => (
                  <RequestCard key={r.id} request={r} onClick={() => setSelected(r)} muted />
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <div className="mt-6">
              <EmptyState
                icon="🔧"
                title="No maintenance requests yet"
                subtitle="Raise one from the button above to get the board moving."
              />
            </div>
          )}
        </>
      )}

      <RaiseRequestModal
        open={raiseOpen}
        onClose={() => setRaiseOpen(false)}
        assets={assets}
        onCreated={(created) => {
          setRequests((prev) => [created, ...prev]);
          setRaiseOpen(false);
        }}
      />

      <RequestDetailModal
        request={selected}
        canManage={canManage}
        employees={employees}
        onClose={() => setSelected(null)}
        onMove={move}
      />
    </div>
  );
}

function RequestCard({ request, onClick, draggable = false, onDragStart, muted = false }) {
  return (
    <Card
      className={`cursor-pointer border-l-4 !p-3 transition-transform hover:-translate-y-0.5 hover:border-[var(--color-accent)]/60 ${
        PRIORITY_BORDER[request.priority] || "border-l-[var(--color-border)]"
      } ${muted ? "opacity-70" : ""}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{request.asset_name}</p>
        <Badge tone={PRIORITY_TONE[request.priority]}>{request.priority}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-[var(--color-muted)]">{request.asset_tag}</p>
      <p className="mt-2 line-clamp-2 text-xs text-[var(--color-muted)]">{request.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>{request.raised_by_name || "—"}</span>
        <span className="flex items-center gap-1.5">
          {request.photo_url && <span title="Has photo">📷</span>}
          {timeAgo(request.created_at)}
        </span>
      </div>
    </Card>
  );
}

function RaiseRequestModal({ open, onClose, assets, onCreated }) {
  const [assetId, setAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open) {
      setAssetId("");
      setDescription("");
      setPriority("Medium");
      setPhotoUrl("");
      setFormError("");
    }
  }, [open]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!assetId) return setFormError("Choose an asset.");
    if (!description.trim()) return setFormError("Describe the issue.");
    setFormError("");
    setBusy(true);
    const res = await raiseMaintenanceRequest({
      asset_id: Number(assetId),
      description: description.trim(),
      priority,
      photo_url: photoUrl.trim() || null,
    });
    setBusy(false);
    if (res.ok) onCreated(res.data);
    else setFormError(res.error);
  }

  return (
    <Modal open={open} onClose={onClose} title="Raise Maintenance Request">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Asset">
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className={inputClass}>
            <option value="">Select an asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id} disabled={a.status === "Under Maintenance"}>
                {a.asset_tag} — {a.name}
                {a.status === "Under Maintenance" ? " (already under maintenance)" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What's wrong with it?"
          />
        </Field>

        <Field label="Photo URL" hint="Optional — link to a photo of the issue.">
          <input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </Field>

        {formError && <Banner>{formError}</Banner>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RequestDetailModal({ request, canManage, employees, onClose, onMove }) {
  const [technicianId, setTechnicianId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTechnicianId("");
  }, [request?.id]);

  if (!request) return null;

  const next = NEXT_STATUS[request.status];
  const isTerminal = request.status === "Resolved" || request.status === "Rejected";
  const needsTechnician = next === "Technician Assigned";

  async function advance() {
    if (needsTechnician && !technicianId) return;
    setBusy(true);
    const ok = await onMove(request, next, needsTechnician ? Number(technicianId) : undefined);
    setBusy(false);
    if (ok && !needsTechnician) onClose();
  }

  async function reject() {
    setBusy(true);
    const ok = await onMove(request, "Rejected");
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal open={!!request} onClose={onClose} title={`${request.asset_name} (${request.asset_tag})`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={PRIORITY_TONE[request.priority]}>{request.priority} priority</Badge>
          <Badge tone={request.status === "Rejected" ? "danger" : "neutral"}>{request.status}</Badge>
        </div>

        <p className="text-sm text-[var(--color-muted)]">{request.description}</p>

        {request.photo_url && (
          <a
            href={request.photo_url}
            target="_blank"
            rel="noreferrer"
            className="block text-sm text-[var(--color-accent)] hover:underline"
          >
            📷 View attached photo
          </a>
        )}

        <dl className="grid grid-cols-2 gap-3 text-xs text-[var(--color-muted)]">
          <div>
            <dt className="font-medium text-white">Raised by</dt>
            <dd>{request.raised_by_name || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-white">Raised</dt>
            <dd>{timeAgo(request.created_at)}</dd>
          </div>
          {request.assigned_to_name && (
            <div>
              <dt className="font-medium text-white">Technician</dt>
              <dd>{request.assigned_to_name}</dd>
            </div>
          )}
          {request.resolved_at && (
            <div>
              <dt className="font-medium text-white">Resolved</dt>
              <dd>{timeAgo(request.resolved_at)}</dd>
            </div>
          )}
        </dl>

        {canManage && !isTerminal && (
          <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
            {needsTechnician && (
              <Field label="Assign technician">
                <select
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select an employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="flex justify-end gap-2">
              {request.status === "Pending" && (
                <Button variant="danger" onClick={reject} disabled={busy}>
                  Reject
                </Button>
              )}
              <Button onClick={advance} disabled={busy || (needsTechnician && !technicianId)}>
                {busy ? "Working…" : `Advance → ${next}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
