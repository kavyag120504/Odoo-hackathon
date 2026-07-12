import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { AuthCard, Field } from "./Login";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function validate() {
    if (!name.trim()) return "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setBusy(true);
    const res = await signup(name.trim(), email.trim().toLowerCase(), password);
    setBusy(false);
    if (res.ok) navigate("/");
    else setError(res.error);
  }

  return (
    <AuthCard title="Create your account" subtitle="Sign up to AssetFlow">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} autoFocus />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          hint="At least 6 characters."
        />
        {/* No role field by design — signup creates an employee account; admin
            roles are assigned later. */}
        <p className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-muted)]">
          Sign up creates an employee account. Admin roles are assigned later.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 font-medium text-black transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
        Already have an account?{" "}
        <Link to="/login" className="text-[var(--color-accent)] hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
