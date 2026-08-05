// ============================================================
//  FreelanceHub — client/js/demo.js
//  Demo mode controller.
//  Activated by DEMO_MODE = true in app.js boot.
//  Intercepts all write operations and shows upgrade modal.
// ============================================================

window.DEMO_MODE = false;

// ── Activate demo mode ────────────────────────────────────────
window.activateDemo = function() {
  window.DEMO_MODE = true;

  // Patch db write methods to intercept and show upgrade modal
  const _originalInsert = db.insert;
  const _originalUpdate = db.update;
  const _originalDelete = db.delete;
  const _originalUpsert = db.upsert;

  db.insert = function() { showUpgradeModal(); return Promise.resolve(null); };
  db.update = function() { showUpgradeModal(); return Promise.resolve(null); };
  db.delete = function() { showUpgradeModal(); return Promise.resolve(null); };
  db.upsert = function() { showUpgradeModal(); return Promise.resolve(null); };

  // Load demo state
  STATE.user = DEMO_DATA.user;
  STATE.data  = {
    clients:             DEMO_DATA.clients,
    projects:            DEMO_DATA.projects,
    finances:            DEMO_DATA.finances,
    invoices:            DEMO_DATA.invoices,
    invoice_items:       DEMO_DATA.invoice_items,
    business_plan:       DEMO_DATA.business_plan,
    user_settings:       DEMO_DATA.user_settings,
    project_credentials: DEMO_DATA.project_credentials,
    bookmarks:           DEMO_DATA.bookmarks,
    tech_stack:          DEMO_DATA.tech_stack,
    workflow_templates:  DEMO_DATA.workflow_templates,
    workflow_steps:      DEMO_DATA.workflow_steps,
    workflow_runs:       DEMO_DATA.workflow_runs,
    workflow_run_steps:  DEMO_DATA.workflow_run_steps,
    project_todos:       DEMO_DATA.project_todos,
    client_documents:    DEMO_DATA.client_documents,
    brainstorm:          DEMO_DATA.brainstorm,
  };
  STATE.loading = false;
};

// ── Demo banner HTML (injected into sidebar) ──────────────────
window.demoBannerHTML = function() {
  if (!window.DEMO_MODE) return "";
  return `
<div style="
  margin:12px;
  padding:10px 12px;
  background:color-mix(in srgb,var(--accent) 10%,transparent);
  border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);
  border-radius:4px;
  font-family:'JetBrains Mono',monospace;
">
  <div style="font-size:10px;font-weight:700;color:var(--accent);letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px">
    ◆ demo mode
  </div>
  <div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:8px">
    You're exploring with sample data. Nothing is saved.
  </div>
  <button onclick="showUpgradeModal()"
    style="width:100%;padding:7px;background:var(--accent);color:var(--accent-fg);
           border:none;border-radius:3px;font-family:'JetBrains Mono',monospace;
           font-size:10px;font-weight:700;cursor:pointer;letter-spacing:.3px">
    start free trial →
  </button>
</div>`;
};

// ── Upgrade modal ─────────────────────────────────────────────
window.showUpgradeModal = function() {
  // Remove any existing modal first
  document.querySelector(".modal-overlay")?.remove();

  const ov = document.createElement("div");
  ov.className = "modal-overlay";
  ov.innerHTML = `
<div class="modal" style="max-width:480px;text-align:center">
  <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"
    style="position:absolute;top:16px;right:16px">×</button>

  <div style="font-family:'JetBrains Mono',monospace;font-size:28px;color:var(--accent);margin-bottom:4px">◆</div>
  <div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px">
    ready to save your work?
  </div>
  <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);line-height:1.7;margin-bottom:28px">
    You're in demo mode — create a free account to start saving clients,
    projects, invoices, and everything else across all your devices.
  </div>

  <div style="background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:20px;margin-bottom:24px">
    <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--accent);margin-bottom:4px">
      $12 / month
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:16px">
      Everything. No limits. Cancel any time.
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;text-align:left;margin-bottom:0">
      ${[
        "Unlimited clients, projects & invoices",
        "PDF invoice export",
        "Workflow SOPs & checklists",
        "Bookmark & credential manager (PIN protected)",
        "Business plan & brainstorm tools",
        "Multi-device sync via secure cloud",
      ].map(f => `
      <div style="display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text)">
        <span style="color:var(--accent);flex-shrink:0">✓</span> ${f}
      </div>`).join("")}
    </div>
  </div>

  <a href="login.html?signup=true"
    style="display:block;width:100%;padding:13px;background:var(--accent);color:var(--accent-fg);
           border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;
           text-decoration:none;letter-spacing:.3px;margin-bottom:10px">
    create account →
  </a>
  <button onclick="this.closest('.modal-overlay').remove()"
    style="width:100%;padding:10px;background:transparent;color:var(--text-muted);
           border:1px solid var(--border);border-radius:3px;font-family:'JetBrains Mono',monospace;
           font-size:12px;cursor:pointer">
    keep exploring the demo
  </button>
</div>`;

  ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
  document.body.appendChild(ov);
};
