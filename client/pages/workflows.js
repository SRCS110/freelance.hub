// ============================================================
//  FreelanceHub — client/pages/workflows.js
//  SOPs + Pipeline runner.
//  Templates define reusable step-by-step processes.
//  Runs are live instances applied to a client or project.
// ============================================================

const WF_CATS   = ["Client Onboarding","Project Kickoff","Invoice & Payment","Offboarding","Discovery","Design","Development","Marketing","Admin","Other"];
const WF_COLORS = ["#3bf4a3","#38bdf8","#f59e0b","#ff4757","#8b5cf6","var(--text)"];

// ── View state ─────────────────────────────────────────────────
// _wfView: "overview" | "template" | "run"
// _wfTemplateId / _wfRunId: active record

function workflowsHTML() {
  const view = window._wfView || "overview";
  if (view === "template") return _templateDetailHTML();
  if (view === "run")      return _runDetailHTML();
  return _overviewHTML();
}

// ══════════════════════════════════════════════════════════════
//  OVERVIEW
// ══════════════════════════════════════════════════════════════
function _overviewHTML() {
  const { workflow_templates, workflow_runs, clients, projects } = STATE.data;
  const templates = workflow_templates || [];
  const runs      = (workflow_runs     || []).filter(r => r.status === "active");
  const completed = (workflow_runs     || []).filter(r => r.status === "completed");

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">// workflows</div>
    <div class="page-sub">${templates.length} template${templates.length!==1?"s":""} · ${runs.length} active run${runs.length!==1?"s":""}</div>
  </div>
  <div class="btn-row">
    <button class="btn btn-ghost" onclick="openWfRunModal(null)">▶ start run</button>
    <button class="btn btn-primary" onclick="openWfTemplateModal(null)">+ new template</button>
  </div>
</div>

<!-- Active runs -->
${runs.length > 0 ? `
<div style="margin-bottom:28px">
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px">active runs</div>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${runs.map(r => _runCardHTML(r)).join("")}
  </div>
</div>` : ""}

<!-- Templates -->
<div style="margin-bottom:28px">
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px">sop templates</div>
  ${templates.length === 0
    ? `<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">no templates yet — create your first SOP.</div></div>`
    : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
        ${templates.map(t => _templateCardHTML(t)).join("")}
      </div>`}
</div>

<!-- Completed runs -->
${completed.length > 0 ? `
<div>
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px">completed</div>
  <div style="display:flex;flex-direction:column;gap:6px">
    ${completed.map(r => _runCardHTML(r, true)).join("")}
  </div>
</div>` : ""}`;
}

function _templateCardHTML(t) {
  const steps    = (STATE.data.workflow_steps || []).filter(s => s.template_id === t.id);
  const color    = t.color || "#3bf4a3";
  return `
<div style="background:var(--bg-raised);border:1px solid #24242d;border-left:3px solid ${color};border-radius:8px;padding:18px;cursor:pointer;transition:all .15s"
  onmouseover="this.style.borderColor='${color}44 ${color}44 ${color}44 ${color}'"
  onmouseout="this.style.borderColor='#24242d #24242d #24242d ${color}'"
  onclick="openWfTemplate('${t.id}')">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
    <div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--text)">${t.name}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);margin-top:2px;text-transform:uppercase;letter-spacing:.4px">${t.category}</div>
    </div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px;color:${color};border-color:${color}44"
        onclick="event.stopPropagation();openWfRunModal('${t.id}')">▶ run</button>
      <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px"
        onclick="event.stopPropagation();openWfTemplateModal('${t.id}')">edit</button>
      <button class="btn btn-danger btn-sm" style="font-size:10px;padding:3px 8px"
        onclick="event.stopPropagation();deleteWfTemplate('${t.id}')">×</button>
    </div>
  </div>
  ${t.description ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:10px;line-height:1.5">${t.description}</div>` : ""}
  <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${color}">${steps.length} step${steps.length!==1?"s":""}</div>
</div>`;
}

function _runCardHTML(r, dimmed = false) {
  const steps     = (STATE.data.workflow_run_steps || []).filter(s => s.run_id === r.id);
  const done      = steps.filter(s => s.completed).length;
  const total     = steps.length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
  const template  = (STATE.data.workflow_templates || []).find(t => t.id === r.template_id);
  const color     = template?.color || "#3bf4a3";

  return `
<div style="background:var(--bg-raised);border:1px solid #24242d;border-radius:8px;padding:16px;${dimmed?"opacity:.6":""};cursor:pointer;transition:border-color .15s"
  onclick="openWfRun('${r.id}')"
  onmouseover="this.style.borderColor='${color}33'"
  onmouseout="this.style.borderColor='var(--border)'">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:${total>0?"10px":"0"}">
    <div style="min-width:0">
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);margin-top:2px">
        ${r.client_name ? `👥 ${r.client_name}` : ""}${r.client_name && r.project_name ? " · " : ""}${r.project_name ? `📁 ${r.project_name}` : ""}
        ${!r.client_name && !r.project_name ? "stand-alone" : ""}
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
      ${total > 0 ? `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:${color}">${done}/${total}</span>` : ""}
      ${!dimmed ? `<button class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px;color:var(--accent);border-color:var(--accent)33"
        onclick="event.stopPropagation();completeWfRun('${r.id}')">✓ done</button>` : ""}
      <button class="btn btn-danger btn-sm" style="font-size:10px;padding:3px 8px"
        onclick="event.stopPropagation();deleteWfRun('${r.id}')">×</button>
    </div>
  </div>
  ${total > 0 ? `
  <div class="progress-bar">
    <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
  </div>
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);margin-top:4px">${pct}% complete</div>` : ""}
</div>`;
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATE DETAIL — edit steps inline
// ══════════════════════════════════════════════════════════════
function _templateDetailHTML() {
  const id       = window._wfTemplateId;
  const t        = (STATE.data.workflow_templates || []).find(x => x.id === id);
  if (!t) { window._wfView = "overview"; return workflowsHTML(); }
  const steps    = (STATE.data.workflow_steps || [])
    .filter(s => s.template_id === id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const color    = t.color || "#3bf4a3";

  return `
