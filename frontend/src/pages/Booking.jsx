import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

// Hourly grid window (per mockup Screen 6): 8:00 → 20:00.
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8..19 (last slot 19-20)

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function pad(n) {
  return String(n).padStart(2, "0");
}
// Build a naive local datetime string the API accepts (matches its naive datetimes).
function slotStart(date, hour) {
  return `${date}T${pad(hour)}:00:00`;
}
function slotEnd(date, hour) {
  return `${date}T${pad(hour + 1)}:00:00`;
}

const STATUS_STYLES = {
  Upcoming: "bg-accent/15 text-accent border-accent/40",
  Ongoing: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
  Completed: "bg-[var(--color-surface-2)] text-[var(--color-muted)] border-[var(--color-border)]",
};

export default function Booking() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyHour, setBusyHour] = useState(null);
  const [rangeStart, setRangeStart] = useState(`${todayISO()}T09:00`);
  const [rangeEnd, setRangeEnd] = useState(`${todayISO()}T11:00`);
  const [rangeBusy, setRangeBusy] = useState(false);

  const selected = assets.find((a) => a.asset_id === selectedId) || null;

  async function loadAssets() {
    const res = await api("/bookings/asset-statuses");
    if (res.ok) {
      setAssets(res.data);
      if (res.data.length && selectedId === null) setSelectedId(res.data[0].asset_id);
    } else setError(res.error);
  }

  async function loadBookings(assetId) {
    if (!assetId) return;
    const res = await api(`/bookings?asset_id=${assetId}`);
    if (res.ok) setBookings(res.data);
  }

  useEffect(() => {
    loadAssets();
  }, []);
  useEffect(() => {
    loadBookings(selectedId);
  }, [selectedId]);

  // Active (non-cancelled) bookings that fall on the selected date.
  const dayBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.effective_status !== "Cancelled" && b.start_time.slice(0, 10) === date,
      ),
    [bookings, date],
  );

  function bookingForHour(hour) {
    const s = slotStart(date, hour);
    const e = slotEnd(date, hour);
    // Half-open overlap: booking covers this hour if it starts before the slot
    // ends AND ends after the slot starts.
    return dayBookings.find((b) => b.start_time < e && b.end_time > s) || null;
  }

  async function book(hour) {
    setError("");
    setNotice("");
    setBusyHour(hour);
    const res = await api("/bookings", {
      method: "POST",
      body: {
        asset_id: selectedId,
        start_time: slotStart(date, hour),
        end_time: slotEnd(date, hour),
        purpose: "Booked from grid",
      },
    });
    setBusyHour(null);
    if (res.ok) {
      setNotice(`Booked ${pad(hour)}:00–${pad(hour + 1)}:00.`);
      await Promise.all([loadBookings(selectedId), loadAssets()]);
    } else {
      // Conflict / block reasons render inline (mockup: "conflict — slot is unavailable").
      setError(res.error);
    }
  }

  async function cancel(id) {
    setError("");
    setNotice("");
    const res = await api(`/bookings/${id}/cancel`, { method: "PATCH" });
    if (res.ok) {
      setNotice("Booking cancelled — slot is free again.");
      await Promise.all([loadBookings(selectedId), loadAssets()]);
    } else setError(res.error);
  }

  // Custom range booking — lets you request any window (so overlap/boundary
  // rejection is demoable directly in the UI, not just the grid's 1-hour slots).
  async function bookRange() {
    setError("");
    setNotice("");
    if (!selected) return;
    if (rangeStart >= rangeEnd) {
      setError("End time must be after start time.");
      return;
    }
    setRangeBusy(true);
    const res = await api("/bookings", {
      method: "POST",
      body: {
        asset_id: selectedId,
        start_time: rangeStart,
        end_time: rangeEnd,
        purpose: "Custom range booking",
      },
    });
    setRangeBusy(false);
    if (res.ok) {
      setNotice(`Booked ${rangeStart.slice(11)}–${rangeEnd.slice(11)}.`);
      if (rangeStart.slice(0, 10) !== date) setDate(rangeStart.slice(0, 10));
      await Promise.all([loadBookings(selectedId), loadAssets()]);
    } else {
      setError(res.error); // e.g. "Conflict — slot is unavailable (...)"
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Resource Booking</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Pick a resource, then book an hourly slot. Booked slots are solid; conflicts are
        rejected inline.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Resource picker */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Resources
          </div>
          <div className="space-y-1">
            {assets.map((a) => (
              <button
                key={a.asset_id}
                onClick={() => setSelectedId(a.asset_id)}
                className={[
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  a.asset_id === selectedId
                    ? "bg-accent/15 text-accent"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-white",
                ].join(" ")}
              >
                <span className="truncate">
                  {a.name}
                  <span className="ml-1 text-xs opacity-60">{a.asset_tag}</span>
                </span>
                <StatusDot status={a.effective_status} />
              </button>
            ))}
            {assets.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">
                No bookable resources.
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-medium">{selected?.name ?? "—"}</div>
              {selected && (
                <div className="text-sm text-[var(--color-muted)]">
                  Live status:{" "}
                  <span className="font-medium text-white">{selected.effective_status}</span>
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-white outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          {notice && !error && (
            <div className="mb-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
              {notice}
            </div>
          )}

          {/* Custom range — request any window; overlap/boundary rejection shows
              inline above, exactly like the grid. */}
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
            <label className="text-xs text-[var(--color-muted)]">
              <span className="mb-1 block">Start</span>
              <input
                type="datetime-local"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-white outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="text-xs text-[var(--color-muted)]">
              <span className="mb-1 block">End</span>
              <input
                type="datetime-local"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-white outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <button
              onClick={bookRange}
              disabled={rangeBusy || !selected}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {rangeBusy ? "Booking…" : "Book range"}
            </button>
            <span className="text-xs text-[var(--color-muted)]">
              Try an overlapping window to see the conflict rejected inline.
            </span>
          </div>

          <div className="space-y-1.5">
            {HOURS.map((hour) => {
              const b = bookingForHour(hour);
              const mine = b && b.booked_by_id === user?.id;
              return (
                <div key={hour} className="flex items-center gap-3">
                  <div className="w-16 shrink-0 text-right text-sm tabular-nums text-[var(--color-muted)]">
                    {pad(hour)}:00
                  </div>
                  {b ? (
                    <div
                      className={`flex flex-1 items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        STATUS_STYLES[b.effective_status] ?? STATUS_STYLES.Upcoming
                      }`}
                    >
                      <span className="truncate">
                        {b.purpose || "Booked"} · {b.effective_status}
                        {mine && <span className="ml-1 opacity-70">(you)</span>}
                      </span>
                      {mine && b.effective_status !== "Completed" && (
                        <button
                          onClick={() => cancel(b.id)}
                          className="ml-2 shrink-0 rounded px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/20"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => book(hour)}
                      disabled={busyHour === hour || !selected}
                      className="flex-1 rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-left text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-white disabled:opacity-50"
                    >
                      {busyHour === hour ? "Booking…" : "＋ Book this slot"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    Available: "bg-[var(--color-muted)]",
    Reserved: "bg-accent",
    "Under Maintenance": "bg-amber-400",
    Allocated: "bg-blue-400",
  };
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className={`h-2 w-2 rounded-full ${map[status] ?? "bg-[var(--color-muted)]"}`} />
      {status}
    </span>
  );
}
