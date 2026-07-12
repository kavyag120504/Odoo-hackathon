import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { canAccess } from "../layout/nav";

// Guards routes. Unauthenticated -> /login. Authenticated but role-blocked ->
// a 403 view (mirrors the backend role-gate so the UI never shows what the API
// would reject).
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!canAccess(user.role, location.pathname)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="text-5xl">🔒</div>
        <h2 className="text-xl font-semibold">403 — Not authorized</h2>
        <p className="text-[var(--color-muted)]">
          Your role ({user.role}) can’t access this screen.
        </p>
      </div>
    );
  }
  return children;
}
