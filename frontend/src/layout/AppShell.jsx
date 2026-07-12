import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../auth/AuthContext";

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
          <div className="text-sm text-[var(--color-muted)]">
            Asset lifecycle management
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-muted)]">{user?.email}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-white"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
