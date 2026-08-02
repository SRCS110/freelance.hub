// ============================================================
//  FreelanceHub — client/js/app.js
//  App state, render router, and boot sequence.
// ============================================================

let STATE = {
  user:        null,
  page:        "dashboard",
  openProject: null,
  data: {
    clients: [], projects: [], finances: [], invoices: [],
    business_plan: null, user_settings: null, project_credentials: [],
    bookmarks: [], tech_stack: [], workflow_templates: [], workflow_steps: [], workflow_runs: [], workflow_run_steps: [],
  },
  loading: true,
};

// ── Data loader ───────────────────────────────────────────────
async function loadAll() {
  if (!STATE.user) return;
  try {
    const [clients, projects, finances, invoices, bpList, settingsList, projCreds, bookmarks, techStack, wfTemplates, wfSteps, wfRuns, wfRunSteps, projectTodos] = await Promise.all([
      db.list("clients"),
      db.list("projects"),
      db.list("finances"),
      db.list("invoices"),
      db.list("business_plan").catch(() => []),
      db.list("user_settings").catch(() => []),
      db.list("project_credentials").catch(() => []),
      db.list("bookmarks").catch(() => []),
      db.list("tech_stack").catch(() => []),
      db.list("workflow_templates").catch(() => []),
      db.list("workflow_steps").catch(() => []),
      db.list("workflow_runs").catch(() => []),
      db.list("workflow_run_steps").catch(() => []),
      db.list("project_todos").catch(() => []),
    ]);
    STATE.data = {
      clients:             clients    || [],
      projects:            projects   || [],
      finances:            finances   || [],
      invoices:            invoices   || [],
      business_plan:       (bpList || [])[0] || null,
      user_settings:       (settingsList || [])[0] || null,
      project_credentials: projCreds  || [],
      bookmarks:           bookmarks  || [],
      tech_stack:          techStack   || [],
      workflow_templates: wfTemplates  || [],
      workflow_steps:     wfSteps      || [],
      workflow_runs:      wfRuns       || [],
      workflow_run_steps: wfRunSteps   || [],
      project_todos:      projectTodos || [],
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
window.doSignOut   = function() { Auth.signOut(); };

// ── Sidebar ───────────────────────────────────────────────────
function sidebarHTML() {
  const s   = STATE.data.user_settings;
  const usr = STATE.user;
  const displayName = s?.display_name || usr?.email?.split("@")[0] || "You";
  const overdueCt   = STATE.data.invoices.filter(i => i.status === "Overdue").length;

  const nav = [
    { id: "dashboard",     label: "Dashboard",     icon: "◈" },
    { id: "clients",       label: "Clients",        icon: "◎" },
    { id: "projects",      label: "Projects",       icon: "◫" },
    { id: "finances",      label: "Finances",       icon: "◇" },
    { id: "invoices",      label: "Invoices",       icon: "◻" },
    { id: "business-plan", label: "Business Plan",  icon: "◈" },
    { id: "bookmarks",     label: "Bookmarks",      icon: "◆" },
    { id: "tech-stack",    label: "Tech Stack",     icon: "◉" },
    { id: "workflows",     label: "Workflows",      icon: "◳" },
  ];

  return `
<div class="sidebar">
  <div>
    <div class="sidebar-logo">FreelanceHub</div>
    <div class="sidebar-sub">Business OS</div>
  </div>
  ${nav.map(n => `
  <div class="nav-item${STATE.page === n.id ? " active" : ""}" onclick="navigate('${n.id}')">
    <span style="font-family:'JetBrains Mono',monospace;width:20px;text-align:center;font-size:13px">${n.icon}</span>
    ${n.label}
    ${n.id === "invoices" && overdueCt > 0
      ? `<span style="margin-left:auto;background:#f43f5e;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px">${overdueCt}</span>`
      : ""}
  </div>`).join("")}

  <div class="sidebar-footer">
    <div class="theme-toggle" onclick="toggleTheme()">
      <span>${_isLight() ? "light" : "dark"} mode</span>
      <div class="theme-toggle-track${_isLight() ? " on" : ""}">
        <div class="theme-toggle-thumb"></div>
      </div>
    </div>
    <div class="nav-item${STATE.page === "settings" ? " active" : ""}"
      onclick="navigate('settings')"
      style="padding:8px 20px;margin-bottom:8px;border-radius:0">
      <span style="font-family:'JetBrains Mono',monospace;width:20px;text-align:center;font-size:14px">◈</span>
      ${displayName}
    </div>
    <button class="logout-btn" onclick="doSignOut()">sign out</button>
  </div>
</div>`;
}


// ── Mobile bar + drawer ───────────────────────────────────────
function mobileBarHTML() {
  return `
<div class="mobile-bar">
  <div class="mobile-bar-logo">FreelanceHub</div>
  <button class="hamburger" id="hamburger-btn" onclick="toggleDrawer()">
    <span></span><span></span><span></span>
  </button>
</div>

<div class="mobile-drawer" id="mobile-drawer" onclick="closeDrawerOnBackdrop(event)">
  <div class="mobile-drawer-backdrop"></div>
  <div class="mobile-drawer-panel">
    ${_drawerNav()}
  </div>
</div>`;
}

function _drawerNav() {
  const nav = [
    { id: "dashboard",     label: "Dashboard",    icon: "◈" },
    { id: "clients",       label: "Clients",       icon: "◎" },
    { id: "projects",      label: "Projects",      icon: "◫" },
    { id: "finances",      label: "Finances",      icon: "◇" },
    { id: "invoices",      label: "Invoices",      icon: "◻" },
    { id: "business-plan", label: "Business Plan", icon: "◈" },
    { id: "bookmarks",     label: "Bookmarks",     icon: "◆" },
    { id: "tech-stack",    label: "Tech Stack",    icon: "◉" },
    { id: "workflows",     label: "Workflows",     icon: "◳" },
  ];
  const overdueCt = STATE.data.invoices.filter(i => i.status === "Overdue").length;
  const s   = STATE.data.user_settings;
  const usr = STATE.user;
  const displayName = s?.display_name || usr?.email?.split("@")[0] || "account";
  const isLight = document.body.classList.contains("light");

  return nav.map(n => `
  <div class="nav-item${STATE.page === n.id ? " active" : ""}" onclick="drawerNavigate('${n.id}')">
    <span style="font-family:'JetBrains Mono',monospace;width:20px;text-align:center;font-size:13px">${n.icon}</span>
    ${n.label}
    ${n.id === "invoices" && overdueCt > 0
      ? `<span style="margin-left:auto;background:var(--danger);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px">${overdueCt}</span>`
      : ""}
  </div>`).join("") + `
  <div style="margin-top:auto;padding:16px 20px;border-top:1px solid var(--border)">
    <div class="theme-toggle" onclick="toggleTheme()" style="margin-bottom:10px">
      <span>${isLight ? "light" : "dark"} mode</span>
      <div class="theme-toggle-track${isLight ? " on" : ""}">
        <div class="theme-toggle-thumb"></div>
      </div>
    </div>
    <div class="nav-item${STATE.page === "settings" ? " active" : ""}"
      onclick="drawerNavigate('settings')"
      style="padding:8px 0;margin-bottom:6px">
      <span style="font-family:'JetBrains Mono',monospace;width:20px;text-align:center;font-size:13px">◈</span>
      ${displayName}
    </div>
    <button class="logout-btn" onclick="doSignOut()">sign out</button>
  </div>`;
}

window.toggleDrawer = function() {
  const drawer = document.getElementById("mobile-drawer");
  const btn    = document.getElementById("hamburger-btn");
  if (!drawer) return;
  const isOpen = drawer.classList.contains("open");
  drawer.classList.toggle("open", !isOpen);
  if (btn) btn.classList.toggle("open", !isOpen);
};

window.closeDrawerOnBackdrop = function(e) {
  if (e.target.classList.contains("mobile-drawer-backdrop") ||
      e.target.classList.contains("mobile-drawer")) {
    closeDrawer();
  }
};

window.closeDrawer = function() {
  const drawer = document.getElementById("mobile-drawer");
  const btn    = document.getElementById("hamburger-btn");
  if (drawer) drawer.classList.remove("open");
  if (btn)    btn.classList.remove("open");
};

window.drawerNavigate = function(page) {
  closeDrawer();
  navigate(page);
};

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
  else if (STATE.page === "settings")                          content = userSettingsHTML();
  else if (STATE.page === "bookmarks")                         content = bookmarksHTML();
  else if (STATE.page === "tech-stack")                        content = techStackHTML();
  else if (STATE.page === "workflows")                          content = workflowsHTML();

  root.innerHTML = sidebarHTML() + mobileBarHTML() + `<div class="main">${content}</div>`;
}

// ── Theme ─────────────────────────────────────────────────────
function _isLight() { return document.body.classList.contains("light"); }

window.toggleTheme = function() {
  const light = !_isLight();
  document.body.classList.toggle("light", light);
  localStorage.setItem("fh_theme", light ? "light" : "dark");
  render(); // re-render to update toggle state
};

// Apply saved theme immediately (before render)
(function applyTheme() {
  if (localStorage.getItem("fh_theme") === "light") {
    document.body.classList.add("light");
  }
})();

// ── Boot ──────────────────────────────────────────────────────
function waitForAuth(cb, tries = 0) {
  if (window.Auth) { cb(); return; }
  if (tries < 100) setTimeout(() => waitForAuth(cb, tries + 1), 50);
  else { window.location.href = "login.html"; }
}

waitForAuth(async function() {
  if (!hasConfig()) { window.location.href = "login.html"; return; }

  const session = await Auth.requireAuth();
  if (!session) return; // requireAuth redirects if no session

  STATE.user     = session.user;
  window.STATE   = STATE;
  window.loadAll = loadAll;
  window.render  = render;

  // Watch for sign-out from another tab
  Auth.onAuthStateChange((event, s) => {
    if (event === "SIGNED_OUT") window.location.href = "login.html";
  });

  await loadAll();
});
