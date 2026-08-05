// ============================================================
//  Freelancer — client/pages/brainstorm.js
//  Guided brainstorming — free-form notes, idea cards,
//  prompted sessions for business planning and strategy.
// ============================================================

const BS_PROMPTS = {
  "New Service Idea": [
    "What problem does this solve?",
    "Who specifically would pay for this?",
    "How is this different from what already exists?",
    "What would you charge and why?",
    "What's the biggest risk?",
    "What's the first step to validate it?",
  ],
  "Client Pitch": [
    "What is the client's core pain point?",
    "What outcome will they care about most?",
    "What's your unique angle or proof point?",
    "What objections might they have?",
    "What does success look like in 90 days?",
    "What's your ask at the end of the meeting?",
  ],
  "Quarterly Goals": [
    "What is the single most important thing to accomplish this quarter?",
    "What revenue target are you aiming for?",
    "What new skill or capability do you want to build?",
    "What should you stop doing or cut?",
    "Who do you need to connect with or hire?",
    "How will you measure success?",
  ],
  "Problem Solving": [
    "Describe the problem in one sentence.",
    "What have you already tried?",
    "What would the ideal solution look like?",
    "What constraints are you working within?",
    "Who else has solved a similar problem?",
    "What's the smallest possible experiment you could run?",
  ],
  "Free Form": [],
};

function brainstormHTML() {
  const notes  = STATE.data.brainstorm || [];
  const active = window._bsActive || null; // id of open note

  if (active) return _bsEditHTML(active);

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">// brainstorm</div>
    <div class="page-sub">${notes.length} note${notes.length !== 1 ? "s" : ""} saved</div>
  </div>
  <button class="btn btn-primary" onclick="newBsNote()">+ new note</button>
</div>

<!-- Guided prompts -->
<div style="margin-bottom:24px">
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:12px">guided sessions</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    ${Object.keys(BS_PROMPTS).map(p => `
    <button class="filter-btn" onclick="startPromptedSession('${p.replace(/'/g,"\\'")}')">
      ${p}
    </button>`).join("")}
  </div>
</div>

<!-- Notes grid -->
${notes.length === 0
  ? `<div class="empty">
      <div class="empty-icon" style="font-family:'JetBrains Mono',monospace">◈</div>
      <div class="empty-text">no notes yet. start a guided session or write freely.</div>
    </div>`
  : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
      ${notes.map(n => `
      <div style="background:var(--bg-raised);border:1px solid var(--border);border-left:3px solid ${n.color || "var(--accent)"};border-radius:4px;padding:18px;cursor:pointer;transition:border-color .15s"
        onclick="openBsNote('${n.id}')">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
          <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:var(--text)">${n.title}</div>
          <button onclick="event.stopPropagation();deleteBsNote('${n.id}')"
            style="background:none;border:none;color:var(--border-2);font-size:14px;cursor:pointer;padding:0;flex-shrink:0"
            onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--border-2)'">×</button>
        </div>
        ${n.content ? `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">
          ${n.content.replace(/</g,"&lt;").substring(0,200)}
        </div>` : ""}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
          ${n.tags ? `<div style="display:flex;gap:4px;flex-wrap:wrap">
            ${n.tags.split(",").filter(Boolean).map(t => `<span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--text-muted);background:var(--border);padding:2px 6px;border-radius:3px">${t.trim()}</span>`).join("")}
          </div>` : "<span></span>"}
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted)">${fmtDate(n.updated_at)}</span>
        </div>
      </div>`).join("")}
    </div>`}`;
}

// ── Note editor ───────────────────────────────────────────────
function _bsEditHTML(id) {
  const n = id === "new" ? null : (STATE.data.brainstorm || []).find(x => x.id === id);
  const prompts = window._bsPrompts || [];

  return `
<div style="display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:20px;cursor:pointer" onclick="window._bsActive=null;window._bsPrompts=null;render()">
  ← back to brainstorm
</div>

<div style="max-width:720px">
  <div class="form-group">
    <input id="bs-title" value="${n?.title || window._bsPromptType || "untitled"}"
      placeholder="note title…"
      style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;background:transparent;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:4px 0;margin-bottom:8px"/>
  </div>
  <div class="form-group">
    <input id="bs-tags" value="${n?.tags || ""}" placeholder="tags: strategy, q3, idea…"
      style="font-size:11px;border-color:var(--border)"/>
  </div>

  ${prompts.length > 0 ? `
  <div style="margin-bottom:20px">
    <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px">guided prompts — answer below each one</div>
    ${prompts.map((p, i) => `
    <div style="padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:4px;margin-bottom:8px">
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent);font-weight:700;margin-bottom:4px">${i + 1}. ${p}</div>
    </div>`).join("")}
  </div>` : ""}

  <div class="form-group">
    <label class="form-label">notes</label>
    <textarea id="bs-content" rows="16"
      placeholder="${prompts.length > 0 ? "Write your answers here — use the prompts above as a guide…" : "Start writing…"}"
      style="font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.8;resize:vertical">${n?.content || (prompts.length > 0 ? prompts.map((p,i) => `${i+1}. ${p}\n\n`).join("") : "")}</textarea>
  </div>

  <div class="btn-row" style="margin-top:16px">
    <button class="btn btn-primary" onclick="saveBsNote('${id}')">save note</button>
    <button class="btn btn-ghost" onclick="window._bsActive=null;window._bsPrompts=null;render()">cancel</button>
    ${id !== "new" ? `<button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="deleteBsNote('${id}')">delete</button>` : ""}
  </div>
</div>`;
}

// ── Actions ───────────────────────────────────────────────────
window.newBsNote = function() {
  window._bsActive  = "new";
  window._bsPrompts = null;
  window._bsPromptType = "untitled";
  render();
};

window.startPromptedSession = function(type) {
  window._bsActive     = "new";
  window._bsPrompts    = BS_PROMPTS[type] || [];
  window._bsPromptType = type;
  render();
};

window.openBsNote = function(id) {
  window._bsActive  = id;
  window._bsPrompts = null;
  render();
};

window.saveBsNote = async function(id) {
  const body = {
    title:      document.getElementById("bs-title")?.value.trim() || "untitled",
    content:    document.getElementById("bs-content")?.value.trim(),
    tags:       document.getElementById("bs-tags")?.value.trim(),
    color:      window._bsColor || (STATE.data.brainstorm || []).find(n => n.id === id)?.color || "#3bf4a3",
    updated_at: new Date().toISOString(),
  };
  try {
    if (id === "new") {
      await db.insert("brainstorm", body);
    } else {
      await db.update("brainstorm", id, body);
    }
    window._bsActive  = null;
    window._bsPrompts = null;
    await loadAll();
  } catch(e) { alert(e.message); }
};

window.deleteBsNote = async function(id) {
  if (!confirm("Delete this note?")) return;
  await db.delete("brainstorm", id);
  window._bsActive = null;
  loadAll();
};

window.brainstormHTML = brainstormHTML;
