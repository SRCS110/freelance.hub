// ============================================================
//  FreelanceHub — client/js/onboarding.js
//  Auto-installs a "Getting Started" workflow on first login.
//  Runs once per user — tracked via user_settings.onboarded.
// ============================================================

const GETTING_STARTED_TEMPLATE = {
  name:        "Getting Started with FreelanceHub",
  description: "A guided walkthrough to set up your business dashboard.",
  category:    "Admin",
  color:       "#3bf4a3",
  steps: [
    {
      title:       "Set your business name",
      description: "Go to Account & Settings → Profile. Enter your business name — it will appear in the sidebar, on invoices, and in exports.",
      sort_order:  0,
    },
    {
      title:       "Fill out your Business Plan",
      description: "Navigate to Business Plan and complete your mission, vision, and target market. This is your north star — refer back to it when making decisions.",
      sort_order:  1,
    },
    {
      title:       "Add your first client",
      description: "Go to Clients → New Client. Add their name, company, email, and phone. Every project and invoice will link back to a client.",
      sort_order:  2,
    },
    {
      title:       "Create your first project",
      description: "Go to Projects → New Project. Link it to the client you just added, set a status (Lead, Active, etc.) and a deadline if you have one.",
      sort_order:  3,
    },
    {
      title:       "Add a to-do to your project",
      description: "Open your project and use the to-do list at the bottom to track tasks. Set priorities (high/normal/low) and due dates.",
      sort_order:  4,
    },
    {
      title:       "Log your first income or expense",
      description: "Go to Finances → Add Entry. Link it to your project so the dashboard can show you per-project profitability.",
      sort_order:  5,
    },
    {
      title:       "Create and download an invoice",
      description: "Go to Invoices → New Invoice. Add line items, set a due date, and hit ⎙ print / save to download a PDF. Mark it Paid when payment arrives.",
      sort_order:  6,
    },
    {
      title:       "Save your tools in Bookmarks",
      description: "Go to Bookmarks → Add. Save the websites and tools your business uses. Store login credentials — they're protected by your PIN.",
      sort_order:  7,
    },
    {
      title:       "Set up your credential PIN",
      description: "Go to Account & Settings → Security → Set up PIN. This protects bookmark passwords and project credentials. Required before viewing any saved passwords.",
      sort_order:  8,
    },
    {
      title:       "Track your tech stack costs",
      description: "Go to Tech Stack → Add. Log every recurring subscription (hosting, tools, SaaS) so you can see your total monthly and annual burn.",
      sort_order:  9,
    },
    {
      title:       "Build your first SOP workflow",
      description: "Go to Workflows → New Template. Create a reusable checklist (e.g. Client Onboarding). Then hit Run to apply it to a specific client or project.",
      sort_order:  10,
    },
    {
      title:       "Brainstorm your next move",
      description: "Go to Brainstorm and start a guided session. Try 'Quarterly Goals' or 'New Service Idea' for a structured thinking exercise.",
      sort_order:  11,
    },
  ],
};

// ── Main entry point called from app.js after loadAll ────────
window.runOnboarding = async function() {
  // Only run if not already onboarded
  const settings = STATE.data.user_settings;
  if (settings?.onboarded) return;

  // Check if the Getting Started workflow already exists
  const existing = (STATE.data.workflow_templates || [])
    .find(t => t.name === GETTING_STARTED_TEMPLATE.name);
  if (existing) {
    // Template exists but onboarded flag wasn't set — mark it now
    await _markOnboarded();
    return;
  }

  try {
    // 1. Create the template
    const templateResult = await db.insert("workflow_templates", {
      name:        GETTING_STARTED_TEMPLATE.name,
      description: GETTING_STARTED_TEMPLATE.description,
      category:    GETTING_STARTED_TEMPLATE.category,
      color:       GETTING_STARTED_TEMPLATE.color,
    });
    const templateId = Array.isArray(templateResult)
      ? templateResult[0]?.id
      : templateResult?.id;

    if (!templateId) throw new Error("Template insert returned no ID.");

    // 2. Insert all steps
    for (const step of GETTING_STARTED_TEMPLATE.steps) {
      await db.insert("workflow_steps", { ...step, template_id: templateId });
    }

    // 3. Create an active run so it shows up in Workflows immediately
    const runResult = await db.insert("workflow_runs", {
      name:        "Getting Started",
      template_id: templateId,
      status:      "active",
    });
    const runId = Array.isArray(runResult)
      ? runResult[0]?.id
      : runResult?.id;

    // 4. Copy steps into the run
    if (runId) {
      for (const step of GETTING_STARTED_TEMPLATE.steps) {
        await db.insert("workflow_run_steps", {
          run_id:      runId,
          title:       step.title,
          description: step.description,
          sort_order:  step.sort_order,
          completed:   false,
        });
      }
    }

    // 5. Mark user as onboarded
    await _markOnboarded();

    // 6. Reload state and navigate to Workflows
    await loadAll();
    navigate("workflows");

    // 7. Show a welcome toast
    _showWelcomeToast();

  } catch(e) {
    console.warn("Onboarding install failed:", e.message);
    // Non-fatal — user can still use the app
  }
};

async function _markOnboarded() {
  try {
    const s = STATE.data.user_settings;
    if (s?.id) {
      await db.update("user_settings", s.id, { onboarded: true });
    } else {
      await db.insert("user_settings", { onboarded: true });
    }
  } catch(e) {
    console.warn("Could not mark onboarded:", e.message);
  }
}

function _showWelcomeToast() {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:1000;
    background:var(--bg-raised);border:1px solid var(--accent);
    border-radius:4px;padding:16px 20px;
    font-family:'JetBrains Mono',monospace;
    box-shadow:0 8px 32px rgba(0,0,0,0.3);
    max-width:320px;animation:slideUp .3s ease;
  `;
  toast.innerHTML = `
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">
      ◆ welcome to FreelanceHub
    </div>
    <div style="font-size:11px;color:var(--text-muted);line-height:1.5">
      A "Getting Started" workflow has been added to help you get set up.
      Tick off each step as you go.
    </div>
    <button onclick="this.parentElement.remove()"
      style="position:absolute;top:8px;right:10px;background:none;border:none;
             color:var(--text-muted);font-size:16px;cursor:pointer;line-height:1">×</button>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.style.opacity = "0", 6000);
  setTimeout(() => toast.remove(), 6400);
}

// Inject slide-up animation
const style = document.createElement("style");
style.textContent = `
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
`;
document.head.appendChild(style);
