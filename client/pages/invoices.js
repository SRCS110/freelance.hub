// ============================================================
//  FreelanceHub — client/pages/invoices.js
//  Invoices with line items + PDF/print export.
// ============================================================

function invoicesHTML() {
  const { invoices, clients, projects } = STATE.data;
  const filter   = window._invFilter || "All";
  const filtered = filter === "All" ? invoices : invoices.filter(i => i.status === filter);
  const totals   = { Draft: 0, Sent: 0, Paid: 0, Overdue: 0, Void: 0 };
  invoices.forEach(i => { totals[i.status] = (totals[i.status] || 0) + Number(i.amount); });

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">Invoices</div>
    <div class="page-sub">${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} total</div>
  </div>
  <button class="btn btn-primary" onclick="openInvModal(null)">+ New Invoice</button>
</div>

<div class="grid-4" style="margin-bottom:24px">
  ${Object.entries(totals).filter(([s]) => s !== "Void").map(([status, total]) => `
  <div class="card">
    <div style="height:3px;background:${STATUS_COLORS[status] || "#64748b"};border-radius:2px;margin-bottom:12px"></div>
    <div class="card-label">${status}</div>
    <div class="card-value" style="font-size:22px;color:${STATUS_COLORS[status] || "#64748b"}">${usd(total)}</div>
    <div class="card-sub">${invoices.filter(i => i.status === status).length} invoice${invoices.filter(i => i.status === status).length !== 1 ? "s" : ""}</div>
  </div>`).join("")}
</div>

<div class="card" style="padding:0">
  <div style="padding:16px 20px 0;display:flex;gap:10px;flex-wrap:wrap">
    ${["All","Draft","Sent","Paid","Overdue","Void"].map(s =>
      `<button class="filter-btn${filter === s ? " active" : ""}" onclick="setInvFilter('${s}')" style="margin-bottom:12px">${s}</button>`
    ).join("")}
  </div>
  ${filtered.length === 0
    ? `<div class="empty"><div class="empty-icon">🧾</div><div class="empty-text">No invoices here.</div></div>`
    : `<table class="tbl">
        <thead><tr><th>#</th><th>Client</th><th>Project</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${filtered.map(inv => `
        <tr>
          <td data-label="#" style="color:var(--text-muted);font-weight:600">${inv.invoice_number}</td>
          <td style="font-weight:600;color:var(--text)">${inv.client_name || "—"}</td>
          <td style="color:var(--text-muted)">${inv.project_name || "—"}</td>
          <td data-label="Amount" style="font-weight:700">${usd(inv.amount)}</td>
          <td style="color:${inv.status === 'Overdue' ? '#f43f5e' : '#64748b'}">${fmtDate(inv.due_date)}</td>
          <td>${badge(inv.status)}</td>
          <td><div class="btn-row" style="flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="printInvoice('${inv.id}')">🖨 Print</button>
            ${inv.status !== "Paid" && inv.status !== "Void" ? `<button class="btn btn-ghost btn-sm" style="color:#10b981;border-color:#10b98144;font-size:11px" onclick="updateInvStatus('${inv.id}','Paid')">✓ Paid</button>` : ""}
            ${inv.status === "Draft" ? `<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="updateInvStatus('${inv.id}','Sent')">Send</button>` : ""}
            ${inv.status !== "Void" && inv.status !== "Paid" ? `<button class="btn btn-ghost btn-sm" style="font-size:11px;color:#f59e0b;border-color:#f59e0b44" onclick="updateInvStatus('${inv.id}','Void')">Void</button>` : ""}
            <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="openInvModal('${inv.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" style="font-size:11px" onclick="deleteInv('${inv.id}')">×</button>
          </div></td>
        </tr>`).join("")}</tbody>
      </table>`}
</div>`;
}

window.setInvFilter    = function(f) { window._invFilter = f; render(); };
window.updateInvStatus = async function(id, status) { await db.update("invoices", id, { status }); loadAll(); };
window.deleteInv       = async function(id) { if (!confirm("Delete this invoice?")) return; await db.delete("invoices", id); loadAll(); };

// ── Print / PDF export ─────────────────────────────────────────
window.printInvoice = async function(id) {
  const inv     = STATE.data.invoices.find(i => i.id === id);
  if (!inv) return;
  const items   = await _fetchItems(id);
  const cfg     = getConfig();
  const bizName = STATE.data.business_plan?.business_name || cfg.app_name || "FreelanceHub";

  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html>
<html><head><title>Invoice ${inv.invoice_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 48px; background: #fff; }
  .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .inv-biz    { font-size: 22px; font-weight: 700; color: #6366f1; }
  .inv-meta   { text-align: right; color: #64748b; }
  .inv-meta strong { color: #1e293b; }
  .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
  .inv-party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #94a3b8; margin-bottom: 6px; }
  .inv-party p  { font-size: 14px; font-weight: 600; color: #1e293b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; }
  td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .right { text-align: right; }
  .totals-row { display: flex; justify-content: flex-end; }
  .totals     { min-width: 260px; }
  .tot-line   { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #64748b; }
  .tot-total  { display: flex; justify-content: space-between; padding: 12px 0 0; font-size: 18px; font-weight: 700; color: #6366f1; border-top: 2px solid #e2e8f0; margin-top: 6px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .status-Paid    { background:#dcfce7; color:#16a34a; }
  .status-Sent    { background:#dbeafe; color:#2563eb; }
  .status-Draft   { background:#f1f5f9; color:var(--text-muted); }
  .status-Overdue { background:#fee2e2; color:#dc2626; }
  .status-Void    { background:#f1f5f9; color:#94a3b8; text-decoration:line-through; }
  .notes { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 24px; } }
</style>
</head><body>
<div class="inv-header">
  <div>
    <div class="inv-biz">${bizName}</div>
  </div>
  <div class="inv-meta">
    <div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:6px">INVOICE</div>
    <div><strong>#${inv.invoice_number}</strong></div>
    <div>Issued: ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
    ${inv.due_date ? `<div>Due: <strong>${fmtDate(inv.due_date)}</strong></div>` : ""}
    <div style="margin-top:8px"><span class="status-badge status-${inv.status}">${inv.status}</span></div>
  </div>
</div>

<div class="inv-parties">
  <div class="inv-party">
    <h3>Bill To</h3>
    <p>${inv.client_name || "—"}</p>
    ${inv.project_name ? `<div style="color:var(--text-muted);margin-top:4px">Re: ${inv.project_name}</div>` : ""}
  </div>
</div>

${items.length > 0 ? `
<table>
  <thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
  <tbody>
    ${items.map(it => `
    <tr>
      <td>${it.description}</td>
      <td class="right">${Number(it.quantity)}</td>
      <td class="right">${usd(it.unit_price)}</td>
      <td class="right" style="font-weight:600">${usd(it.amount)}</td>
    </tr>`).join("")}
  </tbody>
</table>` : `
<table>
  <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
  <tbody><tr><td>${inv.notes || "Services rendered"}</td><td class="right" style="font-weight:600">${usd(inv.amount)}</td></tr></tbody>
</table>`}

<div class="totals-row">
  <div class="totals">
    <div class="tot-total"><span>Total Due</span><span>${usd(inv.amount)}</span></div>
  </div>
</div>

${inv.notes && items.length > 0 ? `<div class="notes"><strong>Notes:</strong> ${inv.notes}</div>` : ""}
<div class="footer">Thank you for your business.</div>
</body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 400);
};

// ── Fetch line items ──────────────────────────────────────────
async function _fetchItems(invoiceId) {
  try {
    const rows = await db.list("invoice_items", `invoice_id=eq.${invoiceId}&order=sort_order.asc`);
    return rows || [];
  } catch { return []; }
}

// ── Modal with line items ─────────────────────────────────────
window.openInvModal = async function(id) {
  const inv  = id ? STATE.data.invoices.find(x => x.id === id) : null;
  const { clients, invoices, projects } = STATE.data;
  const nums    = invoices.map(i => parseInt((i.invoice_number || "0").replace(/\D/g, "")) || 0);
  const nextNum = `INV-${String(Math.max(0, ...nums) + 1).padStart(4, "0")}`;
  const items   = id ? await _fetchItems(id) : [];

  // Seed one blank row if new invoice
  const initialItems = items.length > 0 ? items : [{ description: "", quantity: 1, unit_price: "" }];

  showModal(`
<div class="modal-header">
  <div class="modal-title">${inv ? "Edit Invoice" : "New Invoice"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Invoice #</label>
    <input id="i-num" value="${inv?.invoice_number || nextNum}"/></div>
  <div class="form-group"><label class="form-label">Status</label>
    <select id="i-status">
      ${["Draft","Sent","Paid","Overdue","Void"].map(s => `<option${inv?.status === s ? " selected" : ""}>${s}</option>`).join("")}
    </select></div>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Client</label>
    <select id="i-client">
      <option value="">— Select —</option>
      ${clients.map(c => `<option value="${c.id}"${inv?.client_id === c.id ? " selected" : ""}>${c.name}</option>`).join("")}
    </select></div>
  <div class="form-group"><label class="form-label">Project</label>
    <select id="i-project">
      <option value="">— Select —</option>
      ${projects.map(p => `<option value="${p.id}"${inv?.project_id === p.id ? " selected" : ""}>${p.name}</option>`).join("")}
    </select></div>
</div>
<div class="form-group"><label class="form-label">Due Date</label>
  <input id="i-due" type="date" value="${inv?.due_date || ""}"/></div>

<div style="margin-bottom:16px">
  <div style="font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:10px">Line Items</div>
  <div id="inv-items-wrap">
    ${initialItems.map((it, idx) => _itemRowHTML(idx, it)).join("")}
  </div>
  <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="addInvItem()">+ Add Line</button>
</div>

<div style="text-align:right;padding:12px 0;border-top:1px solid #2a3048;margin-bottom:16px">
  <span style="font-size:13px;color:var(--text-muted)">Total: </span>
  <span id="inv-total-preview" style="font-size:18px;font-weight:700;color:var(--text);font-family:'Space Grotesk',sans-serif">
    ${usd(inv?.amount || 0)}
  </span>
</div>

<div class="form-group"><label class="form-label">Notes / Payment Terms</label>
  <textarea id="i-notes" rows="2" placeholder="Net 30, payment via bank transfer…">${inv?.notes || ""}</textarea>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
  <button class="btn btn-primary" id="i-save-btn" onclick="saveInv('${id || ""}')">
    ${inv ? "Save Changes" : "Create Invoice"}
  </button>
</div>`, "large");

  _recalcInvTotal();
};

function _itemRowHTML(idx, it = {}) {
  return `
<div class="inv-item-row" id="inv-item-${idx}" style="display:grid;grid-template-columns:1fr 80px 100px 24px;gap:8px;margin-bottom:8px;align-items:center">
  <input placeholder="Description" value="${(it.description || "").replace(/"/g, "&quot;")}"
    oninput="invItemChanged()" class="inv-item-desc" style="font-size:13px"/>
  <input type="number" placeholder="Qty" value="${it.quantity || 1}" min="0" step="any"
    oninput="_recalcInvTotal()" class="inv-item-qty" style="font-size:13px"/>
  <input type="number" placeholder="Rate" value="${it.unit_price || ""}" min="0" step="0.01"
    oninput="_recalcInvTotal()" class="inv-item-rate" style="font-size:13px"/>
  <button onclick="removeInvItem(${idx})" style="background:none;border:none;color:var(--text-muted);font-size:16px;cursor:pointer;padding:0;line-height:1">×</button>
