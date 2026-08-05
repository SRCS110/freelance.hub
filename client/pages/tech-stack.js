// ============================================================
//  Freelancer — client/pages/tech-stack.js
//  Tech stack recurring charges — monthly, annual, one-time.
// ============================================================

const STACK_CATS = ["Hosting","Database","Auth","Analytics","Design","Dev Tools","Marketing","Communication","AI/ML","Storage","Other"];
const STACK_CYCLES = ["monthly","annual","one-time"];

function techStackHTML() {
  const { tech_stack } = STATE.data;
  const stack = tech_stack || [];

  const monthly  = stack.filter(s => s.cycle === "monthly").reduce((sum, s) => sum + Number(s.amount), 0);
  const annual   = stack.filter(s => s.cycle === "annual").reduce((sum, s) => sum + Number(s.amount), 0);
  const oneTime  = stack.filter(s => s.cycle === "one-time").reduce((sum, s) => sum + Number(s.amount), 0);
  const annualTotal = monthly * 12 + annual + oneTime;

  const byCat = {};
  STACK_CATS.forEach(c => {
    const items = stack.filter(s => s.category === c);
    if (items.length) byCat[c] = items;
  });

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">// tech_stack</div>
    <div class="page-sub">${stack.length} service${stack.length!==1?"s":""} · ${usd(monthly)}/mo · ${usd(annualTotal)}/yr est.</div>
  </div>
  <button class="btn btn-primary" onclick="openStackModal(null)">+ add</button>
</div>

<div class="grid-3" style="margin-bottom:24px">
  ${[
    { label: "monthly burn",   val: usd(monthly),     sub: `${stack.filter(s=>s.cycle==="monthly").length} subscriptions`,  color: "#3bf4a3" },
    { label: "annual costs",   val: usd(annual),      sub: `${stack.filter(s=>s.cycle==="annual").length} annual plans`,    color: "#f59e0b" },
    { label: "est. total/yr",  val: usd(annualTotal), sub: "monthly×12 + annual",                                           color: "#e2e8f0" },
  ].map(s => `
  <div class="card">
    <div class="card-label">${s.label}</div>
    <div class="card-value" style="color:${s.color}">${s.val}</div>
    <div class="card-sub">${s.sub}</div>
  </div>`).join("")}
</div>

${stack.length === 0
  ? `<div class="empty"><div class="empty-icon">⚡</div><div class="empty-text">no services tracked yet.</div></div>`
  : Object.entries(byCat).map(([cat, items]) => `
<div style="margin-bottom:24px">
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
    <span>${cat}</span>
    <span style="color:#3bf4a3">${usd(items.reduce((s,i)=>s+Number(i.cycle==="monthly"?i.amount:0),0))}/mo</span>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${items.map(s => `
    <div class="stack-card">
      <div style="min-width:0">
        <div class="stack-name">${s.name}</div>
        <div class="stack-cat">${s.category}${s.description ? " · " + s.description : ""}</div>
        ${s.url ? `<a href="${s.url}" target="_blank" rel="noopener" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#3bf4a3;text-decoration:none">${s.url.replace(/^https?:\/\//,"")}</a>` : ""}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="stack-amt">${usd(s.amount)}</div>
        <div class="stack-cycle">/${s.cycle}</div>
        ${s.renewal_date ? `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);margin-top:2px">renews ${fmtDate(s.renewal_date)}</div>` : ""}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="openStackModal('${s.id}')" style="font-size:10px;padding:4px 8px">edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteStack('${s.id}')" style="font-size:10px;padding:4px 8px">×</button>
      </div>
    </div>`).join("")}
  </div>
</div>`).join("")}`;
}

// ── Modal ─────────────────────────────────────────────────────
window.openStackModal = function(id) {
  const s = id ? (STATE.data.tech_stack||[]).find(x => x.id === id) : null;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${s ? "edit service" : "add service"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label">Service Name</label>
    <input id="st-name" value="${s?.name||""}" placeholder="Supabase"/>
  </div>
  <div class="form-group">
    <label class="form-label">Category</label>
    <select id="st-cat">
      ${STACK_CATS.map(c => `<option${s?.category===c?" selected":""}>${c}</option>`).join("")}
    </select>
  </div>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label">Amount ($)</label>
    <input id="st-amount" type="number" min="0" step="0.01" value="${s?.amount||""}" placeholder="25.00"/>
  </div>
  <div class="form-group">
    <label class="form-label">Billing Cycle</label>
    <select id="st-cycle">
      ${STACK_CYCLES.map(c => `<option${s?.cycle===c?" selected":""}>${c}</option>`).join("")}
    </select>
  </div>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label">URL</label>
    <input id="st-url" value="${s?.url||""}" placeholder="https://supabase.com" type="url"/>
  </div>
  <div class="form-group">
    <label class="form-label">Renewal Date</label>
    <input id="st-renewal" type="date" value="${s?.renewal_date||""}"/>
  </div>
</div>
<div class="form-group">
  <label class="form-label">Description / Plan</label>
  <input id="st-desc" value="${s?.description||""}" placeholder="Pro plan, 10GB storage"/>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="st-save-btn" onclick="saveStack('${id||""}')">
    ${s ? "save changes" : "add service"}
  </button>
</div>`);
};

window.saveStack = async function(id) {
  const body = {
    name:         document.getElementById("st-name").value.trim(),
    category:     document.getElementById("st-cat").value,
    amount:       parseFloat(document.getElementById("st-amount").value) || 0,
    cycle:        document.getElementById("st-cycle").value,
    url:          document.getElementById("st-url").value.trim(),
    renewal_date: document.getElementById("st-renewal").value || null,
    description:  document.getElementById("st-desc").value.trim(),
  };
  if (!body.name) return;
  const btn = document.getElementById("st-save-btn");
  btn.disabled = true; btn.textContent = "saving…";
  try {
    if (id) await db.update("tech_stack", id, body);
    else     await db.insert("tech_stack", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "save"; }
};

window.deleteStack = async function(id) {
  if (!confirm("Remove this service?")) return;
  await db.delete("tech_stack", id); loadAll();
};

window.techStackHTML = techStackHTML;
