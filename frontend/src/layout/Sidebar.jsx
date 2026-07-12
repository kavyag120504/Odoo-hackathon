import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { visibleNav } from "./nav";
import { ShieldCheck, ChevronRight, UserCog } from "lucide-react";
import { THEME, fontImport } from "../data/theme";

export default function Sidebar() {
  const { user } = useAuth();
  const items = visibleNav(user?.role);

  return (
    <aside
      className="flex w-64 shrink-0 flex-col gap-1 p-6"
      style={{
        backgroundColor: THEME.navy,
        borderRight: `1px solid ${THEME.bronze}33`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{fontImport}</style>

      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: THEME.sand }}
        >
          <ShieldCheck size={18} color={THEME.navy} />
        </div>
        <span
          className="text-lg font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", color: THEME.white }}
        >
          AssetFlow
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
          >
            {({ isActive }) => (
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-300"
                style={{
                  backgroundColor: isActive ? `${THEME.sand}1A` : "transparent",
                  color: isActive ? THEME.sand : THEME.soft,
                }}
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  {item.label}
                </span>
                {isActive && <ChevronRight size={15} />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User badge */}
      <div
        className="mt-auto flex items-center gap-2 rounded-xl p-3"
        style={{ backgroundColor: THEME.steel }}
      >
        <UserCog size={16} color={THEME.sand} />
        <div className="text-xs">
          <p className="font-semibold" style={{ color: THEME.white }}>
            {user?.name || "User"}
          </p>
          <p style={{ color: `${THEME.soft}99` }}>{user?.role}</p>
        </div>
      </div>
    </aside>
  );
}
