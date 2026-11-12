// Live demos, ported from the reference prototype (island-art/site/demos.js).
// Each export mounts into an element: mount(el, { hue }).
// Plain JS + canvas, no libraries. Keyboard accessible, pauses when off-screen, respects reduced motion.
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

function canvas(el, w = 720, hgt = 440) {
  const c = el.querySelector("canvas"); const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = w * dpr; c.height = hgt * dpr; const g = c.getContext("2d"); g.scale(dpr, dpr);
  return { c, g, w, h: hgt };
}
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function grid(g, w, h) {
  g.fillStyle = "#0A080B"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(217,178,106,.08)"; g.lineWidth = 1;
  for (let x = 0; x <= w; x += 40) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke(); }
  for (let y = 0; y <= h; y += 40) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); }
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r()); }
const shell = (title, sub, side) => `
  <div class="demo-head"><div><p class="label">Interactive demo</p><h3>${title}</h3></div><p class="small">${sub}</p></div>
  <div class="demo-body"><canvas role="img"></canvas><div class="demo-side">${side}</div></div>`;

/* ---------- S2 · gradient descent ---------- */
export function S2(el, { hue }) {
  el.innerHTML = shell("Gradient descent, step by step",
    "The line starts wrong. Each step nudges its slope and intercept against the gradient of the error. Drag points to change the data.",
    `<div class="ctl"><div class="row"><span>Learning rate</span><b id="lrv"></b></div><input id="lr" type="range" min="-3" max="0.3" step="0.05" value="-1.3" aria-label="Learning rate (log scale)"></div>
     <div class="btns"><button class="btn sm" id="run">Run</button><button class="btn sm ghost" id="step">Step</button><button class="btn sm ghost" id="reset">Reset</button></div>
     <div class="ctl"><div class="row"><span>Step</span><b id="it">0</b></div><div class="row"><span>Loss (MSE)</span><b id="loss"></b></div><div class="row"><span>Line</span><b id="eq"></b></div></div>
     <p class="small" id="msg">Try a learning rate near 1.0, then one near 0.001.</p>`);
  const { c, g, w, h } = canvas(el); c.setAttribute("aria-label", "Scatter plot with a fitted line and a loss curve");
  const r = rng(7); let pts = Array.from({ length: 24 }, () => { const x = r() * 2 - 1; return { x, y: 0.8 * x + 0.2 + gauss(r) * 0.18 }; });
  let m = -0.9, b = 0.7, it = 0, hist = [], running = false, drag = null;
  const X = (x) => 40 + (x + 1.1) / 2.2 * (w - 80), Y = (y) => h - 60 - (y + 1.1) / 2.2 * (h - 120);
  const iX = (px) => (px - 40) / (w - 80) * 2.2 - 1.1, iY = (py) => (h - 60 - py) / (h - 120) * 2.2 - 1.1;
  const lr = () => Math.pow(10, +el.querySelector("#lr").value);
  const loss = () => pts.reduce((s, p) => s + (m * p.x + b - p.y) ** 2, 0) / pts.length;
  function step() {
    let gm = 0, gb = 0; pts.forEach((p) => { const e = m * p.x + b - p.y; gm += 2 * e * p.x; gb += 2 * e; });
    m -= lr() * gm / pts.length; b -= lr() * gb / pts.length; it++; hist.push(loss()); if (hist.length > 200) hist.shift();
    if (!isFinite(m) || Math.abs(m) > 1e6) { el.querySelector("#msg").textContent = "Diverged: the learning rate is too big, so every step overshoots. Reset and lower it."; running = false; }
  }
  function draw() {
    const hc = hue || css("--hue"); grid(g, w, h);
    g.strokeStyle = "rgba(243,235,221,.25)"; g.beginPath(); g.moveTo(X(-1.1), Y(0)); g.lineTo(X(1.1), Y(0)); g.moveTo(X(0), Y(-1.1)); g.lineTo(X(0), Y(1.1)); g.stroke();
    pts.forEach((p) => { const py = m * p.x + b; g.strokeStyle = "rgba(243,235,221,.18)"; g.beginPath(); g.moveTo(X(p.x), Y(p.y)); g.lineTo(X(p.x), Y(py)); g.stroke(); });
    if (isFinite(m)) { g.strokeStyle = hc; g.lineWidth = 3; g.shadowColor = hc; g.shadowBlur = 14; g.beginPath(); g.moveTo(X(-1.1), Y(-1.1 * m + b)); g.lineTo(X(1.1), Y(1.1 * m + b)); g.stroke(); g.shadowBlur = 0; g.lineWidth = 1; }
    pts.forEach((p) => { g.fillStyle = "#F3EBDD"; g.beginPath(); g.arc(X(p.x), Y(p.y), 5, 0, 7); g.fill(); });
    // loss sparkline
    const bx = w - 230, by = 18, bw = 210, bh = 70; g.fillStyle = "rgba(12,10,13,.85)"; g.fillRect(bx, by, bw, bh); g.strokeStyle = "rgba(217,178,106,.3)"; g.strokeRect(bx + .5, by + .5, bw, bh);
    g.fillStyle = "#9C9182"; g.font = "11px JetBrains Mono, monospace"; g.fillText("LOSS", bx + 8, by + 15);
    if (hist.length > 1) { const mx = Math.max(...hist.filter(isFinite), 1e-6); g.strokeStyle = hc; g.beginPath();
      hist.forEach((v, i) => { const x = bx + 8 + i / 199 * (bw - 16), y = by + bh - 8 - Math.min(1, v / mx) * (bh - 26); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
    el.querySelector("#it").textContent = it; el.querySelector("#loss").textContent = isFinite(loss()) ? loss().toFixed(4) : "∞";
    el.querySelector("#eq").textContent = isFinite(m) ? `y = ${m.toFixed(2)}x ${b < 0 ? "−" : "+"} ${Math.abs(b).toFixed(2)}` : "—";
    el.querySelector("#lrv").textContent = lr() < 0.01 ? lr().toExponential(1) : lr().toFixed(3);
  }
  let vis = true; new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(el);
  function loop() { if (running && vis) { step(); draw(); } requestAnimationFrame(loop); }
  el.querySelector("#run").onclick = (e) => { running = !running; e.target.textContent = running ? "Pause" : "Run"; if (RM && running) { for (let i = 0; i < 60; i++) step(); running = false; e.target.textContent = "Run"; draw(); } };
  el.querySelector("#step").onclick = () => { step(); draw(); };
  el.querySelector("#reset").onclick = () => { m = -0.9; b = 0.7; it = 0; hist = []; el.querySelector("#msg").textContent = "Reset. Pick a learning rate and run."; draw(); };
  el.querySelector("#lr").oninput = draw;
  const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * w, (e.clientY - r.top) / r.height * h]; };
  c.onpointerdown = (e) => { const [px, py] = pos(e); drag = pts.find((p) => Math.hypot(X(p.x) - px, Y(p.y) - py) < 14); if (drag) c.setPointerCapture(e.pointerId); };
  c.onpointermove = (e) => { if (!drag) return; const [px, py] = pos(e); drag.x = Math.max(-1, Math.min(1, iX(px))); drag.y = Math.max(-1.1, Math.min(1.1, iY(py))); draw(); };
  c.onpointerup = () => (drag = null);
  draw(); loop();
}

/* ---------- S3 · overfitting ---------- */
export function S3(el, { hue }) {
  el.innerHTML = shell("Overfitting you can see",
    "Filled dots train the curve. Hollow dots are held back for validation. Raise the degree: training error keeps falling, validation error turns back up.",
    `<div class="ctl"><div class="row"><span>Polynomial degree</span><b id="dv"></b></div><input id="deg" type="range" min="1" max="12" step="1" value="3" aria-label="Polynomial degree"></div>
     <div class="btns"><button class="btn sm ghost" id="noise">New noise</button></div>
     <div class="ctl"><div class="row"><span>Training error</span><b id="tr"></b></div><div class="row"><span>Validation error</span><b id="va"></b></div></div>
     <p class="small" id="verdict"></p>`);
  const { c, g, w, h } = canvas(el); c.setAttribute("aria-label", "Polynomial fit with training and validation points");
  let seed = 3, train, val;
  const f = (x) => Math.sin(2.6 * x) * 0.7 + 0.15 * x;
  function sample() { const r = rng(seed++); const mk = (n) => Array.from({ length: n }, () => { const x = r() * 2 - 1; return { x, y: f(x) + gauss(r) * 0.16 }; }); train = mk(14); val = mk(14); }
  function fit(d) { // least squares with tiny ridge, normal equations + Gaussian elimination
    const n = d + 1, A = Array.from({ length: n }, () => Array(n + 1).fill(0));
    train.forEach((p) => { const pw = Array.from({ length: n }, (_, i) => p.x ** i); for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += pw[i] * pw[j]; A[i][n] += pw[i] * p.y; } });
    for (let i = 0; i < n; i++) A[i][i] += 1e-9;
    for (let i = 0; i < n; i++) { let mx = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k; [A[i], A[mx]] = [A[mx], A[i]];
      for (let k = i + 1; k < n; k++) { const t = A[k][i] / A[i][i]; for (let j = i; j <= n; j++) A[k][j] -= t * A[i][j]; } }
    const w_ = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * w_[j]; w_[i] = s / A[i][i]; }
    return (x) => w_.reduce((s, c_, i) => s + c_ * x ** i, 0);
  }
  const X = (x) => 40 + (x + 1.05) / 2.1 * (w - 80), Y = (y) => h / 2 - y * (h * 0.36);
  const mse = (p, set) => set.reduce((s, q) => s + (p(q.x) - q.y) ** 2, 0) / set.length;
  function draw() {
    const d = +el.querySelector("#deg").value, p = fit(d), hc = hue || css("--hue"); grid(g, w, h);
    g.strokeStyle = "rgba(243,235,221,.18)"; g.setLineDash([4, 6]); g.beginPath(); for (let i = 0; i <= 200; i++) { const x = -1 + i / 100; i ? g.lineTo(X(x), Y(f(x))) : g.moveTo(X(x), Y(f(x))); } g.stroke(); g.setLineDash([]);
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip(); g.strokeStyle = hc; g.lineWidth = 3; g.shadowColor = hc; g.shadowBlur = 14; g.beginPath();
    for (let i = 0; i <= 300; i++) { const x = -1.02 + i / 300 * 2.04, y = Math.max(-3, Math.min(3, p(x))); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); } g.stroke(); g.restore(); g.lineWidth = 1;
    train.forEach((q) => { g.fillStyle = "#F3EBDD"; g.beginPath(); g.arc(X(q.x), Y(q.y), 5, 0, 7); g.fill(); });
    val.forEach((q) => { g.strokeStyle = "#D9B26A"; g.lineWidth = 2; g.beginPath(); g.arc(X(q.x), Y(q.y), 5, 0, 7); g.stroke(); g.lineWidth = 1; });
    g.fillStyle = "#9C9182"; g.font = "11px JetBrains Mono, monospace"; g.fillText("● TRAIN   ○ VALIDATION   - - TRUE PATTERN", 40, h - 16);
    const te = mse(p, train), ve = mse(p, val);
    el.querySelector("#dv").textContent = d; el.querySelector("#tr").textContent = te.toFixed(3); el.querySelector("#va").textContent = ve.toFixed(3);
    el.querySelector("#verdict").textContent = d <= 2 ? "Underfitting: too simple to follow the pattern. Both errors are high." :
      ve > te * 2.2 && d >= 7 ? "Overfitting: the curve memorises the training dots, noise included, and misses the validation dots." : "A good fit: it follows the pattern, not the noise.";
  }
  el.querySelector("#deg").oninput = draw; el.querySelector("#noise").onclick = () => { sample(); draw(); };
  sample(); draw();
}

