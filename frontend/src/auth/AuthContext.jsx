import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, if we have a token, resolve the session via /auth/me.
  useEffect(() => {
    async function loadSession() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      const res = await api("/auth/me");
      if (res.ok) setUser(res.data);
      else setToken(null); // stale/invalid token
      setLoading(false);
    }
    loadSession();
  }, []);

  async function login(email, password) {
    const res = await api("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    if (res.ok) {
      setToken(res.data.access_token);
      setUser(res.data.user);
    }
    return res;
  }

  async function signup(name, email, password) {
    const res = await api("/auth/signup", {
      method: "POST",
      auth: false,
      body: { name, email, password },
    });
    if (res.ok) {
      setToken(res.data.access_token);
      setUser(res.data.user);
    }
    return res;
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