<div style="display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:20px;cursor:pointer" onclick="window._wfView='overview';render()">
  ← back to workflows
</div>

<div class="page-section-header">
  <div>
    <div class="page-title" style="color:${color}">${t.name}</div>
    <div class="page-sub">${t.category}${t.description ? " · " + t.description : ""}</div>
  </div>
  <div class="btn-row">
    <button class="btn btn-ghost" onclick="openWfTemplateModal('${t.id}')">edit template</button>
    <button class="btn btn-primary" style="background:${color};color:var(--bg)" onclick="openWfRunModal('${t.id}')">▶ start run</button>
  </div>
</div>

<div style="margin-bottom:16px">
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px">
    steps (${steps.length})
  </div>
  ${steps.length === 0
    ? `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);padding:16px 0">no steps yet — add your first step below.</div>`
    : steps.map((s, i) => `
  <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;padding:14px;background:var(--bg-raised);border:1px solid #24242d;border-radius:8px">
    <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:${color};width:24px;flex-shrink:0;padding-top:1px">${i+1}.</div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--text)">${s.title}</div>
      ${s.description ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-top:4px;line-height:1.5">${s.description}</div>` : ""}
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:3px 8px" onclick="openStepModal('${t.id}','${s.id}')">edit</button>
      <button class="btn btn-danger btn-sm" style="font-size:10px;padding:3px 8px" onclick="deleteStep('${s.id}')">×</button>
    </div>
  </div>`).join("")}
  <button class="btn btn-ghost" style="margin-top:6px;width:100%;border-style:dashed;font-size:12px" onclick="openStepModal('${t.id}',null)">+ add step</button>
</div>`;
}

