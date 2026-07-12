import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    const res = await login(email.trim().toLowerCase(), password);
    setBusy(false);
    if (res.ok) navigate("/");
    else setError(res.error);
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to AssetFlow">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoFocus />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 font-medium text-black transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
        No account?{" "}
        <Link to="/signup" className="text-[var(--color-accent)] hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

// Shared bits reused by Signup.
export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent)] font-bold text-black">
            A
          </span>
          <span className="text-xl font-semibold">AssetFlow</span>
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, type = "text", value, onChange, autoFocus, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[var(--color-muted)]">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-white outline-none transition-colors focus:border-[var(--color-accent)]"
      />
      {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
    </label>
  );
}
