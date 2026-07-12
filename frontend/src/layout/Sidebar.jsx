import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { visibleNav } from "./nav";

export default function Sidebar() {
  const { user } = useAuth();
  const items = visibleNav(user?.role);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent)] font-bold text-black">
          A
        </span>
        <span className="text-lg font-semibold tracking-tight">AssetFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-white",
              ].join(" ")
            }
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)]">
        Signed in as
        <div className="truncate font-medium text-white">{user?.name}</div>
        <div className="mt-0.5 inline-block rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">
          {user?.role}
        </div>
      </div>
    </aside>
  );
}
