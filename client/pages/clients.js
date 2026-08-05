// ============================================================
//  FreelanceHub — client/pages/clients.js
//  Client list + Client File with document storage.
// ============================================================

const DOC_TYPES = ["Service Agreement", "Contract", "Content Form", "Proposal", "Invoice", "NDA", "Brief", "Other"];

// ══════════════════════════════════════════════════════════════
//  CLIENT LIST
// ══════════════════════════════════════════════════════════════
function clientsHTML() {
  const { clients } = STATE.data;

  if (window._openClientId) return clientFileHTML(window._openClientId);

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">// clients</div>
    <div class="page-sub">${clients.length} client${clients.length !== 1 ? "s" : ""} on record</div>
  </div>
  <button class="btn btn-primary" onclick="openClientModal(null)">+ new client</button>
</div>

${clients.length === 0
  ? `<div class="empty">
      <div class="empty-icon" style="font-family:'JetBrains Mono',monospace">◎</div>
      <div class="empty-text">no clients yet.</div>
      <button class="btn btn-primary" onclick="openClientModal(null)">+ new client</button>
    </div>`
  : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
      ${clients.map(c => {
        const projects = (STATE.data.projects || []).filter(p => p.client_id === c.id);
        const docs     = (STATE.data.client_documents || []).filter(d => d.client_id === c.id);
        return `
        <div style="background:var(--bg-raised);border:1px solid var(--border);border-radius:4px;padding:18px;cursor:pointer;transition:border-color .15s"
          onclick="openClientFile('${c.id}')"
          onmouseover="this.style.borderColor='color-mix(in srgb,var(--accent) 40%,transparent)'"
          onmouseout="this.style.borderColor='var(--border)'">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px">
            <div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:var(--text)">${c.name}</div>
              ${c.company ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-top:2px">${c.company}</div>` : ""}
            </div>
            ${badge(c.status)}
          </div>
          ${c.email ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent);margin-bottom:4px">${c.email}</div>` : ""}
          ${c.phone ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:8px">${c.phone}</div>` : ""}
          <div style="display:flex;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
            <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted)">
              ◫ ${projects.length} project${projects.length !== 1 ? "s" : ""}
            </span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted)">
              ◻ ${docs.length} doc${docs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>`;
      }).join("")}
    </div>`}`;
}

window.openClientFile = function(id) {
  window._openClientId = id;
  render();
};

// ══════════════════════════════════════════════════════════════
//  CLIENT FILE
// ══════════════════════════════════════════════════════════════
function clientFileHTML(id) {
  const c        = STATE.data.clients.find(x => x.id === id);
  if (!c) { window._openClientId = null; return clientsHTML(); }

  const projects  = (STATE.data.projects || []).filter(p => p.client_id === id);
  const invoices  = (STATE.data.invoices || []).filter(i => i.client_id === id);
  const docs      = (STATE.data.client_documents || []).filter(d => d.client_id === id);
  const totalBilled = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid   = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + Number(i.amount), 0);

  return `
<div class="breadcrumb">
  <span class="breadcrumb-link" onclick="window._openClientId=null;render()">← clients</span>
  <span>/</span>
  <span style="color:var(--text)">${c.name}</span>
</div>

<div class="page-section-header">
  <div>
    <div class="page-title">${c.name}</div>
    <div class="pf-meta">
      ${badge(c.status)}
      ${c.company ? `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted)">${c.company}</span>` : ""}
    </div>
  </div>
  <div class="btn-row">
    <button class="btn btn-ghost" onclick="openClientModal('${c.id}')">edit</button>
    <button class="btn btn-danger btn-sm" onclick="deleteClient('${c.id}')">delete</button>
  </div>
</div>

<!-- Stats row -->
<div class="grid-4" style="margin-bottom:20px">
  ${[
    { label: "Projects",   val: projects.length, color: "var(--accent)" },
    { label: "Invoices",   val: invoices.length, color: "var(--text)" },
    { label: "Total Billed", val: usd(totalBilled), color: "var(--text)" },
    { label: "Total Paid",   val: usd(totalPaid),   color: "var(--accent)" },
  ].map(s => `
  <div class="card">
    <div class="card-label">${s.label}</div>
    <div class="card-value" style="font-size:18px;color:${s.color}">${s.val}</div>
  </div>`).join("")}
</div>

<div class="grid-2" style="margin-bottom:20px">
  <!-- Contact info -->
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">contact</div>
    ${[
      { label: "email", val: c.email, href: c.email ? `mailto:${c.email}` : null },
      { label: "phone", val: c.phone, href: c.phone ? `tel:${c.phone}` : null },
      { label: "company", val: c.company, href: null },
    ].map(f => `
    <div class="pf-detail-row">
      <span style="color:var(--text-muted)">${f.label}</span>
      ${f.href
        ? `<a href="${f.href}" style="color:var(--accent);font-family:'JetBrains Mono',monospace;font-size:12px;text-decoration:none">${f.val || "—"}</a>`
        : `<span style="font-family:'JetBrains Mono',monospace;font-size:12px">${f.val || "—"}</span>`}
    </div>`).join("")}
    ${c.notes ? `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">notes</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text);line-height:1.6">${c.notes}</div>
    </div>` : ""}
  </div>

  <!-- Projects -->
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="section-title">projects</div>
      <button class="btn btn-ghost btn-sm" onclick="navigate('projects')">+ new</button>
    </div>
    ${projects.length === 0
      ? `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted)">no projects yet.</div>`
      : projects.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer"
        onclick="window.openProject(${JSON.stringify(p).replace(/"/g,'&quot;')})">
        <div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--text)">${p.name}</div>
          ${p.deadline ? `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted)">${fmtDate(p.deadline)}</div>` : ""}
        </div>
        ${badge(p.status)}
      </div>`).join("")}
  </div>
</div>

<!-- Document Storage -->
<div class="card" style="margin-bottom:20px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div>
      <div class="section-title">documents</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);margin-top:3px">
        service agreements, contracts, content forms, and more
      </div>
    </div>
    <button class="btn btn-primary btn-sm" onclick="openDocModal('${c.id}', null)">+ add doc</button>
  </div>

  ${docs.length === 0
    ? `<div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);padding:12px 0">
        no documents yet. paste Google Drive, Dropbox, or DocuSign links to keep everything in one place.
      </div>`
    : `<div style="display:flex;flex-direction:column;gap:8px">
        ${docs.map(d => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:4px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:18px;flex-shrink:0">${_docIcon(d.type)}</span>
          <div style="flex:1;min-width:0">
            <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--text)">${d.name}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
              <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.4px">${d.type}</span>
              ${d.url ? `<span style="color:var(--text-muted);font-size:10px">·</span>
              <a href="${d.url}" target="_blank" rel="noopener"
                style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--accent);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px"
                onclick="event.stopPropagation()">${d.url.replace(/^https?:\/\//,"")}</a>` : ""}
            </div>
            ${d.notes ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-top:4px">${d.notes}</div>` : ""}
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            ${d.url ? `<a href="${d.url}" target="_blank" rel="noopener"
              class="btn btn-ghost btn-sm" style="font-size:10px;padding:4px 8px;text-decoration:none">open</a>` : ""}
            <button class="btn btn-ghost btn-sm" style="font-size:10px;padding:4px 8px"
              onclick="openDocModal('${c.id}','${d.id}')">edit</button>
            <button class="btn btn-danger btn-sm" style="font-size:10px;padding:4px 8px"
              onclick="deleteDoc('${d.id}')">×</button>
          </div>
        </div>`).join("")}
      </div>`}
</div>

<!-- Recent Invoices -->
${invoices.length > 0 ? `
<div class="card">
  <div class="section-title" style="margin-bottom:14px">invoices</div>
  <table class="tbl">
    <thead><tr><th>#</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
    <tbody>${invoices.map(i => `
    <tr>
      <td data-label="#" style="font-family:'JetBrains Mono',monospace;color:var(--text-muted)">${i.invoice_number}</td>
      <td data-label="Amount" style="font-weight:700">${usd(i.amount)}</td>
      <td data-label="Due" style="color:var(--text-muted)">${fmtDate(i.due_date)}</td>
      <td data-label="Status">${badge(i.status)}</td>
    </tr>`).join("")}</tbody>
  </table>
</div>` : ""}`;
}

function _docIcon(type) {
  const icons = {
    "Service Agreement": "📋", "Contract": "✍", "Content Form": "📝",
    "Proposal": "💼", "Invoice": "🧾", "NDA": "🔒", "Brief": "📄", "Other": "📎",
  };
  // Return mono symbol instead of emoji to match design system
  const symbols = {
    "Service Agreement": "◈", "Contract": "◆", "Content Form": "◻",
    "Proposal": "◫", "Invoice": "◇", "NDA": "◉", "Brief": "◎", "Other": "○",
  };
  return symbols[type] || "○";
}

// ══════════════════════════════════════════════════════════════
//  CLIENT MODAL
// ══════════════════════════════════════════════════════════════
window.openClientModal = function(id) {
  const c = id ? STATE.data.clients.find(x => x.id === id) : null;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${c ? "edit client" : "new client"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Name *</label>
    <input id="c-name" value="${c?.name || ""}" placeholder="Jane Smith"/></div>
  <div class="form-group"><label class="form-label">Company</label>
    <input id="c-company" value="${c?.company || ""}" placeholder="Acme Co."/></div>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Email</label>
    <input id="c-email" value="${c?.email || ""}" placeholder="jane@example.com"/></div>
  <div class="form-group"><label class="form-label">Phone</label>
    <input id="c-phone" value="${c?.phone || ""}" placeholder="+1 555 000 0000"/></div>
</div>
<div class="form-group"><label class="form-label">Status</label>
  <select id="c-status">
    ${["Active","Inactive","Lead"].map(s => `<option${c?.status === s ? " selected" : ""}>${s}</option>`).join("")}
  </select>
</div>
<div class="form-group"><label class="form-label">Notes</label>
  <textarea id="c-notes" rows="3">${c?.notes || ""}</textarea>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="c-save-btn" onclick="saveClient('${id || ""}')">
    ${c ? "save changes" : "add client"}
  </button>
</div>`);
};

