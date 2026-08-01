// ============================================================
//  FreelanceHub — client/pages/projects.js
//  Projects list + Project File (with connection credentials)
// ============================================================

// ── Projects List ─────────────────────────────────────────────
function projectsListHTML() {
  const { projects } = STATE.data;
  const filter   = window._projFilter || "All";
  const filtered = filter === "All" ? projects : projects.filter(p => p.status === filter);

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">Projects</div>
    <div class="page-sub">${projects.length} project${projects.length !== 1 ? "s" : ""} — click any card to open its file</div>
  </div>
  <button class="btn btn-primary" onclick="openProjectModal(null)">+ New Project</button>
</div>

<div class="filter-row">
  ${["All","Lead","Active","Review","Complete","Cancelled"].map(s =>
    `<button class="filter-btn${filter === s ? " active" : ""}" onclick="setProjFilter('${s}')">${s}</button>`
  ).join("")}
</div>

${filtered.length === 0
  ? `<div class="empty">
      <div class="empty-icon">📁</div>
      <div class="empty-text">${filter === "All" ? "No projects yet." : "No " + filter + " projects."}</div>
      ${filter === "All" ? `<button class="btn btn-primary" onclick="openProjectModal(null)">+ New Project</button>` : ""}
    </div>`
  : `<div class="projects-grid">
      ${filtered.map(p => {
        const creds = (STATE.data.project_credentials || []).find(c => c.project_id === p.id) || {};
        const sbOk  = !!(creds.supabase_url && creds.supabase_anon_key);
        const goOk  = !!(creds.google_client_id && creds.google_client_secret);
        const col   = STATUS_COLORS[p.status] || "#64748b";
        return `
<div class="project-card" onclick='openProject(${JSON.stringify(p).replace(/'/g,"&#39;")})'>
  <div style="height:3px;background:${col};border-radius:2px;margin-bottom:14px"></div>
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div class="project-card-name">${p.name}</div>
      <div class="project-card-client">${p.client_name || "No client"}</div>
    </div>
    ${badge(p.status)}
  </div>
  ${p.description ? `<div style="font-size:12px;color:#64748b;line-height:1.5;margin:8px 0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${p.description}</div>` : ""}
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">
    ${p.deadline ? `<span style="font-size:11px;color:#64748b">📅 ${fmtDate(p.deadline)}</span>` : ""}
    ${p.budget   ? `<span style="font-size:11px;color:#64748b">💰 ${usd(p.budget)}</span>`        : ""}
  </div>
  <div style="display:flex;gap:14px;padding-top:12px;border-top:1px solid #2a3048">
    <span style="font-size:11px;color:${sbOk ? "#10b981" : "#64748b"};display:flex;align-items:center">
      <span style="width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:5px;background:${sbOk ? "#10b981" : "#2a3048"}"></span>Supabase</span>
    <span style="font-size:11px;color:${goOk ? "#10b981" : "#64748b"};display:flex;align-items:center">
      <span style="width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:5px;background:${goOk ? "#10b981" : "#2a3048"}"></span>Google OAuth</span>
  </div>
</div>`;
      }).join("")}
    </div>`}`;
}

window.setProjFilter = function(f) { window._projFilter = f; render(); };

// ── Project File ──────────────────────────────────────────────
function projectFileHTML(p) {
  const client = STATE.data.clients.find(c => c.id === p.client_id);
  const col    = STATUS_COLORS[p.status] || "#64748b";

  return `
<div class="breadcrumb">
  <span class="breadcrumb-link" onclick="navigate('projects')">Projects</span>
  <span style="color:#2a3048">/</span>
  <span style="color:#e2e8f0">${p.name}</span>
</div>

<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px">
  <div>
    <div style="height:3px;width:48px;background:${col};border-radius:2px;margin-bottom:10px"></div>
    <div class="page-title">${p.name}</div>
    <div class="pf-meta">
      ${badge(p.status)}
      ${client  ? `<span style="font-size:12px;color:#64748b">👥 ${client.name}</span>`     : ""}
      ${p.deadline ? `<span style="font-size:12px;color:#64748b">📅 ${fmtDate(p.deadline)}</span>` : ""}
      ${p.budget   ? `<span style="font-size:12px;color:#64748b">💰 ${usd(p.budget)}</span>`       : ""}
    </div>
  </div>
  <div class="btn-row">
    <button class="btn btn-ghost btn-sm" onclick="openProjectModal('${p.id}')">Edit</button>
    <button class="btn btn-danger btn-sm" onclick="deleteProject('${p.id}')">Delete</button>
  </div>
</div>

${connPanelHTML(p.id)}

