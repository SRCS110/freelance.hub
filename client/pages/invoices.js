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
    ? `<div class="empty"><div class="empty-icon" style="font-family:'JetBrains Mono',monospace">◻</div><div class="empty-text">No invoices here.</div></div>`
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
            <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="printInvoice('${inv.id}')">⎙ print / save</button>
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
  const inv   = STATE.data.invoices.find(i => i.id === id);
  if (!inv) return;
  const items = await _fetchItems(id);
  const bizName = STATE.data.user_settings?.business_name ||
                  STATE.data.business_plan?.business_name || "FreelanceHub";

  // Load jsPDF if not already loaded
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W   = 210;
  const M   = 18; // margin
  const CW  = W - M * 2; // content width
  let   y   = M;

  // Helpers
  const line  = (x1, y1, x2, y2, color = "#e2e2e8") => { doc.setDrawColor(color); doc.line(x1, y1, x2, y2); };
  const text  = (str, x, yy, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(opts.color || "#18181b");
    doc.text(String(str || ""), x, yy, { align: opts.align || "left", maxWidth: opts.maxWidth });
  };

  // ── Header ──────────────────────────────────────────────────
  text(bizName, M, y + 6, { size: 18, bold: true, color: "#059669" });
  text("INVOICE", W - M, y + 4, { size: 20, bold: true, align: "right", color: "#18181b" });
  text(`#${inv.invoice_number}`, W - M, y + 10, { size: 11, align: "right", color: "#71717a" });
  y += 18;
  line(M, y, W - M, y);
  y += 6;

  // ── Meta row ────────────────────────────────────────────────
  text("Issued:", M, y, { size: 9, color: "#71717a" });
  text(new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), M + 16, y, { size: 9 });
  if (inv.due_date) {
    text("Due:", M + 60, y, { size: 9, color: "#71717a" });
    text(new Date(inv.due_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), M + 72, y, { size: 9 });
  }
  text("Status:", W - M - 30, y, { size: 9, color: "#71717a" });
  text(inv.status, W - M, y, { size: 9, bold: true, align: "right" });
  y += 10;

  // ── Bill To ─────────────────────────────────────────────────
  text("BILL TO", M, y, { size: 8, bold: true, color: "#71717a" });
  y += 5;
  text(inv.client_name || "—", M, y, { size: 11, bold: true });
  if (inv.project_name) { y += 5; text(`Re: ${inv.project_name}`, M, y, { size: 9, color: "#71717a" }); }
  y += 12;
  line(M, y, W - M, y);
  y += 6;

  // ── Line items ───────────────────────────────────────────────
  if (items.length > 0) {
    // Header row
    doc.setFillColor("#f4f4f5");
    doc.rect(M, y - 3, CW, 8, "F");
    text("Description", M + 2, y + 2, { size: 8, bold: true, color: "#71717a" });
    text("Qty",    M + CW * 0.60, y + 2, { size: 8, bold: true, color: "#71717a", align: "right" });
    text("Rate",   M + CW * 0.75, y + 2, { size: 8, bold: true, color: "#71717a", align: "right" });
    text("Amount", M + CW + 2,    y + 2, { size: 8, bold: true, color: "#71717a", align: "right" });
    y += 9;

    items.forEach(it => {
      text(it.description, M + 2, y, { size: 9, maxWidth: CW * 0.55 });
      text(String(Number(it.quantity)), M + CW * 0.60, y, { size: 9, align: "right" });
      text("$" + Number(it.unit_price).toFixed(2), M + CW * 0.75, y, { size: 9, align: "right" });
      text("$" + Number(it.amount || it.quantity * it.unit_price).toFixed(2), M + CW + 2, y, { size: 9, bold: true, align: "right" });
      y += 2;
      line(M, y, W - M, y, "#f4f4f5");
      y += 5;
    });
  } else {
    text(inv.notes || "Services rendered", M + 2, y, { size: 9 });
    text("$" + Number(inv.amount).toFixed(2), M + CW + 2, y, { size: 9, bold: true, align: "right" });
    y += 8;
  }

  y += 2;
  line(M, y, W - M, y);
  y += 6;

  // ── Total ────────────────────────────────────────────────────
  text("Total Due", M + CW - 30, y, { size: 11, bold: true, align: "right" });
  text("$" + Number(inv.amount).toFixed(2), M + CW + 2, y, { size: 14, bold: true, color: "#059669", align: "right" });
  y += 12;

  // ── Notes ────────────────────────────────────────────────────
  if (inv.notes && items.length > 0) {
    text("Notes", M, y, { size: 8, bold: true, color: "#71717a" });
    y += 4;
    text(inv.notes, M, y, { size: 9, color: "#71717a", maxWidth: CW });
    y += 8;
  }

  // ── Footer ───────────────────────────────────────────────────
  line(M, 277, W - M, 277);
  text("Thank you for your business.", W / 2, 282, { size: 8, color: "#71717a", align: "center" });

  // Download — no popup needed
  doc.save(`invoice-${inv.invoice_number}.pdf`);
};

// ── Fetch line items ─────────────────────────────────────────
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

  _invItemCount = initialItems.length; // reset counter
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

<div style="text-align:right;padding:12px 0;border-top:1px solid var(--border);margin-bottom:16px">
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

  setTimeout(() => _recalcInvTotal(), 50);
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
  setTimeout(() => _recalcInvTotal(), 50);
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
