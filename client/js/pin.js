// ============================================================
//  FreelanceHub — client/js/pin.js
//  In-app PIN system for viewing sensitive credentials.
//
//  PIN is hashed (SHA-256) before storing in user_settings.
//  A verified session lasts PIN_SESSION_MINUTES before
//  requiring re-entry. Nothing is stored in plaintext.
// ============================================================

const PIN_SESSION_MINUTES = 15;
const PIN_SESSION_KEY     = "fh_pin_until";

// ── Hash helper (Web Crypto API — no dependencies) ────────────
async function _hashPin(pin) {
  const buf    = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Session check ─────────────────────────────────────────────
function pinSessionActive() {
  const until = parseInt(localStorage.getItem(PIN_SESSION_KEY) || "0");
  return Date.now() < until;
}

function _extendPinSession() {
  localStorage.setItem(PIN_SESSION_KEY, String(Date.now() + PIN_SESSION_MINUTES * 60 * 1000));
}

function clearPinSession() {
  localStorage.removeItem(PIN_SESSION_KEY);
}

// ── Check if user has a PIN set ───────────────────────────────
function hasPinSet() {
  return !!(STATE.data.user_settings?.pin_hash);
}

// ── Core: require PIN before running a callback ───────────────
//  Usage: requirePin(() => { /* do sensitive thing */ })
window.requirePin = function(callback) {
  // If session still active, run immediately
  if (pinSessionActive()) { _extendPinSession(); callback(); return; }

  if (!hasPinSet()) {
    // No PIN set — prompt to create one first
    _showCreatePinModal(callback);
  } else {
    _showVerifyPinModal(callback);
  }
};

// ── Create PIN modal ──────────────────────────────────────────
function _showCreatePinModal(afterCreate) {
  showModal(`
<div class="modal-header">
  <div class="modal-title">create security pin</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:20px;line-height:1.6">
  Set a PIN to protect sensitive credentials.<br/>
  Required each time you view a password or key.<br/>
  Session stays unlocked for ${PIN_SESSION_MINUTES} minutes after entry.
</div>

<div class="form-group">
  <label class="form-label">choose pin (4–8 digits)</label>
  <input id="pin-new" type="password" inputmode="numeric" maxlength="8"
    placeholder="••••" autocomplete="new-password"
    style="letter-spacing:6px;font-size:20px;text-align:center"
    oninput="this.value=this.value.replace(/[^0-9]/g,'')"/>
</div>
<div class="form-group">
  <label class="form-label">confirm pin</label>
  <input id="pin-confirm" type="password" inputmode="numeric" maxlength="8"
    placeholder="••••" autocomplete="new-password"
    style="letter-spacing:6px;font-size:20px;text-align:center"
    oninput="this.value=this.value.replace(/[^0-9]/g,'')"
    onkeydown="if(event.key==='Enter') _submitCreatePin()"/>
</div>
<div id="pin-create-msg" style="display:none;margin-bottom:12px"></div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="pin-create-btn" onclick="_submitCreatePin()">set pin</button>
</div>`);

  window._pinAfterCreate = afterCreate;
}

window._submitCreatePin = async function() {
  const pin  = document.getElementById("pin-new")?.value;
  const conf = document.getElementById("pin-confirm")?.value;
  const msg  = document.getElementById("pin-create-msg");
  const btn  = document.getElementById("pin-create-btn");

  const showErr = (t) => { msg.innerHTML = `<div class="msg-error">${t}</div>`; msg.style.display = "block"; };

  if (!pin || pin.length < 4) return showErr("PIN must be at least 4 digits.");
  if (pin !== conf)           return showErr("PINs don't match.");

  btn.disabled = true; btn.textContent = "saving…";

  try {
    const hash    = await _hashPin(pin);
    const existing = STATE.data.user_settings;
    if (existing?.id) {
      await db.update("user_settings", existing.id, { pin_hash: hash });
    } else {
      await db.insert("user_settings", { pin_hash: hash });
    }
    _extendPinSession();
    await loadAll();
    closeModal();
    if (window._pinAfterCreate) { window._pinAfterCreate(); window._pinAfterCreate = null; }
  } catch(e) {
    showErr(e.message);
    btn.disabled = false; btn.textContent = "set pin";
  }
};

// ── Verify PIN modal ──────────────────────────────────────────
function _showVerifyPinModal(onSuccess) {
  const remaining = Math.ceil(
    (parseInt(localStorage.getItem(PIN_SESSION_KEY) || "0") - Date.now()) / 60000
  );

  showModal(`
<div class="modal-header">
  <div class="modal-title">enter pin</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:20px;line-height:1.6">
  Enter your security PIN to view this credential.<br/>
  Session unlocks for ${PIN_SESSION_MINUTES} min after verification.
</div>

<div class="form-group">
  <label class="form-label">security pin</label>
  <input id="pin-entry" type="password" inputmode="numeric" maxlength="8"
    placeholder="••••" autocomplete="current-password"
    style="letter-spacing:8px;font-size:24px;text-align:center"
    oninput="this.value=this.value.replace(/[^0-9]/g,'')"
    onkeydown="if(event.key==='Enter') _submitVerifyPin()"/>
</div>
<div id="pin-verify-msg" style="display:none;margin-bottom:12px"></div>
<div style="text-align:right;margin-top:4px;margin-bottom:16px">
  <button onclick="_showResetPinModal()" style="background:none;border:none;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);cursor:pointer;padding:0">
    forgot pin? reset →
  </button>
</div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="pin-verify-btn" onclick="_submitVerifyPin()">unlock</button>
</div>`);

  setTimeout(() => document.getElementById("pin-entry")?.focus(), 100);
  window._pinOnSuccess = onSuccess;
}

window._submitVerifyPin = async function() {
  const pin = document.getElementById("pin-entry")?.value;
  const msg = document.getElementById("pin-verify-msg");
  const btn = document.getElementById("pin-verify-btn");
  if (!pin) return;

  btn.disabled = true; btn.textContent = "checking…";

  try {
    const hash    = await _hashPin(pin);
    const stored  = STATE.data.user_settings?.pin_hash;

    if (hash === stored) {
      _extendPinSession();
      closeModal();
      if (window._pinOnSuccess) { window._pinOnSuccess(); window._pinOnSuccess = null; }
    } else {
      msg.innerHTML = `<div class="msg-error">incorrect pin.</div>`;
      msg.style.display = "block";
      document.getElementById("pin-entry").value = "";
      btn.disabled = false; btn.textContent = "unlock";
    }
  } catch(e) {
    msg.innerHTML = `<div class="msg-error">${e.message}</div>`;
    msg.style.display = "block";
    btn.disabled = false; btn.textContent = "unlock";
  }
};

// ── Reset PIN (requires re-auth via Supabase) ─────────────────
window._showResetPinModal = async function() {
  closeModal();

  // Detect if user signed in via OAuth (no password to verify with)
  const session = await Auth.getSession();
  const provider = session?.user?.app_metadata?.provider || "email";
  const isOAuth  = provider !== "email";

  if (isOAuth) {
    // OAuth users — just confirm intent, no password needed
    showModal(`
<div class="modal-header">
  <div class="modal-title">remove pin</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:20px;line-height:1.6">
  You signed in with Google, so we can't verify via password.<br/>
  Are you sure you want to remove your credential PIN?
</div>
<div id="pin-reset-msg" style="display:none;margin-bottom:12px"></div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-danger" id="pin-reset-btn" onclick="_clearPinDirect()">yes, remove pin</button>
</div>`);
  } else {
    showModal(`
<div class="modal-header">
  <div class="modal-title">reset pin</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:20px;line-height:1.6">
  Re-enter your account password to verify identity before clearing the PIN.
</div>
<div class="form-group">
  <label class="form-label">account password</label>
  <input id="pin-reset-pw" type="password" placeholder="your account password"
    autocomplete="current-password"
    onkeydown="if(event.key==='Enter') _submitPinReset()"/>
</div>
<div id="pin-reset-msg" style="display:none;margin-bottom:12px"></div>
<div class="modal-actions">
  <button class="btn btn-ghost" onclick="closeModal()">cancel</button>
  <button class="btn btn-primary" id="pin-reset-btn" onclick="_submitPinReset()">verify & reset</button>
</div>`);
  }
};

window._clearPinDirect = async function() {
  try {
    const existing = STATE.data.user_settings;
    if (existing?.id) await db.update("user_settings", existing.id, { pin_hash: null });
    clearPinSession();
    await loadAll();
    closeModal();
    setTimeout(() => showModal(`
<div class="modal-header"><div class="modal-title">pin removed</div><button class="modal-close" onclick="closeModal()">×</button></div>
<div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);margin-bottom:20px">PIN removed. You can set a new one any time from Account & Settings.</div>
<div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">done</button></div>`), 200);
  } catch(e) { alert(e.message); }
};

window._submitPinReset = async function() {
  const pw  = document.getElementById("pin-reset-pw")?.value;
  const msg = document.getElementById("pin-reset-msg");
  const btn = document.getElementById("pin-reset-btn");
  if (!pw) return;

  btn.disabled = true; btn.textContent = "verifying…";

  try {
    // Re-authenticate with Supabase to confirm identity
    await Auth.signInWithEmail(STATE.user.email, pw);

    // Clear PIN hash
    const existing = STATE.data.user_settings;
    if (existing?.id) {
      await db.update("user_settings", existing.id, { pin_hash: null });
    }
    clearPinSession();
    await loadAll();
    closeModal();

    // Show success then prompt to set new PIN
    setTimeout(() => {
      showModal(`
<div class="modal-header">
  <div class="modal-title">pin cleared</div>
  <button class="modal-close" onclick="closeModal()">×</button>
</div>
<div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);margin-bottom:20px">
  Your PIN has been removed. You can set a new one the next time you access a protected credential, or from Account & Settings.
</div>
<div class="modal-actions">
  <button class="btn btn-primary" onclick="closeModal()">done</button>
</div>`);
    }, 200);

  } catch(e) {
    msg.innerHTML = `<div class="msg-error">Incorrect password.</div>`;
    msg.style.display = "block";
    btn.disabled = false; btn.textContent = "verify & reset";
  }
};

// ── Expose ────────────────────────────────────────────────────
window.pinSessionActive = pinSessionActive;
window.clearPinSession  = clearPinSession;
window.hasPinSet        = hasPinSet;