</div>`;
}

let _invItemCount = 1;
window.addInvItem = function() {
  const wrap = document.getElementById("inv-items-wrap");
  const div  = document.createElement("div");
  div.innerHTML = _itemRowHTML(_invItemCount++);
  wrap.appendChild(div.firstElementChild);
};

window.removeInvItem = function(idx) {
  const row = document.getElementById("inv-item-" + idx);
  if (row) row.remove();
  _recalcInvTotal();
};

window.invItemChanged = function() { _recalcInvTotal(); };

function _recalcInvTotal() {
  const rows   = document.querySelectorAll(".inv-item-row");
  let total    = 0;
  rows.forEach(row => {
    const qty  = parseFloat(row.querySelector(".inv-item-qty")?.value) || 0;
    const rate = parseFloat(row.querySelector(".inv-item-rate")?.value) || 0;
    total += qty * rate;
  });
  const el = document.getElementById("inv-total-preview");
  if (el) el.textContent = usd(total);
  window._invTotal = total;
}

function _collectItems() {
  const rows = document.querySelectorAll(".inv-item-row");
  const items = [];
  rows.forEach((row, idx) => {
    const desc = row.querySelector(".inv-item-desc")?.value.trim();
    const qty  = parseFloat(row.querySelector(".inv-item-qty")?.value) || 0;
    const rate = parseFloat(row.querySelector(".inv-item-rate")?.value) || 0;
    if (desc) items.push({ description: desc, quantity: qty, unit_price: rate, sort_order: idx });
  });
  return items;
}

window.saveInv = async function(id) {
  const { clients, projects } = STATE.data;
  const clId = document.getElementById("i-client").value;
  const prId = document.getElementById("i-project").value;
  const cl   = clients.find(c => c.id === clId);
  const pr   = projects.find(p => p.id === prId);
  const items = _collectItems();
  const total = items.reduce((s, it) => s + it.quantity * it.unit_price, 0) || window._invTotal || 0;

  const body = {
    invoice_number: document.getElementById("i-num").value.trim(),
    client_id:      clId,
    client_name:    cl ? cl.name : "",
    project_id:     prId,
    project_name:   pr ? pr.name : "",
    amount:         total,
    status:         document.getElementById("i-status").value,
    due_date:       document.getElementById("i-due").value,
    notes:          document.getElementById("i-notes").value.trim(),
  };

  const btn = document.getElementById("i-save-btn");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    let invId = id;
    if (id) {
      await db.update("invoices", id, body);
    } else {
      const created = await db.insert("invoices", body);
      invId = Array.isArray(created) ? created[0]?.id : created?.id;
    }
    // Sync line items: delete old, insert new
    if (invId) {
      try {
        const existingItems = await _fetchItems(invId);
        for (const it of existingItems) {
          await db.delete("invoice_items", it.id);
        }
        for (const it of items) {
          await db.insert("invoice_items", { ...it, invoice_id: invId });
        }
      } catch (e) { console.warn("Line items sync error:", e.message); }
    }
    closeModal();
    await loadAll();
  } catch(e) {
    alert(e.message);
    btn.disabled = false;
    btn.textContent = id ? "Save Changes" : "Create Invoice";
  }
};



window.invoicesHTML = invoicesHTML;
