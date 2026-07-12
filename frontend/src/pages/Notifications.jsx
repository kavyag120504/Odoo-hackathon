import { useEffect, useState } from "react";
import {
  listActivityLog,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { Badge, Banner, Button, Card, EmptyState, Spinner, timeAgo } from "../components/ui";

// Screen 10 filter tabs, in spec order.
const TABS = ["All", "Alert", "Approval", "Booking"];
const TAB_LABEL = { All: "All", Alert: "Alerts", Approval: "Approvals", Booking: "Bookings" };
const CATEGORY_TONE = { Alert: "warning", Approval: "accent", Booking: "info" };

export default function Notifications() {
  const [view, setView] = useState("notifications"); // "notifications" | "activity"
  const [tab, setTab] = useState("All");
  const [items, setItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications(category) {
    setLoading(true);
    const res = await listNotifications(category);
    if (res.ok) setItems(res.data);
    else setError(res.error);
    setLoading(false);
  }

  async function loadActivity() {
    setLoading(true);
    const res = await listActivityLog(50);
    if (res.ok) setActivity(res.data);
    else setError(res.error);
    setLoading(false);
  }

  useEffect(() => {
    if (view === "notifications") loadNotifications(tab);
    else loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tab]);

  async function onMarkRead(id) {
    const res = await markNotificationRead(id);
    if (res.ok) {
      setItems((prev) => prev.map((n) => (n.id === id ? res.data : n)));
    }
  }

  async function onMarkAllRead() {
    const res = await markAllNotificationsRead();
    if (res.ok) setItems(res.data);
  }

  const unreadTotal = items.filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex gap-2">
          <Button
            variant={view === "notifications" ? "primary" : "ghost"}
            onClick={() => setView("notifications")}
          >
            Notifications
          </Button>
          <Button variant={view === "activity" ? "primary" : "ghost"} onClick={() => setView("activity")}>
            Activity Log
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Banner onDismiss={() => setError("")}>{error}</Banner>
        </div>
      )}

      {view === "notifications" && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-[var(--color-accent)] text-black"
                      : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white"
                  }`}
                >
                  {TAB_LABEL[t]}
                </button>
              ))}
            </div>
            {unreadTotal > 0 && (
              <Button variant="ghost" onClick={onMarkAllRead}>
                Mark all as read ({unreadTotal})
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon="🔔"
                title="Nothing here"
                subtitle="You're all caught up — new alerts, approvals and booking updates will show up here."
              />
            ) : (
              items.map((n) => (
                <Card
                  key={n.id}
                  className={`!p-4 transition-colors ${!n.is_read ? "border-[var(--color-accent)]/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      )}
                      <div>
                        <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-sm text-[var(--color-muted)]">{n.message}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge tone={CATEGORY_TONE[n.category]}>{n.category}</Badge>
                          <span className="text-xs text-[var(--color-muted)]">{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {!n.is_read && (
                      <Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => onMarkRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {view === "activity" && (
        <div className="mt-5 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : activity.length === 0 ? (
            <EmptyState icon="📜" title="No activity yet" subtitle="Actions across the app will be logged here." />
          ) : (
            activity.map((e) => (
              <Card key={e.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {e.actor_name || "System"}{" "}
                      <span className="font-normal text-[var(--color-muted)]">{e.action}</span>
                    </p>
                    {e.details && <p className="mt-0.5 text-sm text-[var(--color-muted)]">{e.details}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-muted)]">{timeAgo(e.timestamp)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
