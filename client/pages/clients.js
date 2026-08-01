// ============================================================
//  FreelanceHub — client/pages/clients.js
// ============================================================

function clientsHTML() {
  const { clients } = STATE.data;
  return `
<div class="page-section-header">
  <div>
    <div class="page-title">Clients</div>
    <div class="page-sub">${clients.length} client${clients.length !== 1 ? "s" : ""} on record</div>
  </div>
  <button class="btn btn-primary" onclick="openClientModal(null)">+ New Client</button>
</div>
${clients.length === 0
  ? `<div class="empty">
      <div class="empty-icon">👥</div>
      <div class="empty-text">No clients yet.</div>
      <button class="btn btn-primary" onclick="openClientModal(null)">+ New Client</button>
    </div>`
  : `<div class="card" style="padding:0">
      <table class="tbl">
        <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${clients.map(c => `
        <tr>
          <td style="font-weight:600;color:#fff">${c.name}</td>
          <td style="color:#64748b">${c.company || "—"}</td>
          <td style="color:#64748b">${c.email || "—"}</td>
          <td style="color:#64748b">${c.phone || "—"}</td>
          <td>${badge(c.status)}</td>
          <td><div class="btn-row">
            <button class="btn btn-ghost btn-sm" onclick="openClientModal('${c.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteClient('${c.id}')">Delete</button>
          </div></td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`}`;
}

window.openClientModal = function(id) {
  const c = id ? STATE.data.clients.find(x => x.id === id) : null;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${c ? "Edit Client" : "New Client"}</div>
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
    ${["Active", "Inactive", "Lead"].map(s => `<option${c?.status === s ? " selected" : ""}>${s}</option>`).join("")}
  </select>
</div>
<div class="form-group"><label class="form-label">Notes</label>
  <textarea id="c-notes" rows="3">${c?.notes || ""}</textarea>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
  <button class="btn btn-primary" id="c-save-btn" onclick="saveClient('${id || ""}')">
    ${c ? "Save Changes" : "Add Client"}
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
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    if (id) await db.update("clients", id, body);
    else     await db.insert("clients", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "Save"; }
};

window.deleteClient = async function(id) {
  if (!confirm("Delete this client?")) return;
  await db.delete("clients", id); loadAll();
};

window.clientsHTML = clientsHTML;
