// ============================================================
//  FreelanceHub — client/pages/bookmarks.js
//  Bookmarks: websites, tools, and their login credentials.
//  Credentials stored encrypted-at-rest in Supabase (RLS).
// ============================================================

const BM_TAGS = ["Design","Dev","Marketing","Finance","Productivity","Hosting","Social","Other"];

function bookmarksHTML() {
  const { bookmarks } = STATE.data;
  const tag    = window._bmTag    || "All";
  const search = window._bmSearch || "";

  let items = tag === "All" ? bookmarks : bookmarks.filter(b => b.tag === tag);
  if (search) items = items.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.url?.toLowerCase().includes(search.toLowerCase()) ||
    b.tag?.toLowerCase().includes(search.toLowerCase())
  );

  const totalMonthlyCost = bookmarks
    .filter(b => b.monthly_cost)
    .reduce((s, b) => s + Number(b.monthly_cost), 0);

  return `
<div class="page-section-header">
  <div>
    <div class="page-title">// bookmarks</div>
    <div class="page-sub">${bookmarks.length} saved · ${BM_TAGS.filter(t => bookmarks.some(b => b.tag === t)).length} categories${totalMonthlyCost > 0 ? ` · ${usd(totalMonthlyCost)}/mo tracked` : ""}</div>
  </div>
  <button class="btn btn-primary" onclick="openBmModal(null)">+ add</button>
</div>

<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
  <div style="position:relative;flex:1;min-width:200px;max-width:320px">
    <input id="bm-search" value="${search}" placeholder="search bookmarks…"
      oninput="window._bmSearch=this.value;render()"
      style="padding-left:32px"/>
    <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#808b9e;font-size:14px">⌕</span>
  </div>
  <div class="filter-row" style="margin:0;gap:6px">
    ${["All",...BM_TAGS].map(t =>
      `<button class="filter-btn${tag===t?" active":""}" onclick="setBmTag('${t}')">${t}</button>`
    ).join("")}
  </div>
</div>

${items.length === 0
  ? `<div class="empty"><div class="empty-icon">🔖</div><div class="empty-text">no bookmarks${search||tag!=="All"?" matching these filters":""} yet.</div></div>`
  : `<div class="bookmark-grid">
      ${items.map(b => _bookmarkCard(b)).join("")}
    </div>`}`;
}