/* ---------- U1 · temperature ---------- */
const TOY = {
  "The robot opened its": [["eyes", 3.1], ["mouth", 1.9], ["hand", 1.7], ["door", 1.2], ["manual", 0.6], ["heart", 0.3], ["umbrella", -0.6], ["sonnet", -1.4]],
  "To learn AI, start with": [["Python", 3.0], ["math", 2.1], ["curiosity", 1.4], ["a project", 1.3], ["courses", 1.1], ["coffee", -0.2], ["dragons", -1.6], ["jazz", -1.9]],
  "The map shows an island called": [["Python", 1.6], ["Atlantis", 1.5], ["Vision", 1.4], ["Gradient", 1.1], ["Hope", 0.4], ["Tuesday", -0.8], ["Bob", -1.1], ["Spoon", -1.8]],
};
export function U1(el, { hue }) {
  const keys = Object.keys(TOY);
  el.innerHTML = shell("Temperature and the next word",
    "A language model scores every possible next word, then samples one. Temperature reshapes those odds. These scores are a toy example, not a real model.",
    `<div class="ctl"><span>Prompt</span><div class="btns" id="prompts">${keys.map((k, i) => `<button type="button" class="chip" aria-pressed="${!i}" data-k="${i}">${k}…</button>`).join("")}</div></div>
     <div class="ctl"><div class="row"><span>Temperature</span><b id="tv"></b></div><input id="temp" type="range" min="0.1" max="2.5" step="0.05" value="0.8" aria-label="Temperature"></div>
     <div class="btns"><button type="button" class="btn sm" id="sample">Sample 10 times</button></div>
     <p class="small" id="out" aria-live="polite"></p>`);
  const { c, g, w, h } = canvas(el, 720, 440); c.setAttribute("aria-label", "Bar chart of next-word probabilities");
  let k = keys[0], shown = null, anim = 0;
  const probs = () => { const T = +el.querySelector("#temp").value; const z = TOY[k].map(([, s]) => s / T), mx = Math.max(...z); const e = z.map((v) => Math.exp(v - mx)); const s = e.reduce((a, b) => a + b); return e.map((v) => v / s); };
  function draw() {
    const P = probs(), hc = hue || css("--hue"); if (!shown) shown = P.slice();
    shown = shown.map((v, i) => v + (P[i] - v) * (RM ? 1 : 0.18));
    grid(g, w, h); g.font = "500 16px Inter, sans-serif"; g.textBaseline = "middle";
    g.fillStyle = "#CEC3B1"; g.fillText(k + " …", 28, 32);
    TOY[k].forEach(([word], i) => { const y = 78 + i * 44, bw = (w - 260) * shown[i];
      g.fillStyle = "#F3EBDD"; g.fillText(word, 28, y + 14);
      g.fillStyle = "rgba(243,235,221,.07)"; g.fillRect(160, y, w - 260, 28);
      g.fillStyle = hc; g.shadowColor = hc; g.shadowBlur = 12; g.fillRect(160, y, bw, 28); g.shadowBlur = 0;
      g.fillStyle = "#9C9182"; g.font = "13px JetBrains Mono, monospace"; g.fillText((shown[i] * 100).toFixed(1) + "%", 168 + bw, y + 14); g.font = "500 16px Inter, sans-serif"; });
    const T = +el.querySelector("#temp").value; el.querySelector("#tv").textContent = T.toFixed(2) + (T < 0.5 ? " · predictable" : T > 1.5 ? " · chaotic" : " · balanced");
    if (shown.some((v, i) => Math.abs(v - P[i]) > 0.001)) anim = requestAnimationFrame(draw);
  }
  const redraw = () => { cancelAnimationFrame(anim); draw(); };
  el.querySelector("#temp").oninput = redraw;
  el.querySelectorAll("#prompts .chip").forEach((b) => b.onclick = () => { k = keys[+b.dataset.k]; el.querySelectorAll("#prompts .chip").forEach((x) => x.setAttribute("aria-pressed", x === b)); shown = null; el.querySelector("#out").textContent = ""; redraw(); });
  el.querySelector("#sample").onclick = () => { const P = probs(); const pick = () => { let r = Math.random(); for (let i = 0; i < P.length; i++) { r -= P[i]; if (r <= 0) return TOY[k][i][0]; } return TOY[k][0][0]; };
    el.querySelector("#out").innerHTML = Array.from({ length: 10 }, pick).map((x) => `<b style="color:var(--ivory)">${x}</b>`).join(" · "); };
  draw();
}

export const LIVE = { S2, S3, U1 };
