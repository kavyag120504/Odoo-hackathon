import { X } from "lucide-react";
import { THEME } from "../data/theme";

export function Card({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-3xl p-6 ${className}`}
      style={{ backgroundColor: THEME.steel, border: `1px solid ${THEME.bronze}33`, ...style }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = "sand" }) {
  const bg =
    tone === "sand"
      ? THEME.sand
      : tone === "danger"
      ? THEME.danger
      : tone === "success"
      ? THEME.success
      : THEME.bronze;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${bg}22`, color: bg, border: `1px solid ${bg}55` }}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }) {
  const map = {
    Available: "success",
    Allocated: "sand",
    Reserved: "sand",
    "Under Maintenance": "danger",
    Lost: "danger",
    Retired: "bronze",
    Disposed: "bronze",
  };
  return <Pill tone={map[status] || "bronze"}>{status}</Pill>;
}

export function PrimaryButton({ children, onClick, type = "button", style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-300"
      style={{ backgroundColor: THEME.sand, color: THEME.navy, ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = THEME.bronze)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = THEME.sand)}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-300"
      style={{
        backgroundColor: "transparent",
        color: THEME.soft,
        border: `1px solid ${THEME.bronze}66`,
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.sand)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${THEME.bronze}66`)}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium" style={{ color: THEME.soft }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputStyle = {
  backgroundColor: THEME.navy,
  color: THEME.white,
  border: `1px solid ${THEME.bronze}55`,
};

export const inputClass = "rounded-xl px-3 py-2 text-sm outline-none focus:ring-2";

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      className="mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium"
      style={{
        backgroundColor: `${THEME.danger}22`,
        color: THEME.danger,
        border: `1px solid ${THEME.danger}55`,
      }}
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex justify-center p-8">
      <span className="text-sm font-medium" style={{ color: THEME.sand }}>
        Loading...
      </span>
    </div>
  );
}
