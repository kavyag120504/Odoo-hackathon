// Thin fetch wrapper. Attaches the Bearer token and normalizes errors so every
// screen (A/C/D too) gets consistent { ok, data, error } handling.

const TOKEN_KEY = "assetflow_token";
const BASE = "/api"; // Vite proxies /api -> FastAPI (single-origin in dev)

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = "GET", body, auth = true, params } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Append query params (used by asset search/filter), skipping empty values.
  if (params && typeof params === "object") {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    }
    const s = qs.toString();
    if (s) path += (path.includes("?") ? "&" : "?") + s;
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network/offline error — never crash the UI.
    return { ok: false, status: 0, error: "Cannot reach the server." };
  }

  if (res.status === 204) return { ok: true, status: 204, data: null };

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = data?.detail;
    const error =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : "Something went wrong.";
    return { ok: false, status: res.status, error };
  }
  return { ok: true, status: res.status, data };
}
