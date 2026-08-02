// ============================================================
//  FreelanceHub — client/pages/dashboard.js
//  Dashboard with period filter + real-time tax estimate.
// ============================================================

const DASH_PERIODS = {
  this_month:   "This Month",
  this_quarter: "This Quarter",
  this_year:    "This Year",
  all:          "All Time",
};

function _dashFilterFinances(finances, period) {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth();
  let start, end;
  switch (period) {
    case "this_month":
      start = new Date(y, m, 1); end = new Date(y, m + 1, 0); break;
    case "this_quarter": {
      const q = Math.floor(m / 3);
      start = new Date(y, q * 3, 1); end = new Date(y, q * 3 + 3, 0); break;
    }
    case "this_year":
      start = new Date(y, 0, 1); end = new Date(y, 11, 31); break;
    default:
      return finances;
  }
  return finances.filter(f => { const d = new Date(f.date); return d >= start && d <= end; });
}

function dashboardHTML() {
  const { clients, projects, finances, invoices } = STATE.data;
  const period = window._dashPeriod || "this_month";
  const pf     = _dashFilterFinances(finances, period);

  const rev  = pf.filter(f => f.type === "income").reduce((s, f)  => s + Number(f.amount), 0);
  const exp  = pf.filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
  const unpd = invoices.filter(i => i.status !== "Paid" && i.status !== "Void").reduce((s, i) => s + Number(i.amount), 0);
  const tax  = Math.max(0, (rev - exp) * 0.25);
  const actv = projects.filter(p => p.status === "Active").length;
  const overdue = invoices.filter(i => i.status === "Overdue").length;

  const stats = [
    { label: "Revenue",         val: usd(rev),  icon: "◇", color: "#10b981", sub: DASH_PERIODS[period] },
    { label: "Expenses",        val: usd(exp),  icon: "◈", color: "#f59e0b", sub: DASH_PERIODS[period] },
    { label: "Outstanding",     val: usd(unpd), icon: "◻", color: "#f43f5e", sub: `${invoices.filter(i => i.status !== "Paid" && i.status !== "Void").length} unpaid` },
    { label: "Active Projects", val: actv,      icon: "◫", color: "#6366f1", sub: `${projects.length} total` },
  ];

  return `
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
  <div>
    <div class="page-title">Dashboard</div>
    <div class="page-sub">Your business at a glance</div>
  </div>
  <div class="filter-row" style="margin-bottom:0">
    ${Object.entries(DASH_PERIODS).map(([k, label]) =>
      `<button class="filter-btn${period === k ? " active" : ""}" onclick="setDashPeriod('${k}')">${label}</button>`
    ).join("")}
  </div>
</div>

${overdue > 0 ? `
<div style="margin-bottom:20px;padding:10px 16px;background:#f43f5e11;border:1px solid #f43f5e33;border-radius:10px;font-size:13px;color:#f43f5e;display:flex;align-items:center;gap:8px">
  ! <strong>${overdue} overdue invoice${overdue !== 1 ? "s" : ""}</strong> — follow up with clients before the balance grows.
  <button class="btn btn-ghost btn-sm" style="margin-left:auto;color:#f43f5e;border-color:#f43f5e44;font-size:11px" onclick="navigate('invoices')">View →</button>
</div>` : ""}

<div class="grid-4" style="margin-bottom:24px">
  ${stats.map(s => `
  <div class="card">
    <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:${s.color};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;opacity:.7">◆</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:18px;margin-bottom:10px;color:#808b9e">${s.icon}</div>
    <div class="card-label">${s.label}</div>
    <div class="card-value" style="color:${s.color}">${s.val}</div>
    <div class="card-sub">${s.sub}</div>
  </div>`).join("")}
</div>

<div class="grid-2" style="margin-bottom:24px">
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">Recent Projects</div>
    ${projects.length === 0
      ? `<div style="color:#64748b;font-size:13px">No projects yet. <span style="color:#6366f1;cursor:pointer" onclick="navigate('projects')">Add one →</span></div>`
      : `<table class="tbl">
          <thead><tr><th>Project</th><th>Client</th><th>Status</th></tr></thead>
          <tbody>${projects.slice(0, 5).map(p => `
          <tr onclick="window.openProject(${JSON.stringify(p).replace(/"/g,"&quot;")})" style="cursor:pointer">
            <td style="font-weight:600;color:#fff">${p.name}</td>
            <td style="color:#64748b">${p.client_name || "—"}</td>
            <td>${badge(p.status)}</td>
          </tr>`).join("")}</tbody>
        </table>`}
  </div>
  <div class="card">
    <div class="section-title" style="margin-bottom:16px">Tax Estimate</div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;color:#64748b;margin-bottom:3px">Net Profit (${DASH_PERIODS[period]})</div>
      <div style="font-size:22px;font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif">${usd(rev - exp)}</div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;color:#64748b;margin-bottom:3px">Estimated Tax (25%)</div>
      <div style="font-size:22px;font-weight:700;color:#f59e0b;font-family:'Space Grotesk',sans-serif">${usd(tax)}</div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:${rev > 0 ? Math.min(100, (exp / rev) * 100) : 0}%"></div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-top:5px">Expense ratio vs revenue</div>
    ${tax > 0 ? `
    <div style="margin-top:14px;padding:9px 12px;background:#0f1117;border-radius:8px;border:1px solid #2a3048;font-size:12px;color:#64748b">
      💡 Set aside <strong style="color:#f59e0b">${usd(tax)}</strong> for quarterly taxes.
    </div>` : ""}
  </div>
</div>

<div class="grid-2">
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">Recent Invoices</div>
    ${invoices.length === 0
      ? `<div style="color:#64748b;font-size:13px">No invoices yet. <span style="color:#6366f1;cursor:pointer" onclick="navigate('invoices')">Create one →</span></div>`
      : `<table class="tbl">
          <thead><tr><th>#</th><th>Client</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>${invoices.slice(0, 6).map(i => `
          <tr>
            <td style="color:#64748b">${i.invoice_number}</td>
            <td style="font-weight:600">${i.client_name || "—"}</td>
            <td style="font-weight:700;color:#fff">${usd(i.amount)}</td>
            <td>${badge(i.status)}</td>
          </tr>`).join("")}</tbody>
        </table>`}
  </div>
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">Quick Actions</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${[
        { icon: "◎", label: "Add a Client",   page: "clients",      action: "openClientModal(null)" },
        { icon: "◫", label: "New Project",     page: "projects",     action: "openProjectModal(null)" },
        { icon: "◻", label: "Create Invoice",  page: "invoices",     action: "openInvModal(null)" },
        { icon: "◇", label: "Log a Payment",   page: "finances",     action: "openFinModal(null)" },
        { icon: "◈", label: "Edit Business Plan", page: "business-plan", action: null },
        { icon: "◆", label: "Add Bookmark",        page: "bookmarks",     action: "openBmModal(null)" },
        { icon: "◉", label: "Log Tech Charge",     page: "tech-stack",    action: "openStackModal(null)" },
      ].map(q => `
      <button class="btn btn-ghost" style="justify-content:flex-start;gap:12px;text-align:left"
        onclick="${q.action ? `navigate('${q.page}');setTimeout(()=>${q.action},100)` : `navigate('${q.page}')`}">
        <span style="font-family:'JetBrains Mono',monospace;font-size:13px;opacity:.7">${q.icon}</span>${q.label}
      </button>`).join("")}
    </div>
  </div>
</div>`;
}

window.setDashPeriod = function(p) { window._dashPeriod = p; render(); };
window.dashboardHTML = dashboardHTML;
