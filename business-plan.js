// ============================================================
//  FreelanceHub — client/pages/business-plan.js
//  Business plan memorialization — one record per user.
// ============================================================

// ── Render ────────────────────────────────────────────────────
function businessPlanHTML() {
  const bp = STATE.data.business_plan || null;

  const sections = [
    {
      title: "Identity", icon: "🏢", color: "#6366f1",
      fields: [
        { key: "business_name", label: "Business Name",   placeholder: "Acme Freelance Co." },
        { key: "tagline",       label: "Tagline / Slogan", placeholder: "Making the web beautiful, one pixel at a time." },
        { key: "mission",       label: "Mission Statement", placeholder: "We exist to…", rows: 3 },
        { key: "vision",        label: "Vision",            placeholder: "In 10 years we will be…", rows: 3 },
      ],
    },
    {
      title: "Market", icon: "🎯", color: "#10b981",
      fields: [
        { key: "target_market", label: "Target Market",         placeholder: "Small SaaS companies, 10-50 employees…", rows: 3 },
        { key: "value_prop",    label: "Value Proposition",     placeholder: "We help X do Y so they can Z…", rows: 3 },
        { key: "competitors",   label: "Competitors / Landscape", placeholder: "Upwork, Fiverr, local agencies…", rows: 3 },
      ],
    },
    {
      title: "Business Model", icon: "💼", color: "#f59e0b",
      fields: [
        { key: "revenue_model", label: "Revenue Model",    placeholder: "Project-based, monthly retainer, hourly…", rows: 3 },
        { key: "marketing",     label: "Marketing Strategy", placeholder: "LinkedIn, referrals, cold email, SEO…", rows: 3 },
      ],
    },
    {
      title: "Goals", icon: "🚀", color: "#38bdf8",
      fields: [
        { key: "goals_90_day", label: "90-Day Goals",  placeholder: "Land 3 new clients, hit $10k MRR…", rows: 3 },
        { key: "goals_1_year", label: "1-Year Goals",  placeholder: "Expand to 2 full-time employees…", rows: 3 },
        { key: "goals_5_year", label: "5-Year Goals",  placeholder: "Build a $1M/yr agency…", rows: 3 },
      ],
    },
    {
      title: "SWOT Analysis", icon: "📊", color: "#8b5cf6",
      swot: true,
      fields: [
        { key: "strengths",     label: "Strengths",     placeholder: "Deep technical expertise, fast delivery…", rows: 3, swotColor: "#10b981" },
        { key: "weaknesses",    label: "Weaknesses",    placeholder: "Limited bandwidth, no brand yet…", rows: 3, swotColor: "#f43f5e" },
        { key: "opportunities", label: "Opportunities", placeholder: "AI wave, underserved niches…", rows: 3, swotColor: "#38bdf8" },
        { key: "threats",       label: "Threats",       placeholder: "Commoditization, AI replacing tasks…", rows: 3, swotColor: "#f59e0b" },
      ],
    },
    {
      title: "Notes", icon: "📝", color: "#64748b",
      fields: [
        { key: "notes", label: "Additional Notes", placeholder: "Anything else worth memorializing…", rows: 5 },
      ],
    },
  ];

  const updatedAt = bp?.updated_at
    ? `Last saved ${fmtDate(bp.updated_at)}`
    : "Not yet saved";

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">Business Plan</div>
    <div class="page-sub">Memorialize your strategy — ${updatedAt}</div>
  </div>
  <div class="btn-row">
    <button class="btn btn-ghost" onclick="exportBP()">⬇ Export</button>
    <button class="btn btn-primary" id="bp-save-btn" onclick="saveBP()">Save Plan</button>
  </div>
</div>

<div id="bp-msg" style="display:none;margin-bottom:20px"></div>

${sections.map(sec => `
<div class="card" style="margin-bottom:20px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #2a3048">
    <span style="font-size:20px">${sec.icon}</span>
    <div class="section-title" style="color:${sec.color}">${sec.title}</div>
  </div>
  ${sec.swot
    ? `<div class="grid-2">${sec.fields.map(f => _bpField(f, bp)).join("")}</div>`
    : sec.fields.map(f => _bpField(f, bp)).join("")
  }
</div>`).join("")}`;
}

function _bpField(f, bp) {
  const val = bp?.[f.key] || "";
  if (f.rows) {
    return `
<div class="form-group">
  ${f.swotColor
    ? `<label class="form-label" style="color:${f.swotColor}">${f.label}</label>`
    : `<label class="form-label">${f.label}</label>`}
  <textarea id="bp-${f.key}" rows="${f.rows}" placeholder="${f.placeholder}" style="${f.swotColor ? `border-color:${f.swotColor}33` : ""}">${val}</textarea>
</div>`;
  }
  return `
<div class="form-group">
  <label class="form-label">${f.label}</label>
  <input id="bp-${f.key}" value="${val.replace(/"/g, "&quot;")}" placeholder="${f.placeholder}"/>
