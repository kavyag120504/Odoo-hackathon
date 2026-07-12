// Shared UI atoms (Person D). Small, dependency-free, built on the same
// CSS variables as the rest of the app (see index.css) so Maintenance,
// Notifications and Dashboard read as one system instead of three.

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  accent: "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
  info: "border-sky-400/40 bg-sky-400/15 text-sky-400",
  warning: "border-amber-400/40 bg-amber-400/15 text-amber-400",
  danger: "border-red-400/40 bg-red-400/15 text-red-400",
};

export function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone] || BADGE_TONES.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]",
  ghost:
    "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-white",
  danger: "border border-red-500/40 text-red-400 hover:bg-red-500/10",
};

export function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className = "", ...props }) {
  return (
    <button
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[var(--color-muted)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[var(--color-accent)] disabled:opacity-50";

export function EmptyState({ icon = "🗂️", title, subtitle }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="mt-2 text-sm font-medium">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton onClick={onClose} aria-label="Close">
            ✕
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <div
      className={`h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] ${className}`}
    />
  );
}

export function Banner({ tone = "danger", children, onDismiss }) {
  const tones = {
    danger: "border-red-500/40 bg-red-500/10 text-red-300",
    accent: "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  };
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${tones[tone] || tones.danger}`}
    >
      <span>{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}

// Lightweight "3h ago" formatter — no date-fns dependency for one function.
export function timeAgo(isoString) {
  const then = new Date(isoString).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString();
}
