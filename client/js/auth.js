/**
 * auth.js — Freelancer Authentication
 * ──────────────────────────────────────
 * Built on the Supabase JS v2 SDK (loaded via CDN in HTML).
 * Uses PKCE flow for cross-browser reliability (Safari, Edge, Chrome).
 *
 * SETUP: Replace the two values below with your project credentials.
 * Find them at: Supabase Dashboard → Settings → API
 */

const SUPABASE_URL  = 'YOUR_SUPABASE_PROJECT_URL';  // https://xxxx.supabase.co
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHJ4Z3h0cHdiYWVscmp3emFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MzAwNzYsImV4cCI6MjEwMTEwNjA3Nn0.4WFvWXlLVowHx0-OrQoT96V7WDnRx0SDRsGj7pB_-BA';     // eyJhbGci...

/* ── Internal client singleton ── */
let _client = null;

function getClient() {
  if (_client) return _client;
  if (!window.supabase)
    throw new Error('[auth.js] Supabase CDN not loaded — add the CDN script before auth.js');

  const projectId = SUPABASE_URL.replace('https://','').split('.')[0];

  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: true,
      storage:            window.localStorage,        // explicit — fixes Safari ITP
      storageKey:         `sb-${projectId}-auth-token`,
      flowType:           'pkce'                      // reliable across all browsers
    }
  });
  return _client;
}

/* ── Config (for anything that needs the raw URL) ── */
function getConfig() {
  return { supabase_url: SUPABASE_URL, supabase_anon_key: SUPABASE_ANON };
}

function hasConfig() {
  return !!(
    SUPABASE_URL  && SUPABASE_URL  !== 'YOUR_SUPABASE_PROJECT_URL' &&
    SUPABASE_ANON && SUPABASE_ANON !== 'YOUR_SUPABASE_ANON_KEY'
  );
}

/* ── Session ── */
async function getSession() {
  const { data } = await getClient().auth.getSession();
  return data.session;
}

function onAuthStateChange(callback) {
  return getClient().auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/* ── Sign in ── */
async function signInWithGoogle() {
  const { error } = await getClient().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:  `${location.origin}/index.html`,
      queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  });
  if (error) throw error;
}

async function signInWithEmail(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await getClient().auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  if (error) throw error;
  return data;
}

/* ── Password reset ── */
async function sendPasswordReset(email) {
  const { error } = await getClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/login.html?mode=reset`
  });
  if (error) throw error;
}

async function updatePassword(newPassword) {
  const { error } = await getClient().auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/* ── Sign out ── */
async function signOut() {
  await getClient().auth.signOut();
  location.href = 'login.html';
}

/* ── Route guard — redirects to login if no session ── */
async function requireAuth() {
  const session = await Promise.race([
    getSession(),
    new Promise(resolve => setTimeout(() => resolve(null), 6000)) // 6s Safari fix
  ]);
  if (!session) { location.href = 'login.html'; return null; }
  return session;
}

/* ── User helpers ── */
async function getCurrentUser() {
  const { data } = await getClient().auth.getUser();
  return data.user;
}

function getUserDisplayName(user) {
  if (!user) return '';
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name      ||
    user.email?.split('@')[0]     ||
    'User'
  );
}

function getUserAvatar(user) {
  return user?.user_metadata?.avatar_url || null;
}

/* ── Database helpers (used by all pages) ── */
async function sbFetch(path, opts = {}) {
  if (!hasConfig()) throw new Error('Supabase not configured in auth.js.');
  const session = await getSession();
  const token   = session?.access_token || SUPABASE_ANON;

  const res = await fetch(SUPABASE_URL + path, {
    headers: {
      'Content-Type': 'application/json',
      apikey:          SUPABASE_ANON,
      Authorization:  `Bearer ${token}`,
      Prefer:          opts.prefer || '',
      ...opts.headers,
    },
    ...opts,
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Get current user ID (sync, from cached session) ──────────
function _uid() {
  // Pull from Supabase's localStorage key
  try {
    const projectId = SUPABASE_URL.replace('https://','').split('.')[0];
    const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.user?.id || parsed?.session?.user?.id || null;
    }
  } catch (_) {}
  return null;
}

const db = {
  list: (table, query = '') =>
    sbFetch(`/rest/v1/${table}?${query}${query ? '&' : ''}order=created_at.desc&limit=500`),

  insert: (table, body) => {
    // Auto-inject user_id so RLS policies are satisfied
    const uid = _uid();
    const payload = uid && !body.user_id ? { ...body, user_id: uid } : body;
    return sbFetch(`/rest/v1/${table}`, {
      method: 'POST',
      prefer: 'return=representation',
      body:   JSON.stringify(payload),
    });
  },

  update: (table, id, body) =>
    sbFetch(`/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body:   JSON.stringify(body),
    }),

  upsert: (table, body, onConflict = 'user_id') => {
    const uid = _uid();
    const payload = uid && !body.user_id ? { ...body, user_id: uid } : body;
    return sbFetch(`/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: 'POST',
      prefer: 'return=representation,resolution=merge-duplicates',
      body:   JSON.stringify(payload),
    });
  },

  delete: (table, id) =>
    sbFetch(`/rest/v1/${table}?id=eq.${id}`, { method: 'DELETE' }),
};

/* ── Expose globally ── */
window.Auth = {
  getClient,
  getSession,
  onAuthStateChange,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  updatePassword,
  signOut,
  requireAuth,
  getCurrentUser,
  getUserDisplayName,
  getUserAvatar,
};

// Also expose flat for backward compatibility with existing page code
window.getConfig      = getConfig;
window.hasConfig      = hasConfig;
window.sbFetch        = sbFetch;
window.db             = db;
window.signOut        = signOut;
