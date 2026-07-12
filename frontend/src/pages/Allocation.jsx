import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, PackageCheck, Undo2, Check } from "lucide-react";
import { api } from "../api/client";
import { THEME } from "../data/theme";
import { useAuth } from "../auth/AuthContext";
import {
  Card,
  StatusPill,
  PrimaryButton,
  GhostButton,
  Field,
  ErrorBanner,
  LoadingBlock,
  inputStyle,
  inputClass,
} from "../components/ui";

// Allocation & Transfer (mockup Screen 5). Drives allocate → conflict → transfer
// (request+approve) and the two-step return, all off the live API.
export default function Allocation() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null);

  // modal targets
  const [allocFor, setAllocFor] = useState(null); // asset
  const [transferFor, setTransferFor] = useState(null); // {asset, allocation}
  const [returnFor, setReturnFor] = useState(null); // {asset, allocation}

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [a, e, al, t, r] = await Promise.all([
      api("/assets"),
      api("/employees"),
      api("/allocations"),
      api("/transfers"),
      api("/returns"),
    ]);
    if (a.ok) setAssets(a.data);
    if (e.ok) setEmployees(e.data);
    if (al.ok) setAllocations(al.data);
    if (t.ok) setTransfers(t.data);
    if (r.ok) setReturns(r.data);
    if (!a.ok) setError(a.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // asset_id -> active allocation (for transfer/return we need id + holder emp id)
  const allocByAsset = useMemo(() => {
    const m = {};
    for (const a of allocations) m[a.asset_id] = a;
    return m;
  }, [allocations]);

  const pendingTransfers = transfers.filter((t) => t.status === "Requested");
  const pendingReturns = returns.filter((r) => r.status === "Requested");
  const empName = (id) => employees.find((e) => e.id === id)?.name ?? `#${id}`;

  async function run(promise, okMsg) {
    setError(null);
    setBanner(null);
    const res = await promise;
    if (res.ok) {
      setBanner(okMsg);
      await loadAll();
    } else {
      setError(res.error);
    }
    return res;
  }

  if (loading) return <LoadingBlock label="Loading allocations…" />;

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <ArrowLeftRight size={22} style={{ color: THEME.sand }} />
        <h1 className="text-2xl font-semibold">Allocation &amp; Transfer</h1>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      {banner && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
          style={{ backgroundColor: `${THEME.success}22`, color: THEME.success, border: `1px solid ${THEME.success}55` }}
        >
          {banner}
        </div>
      )}

      {/* Pending approvals */}
      {(pendingTransfers.length > 0 || pendingReturns.length > 0) && (
        <Card className="mb-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: THEME.sand }}>
            Pending Approvals
          </h2>
          <div className="space-y-2">
            {pendingTransfers.map((t) => (
              <Row key={`t${t.id}`}>
                <span>
                  <b>Transfer</b> · {t.asset_name} · {t.from_name} → {t.to_name}
                  {t.reason ? ` · “${t.reason}”` : ""}
                </span>
                <PrimaryButton
                  onClick={() => run(api(`/transfers/${t.id}/approve`, { method: "PATCH", body: { approved_by_id: user.id } }), "Transfer approved — asset re-allocated.")}
                >
                  <span className="inline-flex items-center gap-1"><Check size={14} /> Approve</span>
                </PrimaryButton>
              </Row>
            ))}
            {pendingReturns.map((r) => (
              <Row key={`r${r.id}`}>
                <span>
                  <b>Return</b> · {r.asset_name} · requested by {r.requester_name}
                  {r.employee_notes ? ` · “${r.employee_notes}”` : ""}
                </span>
                <PrimaryButton
                  onClick={() => run(api(`/returns/${r.id}/approve`, { method: "PATCH", body: { approved_by_id: user.id, manager_notes: "Checked in" } }), "Return approved — asset is Available.")}
                >
                  <span className="inline-flex items-center gap-1"><Check size={14} /> Approve return</span>
                </PrimaryButton>
              </Row>
            ))}
          </div>
        </Card>
      )}

      {/* Assets table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: `${THEME.bronze}44`, color: THEME.soft }}>
                <th className="px-3 py-2 font-medium">Asset</th>
                <th className="px-3 py-2 font-medium">Tag</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Held by</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const alloc = allocByAsset[asset.id];
                return (
                  <tr key={asset.id} className="border-b" style={{ borderColor: `${THEME.bronze}22` }}>
                    <td className="px-3 py-2.5">{asset.name}</td>
                    <td className="px-3 py-2.5 opacity-70">{asset.asset_tag}</td>
                    <td className="px-3 py-2.5"><StatusPill status={asset.status} /></td>
                    <td className="px-3 py-2.5">{asset.current_holder_name || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-2">
                        {asset.status === "Available" && (
                          <GhostButton onClick={() => setAllocFor(asset)}>
                            <span className="inline-flex items-center gap-1"><PackageCheck size={14} /> Allocate</span>
                          </GhostButton>
                        )}
                        {asset.status === "Allocated" && alloc && (
                          <>
                            {alloc.employee_id && (
                              <GhostButton onClick={() => setTransferFor({ asset, allocation: alloc })}>
                                <span className="inline-flex items-center gap-1"><ArrowLeftRight size={14} /> Transfer</span>
                              </GhostButton>
                            )}
                            <GhostButton onClick={() => setReturnFor({ asset, allocation: alloc })}>
                              <span className="inline-flex items-center gap-1"><Undo2 size={14} /> Return</span>
                            </GhostButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {assets.length === 0 && <p className="p-6 text-center text-sm opacity-60">No assets yet.</p>}
        </div>
      </Card>

      {allocFor && (
        <AllocateModal
          asset={allocFor}
          employees={employees}
          onClose={() => setAllocFor(null)}
          onSubmit={async (employee_id, expected_return_date) => {
            const res = await run(
              api("/allocations", { method: "POST", body: { asset_id: allocFor.id, employee_id, expected_return_date: expected_return_date || undefined } }),
              `Allocated ${allocFor.name}.`,
            );
            if (res.ok) setAllocFor(null);
          }}
        />
      )}
      {transferFor && (
        <TransferModal
          data={transferFor}
          employees={employees}
          onClose={() => setTransferFor(null)}
          onSubmit={async (to_employee_id, reason) => {
            const res = await run(
              api("/transfers", { method: "POST", body: { asset_id: transferFor.asset.id, from_employee_id: transferFor.allocation.employee_id, to_employee_id, reason } }),
              "Transfer requested — approve it below.",
            );
            if (res.ok) setTransferFor(null);
          }}
        />
      )}
      {returnFor && (
        <ReturnModal
          data={returnFor}
          onClose={() => setReturnFor(null)}
          onSubmit={async (employee_notes) => {
            const res = await run(
              api("/returns", { method: "POST", body: { allocation_id: returnFor.allocation.id, requested_by_id: user.id, employee_notes } }),
              "Return requested — an Asset Manager approves it below.",
            );
            if (res.ok) setReturnFor(null);
          }}
        />
      )}
    </div>
  );
}

function Row({ children }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
      style={{ backgroundColor: `${THEME.navy}`, border: `1px solid ${THEME.bronze}33` }}
    >
      {children}
    </div>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: THEME.steel, border: `1px solid ${THEME.bronze}55` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function AllocateModal({ asset, employees, onClose, onSubmit }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [ret, setRet] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <ModalShell title={`Allocate “${asset.name}”`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Allocate to employee">
          <select className={inputClass} style={inputStyle} value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
            ))}
          </select>
        </Field>
        <Field label="Expected return date" hint="Optional">
          <input type="date" className={inputClass} style={inputStyle} value={ret} onChange={(e) => setRet(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={busy || !employeeId} onClick={async () => { setBusy(true); await onSubmit(employeeId, ret); setBusy(false); }}>
            {busy ? "Allocating…" : "Allocate"}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

function TransferModal({ data, employees, onClose, onSubmit }) {
  const { asset, allocation } = data;
  const options = employees.filter((e) => e.id !== allocation.employee_id);
  const [toId, setToId] = useState(options[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <ModalShell title={`Transfer “${asset.name}”`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: `${THEME.sand}18`, color: THEME.sand, border: `1px solid ${THEME.sand}44` }}>
          Currently held by <b>{allocation.holder_name}</b>
        </div>
        <Field label="Transfer to">
          <select className={inputClass} style={inputStyle} value={toId} onChange={(e) => setToId(Number(e.target.value))}>
            {options.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
            ))}
          </select>
        </Field>
        <Field label="Reason">
          <input className={inputClass} style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. team reassignment" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={busy || !toId} onClick={async () => { setBusy(true); await onSubmit(toId, reason); setBusy(false); }}>
            {busy ? "Requesting…" : "Request transfer"}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

function ReturnModal({ data, onClose, onSubmit }) {
  const { asset, allocation } = data;
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <ModalShell title={`Return “${asset.name}”`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm opacity-75">Held by {allocation.holder_name}. This raises a return request; an Asset Manager approves the check-in.</p>
        <Field label="Condition notes" hint="Optional at this stage">
          <input className={inputClass} style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. minor scratch on lid" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={busy} onClick={async () => { setBusy(true); await onSubmit(notes); setBusy(false); }}>
            {busy ? "Submitting…" : "Submit return request"}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}
