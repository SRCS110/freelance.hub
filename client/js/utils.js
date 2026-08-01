// ============================================================
//  FreelanceHub — client/js/utils.js
//  Shared formatting, UI helpers, and constants.
// ============================================================

// ── Constants ─────────────────────────────────────────────────
const STATUS_COLORS = {
  Lead:      "#38bdf8",
  Active:    "#10b981",
  Review:    "#f59e0b",
  Complete:  "#64748b",
  Cancelled: "#f43f5e",
  Draft:     "#64748b",
  Sent:      "#38bdf8",
  Paid:      "#10b981",
  Overdue:   "#f43f5e",
  Void:      "#475569",
};

const TAX_CATS = [
  "Revenue", "COGS", "Software", "Office",
  "Travel", "Marketing", "Other",
];

// ── Formatting ────────────────────────────────────────────────
function usd(n) {
  return "$" + Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Badge HTML ────────────────────────────────────────────────
function badge(status) {
  const c = STATUS_COLORS[status] || "#64748b";
  return `<span class="badge" style="background:${c}22;color:${c}">${status}</span>`;
}

// ── Modal ─────────────────────────────────────────────────────
function showModal(html, size) {
  const ov = document.createElement("div");
  ov.className = "modal-overlay";
  const maxW = size === "large" ? "680px" : "500px";
  ov.innerHTML = `<div class="modal" style="max-width:${maxW}">${html}</div>`;
  ov.addEventListener("click", e => {
    if (e.target === ov) closeModal();
  });
  document.body.appendChild(ov);
  return ov;
}

function closeModal() {
  document.querySelector(".modal-overlay")?.remove();
}

// ── Swirl animation ───────────────────────────────────────────
function startSwirl() {
  const canvas = document.getElementById("swirl-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);

  const swirls = [
    { x: 0.12, y: 0.18, r: 320, speed: 0.00018, off: 0,   colors: ["#c7d2fe", "#ddd6fe", "#e0e7ff"] },
    { x: 0.88, y: 0.75, r: 380, speed: 0.00013, off: 2.1, colors: ["#ddd6fe", "#fce7f3", "#ede9fe"] },
    { x: 0.55, y: 0.05, r: 260, speed: 0.00022, off: 4.3, colors: ["#e0e7ff", "#c7d2fe", "#f5f3ff"] },
    { x: 0.05, y: 0.85, r: 300, speed: 0.00016, off: 1.4, colors: ["#fce7f3", "#ede9fe", "#ddd6fe"] },
    { x: 0.92, y: 0.10, r: 240, speed: 0.00020, off: 3.7, colors: ["#c7d2fe", "#e0e7ff", "#ddd6fe"] },
  ];

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    swirls.forEach(s => {
      const cx = s.x * W, cy = s.y * H;
      const angle = t * s.speed + s.off;
      for (let i = 0; i < 6; i++) {
        const a0 = angle + i * (Math.PI / 3);
        const a1 = a0 + Math.PI * 1.25;
        const rr = s.r * (0.4 + i * 0.13);
        const alpha = 0.13 - i * 0.015;
        const grd = ctx.createLinearGradient(
          cx + Math.cos(a0) * rr * 0.3, cy + Math.sin(a0) * rr * 0.3,
          cx + Math.cos(a1) * rr,       cy + Math.sin(a1) * rr
        );
        grd.addColorStop(0, s.colors[i % s.colors.length] + "00");
        grd.addColorStop(0.4, s.colors[i % s.colors.length] + Math.floor(alpha * 255).toString(16).padStart(2, "0"));
        grd.addColorStop(1, s.colors[(i + 1) % s.colors.length] + "00");
        ctx.beginPath();
        ctx.arc(cx, cy, rr, a0, a1);
        ctx.strokeStyle = grd;
        ctx.lineWidth = 38 - i * 3;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    });
    t++;
    window._swirlRaf = requestAnimationFrame(draw);
  }

  if (window._swirlRaf) cancelAnimationFrame(window._swirlRaf);
  draw();
}

function stopSwirl() {
  if (window._swirlRaf) {
    cancelAnimationFrame(window._swirlRaf);
    window._swirlRaf = null;
  }
}

