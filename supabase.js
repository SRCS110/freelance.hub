// ============================================================
//  FreelanceHub — client/js/supabase.js
//  All Supabase API calls.
// ============================================================

function getConfig() {
  if (window.FH_CONFIG?.supabase_url && window.FH_CONFIG?.supabase_anon_key) {
    return window.FH_CONFIG;
  }
  try { return JSON.parse(localStorage.getItem("fh_creds") || "{}"); }
  catch { return {}; }
}

function hasConfig() {
  const c = getConfig();
  return !!(c.supabase_url && c.supabase_anon_key);
}

// ── Core fetch wrapper ────────────────────────────────────────
async function sbFetch(path, opts = {}) {
  const { supabase_url: url, supabase_anon_key: key } = getConfig();
  if (!url || !key) throw new Error("Supabase not configured.");

  const token = localStorage.getItem("fh_token");

  const res = await fetch(url + path, {
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: token ? `Bearer ${token}` : `Bearer ${key}`,
      Prefer: opts.prefer || "",
      ...opts.headers,
    },
    ...opts,
  });

  // Token expired — try to auto-refresh once
  if (res.status === 401 && typeof refreshToken === "function") {
    try {
      await refreshToken();
      const newToken = localStorage.getItem("fh_token");
      const retry = await fetch(url + path, {
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${newToken}`,
          Prefer: opts.prefer || "",
          ...opts.headers,
        },
        ...opts,
      });
      if (!retry.ok && retry.status !== 204) {
        const err = await retry.json().catch(() => ({}));
        throw new Error(err.message || err.error_description || `HTTP ${retry.status}`);
      }
      if (retry.status === 204) return null;
      return retry.json();
    } catch (_) {
      // Refresh failed — redirect
      if (typeof signOut === "function") signOut();
      window.location.href = "login.html";
      return;
    }
  }

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Database helpers ──────────────────────────────────────────
const db = {
  list: (table, query = "") =>
    sbFetch(`/rest/v1/${table}?${query}${query ? "&" : ""}order=created_at.desc&limit=500`),

  insert: (table, body) =>
    sbFetch(`/rest/v1/${table}`, {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(body),
    }),

  update: (table, id, body) =>
    sbFetch(`/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify(body),
    }),

  delete: (table, id) =>
    sbFetch(`/rest/v1/${table}?id=eq.${id}`, { method: "DELETE" }),
};

// ── Test connection ───────────────────────────────────────────
async function testConnection() {
  const { supabase_url: url, supabase_anon_key: key } = getConfig();
  const res = await fetch(url + "/auth/v1/settings", {
    headers: { apikey: key, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Could not connect. Check your URL and Anon Key.");
  return true;
}

// Expose globally
window.sbFetch        = sbFetch;
window.db             = db;
window.getConfig      = getConfig;
window.hasConfig      = hasConfig;
window.testConnection = testConnection;
