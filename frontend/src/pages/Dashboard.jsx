import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getDashboardSummary } from "../api/dashboard";
import { Badge, Banner, Card, EmptyState, Spinner, timeAgo } from "../components/ui";

const STATUS_TONE = {
  Available: "accent",
  Allocated: "info",
  Reserved: "info",
  "Under Maintenance": "warning",
  Lost: "danger",
  Retired: "neutral",
  Disposed: "neutral",
};

const QUICK_ACTIONS = [
  { to: "/maintenance", icon: "🔧", label: "Maintenance board" },
  { to: "/booking", icon: "📅", label: "Book a resource" },
  { to: "/notifications", icon: "🔔", label: "Notifications" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardSummary().then((res) => {
      if (res.ok) setSummary(res.data);
      else setError(res.error);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome back, {user?.name?.split(" ")[0] || "there"}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Here's what's happening across AssetFlow.</p>

      {error && (
        <div className="mt-4">
          <Banner onDismiss={() => setError("")}>{error}</Banner>
        </div>
      )}

      {!summary && !error && (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      )}

      {summary && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <KpiCard label="Total Assets" value={summary.assets_total} icon="📦" />
            <KpiCard
              label="Active Allocations"
              value={summary.active_allocations}
              icon="🤝"
              alert={summary.overdue_allocations > 0 ? `${summary.overdue_allocations} overdue` : null}
            />
            <KpiCard label="Upcoming Bookings" value={summary.upcoming_bookings} icon="📅" />
            <KpiCard label="Ongoing Bookings" value={summary.ongoing_bookings} icon="⏱️" />
            <KpiCard label="Open Maintenance" value={summary.open_maintenance} icon="🔧" />
            <KpiCard label="Unread Notifications" value={summary.unread_notifications} icon="🔔" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold">Assets by status</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.assets_by_status).map(([status, count]) => (
                  <Badge key={status} tone={STATUS_TONE[status] || "neutral"}>
                    {status}: {count}
                  </Badge>
                ))}
              </div>

              <h2 className="mb-3 mt-6 text-sm font-semibold">Maintenance by stage</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.maintenance_by_status).length === 0 ? (
                  <p className="text-sm text-[var(--color-muted)]">No maintenance requests yet.</p>
                ) : (
                  Object.entries(summary.maintenance_by_status).map(([status, count]) => (
                    <Badge key={status}>{status}: {count}</Badge>
                  ))
                )}
              </div>

              <h2 className="mb-3 mt-6 text-sm font-semibold">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm transition-colors hover:border-[var(--color-accent)] hover:text-white"
                  >
                    <span>{a.icon}</span>
                    {a.label}
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-sm font-semibold">Recent activity</h2>
              {summary.recent_activity.length === 0 ? (
                <EmptyState icon="📜" title="No activity yet" />
              ) : (
                <ul className="space-y-3">
                  {summary.recent_activity.map((e) => (
                    <li key={e.id} className="text-sm">
                      <p>
                        <span className="font-medium">{e.actor_name || "System"}</span>{" "}
                        <span className="text-[var(--color-muted)]">{e.action}</span>
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">{timeAgo(e.timestamp)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon, alert }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        {alert && <Badge tone="danger">{alert}</Badge>}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
    </Card>
  );
}
