// ============================================================
//  FreelanceHub — client/js/auth.js
//  Config, db helpers, session management, token refresh,
//  and Google OAuth — all in one file.
//
//  SUPABASE_URL and SUPABASE_ANON_KEY are set here.
//  These are NOT secrets — the anon key is public-safe by
//  Supabase's design. RLS policies protect your data, not
//  this key. Safe to commit. Do NOT put your service_role
//  key here — that one never touches the frontend.
// ============================================================

const SUPABASE_URL      = "https://mbprxgxtpwbaelrjwzam.supabase.co";       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHJ4Z3h0cHdiYWVscmp3emFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MzAwNzYsImV4cCI6MjEwMTEwNjA3Nn0.4WFvWXlLVowHx0-OrQoT96V7WDnRx0SDRsGj7pB_-BA";  // Settings → API → anon public

// ── Token keys ────────────────────────────────────────────────
const TOKEN_KEY   = "fh_token";
const REFRESH_KEY = "fh_refresh";
const EXPIRY_KEY  = "fh_expiry";

// ── Config (hardcoded above, exposed for other modules) ───────
function getConfig() {
  return { supabase_url: SUPABASE_URL, supabase_anon_key: SUPABASE_ANON_KEY };
}

function hasConfig() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY &&
    SUPABASE_URL !== "YOUR_SUPABASE_URL");
}

// ── Core fetch wrapper ────────────────────────────────────────
async function sbFetch(path, opts = {}) {
  if (!hasConfig()) throw new Error("Supabase URL and anon key not set in auth.js.");

  const token = localStorage.getItem(TOKEN_KEY);

  const _doFetch = (t) => fetch(SUPABASE_URL + path, {
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: t ? `Bearer ${t}` : `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: opts.prefer || "",
      ...opts.headers,
    },
    ...opts,
  });

  let res = await _doFetch(token);

  // Auto-refresh on 401
  if (res.status === 401) {
    try {
      await refreshToken();
      res = await _doFetch(localStorage.getItem(TOKEN_KEY));
    } catch (_) {
      signOut();
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

  upsert: (table, body, onConflict = "user_id") =>
    sbFetch(`/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      prefer: "return=representation,resolution=merge-duplicates",
      body: JSON.stringify(body),
    }),

  delete: (table, id) =>
    sbFetch(`/rest/v1/${table}?id=eq.${id}`, { method: "DELETE" }),
};

// ── Token storage ─────────────────────────────────────────────
function _storeTokens(data) {
  if (data?.access_token)  localStorage.setItem(TOKEN_KEY,   data.access_token);
  if (data?.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  if (data?.expires_in) {
    const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
    localStorage.setItem(EXPIRY_KEY, String(expiresAt));
  }
}

function _tokenExpired() {
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= Number(expiry);
}

// ── Sign Up ───────────────────────────────────────────────────
async function signUp(email, password) {
  const data = await sbFetch("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  _storeTokens(data);
  return data;
}

// ── Sign In ───────────────────────────────────────────────────
async function signIn(email, password) {
  const data = await sbFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  _storeTokens(data);
  return data;
}

// ── Sign Out ──────────────────────────────────────────────────
function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

// ── Refresh token ─────────────────────────────────────────────
async function refreshToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error("No refresh token.");
  const data = await sbFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
  });
  _storeTokens(data);
  return data;
}

// ── Get current user ──────────────────────────────────────────
async function getUser() {
  return sbFetch("/auth/v1/user");
}

// ── Restore session ───────────────────────────────────────────
async function restoreSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  if (_tokenExpired()) {
    try { await refreshToken(); }
    catch (e) { signOut(); return null; }
  }

  try {
    const user = await getUser();
    if (user?.id) { _scheduleRefresh(); return user; }
  } catch (e) {
    try {
      await refreshToken();
      const user = await getUser();
      if (user?.id) { _scheduleRefresh(); return user; }
    } catch (_) {}
  }

  signOut();
  return null;
}

// ── Proactive token refresh ───────────────────────────────────
function _scheduleRefresh() {
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  const delay  = Math.max(0, expiry - Date.now() - 5 * 60 * 1000);
  clearTimeout(window._refreshTimer);
  window._refreshTimer = setTimeout(async () => {
    try { await refreshToken(); _scheduleRefresh(); }
    catch (e) { signOut(); window.location.href = "login.html"; }
  }, delay);
}

// ── Google OAuth (fully Supabase-managed) ─────────────────────
//  Client ID + Secret live only in:
//  Supabase Dashboard → Authentication → Providers → Google
const googleOAuth = {
  login() {
    if (!hasConfig()) throw new Error("Supabase not configured.");
    const params = new URLSearchParams({
      provider:    "google",
      redirect_to: window.location.origin + "/index.html",
    });
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?${params}`;
  },

  handleCallback() {
    const hash      = new URLSearchParams(window.location.hash.slice(1));
    const token     = hash.get("access_token");
    const refresh   = hash.get("refresh_token");
    const expiresIn = hash.get("expires_in");
    if (token) _storeTokens({ access_token: token, refresh_token: refresh, expires_in: Number(expiresIn) });
    return token;
  },
};

// ── Expose globally ───────────────────────────────────────────
window.getConfig      = getConfig;
window.hasConfig      = hasConfig;
window.sbFetch        = sbFetch;
window.db             = db;
window.signUp         = signUp;
window.signIn         = signIn;
window.signOut        = signOut;
window.getUser        = getUser;
window.restoreSession = restoreSession;
window.refreshToken   = refreshToken;
window.googleOAuth    = googleOAuth;
