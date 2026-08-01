// ============================================================
//  FreelanceHub — client/js/auth.js
//  All authentication logic. Depends on supabase.js.
// ============================================================

const TOKEN_KEY   = "fh_token";
const REFRESH_KEY = "fh_refresh";
const EXPIRY_KEY  = "fh_expiry";

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

// ── Token storage helper ──────────────────────────────────────
function _storeTokens(data) {
  if (data?.access_token)  localStorage.setItem(TOKEN_KEY,   data.access_token);
  if (data?.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  // Supabase returns expires_in (seconds). Store absolute expiry timestamp.
  if (data?.expires_in) {
    const expiresAt = Date.now() + (data.expires_in - 60) * 1000; // 60s buffer
    localStorage.setItem(EXPIRY_KEY, String(expiresAt));
  }
}

// ── Refresh access token ──────────────────────────────────────
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

// ── Check if token is about to expire ────────────────────────
function _tokenExpired() {
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= Number(expiry);
}

// ── Get current user ──────────────────────────────────────────
async function getUser() {
  return sbFetch("/auth/v1/user");
}

// ── Restore session on page load ──────────────────────────────
async function restoreSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  // If token is expired (or close to it), try to refresh first
  if (_tokenExpired()) {
    try {
      await refreshToken();
    } catch (e) {
      signOut();
      return null;
    }
  }

  try {
    const user = await getUser();
    if (user?.id) {
      // Schedule a proactive refresh ~5 min before next expiry
      _scheduleRefresh();
      return user;
    }
  } catch (e) {
    // Token invalid — try refresh as last resort
    try {
      await refreshToken();
      const user = await getUser();
      if (user?.id) { _scheduleRefresh(); return user; }
    } catch (_) {}
  }

  signOut();
  return null;
}

// ── Schedule proactive token refresh ─────────────────────────
function _scheduleRefresh() {
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  const delay  = Math.max(0, expiry - Date.now() - 5 * 60 * 1000); // 5 min early
  clearTimeout(window._refreshTimer);
  window._refreshTimer = setTimeout(async () => {
    try {
      await refreshToken();
      _scheduleRefresh(); // reschedule after successful refresh
    } catch (e) {
      // Refresh failed — redirect to login on next action
      signOut();
      window.location.href = "login.html";
    }
  }, delay);
}

// ── Google OAuth ──────────────────────────────────────────────
const googleOAuth = {
  login(extraScopes = []) {
    const cfg = getConfig();
    if (!cfg.supabase_url) throw new Error("Supabase not configured.");
    const params = new URLSearchParams({
      provider:    "google",
      redirect_to: cfg.google_redirect_uri || window.location.origin,
      scopes:      ["email", "profile", ...extraScopes].join(" "),
    });
    window.location.href = `${cfg.supabase_url}/auth/v1/authorize?${params}`;
  },

  handleCallback() {
    const hash  = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("access_token");
    const refresh = hash.get("refresh_token");
    const expiresIn = hash.get("expires_in");
    if (token) {
      _storeTokens({ access_token: token, refresh_token: refresh, expires_in: Number(expiresIn) });
    }
    return token;
  },
};

// Expose globally
window.signUp         = signUp;
window.signIn         = signIn;
window.signOut        = signOut;
window.getUser        = getUser;
window.restoreSession = restoreSession;
window.refreshToken   = refreshToken;
window.googleOAuth    = googleOAuth;
