// ============================================================
//  FreelanceHub — client/pages/finances.js
//  Income, expenses, tax tracking — with period filter,
//  project/client links, and Cancelled status support.
// ============================================================

// ── Period helpers ────────────────────────────────────────────
function _periodDates(period) {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();
  switch (period) {
    case "this_month":
      return [new Date(y, m, 1), new Date(y, m + 1, 0)];
    case "last_month":
      return [new Date(y, m - 1, 1), new Date(y, m, 0)];
    case "this_quarter": {
      const q = Math.floor(m / 3);
      return [new Date(y, q * 3, 1), new Date(y, q * 3 + 3, 0)];
    }
    case "this_year":
      return [new Date(y, 0, 1), new Date(y, 11, 31)];
    default: // "all"
      return [null, null];
  }
}

function _filterByPeriod(entries, period) {
  const [start, end] = _periodDates(period);
  if (!start) return entries;
  return entries.filter(e => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });
}

const PERIOD_LABELS = {
  all: "All Time",
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
};

// ── Render ────────────────────────────────────────────────────
function financesHTML() {
  const { finances, projects, clients } = STATE.data;
  const typeFilter   = window._finFilter  || "All";
  const period       = window._finPeriod  || "this_month";
  const projFilter   = window._finProject || "";

  const periodEntries = _filterByPeriod(finances, period);

  let displayed = typeFilter === "All"
    ? periodEntries
    : periodEntries.filter(f => f.type === typeFilter);
  if (projFilter) displayed = displayed.filter(f => f.project_id === projFilter);

  const income   = periodEntries.filter(f => f.type === "income").reduce((s, f)  => s + Number(f.amount), 0);
  const expenses = periodEntries.filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
  const tax      = Math.max(0, (income - expenses) * 0.25);

  const catTotals = TAX_CATS
    .map(cat => ({ cat, total: periodEntries.filter(f => f.category === cat).reduce((s, f) => s + Number(f.amount), 0) }))
    .filter(c => c.total > 0);

  // Per-project income summary
  const byProject = {};
  periodEntries.filter(f => f.type === "income" && f.project_id).forEach(f => {
    const p = projects.find(p => p.id === f.project_id);
    const name = p?.name || f.project_id;
    byProject[f.project_id] = { name, total: (byProject[f.project_id]?.total || 0) + Number(f.amount) };
  });

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">Finances</div>
    <div class="page-sub">Income, expenses &amp; tax tracking</div>
  </div>
  <button class="btn btn-primary" onclick="openFinModal(null)">+ Add Entry</button>
</div>

<!-- Period picker -->
<div class="filter-row" style="margin-bottom:16px">
  ${Object.entries(PERIOD_LABELS).map(([k, label]) =>
    `<button class="filter-btn${period === k ? " active" : ""}" onclick="setFinPeriod('${k}')">${label}</button>`
  ).join("")}
</div>

<div class="fin-summary">
  ${[
    { label: "Total Income",    val: income,          color: "#10b981", icon: "📈" },
    { label: "Total Expenses",  val: expenses,        color: "#f43f5e", icon: "📉" },
    { label: "Net Profit",      val: income - expenses, color: (income - expenses) >= 0 ? "#6366f1" : "#f43f5e", icon: "◫" },
  ].map(s => `
  <div class="card">
    <div style="font-size:22px;margin-bottom:8px">${s.icon}</div>
    <div class="card-label">${s.label}</div>
    <div class="card-value" style="color:${s.color}">${usd(s.val)}</div>
    <div class="card-sub">${PERIOD_LABELS[period]}</div>
  </div>`).join("")}
</div>

<div class="grid-2" style="margin-bottom:24px">
  ${catTotals.length > 0 ? `
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">By Tax Category</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${catTotals.map(({ cat, total }) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#0f1117;border-radius:8px;border:1px solid #2a3048">
        <span style="font-size:12px;color:#64748b">${cat}</span>
        <span style="font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif">${usd(total)}</span>
      </div>`).join("")}
    </div>
  </div>` : `<div class="card"><div class="empty-text" style="color:#2a3048;text-align:center;padding:20px">No entries this period.</div></div>`}

  <div class="card">
    <div class="section-title" style="margin-bottom:14px">Tax Estimate (25%)</div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;color:#64748b;margin-bottom:3px">Net Profit</div>
      <div style="font-size:22px;font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif">${usd(income - expenses)}</div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;color:#64748b;margin-bottom:3px">Estimated Tax</div>
      <div style="font-size:22px;font-weight:700;color:#f59e0b;font-family:'Space Grotesk',sans-serif">${usd(tax)}</div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${income > 0 ? Math.min(100, (expenses / income) * 100) : 0}%"></div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-top:5px">Expense ratio vs revenue</div>
    ${tax > 0 ? `
    <div style="margin-top:14px;padding:9px 12px;background:#0f1117;border-radius:8px;border:1px solid #2a3048;font-size:12px;color:#64748b">
      → Set aside <strong style="color:#f59e0b">${usd(tax)}</strong> for quarterly taxes.
    </div>` : ""}
  </div>
</div>

${Object.keys(byProject).length > 0 ? `
<div class="card" style="margin-bottom:24px">
  <div class="section-title" style="margin-bottom:14px">Income by Project</div>
  <div style="display:flex;flex-direction:column;gap:6px">
    ${Object.values(byProject).sort((a,b) => b.total - a.total).map(p => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#0f1117;border-radius:8px;border:1px solid #2a3048">
      <span style="font-size:13px;color:#e2e8f0;font-weight:500">${p.name}</span>
      <span style="font-weight:700;color:#10b981;font-family:'Space Grotesk',sans-serif">${usd(p.total)}</span>
    </div>`).join("")}
  </div>
</div>` : ""}

<div class="card" style="padding:0">
  <div style="padding:16px 20px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    ${["All","income","expense"].map(f =>
      `<button class="filter-btn${typeFilter === f ? " active" : ""}" onclick="setFinFilter('${f}')" style="margin-bottom:12px">
        ${f === "All" ? "All" : f === "income" ? "Income" : "Expenses"}
      </button>`
    ).join("")}
    ${projects.length > 0 ? `
    <select onchange="setFinProject(this.value)" style="margin-left:auto;margin-bottom:12px;width:auto;padding:6px 10px;font-size:12px">
      <option value="">All Projects</option>
      ${projects.map(p => `<option value="${p.id}"${projFilter === p.id ? " selected" : ""}>${p.name}</option>`).join("")}
    </select>` : ""}
  </div>
  ${displayed.length === 0
    ? `<div class="empty"><div class="empty-icon">💰</div><div class="empty-text">No entries match these filters.</div></div>`
    : `<table class="tbl">
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Project</th><th>Type</th><th>Amount</th><th>Actions</th></tr></thead>
        <tbody>${displayed.map(f => {
          const proj = projects.find(p => p.id === f.project_id);
          return `
          <tr>
            <td style="color:#64748b">${fmtDate(f.date)}</td>
            <td style="font-weight:500">${f.description || "—"}</td>
            <td><span style="font-size:11px;color:#38bdf8">${f.category}</span></td>
            <td style="color:#64748b;font-size:12px">${proj?.name || "—"}</td>
            <td>${f.type === "income"
              ? `<span class="badge" style="background:#10b98122;color:#10b981">income</span>`
              : `<span class="badge" style="background:#f43f5e22;color:#f43f5e">expense</span>`}</td>
            <td style="font-weight:700;color:${f.type === "income" ? "#10b981" : "#f43f5e"}">
              ${f.type === "expense" ? "-" : "+"}${usd(f.amount)}
            </td>
            <td><div class="btn-row">
              <button class="btn btn-ghost btn-sm" onclick="openFinModal('${f.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteFin('${f.id}')">×</button>
            </div></td>
          </tr>`;
        }).join("")}</tbody>
      </table>`}
