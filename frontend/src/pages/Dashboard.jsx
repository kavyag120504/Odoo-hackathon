import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Clock,
  CalendarClock,
  ShieldCheck,
  Boxes,
  Bell
} from "lucide-react";
import { THEME, fontImport } from "../data/theme";
import { Card, PrimaryButton, GhostButton, Pill, LoadingBlock, timeAgo } from "../components/ui";
import { getDashboardSummary } from "../api/dashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardSummary().then((res) => {
      if (res.ok) {
        setSummary(res.data);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingBlock label="Loading summary..." />;
  }

  const overdueCount = summary?.overdue_allocations || 0;

  const cards = summary ? [
    { label: "Total Assets", value: summary.assets_total, icon: Boxes },
    { 
      label: "Active Allocations", 
      value: summary.active_allocations, 
      icon: ArrowRightLeft,
      alert: overdueCount > 0 ? `${overdueCount} overdue` : null 
    },
    { label: "Upcoming Bookings", value: summary.upcoming_bookings, icon: CalendarClock },
    { label: "Ongoing Bookings", value: summary.ongoing_bookings, icon: Clock },
    { label: "Open Maintenance", value: summary.open_maintenance, icon: AlertTriangle },
    { label: "Unread Notifications", value: summary.unread_notifications, icon: Bell },
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      <style>{fontImport}</style>
      <div>
        <h1
          className="text-3xl font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", color: THEME.white }}
        >
          Operational Overview
        </h1>
        <p className="mt-1 text-sm" style={{ color: THEME.soft }}>
          A real-time snapshot of every asset and resource across the organization.
        </p>
      </div>

      {error && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{ backgroundColor: `${THEME.danger}1A`, border: `1px solid ${THEME.danger}55` }}
        >
          <AlertTriangle size={20} color={THEME.danger} />
          <p className="text-sm" style={{ color: THEME.soft }}>
            Error fetching dashboard data: {error}
          </p>
        </div>
      )}

      {overdueCount > 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{ backgroundColor: `${THEME.danger}1A`, border: `1px solid ${THEME.danger}55` }}
        >
          <AlertTriangle size={20} color={THEME.danger} />
          <p className="text-sm" style={{ color: THEME.soft }}>
            <span className="font-semibold" style={{ color: THEME.white }}>
              {overdueCount} overdue return{overdueCount > 1 ? "s" : ""}
            </span>{" "}
            — There are active asset allocations past their expected return date.
          </p>
        </div>
      )}

      {summary && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <Card key={c.label}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide" style={{ color: THEME.sand }}>
                      {c.label}
                    </p>
                    <p
                      className="mt-2 text-3xl font-semibold"
                      style={{ fontFamily: "'Playfair Display', serif", color: THEME.white }}
                    >
                      {c.value}
                    </p>
                    {c.alert && (
                      <span className="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${THEME.danger}22`, color: THEME.danger, border: `1px solid ${THEME.danger}55` }}>
                        {c.alert}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl p-2" style={{ backgroundColor: `${THEME.sand}1A` }}>
                    <c.icon size={18} color={THEME.sand} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Quick Actions */}
            <Card className="lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3
                  className="mb-4 text-sm font-semibold uppercase tracking-wide"
                  style={{ color: THEME.sand }}
                >
                  Quick actions
                </h3>
                <div className="flex flex-col gap-3">
                  <PrimaryButton onClick={() => navigate("/assets")}>Register Asset</PrimaryButton>
                  <GhostButton onClick={() => navigate("/booking")}>Book Resource</GhostButton>
                  <GhostButton onClick={() => navigate("/maintenance")}>
                    Maintenance board
                  </GhostButton>
                </div>
              </div>
            </Card>

            {/* Assets & Maintenance Breakdown */}
            <Card className="lg:col-span-1">
              <h3
                className="mb-4 text-sm font-semibold uppercase tracking-wide"
                style={{ color: THEME.sand }}
              >
                Assets & Maintenance
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: THEME.soft }}>Assets by Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary.assets_by_status).map(([status, count]) => (
                      <Pill key={status} tone={
                        status === "Available" ? "success" :
                        status === "Under Maintenance" || status === "Lost" ? "danger" : "sand"
                      }>
                        {status}: {count}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: THEME.soft }}>Maintenance by Stage</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary.maintenance_by_status).length === 0 ? (
                      <p className="text-xs" style={{ color: `${THEME.soft}88` }}>No maintenance requests.</p>
                    ) : (
                      Object.entries(summary.maintenance_by_status).map(([stage, count]) => (
                        <Pill key={stage} tone="sand">
                          {stage}: {count}
                        </Pill>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-1">
              <h3
                className="mb-4 text-sm font-semibold uppercase tracking-wide"
                style={{ color: THEME.sand }}
              >
                Recent activity
              </h3>
              {summary.recent_activity.length === 0 ? (
                <p className="text-sm" style={{ color: `${THEME.soft}88` }}>
                  No activity yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {summary.recent_activity.map((e) => (
                    <li key={e.id} className="flex flex-col text-sm border-b pb-2" style={{ borderColor: `${THEME.bronze}22` }}>
                      <span style={{ color: THEME.soft }}>
                        <span className="font-semibold" style={{ color: THEME.white }}>
                          {e.actor_name || "System"}
                        </span>{" "}
                        {e.action}{" "}
                        {e.details && <span style={{ color: THEME.sand }}>({e.details})</span>}
                      </span>
                      <span
                        className="text-xs mt-0.5"
                        style={{ color: `${THEME.soft}88` }}
                      >
                        {timeAgo(e.timestamp)}
                      </span>
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