function _bookmarkCard(b) {
  const hasCreds = b.login_email || b.login_username || b.login_password;
  return `
<div class="bookmark-card">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
    <div style="min-width:0">
      <div class="bookmark-name">${b.name}</div>
      ${b.url ? `<a class="bookmark-url" href="${b.url}" target="_blank" rel="noopener">${b.url.replace(/^https?:\/\//,"")}</a>` : ""}
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button class="btn btn-ghost btn-sm" onclick="openBmModal('${b.id}')" style="padding:4px 8px;font-size:10px">edit</button>
      <button class="btn btn-danger btn-sm" onclick="deleteBm('${b.id}')" style="padding:4px 8px;font-size:10px">×</button>
    </div>
  </div>

  ${b.description ? `<div style="font-size:11px;color:#808b9e;font-family:'JetBrains Mono',monospace;line-height:1.5">${b.description}</div>` : ""}

  ${hasCreds ? `
  <div style="padding:10px;background:#0a0a0c;border:1px solid #24242d;border-radius:6px;display:flex;flex-direction:column;gap:6px">
    <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#808b9e;letter-spacing:.5px;text-transform:uppercase;margin-bottom:2px">credentials</div>
    ${b.login_email    ? `<div class="bookmark-cred">@ <span>${b.login_email}</span><button class="bookmark-cred-reveal" onclick="navigator.clipboard.writeText('${b.login_email.replace(/'/g,"\\'")}');this.textContent='copied!';setTimeout(()=>this.textContent='copy',1200)">copy</button></div>` : ""}
    ${b.login_username ? `<div class="bookmark-cred">id <span>${b.login_username}</span><button class="bookmark-cred-reveal" onclick="navigator.clipboard.writeText('${b.login_username.replace(/'/g,"\\'")}');this.textContent='copied!';setTimeout(()=>this.textContent='copy',1200)">copy</button></div>` : ""}
    ${b.login_password ? `<div class="bookmark-cred">pw <span id="pw-${b.id}">••••••••</span>
      <button class="bookmark-cred-reveal" onclick="toggleBmPw('${b.id}','${b.login_password.replace(/'/g,"\\'")}')">show</button>
      <button class="bookmark-cred-reveal" onclick="navigator.clipboard.writeText('${b.login_password.replace(/'/g,"\\'")}');this.textContent='copied!';setTimeout(()=>this.textContent='copy',1200)">copy</button>
    </div>` : ""}
  </div>` : ""}

  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px">
    ${b.tag ? `<span class="bookmark-tag">${b.tag}</span>` : "<span></span>"}
    ${b.monthly_cost > 0 ? `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#3bf4a3">${usd(b.monthly_cost)}/mo</span>` : ""}
  </div>
</div>`;
}

// PIN-gated credential helpers
window.bmShowPw = function(btn) {
  const id = btn.dataset.id;
  const pw = btn.dataset.pw;
  const el = document.getElementById("pw-" + id);
  if (!el) return;
  if (el.textContent !== "••••••••") {
    el.textContent = "••••••••";
    el.style.letterSpacing = "2px";
    btn.textContent = "show";
    return;
  }
  requirePin(() => {
    el.textContent = pw;
    el.style.letterSpacing = "normal";
    btn.textContent = "hide";
    setTimeout(() => {
      el.textContent = "••••••••";
      el.style.letterSpacing = "2px";
      btn.textContent = "show";
    }, 30000);
  });
};

window.bmCopy = function(btn) {
  const val = btn.dataset.val;
  requirePin(() => {
    navigator.clipboard.writeText(val);
    const orig = btn.textContent;
    btn.textContent = "copied!";
    setTimeout(() => btn.textContent = orig, 1500);
  });
};

window.setBmTag = function(t) { window._bmTag = t; render(); };

// ── Modal ─────────────────────────────────────────────────────
window.openBmModal = function(id) {
  const b = id ? STATE.data.bookmarks.find(x => x.id === id) : null;
  showModal(`
<div class="modal-header">
  <div class="modal-title">${b ? "edit bookmark" : "new bookmark"}</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div class="form-row">
  <div class="form-group">
    <label class="form-label">Name</label>
    <input id="bm-name" value="${b?.name||""}" placeholder="Figma"/>
  </div>
  <div class="form-group">
    <label class="form-label">Tag</label>
    <select id="bm-tag">
      ${BM_TAGS.map(t => `<option${b?.tag===t?" selected":""}>${t}</option>`).join("")}
    </select>
  </div>
</div>
<div class="form-group">
  <label class="form-label">URL</label>
  <input id="bm-url" value="${b?.url||""}" placeholder="https://figma.com" type="url"/>
</div>
<div class="form-group">
  <label class="form-label">Description</label>
  <input id="bm-desc" value="${b?.description||""}" placeholder="UI design tool"/>
</div>

<div style="margin:16px 0 12px;padding-top:14px;border-top:1px solid #24242d">
  <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#808b9e;letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px">login credentials (optional)</div>
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Email</label>
      <input id="bm-email" value="${b?.login_email||""}" placeholder="you@example.com" type="email" autocomplete="off"/>
    </div>
    <div class="form-group">
      <label class="form-label">Username</label>
      <input id="bm-username" value="${b?.login_username||""}" placeholder="@handle" autocomplete="off"/>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Password</label>
    <div class="conn-input-wrap">
      <input id="bm-password" type="password" value="${b?.login_password||""}" placeholder="••••••••" autocomplete="new-password"/>
      <button class="conn-eye" onclick="document.getElementById('bm-password').type=document.getElementById('bm-password').type==='password'?'text':'password'">👁</button>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Notes / 2FA info</label>
    <textarea id="bm-notes" rows="2" placeholder="2FA on Google Authenticator, recovery email is…">${b?.notes||""}</textarea>
  </div>
</div>

<div class="form-group">
  <label class="form-label">Monthly Cost ($)</label>
  <input id="bm-cost" type="number" min="0" step="0.01" value="${b?.monthly_cost||""}" placeholder="0.00"/>
  <div style="font-size:10px;color:#808b9e;font-family:'JetBrains Mono',monospace;margin-top:4px">if this is a paid subscription, shows in total above</div>
</div>

<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="bm-save-btn" onclick="saveBm('${id||""}')">
    ${b ? "save changes" : "add bookmark"}
  </button>
</div>`);
};

window.saveBm = async function(id) {
  const body = {
    name:           document.getElementById("bm-name").value.trim(),
    url:            document.getElementById("bm-url").value.trim(),
    description:    document.getElementById("bm-desc").value.trim(),
    tag:            document.getElementById("bm-tag").value,
    login_email:    document.getElementById("bm-email").value.trim(),
    login_username: document.getElementById("bm-username").value.trim(),
    login_password: document.getElementById("bm-password").value,
    notes:          document.getElementById("bm-notes").value.trim(),
    monthly_cost:   parseFloat(document.getElementById("bm-cost").value) || null,
  };
  if (!body.name) return;
  const btn = document.getElementById("bm-save-btn");
  btn.disabled = true; btn.textContent = "saving…";
  try {
    if (id) await db.update("bookmarks", id, body);
    else     await db.insert("bookmarks", body);
    closeModal(); await loadAll();
  } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = "save"; }
};

window.deleteBm = async function(id) {
  if (!confirm("Delete this bookmark?")) return;
  await db.delete("bookmarks", id); loadAll();
};

window.bookmarksHTML = bookmarksHTML;