window.saveClient = async function(id) {
  const body = {
    name:    document.getElementById("c-name").value.trim(),
    company: document.getElementById("c-company").value.trim(),
    email:   document.getElementById("c-email").value.trim(),
    phone:   document.getElementById("c-phone").value.trim(),
    status:  document.getElementById("c-status").value,
    notes:   document.getElementById("c-notes").value.trim(),
  };
  if (!body.name) return;
  const btn = document.getElementById("c-save-btn");
  btn.disabled = true; btn.textContent = "saving…";
  try {
    if (id) await db.update("clients", id, body);
    else     await db.insert("clients", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "save"; }
};

window.deleteClient = async function(id) {
  if (!confirm("Delete this client? Their projects and invoices will be unlinked.")) return;
  await db.delete("clients", id);
  window._openClientId = null;
  loadAll();
};

// ══════════════════════════════════════════════════════════════
//  DOCUMENT MODAL
// ══════════════════════════════════════════════════════════════
window.openDocModal = function(clientId, docId) {
  const d = docId ? (STATE.data.client_documents || []).find(x => x.id === docId) : null;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${d ? "edit document" : "add document"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-group">
  <label class="form-label">Document Name</label>
  <input id="doc-name" value="${d?.name || ""}" placeholder="Client Service Agreement 2026"/>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label">Type</label>
    <select id="doc-type">
      ${DOC_TYPES.map(t => `<option${d?.type === t ? " selected" : ""}>${t}</option>`).join("")}
    </select>
  </div>
</div>
<div class="form-group">
  <label class="form-label">Link / URL</label>
  <input id="doc-url" value="${d?.url || ""}" placeholder="https://drive.google.com/…" type="url"/>
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);margin-top:4px">
    Google Drive, Dropbox, DocuSign, OneDrive, or any link
  </div>
</div>
<div class="form-group">
  <label class="form-label">Notes</label>
  <input id="doc-notes" value="${d?.notes || ""}" placeholder="Signed Aug 2026, expires in 1 year…"/>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="doc-save-btn" onclick="saveDoc('${clientId}','${docId || ""}')">
    ${d ? "save changes" : "add document"}
  </button>
</div>`);
};

window.saveDoc = async function(clientId, docId) {
  const body = {
    client_id: clientId,
    name:      document.getElementById("doc-name").value.trim(),
    type:      document.getElementById("doc-type").value,
    url:       document.getElementById("doc-url").value.trim(),
    notes:     document.getElementById("doc-notes").value.trim(),
  };
  if (!body.name) return;
  const btn = document.getElementById("doc-save-btn");
  btn.disabled = true; btn.textContent = "saving…";
  try {
    if (docId) await db.update("client_documents", docId, body);
    else        await db.insert("client_documents", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "save"; }
};

window.deleteDoc = async function(id) {
  if (!confirm("Remove this document?")) return;
  await db.delete("client_documents", id); loadAll();
};

window.clientsHTML    = clientsHTML;
window.clientFileHTML = clientFileHTML;