</div>`;
}

window.setFinFilter  = function(f) { window._finFilter  = f; render(); };
window.setFinPeriod  = function(p) { window._finPeriod  = p; render(); };
window.setFinProject = function(p) { window._finProject = p; render(); };

// ── Modal ─────────────────────────────────────────────────────
window.openFinModal = function(id) {
  const f = id ? STATE.data.finances.find(x => x.id === id) : null;
  const { projects, clients } = STATE.data;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${f ? "Edit Entry" : "Add Entry"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Type</label>
    <select id="f-type" onchange="document.getElementById('f-cat').value=this.value==='income'?'Revenue':'COGS'">
      <option value="income"${(!f || f.type === "income") ? " selected" : ""}>Income</option>
      <option value="expense"${f?.type === "expense" ? " selected" : ""}>Expense</option>
    </select>
  </div>
  <div class="form-group"><label class="form-label">Amount ($)</label>
    <input id="f-amount" type="number" value="${f?.amount || ""}" placeholder="0.00"/>
  </div>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Tax Category</label>
    <select id="f-cat">
      ${TAX_CATS.map(c => `<option${f?.category === c ? " selected" : ""}>${c}</option>`).join("")}
    </select>
  </div>
  <div class="form-group"><label class="form-label">Date</label>
    <input id="f-date" type="date" value="${f?.date || new Date().toISOString().slice(0, 10)}"/>
  </div>
</div>
<div class="form-row">
  <div class="form-group"><label class="form-label">Project (optional)</label>
    <select id="f-project">
      <option value="">— None —</option>
      ${projects.map(p => `<option value="${p.id}"${f?.project_id === p.id ? " selected" : ""}>${p.name}</option>`).join("")}
    </select>
  </div>
  <div class="form-group"><label class="form-label">Client (optional)</label>
    <select id="f-client">
      <option value="">— None —</option>
      ${clients.map(c => `<option value="${c.id}"${f?.client_id === c.id ? " selected" : ""}>${c.name}</option>`).join("")}
    </select>
  </div>
</div>
<div class="form-group"><label class="form-label">Description</label>
  <input id="f-desc" value="${f?.description || ""}" placeholder="What was this for?"/>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
  <button class="btn btn-primary" id="f-save-btn" onclick="saveFin('${id || ""}')">
    ${f ? "Save Changes" : "Add Entry"}
  </button>
</div>`);
};

window.saveFin = async function(id) {
  const body = {
    type:        document.getElementById("f-type").value,
    amount:      document.getElementById("f-amount").value,
    category:    document.getElementById("f-cat").value,
    date:        document.getElementById("f-date").value,
    description: document.getElementById("f-desc").value.trim(),
    project_id:  document.getElementById("f-project").value || null,
    client_id:   document.getElementById("f-client").value || null,
  };
  if (!body.amount) return;
  const btn = document.getElementById("f-save-btn");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    if (id) await db.update("finances", id, body);
    else     await db.insert("finances", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "Save"; }
};

window.deleteFin = async function(id) {
  if (!confirm("Delete this entry?")) return;
  await db.delete("finances", id); loadAll();
};

window.financesHTML = financesHTML;
