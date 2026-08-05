// ============================================================
//  FreelanceHub — client/js/demo-data.js
//  Seed data for demo mode. No Supabase calls made.
//  All IDs are fake UUIDs — nothing touches the database.
// ============================================================

const DEMO_DATA = {
  user_settings: {
    id:            "demo-settings-001",
    business_name: "Meridian Creative",
    display_name:  "Alex Rivera",
    currency:      "USD",
    tax_rate:      25,
    timezone:      "America/New_York",
    onboarded:     true,
    pin_hash:      null,
  },

  business_plan: {
    id:            "demo-bp-001",
    business_name: "Meridian Creative",
    tagline:       "Design that moves people.",
    mission:       "We help ambitious brands communicate with clarity and impact through thoughtful design and strategy.",
    vision:        "To become the go-to creative studio for early-stage startups in the Pacific Northwest.",
    target_market: "Funded startups (Seed–Series A), e-commerce brands, and SaaS companies needing brand identity work.",
    value_prop:    "We combine strategic thinking with fast execution — brand identity in 3 weeks, not 3 months.",
    revenue_model: "Project-based fees + optional monthly retainer for ongoing creative support.",
    goals_90_day:  "Close 2 new retainer clients. Launch portfolio site. Hit $15k MRR.",
    goals_1_year:  "Expand to a team of 3. Build a productized service offering. Reach $30k MRR.",
    strengths:     "Fast turnaround, strong brand strategy background, excellent client communication.",
    weaknesses:    "Limited team bandwidth, no paid marketing yet.",
    opportunities: "AI tools reducing production time, growing demand for brand work from indie founders.",
    threats:       "Commoditization from low-cost offshore studios, economic slowdown reducing startup budgets.",
    updated_at:    new Date().toISOString(),
  },

  clients: [
    {
      id: "demo-client-001", name: "Priya Kapoor", company: "Helios Labs",
      email: "priya@helios.io", phone: "+1 415 555 0192", status: "Active",
      notes: "Seed-stage SaaS. Very responsive, pays on time. Looking to expand scope to include pitch deck design.",
    },
    {
      id: "demo-client-002", name: "Marcus Webb", company: "Driftwood Goods",
      email: "marcus@driftwoodgoods.com", phone: "+1 503 555 0847", status: "Active",
      notes: "E-commerce brand. Needs packaging and social assets on a recurring basis.",
    },
    {
      id: "demo-client-003", name: "Sofia Reyes", company: "Elevate Health",
      email: "sofia@elevatehealth.co", phone: "+1 206 555 0341", status: "Lead",
      notes: "Intro call went well. Waiting on their budget approval from board.",
    },
    {
      id: "demo-client-004", name: "James Okonkwo", company: "Stackr",
      email: "james@stackr.dev", phone: "+1 512 555 0624", status: "Inactive",
      notes: "Project completed. Good relationship — may return for Series A rebrand.",
    },
  ],

  projects: [
    {
      id: "demo-proj-001", name: "Helios Brand Identity",
      client_id: "demo-client-001", client_name: "Helios Labs",
      status: "Active", description: "Full brand identity system including logo, color palette, typography, and brand guidelines document.",
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10),
      budget: 8500, files_notes: "https://drive.google.com/helios-brand-assets",
    },
    {
      id: "demo-proj-002", name: "Driftwood Packaging Refresh",
      client_id: "demo-client-002", client_name: "Driftwood Goods",
      status: "Review", description: "Redesign of product packaging for their 3 core SKUs. Includes print-ready files.",
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10),
      budget: 4200, files_notes: "https://figma.com/driftwood-packaging",
    },
    {
      id: "demo-proj-003", name: "Elevate Health Discovery",
      client_id: "demo-client-003", client_name: "Elevate Health",
      status: "Lead", description: "Initial brand audit and discovery session. Pending contract signing.",
      deadline: null, budget: 1500, files_notes: "",
    },
    {
      id: "demo-proj-004", name: "Stackr Website Redesign",
      client_id: "demo-client-004", client_name: "Stackr",
      status: "Complete", description: "Full website redesign including design system, Webflow build, and CMS setup.",
      deadline: new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10),
      budget: 12000, files_notes: "https://stackr.dev",
    },
    {
      id: "demo-proj-005", name: "Meridian Portfolio Site",
      client_id: null, client_name: "Internal",
      status: "Active", description: "Our own portfolio website. Overdue for a refresh.",
      deadline: new Date(Date.now() + 45 * 86400000).toISOString().slice(0,10),
      budget: null, files_notes: "",
    },
  ],

  finances: [
    // Last 3 months of income
    { id: "demo-fin-001", type: "income",  amount: 4250, category: "Revenue",  description: "Stackr — milestone 1", date: _daysAgo(75), project_id: "demo-proj-004", client_id: "demo-client-004" },
    { id: "demo-fin-002", type: "income",  amount: 4250, category: "Revenue",  description: "Stackr — milestone 2", date: _daysAgo(45), project_id: "demo-proj-004", client_id: "demo-client-004" },
    { id: "demo-fin-003", type: "income",  amount: 3500, category: "Revenue",  description: "Stackr — final payment", date: _daysAgo(20), project_id: "demo-proj-004", client_id: "demo-client-004" },
    { id: "demo-fin-004", type: "income",  amount: 2125, category: "Revenue",  description: "Helios — deposit 50%", date: _daysAgo(10), project_id: "demo-proj-001", client_id: "demo-client-001" },
    { id: "demo-fin-005", type: "income",  amount: 2100, category: "Revenue",  description: "Driftwood — deposit",  date: _daysAgo(5),  project_id: "demo-proj-002", client_id: "demo-client-002" },
    // Expenses
    { id: "demo-fin-006", type: "expense", amount: 49,   category: "Software", description: "Figma subscription",  date: _daysAgo(60) },
    { id: "demo-fin-007", type: "expense", amount: 29,   category: "Software", description: "Notion Pro",          date: _daysAgo(60) },
    { id: "demo-fin-008", type: "expense", amount: 180,  category: "Software", description: "Adobe CC",            date: _daysAgo(60) },
    { id: "demo-fin-009", type: "expense", amount: 49,   category: "Software", description: "Figma subscription",  date: _daysAgo(30) },
    { id: "demo-fin-010", type: "expense", amount: 29,   category: "Software", description: "Notion Pro",          date: _daysAgo(30) },
    { id: "demo-fin-011", type: "expense", amount: 180,  category: "Software", description: "Adobe CC",            date: _daysAgo(30) },
    { id: "demo-fin-012", type: "expense", amount: 320,  category: "Marketing", description: "LinkedIn ads",       date: _daysAgo(14) },
  ],

  invoices: [
    {
      id: "demo-inv-001", invoice_number: "INV-0012",
      client_id: "demo-client-004", client_name: "Stackr",
      project_id: "demo-proj-004", project_name: "Stackr Website Redesign",
      amount: 3500, status: "Paid",
      due_date: _daysAgo(15), notes: "Final invoice. Net 14.",
    },
    {
      id: "demo-inv-002", invoice_number: "INV-0013",
      client_id: "demo-client-001", client_name: "Helios Labs",
      project_id: "demo-proj-001", project_name: "Helios Brand Identity",
      amount: 2125, status: "Sent",
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10),
      notes: "50% deposit. Remaining balance due on delivery.",
    },
    {
      id: "demo-inv-003", invoice_number: "INV-0014",
      client_id: "demo-client-002", client_name: "Driftwood Goods",
      project_id: "demo-proj-002", project_name: "Driftwood Packaging Refresh",
      amount: 2100, status: "Overdue",
      due_date: _daysAgo(5), notes: "Net 30. Follow up sent.",
    },
  ],

  invoice_items: [
    { id: "demo-item-001", invoice_id: "demo-inv-003", description: "Packaging design — SKU 1", quantity: 1, unit_price: 800,  amount: 800,  sort_order: 0 },
    { id: "demo-item-002", invoice_id: "demo-inv-003", description: "Packaging design — SKU 2", quantity: 1, unit_price: 800,  amount: 800,  sort_order: 1 },
    { id: "demo-item-003", invoice_id: "demo-inv-003", description: "Print-ready file prep",    quantity: 1, unit_price: 500,  amount: 500,  sort_order: 2 },
  ],

  bookmarks: [
    { id: "demo-bm-001", name: "Figma",        url: "https://figma.com",       tag: "Design",       description: "Primary design tool",          login_email: "alex@meridian.co", login_username: "", login_password: "••••••••", monthly_cost: 49 },
    { id: "demo-bm-002", name: "Notion",        url: "https://notion.so",       tag: "Productivity", description: "Docs, notes, project tracking", login_email: "alex@meridian.co", login_username: "", login_password: "••••••••", monthly_cost: 29 },
    { id: "demo-bm-003", name: "Google Drive",  url: "https://drive.google.com",tag: "Hosting",      description: "Client file storage",           login_email: "alex@meridian.co", login_username: "", login_password: null,       monthly_cost: null },
    { id: "demo-bm-004", name: "Webflow",       url: "https://webflow.com",     tag: "Dev",          description: "Client website builds",         login_email: "alex@meridian.co", login_username: "alex_meridian", login_password: "••••••••", monthly_cost: 39 },
  ],

  tech_stack: [
    { id: "demo-ts-001", name: "Figma",          category: "Design",    amount: 49,  cycle: "monthly", url: "https://figma.com",   description: "Professional plan", renewal_date: null },
    { id: "demo-ts-002", name: "Adobe CC",        category: "Design",    amount: 180, cycle: "monthly", url: "https://adobe.com",   description: "All apps",          renewal_date: null },
    { id: "demo-ts-003", name: "Webflow",         category: "Dev Tools", amount: 39,  cycle: "monthly", url: "https://webflow.com", description: "CMS plan",          renewal_date: null },
    { id: "demo-ts-004", name: "Notion",          category: "Productivity", amount: 29, cycle: "monthly", url: "https://notion.so", description: "Pro",              renewal_date: null },
    { id: "demo-ts-005", name: "Google Workspace",category: "Communication", amount: 144, cycle: "annual", url: "https://workspace.google.com", description: "Business Starter", renewal_date: new Date(Date.now() + 90 * 86400000).toISOString().slice(0,10) },
  ],

  workflow_templates: [
    {
      id: "demo-wft-001", name: "Client Onboarding",
      description: "Standard process for bringing on a new client from contract to kickoff.",
      category: "Client Onboarding", color: "#3bf4a3",
    },
    {
      id: "demo-wft-002", name: "Project Delivery",
      description: "Checklist for delivering a completed project and closing it out cleanly.",
      category: "Project Kickoff", color: "#38bdf8",
    },
  ],

  workflow_steps: [
    { id: "demo-wfs-001", template_id: "demo-wft-001", title: "Send welcome email",            description: "Introduce yourself, share next steps, and confirm kickoff call time.", sort_order: 0 },
    { id: "demo-wfs-002", template_id: "demo-wft-001", title: "Share contract via DocuSign",   description: "Send service agreement and invoice for deposit.", sort_order: 1 },
    { id: "demo-wfs-003", template_id: "demo-wft-001", title: "Collect deposit payment",        description: "Confirm 50% deposit received before starting work.", sort_order: 2 },
    { id: "demo-wfs-004", template_id: "demo-wft-001", title: "Run kickoff call",               description: "Cover project brief, timeline, communication preferences, and deliverables.", sort_order: 3 },
    { id: "demo-wfs-005", template_id: "demo-wft-001", title: "Set up shared Drive folder",    description: "Create client folder, share access, upload brief and any reference materials.", sort_order: 4 },
    { id: "demo-wfs-006", template_id: "demo-wft-002", title: "Final client review",            description: "Share all deliverables for sign-off.", sort_order: 0 },
    { id: "demo-wfs-007", template_id: "demo-wft-002", title: "Apply final revisions",          description: "Action any last feedback within agreed revision scope.", sort_order: 1 },
    { id: "demo-wfs-008", template_id: "demo-wft-002", title: "Send final invoice",             description: "Issue remaining balance invoice with all files attached.", sort_order: 2 },
    { id: "demo-wfs-009", template_id: "demo-wft-002", title: "Transfer all final files",       description: "Upload print-ready / export files to client Drive folder.", sort_order: 3 },
    { id: "demo-wfs-010", template_id: "demo-wft-002", title: "Request testimonial",            description: "Send follow-up email asking for a testimonial or case study quote.", sort_order: 4 },
  ],

  workflow_runs: [
    {
      id: "demo-wfr-001", name: "Helios Labs Onboarding",
      template_id: "demo-wft-001", client_id: "demo-client-001", client_name: "Helios Labs",
      project_id: "demo-proj-001", project_name: "Helios Brand Identity",
      status: "active",
    },
  ],

  workflow_run_steps: [
    { id: "demo-wfrs-001", run_id: "demo-wfr-001", title: "Send welcome email",          sort_order: 0, completed: true,  completed_at: _daysAgo(10), notes: "Sent — Alex confirmed receipt." },
    { id: "demo-wfrs-002", run_id: "demo-wfr-001", title: "Share contract via DocuSign", sort_order: 1, completed: true,  completed_at: _daysAgo(9),  notes: "Signed same day." },
    { id: "demo-wfrs-003", run_id: "demo-wfr-001", title: "Collect deposit payment",      sort_order: 2, completed: true,  completed_at: _daysAgo(8),  notes: "$2,125 received via bank transfer." },
    { id: "demo-wfrs-004", run_id: "demo-wfr-001", title: "Run kickoff call",             sort_order: 3, completed: true,  completed_at: _daysAgo(7),  notes: "45 min call. Great energy. Brief confirmed." },
    { id: "demo-wfrs-005", run_id: "demo-wfr-001", title: "Set up shared Drive folder",  sort_order: 4, completed: false, completed_at: null,          notes: "" },
  ],

  project_todos: [
    { id: "demo-todo-001", project_id: "demo-proj-001", title: "Deliver initial logo concepts (3 directions)", priority: "high",   completed: false, due_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0,10), sort_order: 0 },
    { id: "demo-todo-002", project_id: "demo-proj-001", title: "Finalize color palette",                        priority: "normal", completed: false, due_date: null, sort_order: 1 },
    { id: "demo-todo-003", project_id: "demo-proj-001", title: "Typography selection",                          priority: "normal", completed: false, due_date: null, sort_order: 2 },
    { id: "demo-todo-004", project_id: "demo-proj-001", title: "Brand guidelines document",                     priority: "low",    completed: false, due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0,10), sort_order: 3 },
    { id: "demo-todo-005", project_id: "demo-proj-002", title: "Present 2 packaging directions",                priority: "high",   completed: true,  due_date: _daysAgo(3), sort_order: 0, completed_at: _daysAgo(3) },
    { id: "demo-todo-006", project_id: "demo-proj-002", title: "Revisions round 1",                             priority: "normal", completed: false, due_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0,10), sort_order: 1 },
  ],

  client_documents: [
    { id: "demo-doc-001", client_id: "demo-client-001", name: "Helios Service Agreement 2026",  type: "Service Agreement", url: "https://drive.google.com/helios-agreement",  notes: "Signed Aug 1, 2026. 12-month term." },
    { id: "demo-doc-002", client_id: "demo-client-001", name: "Helios Brand Brief",              type: "Brief",             url: "https://drive.google.com/helios-brief",      notes: "Completed during kickoff call." },
    { id: "demo-doc-003", client_id: "demo-client-002", name: "Driftwood NDA",                   type: "NDA",               url: "https://drive.google.com/driftwood-nda",     notes: "Mutual NDA. Signed June 2026." },
    { id: "demo-doc-004", client_id: "demo-client-002", name: "Driftwood Content Form",          type: "Content Form",      url: "https://drive.google.com/driftwood-content", notes: "Brand voice, copy tone, and messaging guidelines." },
  ],

  brainstorm: [
    {
      id: "demo-bs-001", title: "Quarterly Goals — Q3 2026",
      tags: "goals, q3, revenue",
      color: "#3bf4a3",
      content: `1. What is the single most important thing to accomplish this quarter?
Close 2 new retainer clients at $2k+/mo each.

2. What revenue target are you aiming for?
$18k total revenue for the quarter. Currently at $11,975 — need $6k more.

3. What new skill or capability do you want to build?
Motion design basics in After Effects. Would expand service offering significantly.

4. What should you stop doing or cut?
Taking on small one-off logo jobs under $1,500. Not worth the context switching.

5. Who do you need to connect with or hire?
A part-time project manager or VA to handle admin, scheduling, and client comms.

6. How will you measure success?
MRR at $6k+ by Sept 30. Portfolio site live. 2 new case studies published.`,
      updated_at: _daysAgo(5),
    },
  ],

  // Empty tables
  project_credentials: [],
  user: {
    id:    "demo-user-001",
    email: "alex@meridian.co",
    user_metadata: { full_name: "Alex Rivera" },
  },
};

// ── Helper ─────────────────────────────────────────────────────
function _daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

window.DEMO_DATA = DEMO_DATA;