// ══════════════════════════════════════════════════════════════
//  RUN DETAIL — live checklist
// ══════════════════════════════════════════════════════════════
function _runDetailHTML() {
  const id       = window._wfRunId;
  const r        = (STATE.data.workflow_runs || []).find(x => x.id === id);
  if (!r) { window._wfView = "overview"; return workflowsHTML(); }
  const steps    = (STATE.data.workflow_run_steps || [])
    .filter(s => s.run_id === id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const done     = steps.filter(s => s.completed).length;
  const total    = steps.length;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
  const template = (STATE.data.workflow_templates || []).find(t => t.id === r.template_id);
  const color    = template?.color || "#3bf4a3";

  return `
<div style="display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:20px;cursor:pointer" onclick="window._wfView='overview';render()">
  ← back to workflows
</div>

<div class="page-section-header">
  <div>
    <div class="page-title">${r.name}</div>
    <div class="page-sub">
      ${r.client_name ? `👥 ${r.client_name}` : ""}${r.client_name && r.project_name ? " · " : ""}${r.project_name ? `📁 ${r.project_name}` : ""}
      ${template ? ` · from: ${template.name}` : ""}
    </div>
  </div>
  <div class="btn-row">
    ${r.status !== "completed" ? `<button class="btn btn-ghost" style="color:#3bf4a3;border-color:#3bf4a333" onclick="completeWfRun('${r.id}')">✓ mark complete</button>` : ""}
    <button class="btn btn-danger btn-sm" onclick="deleteWfRun('${r.id}')">delete run</button>
  </div>
</div>

<div style="margin-bottom:20px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
    <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted)">${done} of ${total} steps complete</span>
    <span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:${color}">${pct}%</span>
  </div>
  <div class="progress-bar" style="height:6px">
    <div class="progress-fill" style="width:${pct}%;background:${color};transition:width .3s ease"></div>
  </div>
</div>

<div style="display:flex;flex-direction:column;gap:8px">
  ${steps.length === 0
    ? `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);padding:16px 0">no steps in this run.</div>`
    : steps.map((s, i) => `
  <div style="display:flex;gap:12px;align-items:flex-start;padding:16px;background:var(--bg-raised);border:1px solid ${s.completed ? color+"33" : "var(--border)"};border-radius:8px;transition:all .2s;opacity:${s.completed?"0.65":"1"}">
    <div style="padding-top:1px;flex-shrink:0">
      <button onclick="toggleStep('${s.id}',${s.completed})"
        style="width:20px;height:20px;border-radius:4px;border:2px solid ${s.completed ? color : "var(--border)"};background:${s.completed ? color : "transparent"};cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:11px;font-weight:900;transition:all .15s;flex-shrink:0">
        ${s.completed ? "✓" : ""}
      </button>
    </div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:${s.completed ? "var(--text-muted)" : "var(--text)"};${s.completed?"text-decoration:line-through":""}">${i+1}. ${s.title}</div>
      ${s.description ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-top:4px;line-height:1.5">${s.description}</div>` : ""}
      ${s.completed && s.completed_at ? `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${color};margin-top:4px">completed ${fmtDate(s.completed_at)}</div>` : ""}
      ${!s.completed ? `
      <div style="margin-top:8px">
        <input placeholder="add a note…" id="note-${s.id}"
          style="font-size:11px;padding:5px 8px;background:var(--bg);border-color:var(--border);border-radius:4px"
          value="${s.notes || ""}"
          onblur="saveStepNote('${s.id}',this.value)"/>
      </div>` : s.notes ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-top:4px;font-style:italic">"${s.notes}"</div>` : ""}
    </div>
  </div>`).join("")}
</div>`;
}

// ══════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════
window.openWfTemplate = function(id) {
  window._wfTemplateId = id;
  window._wfView = "template";
  render();
};

window.openWfRun = function(id) {
  window._wfRunId = id;
  window._wfView  = "run";
  render();
};

// ══════════════════════════════════════════════════════════════
//  TEMPLATE MODAL
// ══════════════════════════════════════════════════════════════
window.openWfTemplateModal = function(id) {
  const t = id ? (STATE.data.workflow_templates||[]).find(x => x.id === id) : null;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${t ? "edit template" : "new sop template"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label">Template Name</label>
    <input id="wt-name" value="${t?.name||""}" placeholder="Client Onboarding"/>
  </div>
  <div class="form-group">
    <label class="form-label">Category</label>
    <select id="wt-cat">
      ${WF_CATS.map(c => `<option${t?.category===c?" selected":""}>${c}</option>`).join("")}
    </select>
  </div>
</div>
<div class="form-group">
  <label class="form-label">Description</label>
  <input id="wt-desc" value="${t?.description||""}" placeholder="Steps to onboard a new client from contract to kickoff"/>
</div>
<div class="form-group">
  <label class="form-label">Color</label>
  <div style="display:flex;gap:8px;margin-top:4px">
    ${WF_COLORS.map(c => `
    <button onclick="document.getElementById('wt-color').value='${c}';document.querySelectorAll('.wf-color-btn').forEach(b=>b.style.outline='none');this.style.outline='2px solid ${c}'"
      class="wf-color-btn"
      style="width:24px;height:24px;border-radius:4px;background:${c};border:none;cursor:pointer;outline:${(t?.color||"#3bf4a3")===c?"2px solid "+c:"none"}">
    </button>`).join("")}
    <input type="hidden" id="wt-color" value="${t?.color||"#3bf4a3"}"/>
  </div>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="wt-save-btn" onclick="saveWfTemplate('${id||""}')">
    ${t ? "save changes" : "create template"}
  </button>
</div>`);
};

window.saveWfTemplate = async function(id) {
  const body = {
    name:        document.getElementById("wt-name").value.trim(),
    category:    document.getElementById("wt-cat").value,
    description: document.getElementById("wt-desc").value.trim(),
    color:       document.getElementById("wt-color").value,
    updated_at:  new Date().toISOString(),
  };
  if (!body.name) return;
  const btn = document.getElementById("wt-save-btn");
  btn.disabled = true; btn.textContent = "saving…";
  try {
    if (id) {
      await db.update("workflow_templates", id, body);
    } else {
      const created = await db.insert("workflow_templates", body);
      const newId   = Array.isArray(created) ? created[0]?.id : created?.id;
      if (newId) { window._wfTemplateId = newId; window._wfView = "template"; }
    }
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "save"; }
};

window.deleteWfTemplate = async function(id) {
  if (!confirm("Delete this template and all its steps?")) return;
  await db.delete("workflow_templates", id);
  loadAll();
};

// ══════════════════════════════════════════════════════════════
//  STEP MODAL (for template editing)
// ══════════════════════════════════════════════════════════════
window.openStepModal = function(templateId, stepId) {
  const s = stepId ? (STATE.data.workflow_steps||[]).find(x => x.id === stepId) : null;
  const existingSteps = (STATE.data.workflow_steps||[]).filter(x => x.template_id === templateId);
  showModal(`
<div class="modal-header">
  <div class="modal-title">${s ? "edit step" : "add step"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-group">
  <label class="form-label">Step Title</label>
  <input id="ws-title" value="${s?.title||""}" placeholder="Send welcome email"/>
</div>
<div class="form-group">
  <label class="form-label">Description / Instructions</label>
  <textarea id="ws-desc" rows="3" placeholder="Include contract link, kickoff call invite, and access to shared folder…">${s?.description||""}</textarea>
</div>
<div class="form-group">
  <label class="form-label">Order</label>
  <input id="ws-order" type="number" value="${s?.sort_order ?? existingSteps.length}" min="0"/>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="ws-save-btn" onclick="saveStep('${templateId}','${stepId||""}')">
    ${s ? "save changes" : "add step"}
  </button>
</div>`);
};

window.saveStep = async function(templateId, stepId) {
  const body = {
    template_id: templateId,
    title:       document.getElementById("ws-title").value.trim(),
    description: document.getElementById("ws-desc").value.trim(),
    sort_order:  parseInt(document.getElementById("ws-order").value) || 0,
  };
  if (!body.title) return;
  const btn = document.getElementById("ws-save-btn");
  btn.disabled = true; btn.textContent = "saving…";
  try {
    if (stepId) await db.update("workflow_steps", stepId, body);
    else        await db.insert("workflow_steps", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "save"; }
};

window.deleteStep = async function(id) {
  if (!confirm("Remove this step?")) return;
  await db.delete("workflow_steps", id); loadAll();
};

// ══════════════════════════════════════════════════════════════
//  RUN MODAL — start a live instance of a template
// ══════════════════════════════════════════════════════════════
window.openWfRunModal = function(templateId) {
  const { workflow_templates, clients, projects } = STATE.data;
  const templates = workflow_templates || [];
  const preselect = templateId || "";

  showModal(`
<div class="modal-header">
  <div class="modal-title">start workflow run</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-group">
  <label class="form-label">Run Name</label>
  <input id="wr-name" placeholder="Onboarding — Acme Corp"/>
</div>
<div class="form-group">
  <label class="form-label">Template (SOP)</label>
  <select id="wr-template">
    <option value="">— blank run —</option>
    ${templates.map(t => `<option value="${t.id}"${t.id===preselect?" selected":""}>${t.name}</option>`).join("")}
  </select>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label">Client (optional)</label>
    <select id="wr-client">
      <option value="">— none —</option>
      ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Project (optional)</label>
    <select id="wr-project">
      <option value="">— none —</option>
      ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
    </select>
  </div>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="wr-save-btn" onclick="saveWfRun()">▶ start run</button>
</div>`);

  // Auto-fill name when template is selected
  document.getElementById("wr-template").addEventListener("change", function() {
    const t = templates.find(x => x.id === this.value);
    if (t && !document.getElementById("wr-name").value) {
      document.getElementById("wr-name").value = t.name;
    }
  });
  // Trigger for preselect
  if (preselect) {
    const t = templates.find(x => x.id === preselect);
    if (t) document.getElementById("wr-name").value = t.name;
  }
};

window.saveWfRun = async function() {
  const { clients, projects, workflow_steps } = STATE.data;
  const templateId = document.getElementById("wr-template").value;
  const clientId   = document.getElementById("wr-client").value;
  const projectId  = document.getElementById("wr-project").value;
  const cl  = clients.find(c => c.id === clientId);
  const pr  = projects.find(p => p.id === projectId);

  const body = {
    name:         document.getElementById("wr-name").value.trim(),
    template_id:  templateId || null,
    client_id:    clientId   || null,
    client_name:  cl?.name   || "",
    project_id:   projectId  || null,
    project_name: pr?.name   || "",
    status:       "active",
  };
  if (!body.name) return;
  const btn = document.getElementById("wr-save-btn");
  btn.disabled = true; btn.textContent = "starting…";
  try {
    const created = await db.insert("workflow_runs", body);
    const runId   = Array.isArray(created) ? created[0]?.id : created?.id;

    // Copy template steps into run steps
    if (runId && templateId) {
      const steps = (workflow_steps || [])
        .filter(s => s.template_id === templateId)
        .sort((a, b) => a.sort_order - b.sort_order);
      for (const s of steps) {
        await db.insert("workflow_run_steps", {
          run_id:      runId,
          step_id:     s.id,
          title:       s.title,
          description: s.description,
          sort_order:  s.sort_order,
          completed:   false,
        });
      }
    }
    closeModal();
    await loadAll();
    // Navigate to run detail
    window._wfRunId = runId;
    window._wfView  = "run";
    render();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "start run"; }
};

// ══════════════════════════════════════════════════════════════
//  RUN ACTIONS
// ══════════════════════════════════════════════════════════════
window.toggleStep = async function(stepId, currentlyDone) {
  const now = new Date().toISOString();
  await db.update("workflow_run_steps", stepId, {
    completed:    !currentlyDone,
    completed_at: !currentlyDone ? now : null,
  });
  await loadAll();
};

window.saveStepNote = async function(stepId, note) {
  await db.update("workflow_run_steps", stepId, { notes: note });
};

window.completeWfRun = async function(id) {
  if (!confirm("Mark this run as complete?")) return;
  await db.update("workflow_runs", id, { status: "completed", updated_at: new Date().toISOString() });
  window._wfView = "overview";
  loadAll();
};

window.deleteWfRun = async function(id) {
  if (!confirm("Delete this run?")) return;
  await db.delete("workflow_runs", id);
  window._wfView = "overview";
  loadAll();
};

window.workflowsHTML = workflowsHTML;