<div class="pf-body">
  <div class="pf-block">
    <div class="pf-block-label">Description</div>
    ${p.description
      ? `<div class="pf-block-val">${p.description}</div>`
      : `<div class="pf-block-empty">No description added.</div>`}
  </div>
  <div class="pf-block">
    <div class="pf-block-label">Details</div>
    ${[
      { label: "Client",   val: client?.name || p.client_name || "—" },
      { label: "Status",   val: p.status },
      { label: "Deadline", val: fmtDate(p.deadline) },
      { label: "Budget",   val: p.budget ? usd(p.budget) : "—" },
    ].map(r => `
    <div class="pf-detail-row">
      <span style="color:#64748b">${r.label}</span>
      <span style="color:#fff;font-weight:500">${r.val}</span>
    </div>`).join("")}
  </div>
  <div class="pf-block pf-full">
    <div class="pf-block-label">File Links &amp; Notes</div>
    ${p.files_notes
      ? `<div class="pf-block-val" style="font-family:monospace;font-size:13px">${p.files_notes}</div>`
      : `<div class="pf-block-empty">No files or links yet. Edit to paste Google Drive, Dropbox, or Figma links.</div>`}
  </div>
</div>`;
}

// ── Connection Panel ────────────────────────────────────────
function connPanelHTML(pid) {
  const c    = (STATE.data.project_credentials || []).find(c => c.project_id === pid) || {};
  const sbOk = !!(c.supabase_url && c.supabase_anon_key);
  const goOk = !!(c.google_client_id && c.google_client_secret && c.google_redirect_uri);

  return `
<div class="conn-panel" style="margin-bottom:28px">
  <div class="conn-panel-header" style="cursor:default">
    <div class="conn-panel-title">🔌 Connection Credentials</div>
    <div class="conn-badges">
      <span class="conn-badge ${sbOk ? "ok" : "miss"}">${sbOk ? "✓" : "○"} Supabase</span>
      <span class="conn-badge ${goOk ? "ok" : "miss"}">${goOk ? "✓" : "○"} Google OAuth</span>
      <button class="btn btn-ghost btn-sm" style="margin-left:12px;font-size:11px"
        onclick="navigate('settings')">Edit in Settings →</button>
    </div>
  </div>
  ${!sbOk && !goOk ? `
  <div style="padding:12px 20px;border-top:1px solid #2a3048;font-size:12px;color:#64748b">
    No credentials saved for this project yet.
    <span style="color:#6366f1;cursor:pointer;font-weight:600" onclick="navigate('settings')">
      Add them in Account & Settings →
    </span>
  </div>` : ""}
</div>`;
}

// Credentials are now managed in Account & Settings (user.js)



// ── Project Modal ─────────────────────────────────────────────
window.openProjectModal = function(id) {
  const p = id ? STATE.data.projects.find(x => x.id === id) : null;
  const { clients } = STATE.data;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${p ? "Edit Project" : "New Project"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-group"><label class="form-label">Project Name *</label>
  <input id="p-name" value="${p?.name || ""}" placeholder="Website Redesign"/>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Client</label>
    <select id="p-client">
      <option value="">— None —</option>
      ${clients.map(c => `<option value="${c.id}"${p?.client_id === c.id ? " selected" : ""}>${c.name}</option>`).join("")}
    </select>
  </div>
  <div class="form-group"><label class="form-label">Status</label>
    <select id="p-status">
      ${["Lead","Active","Review","Complete","Cancelled"].map(s => `<option${p?.status === s ? " selected" : ""}>${s}</option>`).join("")}
    </select>
  </div>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Deadline</label>
    <input id="p-deadline" type="date" value="${p?.deadline || ""}"/>
  </div>
  <div class="form-group"><label class="form-label">Budget ($)</label>
    <input id="p-budget" type="number" value="${p?.budget || ""}" placeholder="0.00"/>
  </div>
</div>
<div class="form-group"><label class="form-label">Description</label>
  <textarea id="p-desc" rows="2" placeholder="What's this project about?">${p?.description || ""}</textarea>
</div>
<div class="form-group"><label class="form-label">File Links / Notes</label>
  <textarea id="p-files" rows="2" placeholder="Google Drive, Dropbox, Figma links…">${p?.files_notes || ""}</textarea>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
  <button class="btn btn-primary" id="p-save-btn" onclick="saveProject('${id || ""}')">
    ${p ? "Save Changes" : "Create Project"}
  </button>
</div>`);
};

window.saveProject = async function(id) {
  const clId = document.getElementById("p-client").value;
  const cl   = STATE.data.clients.find(c => c.id === clId);
  const body = {
    name:        document.getElementById("p-name").value.trim(),
    client_id:   clId,
    client_name: cl ? cl.name : "",
    status:      document.getElementById("p-status").value,
    deadline:    document.getElementById("p-deadline").value,
    budget:      document.getElementById("p-budget").value,
    description: document.getElementById("p-desc").value.trim(),
    files_notes: document.getElementById("p-files").value.trim(),
  };
  if (!body.name) return;
  const btn = document.getElementById("p-save-btn");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    if (id) await db.update("projects", id, body);
    else     await db.insert("projects", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "Save"; }
};

window.deleteProject = async function(id) {
  if (!confirm("Delete this project?")) return;
  await db.delete("projects", id);
  STATE.openProject = null; STATE.page = "projects";
  loadAll();
};

window.projectsListHTML = projectsListHTML;
window.projectFileHTML  = projectFileHTML;
