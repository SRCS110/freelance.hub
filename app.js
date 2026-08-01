// ============================================================
//  FreelanceHub — client/js/app.js
//  App state, render router, and boot sequence.
// ============================================================

// ── App State ─────────────────────────────────────────────────
let STATE = {
  user:        null,
  page:        "dashboard",
  openProject: null,
  data:        {
    clients: [], projects: [], finances: [], invoices: [],
    business_plan: null,
  },
  loading: true,
};

// ── Data loader ───────────────────────────────────────────────
async function loadAll() {
  if (!STATE.user) return;
  try {
    const [clients, projects, finances, invoices, bpList] = await Promise.all([
      db.list("clients"),
      db.list("projects"),
      db.list("finances"),
      db.list("invoices"),
      db.list("business_plan").catch(() => []),
    ]);
    STATE.data = {
      clients:       clients  || [],
      projects:      projects || [],
      finances:      finances || [],
      invoices:      invoices || [],
      business_plan: (bpList || [])[0] || null,
    };
  } catch (e) {
    console.error("loadAll error:", e.message);
  }
  STATE.loading = false;
  render();
}

// ── Navigation ────────────────────────────────────────────────
function navigate(page) {
  STATE.page        = page;
  STATE.openProject = null;
  render();
}

window.navigate    = navigate;
window.openProject = function(p) { STATE.openProject = p; STATE.page = "projects"; render(); };
window.doSignOut   = function() { signOut(); window.location.href = "login.html"; };

// ── Sidebar ───────────────────────────────────────────────────
function sidebarHTML() {
  const nav = [
    { id: "dashboard",     label: "Dashboard",      icon: "⬡" },
    { id: "clients",       label: "Clients",         icon: "👥" },
    { id: "projects",      label: "Projects",        icon: "📁" },
    { id: "finances",      label: "Finances",        icon: "💰" },
    { id: "invoices",      label: "Invoices",        icon: "🧾" },
    { id: "business-plan", label: "Business Plan",   icon: "📋" },
  ];

  // Badge for overdue invoices
  const overdueCt = STATE.data.invoices.filter(i => i.status === "Overdue").length;

  return `
<div class="sidebar">
  <div>
    <div class="sidebar-logo">FreelanceHub</div>
    <div class="sidebar-sub">Business OS</div>
  </div>
  ${nav.map(n => `
  <div class="nav-item${STATE.page === n.id ? " active" : ""}" onclick="navigate('${n.id}')">
    <span style="font-size:16px;width:20px;text-align:center">${n.icon}</span>
    ${n.label}
    ${n.id === "invoices" && overdueCt > 0
      ? `<span style="margin-left:auto;background:#f43f5e;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px">${overdueCt}</span>`
      : ""}
  </div>`).join("")}
  <div class="sidebar-footer">
    <div class="user-email">${STATE.user?.email || ""}</div>
    <button class="logout-btn" onclick="doSignOut()">Sign Out</button>
  </div>
</div>`;
}

// ── Render router ─────────────────────────────────────────────
function render() {
  const root = document.getElementById("app");

  if (STATE.loading) {
    root.innerHTML = `<div class="spinner" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0f1117">Loading…</div>`;
    return;
  }

  let content = "";
  if      (STATE.page === "dashboard")                         content = dashboardHTML();
  else if (STATE.page === "clients")                           content = clientsHTML();
  else if (STATE.page === "projects" && STATE.openProject)     content = projectFileHTML(STATE.openProject);
  else if (STATE.page === "projects")                          content = projectsListHTML();
  else if (STATE.page === "finances")                          content = financesHTML();
  else if (STATE.page === "invoices")                          content = invoicesHTML();
  else if (STATE.page === "business-plan")                     content = businessPlanHTML();

  root.innerHTML = sidebarHTML() + `<div class="main">${content}</div>`;
}

// ── Boot ──────────────────────────────────────────────────────
(async function boot() {
  if (!hasConfig()) { window.location.href = "login.html"; return; }

  const user = await restoreSession().catch(() => null);
  if (!user) { window.location.href = "login.html"; return; }

  STATE.user     = user;
  window.STATE   = STATE;
  window.loadAll = loadAll;
  window.render  = render;

  await loadAll();
})();