</div>`;
}

// ── Collect form data ─────────────────────────────────────────
function _collectBP() {
  const keys = [
    "business_name","tagline","mission","vision","target_market","value_prop",
    "revenue_model","competitors","marketing","goals_90_day","goals_1_year",
    "goals_5_year","strengths","weaknesses","opportunities","threats","notes",
  ];
  const body = { updated_at: new Date().toISOString() };
  keys.forEach(k => {
    const el = document.getElementById("bp-" + k);
    if (el) body[k] = el.value.trim();
  });
  return body;
}

// ── Save ─────────────────────────────────────────────────────
window.saveBP = async function() {
  const btn = document.getElementById("bp-save-btn");
  const msg = document.getElementById("bp-msg");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const body = _collectBP();
    const existing = STATE.data.business_plan;
    if (existing?.id) {
      await db.update("business_plan", existing.id, body);
    } else {
      await db.insert("business_plan", body);
    }
    msg.innerHTML = `<div class="msg-ok">✓ Business plan saved.</div>`;
    msg.style.display = "block";
    setTimeout(() => { msg.style.display = "none"; }, 3000);
    await loadAll();
  } catch(e) {
    msg.innerHTML = `<div class="msg-error">${e.message}</div>`;
    msg.style.display = "block";
  }
  btn.disabled = false; btn.textContent = "Save Plan";
};

// ── Export as plain text ──────────────────────────────────────
window.exportBP = function() {
  const bp = STATE.data.business_plan || _collectBP();
  const lines = [
    `FREELANCEHUB — BUSINESS PLAN`,
    `Exported: ${new Date().toLocaleDateString()}`,
    ``,
    `BUSINESS: ${bp.business_name || "—"}`,
    `TAGLINE:  ${bp.tagline || "—"}`,
    ``,
    `── MISSION ──────────────────────────────`,
    bp.mission || "—",
    ``,
    `── VISION ───────────────────────────────`,
    bp.vision || "—",
    ``,
    `── TARGET MARKET ────────────────────────`,
    bp.target_market || "—",
    ``,
    `── VALUE PROPOSITION ────────────────────`,
    bp.value_prop || "—",
    ``,
    `── REVENUE MODEL ────────────────────────`,
    bp.revenue_model || "—",
    ``,
    `── COMPETITORS ──────────────────────────`,
    bp.competitors || "—",
    ``,
    `── MARKETING STRATEGY ───────────────────`,
    bp.marketing || "—",
    ``,
    `── 90-DAY GOALS ─────────────────────────`,
    bp.goals_90_day || "—",
    ``,
    `── 1-YEAR GOALS ─────────────────────────`,
    bp.goals_1_year || "—",
    ``,
    `── 5-YEAR GOALS ─────────────────────────`,
    bp.goals_5_year || "—",
    ``,
    `── SWOT ─────────────────────────────────`,
    `Strengths:     ${bp.strengths || "—"}`,
    `Weaknesses:    ${bp.weaknesses || "—"}`,
    `Opportunities: ${bp.opportunities || "—"}`,
    `Threats:       ${bp.threats || "—"}`,
    ``,
    `── NOTES ────────────────────────────────`,
    bp.notes || "—",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = `business-plan-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
};

window.businessPlanHTML = businessPlanHTML;
