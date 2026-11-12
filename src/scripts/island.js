// Island page: the "can explain" checklist, finished mark, tutor prompt copy, live demo and goal-path neighbours.
import { LIVE } from "./demos.js";

const KEY = "ai-atlas-progress";

export function initIsland() {
  const main = document.querySelector("main[data-island]");
  if (!main) return;
  const id = main.dataset.island;
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { S = {}; }
  S.done ||= []; S.know ||= {}; S.know[id] ||= [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  // checklist
  const boxes = [...document.querySelectorAll("#iKnow input")];
  const bar = document.getElementById("kBar");
  const paintBar = () => bar && bar.style.setProperty("--w", (S.know[id].length / Math.max(1, boxes.length) * 100) + "%");
  boxes.forEach((x) => {
    const j = +x.dataset.j;
    x.checked = S.know[id].includes(j);
    x.addEventListener("change", () => {
      S.know[id] = x.checked ? [...new Set([...S.know[id], j])] : S.know[id].filter((v) => v !== j);
      save(); paintBar();
    });
  });
  paintBar();

  // finished
  const btn = document.getElementById("iDone");
  const paint = () => { const d = S.done.includes(id); btn.textContent = d ? "✓ Island finished" : "Mark island as finished"; btn.classList.toggle("ghost", d); };
  btn?.addEventListener("click", () => { S.done = S.done.includes(id) ? S.done.filter((v) => v !== id) : [...S.done, id]; save(); paint(); });
  if (btn) paint();

  // tutor prompt
  const copy = document.getElementById("iCopy"), pre = document.getElementById("iTutor");
  copy?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(pre.textContent); copy.textContent = "Copied"; }
    catch { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = "Selected, press Ctrl+C"; }
    setTimeout(() => (copy.textContent = "Copy prompt"), 1800);
  });

  // live demo
  document.querySelectorAll("[data-demo]").forEach((el) => { const f = LIVE[el.dataset.demo]; if (f) f(el, { hue: el.dataset.hue }); });

  // previous / next along the learner's goal path, when that path includes this island
  let nav = {};
  try { nav = JSON.parse(document.getElementById("island-nav").textContent); } catch {}
  const goal = S.goal && nav[S.goal] ? nav[S.goal] : null;
  const pn = document.getElementById("iPn");
  if (goal && pn) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const art = (t) => (t.img ? `<img src="${esc(t.img)}" alt="">` : `<span class="ph">${esc(t.id)}</span>`);
    const tile = (t, next) => !t ? "<span></span>" : `<a class="card${next ? " next" : ""}" href="${esc(t.href)}" style="--hue:${esc(t.hue)}">${next ? "" : art(t)}<span><small>${next ? "Next island →" : "← Previous island"}</small><b>${esc(t.title)}</b></span>${next ? art(t) : ""}</a>`;
    pn.innerHTML = tile(goal.pv, false) + tile(goal.nx, true);
  }
}
