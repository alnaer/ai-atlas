// The Atlas map (DESIGN.md §4.2), ported from the design folder's site/atlas.html.
// Draws the sea chart, the island medallions and your route; camera views, drag and zoom; the peek card.
// Data comes from the page (#atlas-data), built from data/atlas.json at build time.
import { RM } from "./motion.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function initAtlas() {
  const sec = document.querySelector("section.atlas"), compact = sec.classList.contains("compact");
  // on the home page the route colour stays inside the map; on the Atlas page it tints the whole page
  const setHue = (c) => (compact ? sec : document.documentElement).style.setProperty("--hue", c);
  const $ = (id) => document.getElementById(id);
  const A = JSON.parse(document.getElementById("atlas-data").textContent);
  const W = 1600, H = 1080, X = (x) => 800 + x * 1.15, Y = (y) => 600 + y * 1.05;
  const pos = Object.fromEntries(A.islands.map((i) => [i.id, [X(i.x), Y(i.y)]]));
  const I = Object.fromEntries(A.islands.map((i) => [i.id, i]));
  const KEY = "ai-atlas-progress";
  const store = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
  store.done ||= []; store.goal ||= "understand"; store.pace ||= 10;

  /* ---------- draw the chart ---------- */
  const REG = { understand: "The Foundation Shoals", use: "Archipelago of Use", train: "The Training Isles", build: "The Forge Isles",
    vision: "Sight", language: "Lingua", generative: "Making", rl: "Reward", mlops: "The Mills", safety: "The Guardians" };
  const regionPos = (k) => { const ids = A.paths[k].steps.filter((id) => I[id].track === k); const xs = ids.map((i) => pos[i][0]), ys = ids.map((i) => pos[i][1]);
    const cx = xs.reduce((a, b) => a + b) / xs.length, cy = Math.min(...ys); return [cx, k.length && ["vision","language","generative","rl","mlops","safety"].includes(k) ? cy - 62 : (k === "use" ? cy - 72 : cy - 95)]; };
  const rose = (cx, cy, r) => { let s = `<g class="rose" transform="translate(${cx} ${cy})" fill="none" stroke="currentColor">
    <circle r="${r}" stroke-width="1"/><circle r="${r * .86}" stroke-width=".6" stroke-dasharray="2 5"/><circle r="${r * .3}" stroke-width=".8"/>`;
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, l = i % 4 === 0 ? r * .98 : i % 2 === 0 ? r * .7 : r * .5, w = i % 4 === 0 ? r * .1 : r * .06;
      const p = (ang, rr) => `${(Math.sin(ang) * rr).toFixed(1)} ${(-Math.cos(ang) * rr).toFixed(1)}`;
      s += `<path d="M${p(a, l)} L${p(a + Math.PI / 2, w)} L0 0 L${p(a - Math.PI / 2, w)}Z" fill="${i % 2 ? "none" : "currentColor"}" fill-opacity=".35" stroke-width=".8"/>`; }
    return s + `<text y="${-r - 12}" text-anchor="middle" font-family="Fraunces" font-size="20" fill="currentColor" stroke="none">N</text></g>`; };
  const rhumbs = (cx, cy) => Array.from({ length: 32 }, (_, i) => { const a = i * Math.PI / 16; return `<line class="rhumb" x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * 2400}" y2="${cy + Math.sin(a) * 2400}"/>`; }).join("");
  const curve = (a, b) => { const [x1, y1] = pos[a], [x2, y2] = pos[b], mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    const k = 0.12; return `M${x1} ${y1} Q${mx - dy * k} ${my + dx * k} ${x2} ${y2}`; };
  let grid = ""; for (let x = 0; x <= W; x += 100) grid += `<line class="grid-l" x1="${x}" y1="0" x2="${x}" y2="${H}"/>`; for (let y = 0; y <= H; y += 100) grid += `<line class="grid-l" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  let ticks = ""; for (let x = 20; x < W; x += 20) ticks += `<line x1="${x}" y1="10" x2="${x}" y2="${x % 100 ? 16 : 22}" stroke="rgba(217,178,106,.5)"/><line x1="${x}" y1="${H - 10}" x2="${x}" y2="${H - (x % 100 ? 16 : 22)}" stroke="rgba(217,178,106,.5)"/>`;
  const board = document.getElementById("board");
  board.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs><pattern id="waves" width="40" height="22" patternUnits="userSpaceOnUse"><path d="M0 11q10-7 20 0t20 0" fill="none" stroke="rgba(217,178,106,.07)" stroke-width="1"/></pattern>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <radialGradient id="vig"><stop offset="60%" stop-color="#0E0B10" stop-opacity="0"/><stop offset="100%" stop-color="#060507" stop-opacity=".9"/></radialGradient></defs>
    <rect class="sea" width="${W}" height="${H}" rx="18"/><rect width="${W}" height="${H}" fill="url(#waves)" rx="18"/>
    <g clip-path="inset(0 round 18px)">${grid}${rhumbs(230, 880)}${rhumbs(1480, 960)}</g>
    <rect width="${W}" height="${H}" fill="url(#vig)" rx="18"/>
    <rect class="frame-b" x="6" y="6" width="${W - 12}" height="${H - 12}" rx="14"/><rect class="frame-b" x="26" y="26" width="${W - 52}" height="${H - 52}" rx="8" style="opacity:.3"/>${ticks}
    ${rose(230, 880, 110)}${rose(1480, 960, 58)}
    <g transform="translate(1290 98)"><rect x="-150" y="-52" width="300" height="104" rx="6" fill="rgba(12,10,13,.85)" stroke="rgba(217,178,106,.5)"/>
      <text text-anchor="middle" y="-14" font-family="Fraunces" font-size="28" font-style="italic" fill="#F1D49A">Atlas of Machine Learning</text>
      <text text-anchor="middle" y="18" font-family="JetBrains Mono" font-size="11" letter-spacing="3" fill="#9C9182">${esc(A.cartouche)}</text></g>
    ${A.order.map((k) => { const [x, y] = regionPos(k); return `<text class="region" x="${x}" y="${y}">${REG[k]}</text>`; }).join("")}
    <g id="links">${A.linkPairs.map(([a, b]) => `<path class="link" d="${curve(a, b)}"/>`).join("")}</g>
    <g id="route"></g>
  </svg><div class="ship" id="ship"></div>` + A.islands.map((i, n) => { const [x, y] = pos[i.id];
    return `<div class="isl k-${i.k} enter" id="i-${i.id}" style="transform:translate3d(${x}px,${y}px,0);--c:${i.hue};--bd:${(n % 7) * -0.7}s">
      <div class="shadow"></div><div class="ring"></div>
      <div class="bill"><button class="med" data-id="${i.id}" aria-label="Island ${i.num}: ${esc(i.title)}">
        <span class="disc">${i.img ? `<img src="${i.img}" alt="" loading="lazy">` : `<span class="ph">${i.num}</span>`}</span>
        <span class="tag"><b>${i.num}</b>${esc(i.short)}</span></button></div></div>`; }).join("");

  /* ---------- camera ---------- */
  const MOB = innerWidth < 860;
  const VIEWS = [["voyage", "Voyage", 50, -8, MOB ? 1.25 : .82], ["horizon", "Horizon", 62, -14, MOB ? 1.35 : .9], ["chart", "Chart", 0, 0, MOB ? 1.7 : compact ? .64 : .7]];
  const stage = document.getElementById("stage");
  let cam = { tilt: 50, spin: -8, zoom: .82, px: 0, py: 0 }, view = compact || innerWidth < 860 ? "chart" : "voyage";   // home: always the flat chart, centred
  const fit = () => Math.min(1, Math.max(.24, Math.min(stage.clientWidth / 1500, stage.clientHeight / 900)));
  function apply() { const b = board.style; b.setProperty("--tilt", cam.tilt + "deg"); b.setProperty("--spin", cam.spin + "deg");
    b.setProperty("--zoom", (cam.zoom * fit()).toFixed(3)); b.setProperty("--px", cam.px + "px"); b.setProperty("--py", cam.py + "px"); }
  // home: the chart fills nearly the whole screen, between the top bar, the side menu and the path bar
  const homeRail = () => (innerWidth >= 1180 && innerHeight >= 620 ? Math.min(40, Math.max(20, innerWidth * .024)) + 244 : 0);   /* the side menu (rail.css --rail-space) */
  const homeFit = () => { const cs = getComputedStyle(document.documentElement), rail = homeRail(), nav = parseFloat(cs.getPropertyValue("--nav-h")) || 64;
    const w = stage.clientWidth - rail - 48, h = stage.clientHeight - nav - 112;
    return Math.max(.3, Math.min(w / 1600, h / 1080)) / fit(); };
  if (compact && !MOB) addEventListener("resize", () => { if (!dragging) setView(view); });
  function setView(v) { const p = VIEWS.find((x) => x[0] === v); view = v; Object.assign(cam, { tilt: p[2], spin: p[3], zoom: compact && !MOB ? homeFit() : p[4], px: compact ? homeRail() / 2 : innerWidth > 860 ? 150 : 0, py: compact && !MOB ? ((parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64) - 112) / 2 : 0 }); apply();
    document.querySelectorAll("#views button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v)); }
  document.getElementById("views").innerHTML = VIEWS.map(([k, t]) => `<button data-v="${k}">${t}</button>`).join("");
  document.querySelectorAll("#views button").forEach((b) => (b.onclick = () => setView(b.dataset.v)));
  document.getElementById("zin").onclick = () => { cam.zoom = Math.min(3, cam.zoom * 1.2); apply(); };
  document.getElementById("zout").onclick = () => { cam.zoom = Math.max(.4, cam.zoom / 1.2); apply(); };
  document.getElementById("zre").onclick = () => setView(view);
  // drag to pan, gentle pointer parallax
  let dragging = null;
  stage.addEventListener("pointerdown", (e) => { if (e.target.closest(".med") || (compact && e.pointerType !== "mouse")) return; /* on the home page a finger scrolls the page */ dragging = { x: e.clientX, y: e.clientY, px: cam.px, py: cam.py }; stage.classList.add("drag"); stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => {
    if (dragging) { cam.px = dragging.px + e.clientX - dragging.x; cam.py = dragging.py + e.clientY - dragging.y; apply(); return; }
    if (RM || view === "chart" || e.pointerType !== "mouse") return;
    const r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    const p = VIEWS.find((x) => x[0] === view); cam.spin = p[3] + nx * 4; cam.tilt = p[2] - ny * 4;
    board.classList.add("instant"); apply(); clearTimeout(stage._t); stage._t = setTimeout(() => board.classList.remove("instant"), 60);
  });
  const end = () => { dragging = null; stage.classList.remove("drag"); };
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
  stage.addEventListener("wheel", (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); cam.zoom = Math.max(.45, Math.min(1.8, cam.zoom * (e.deltaY < 0 ? 1.08 : .92))); apply(); }, { passive: false });
  addEventListener("resize", apply);

  /* ---------- route ---------- */
  const GOALS = ["understand", "use", "train", "build", ...A.specs];
  if ($("goals")) $("goals").innerHTML = GOALS.map((k) => `<button class="chip" data-k="${k}" style="--c:${A.pathHue[k]}" aria-pressed="false"><i></i>${esc(A.paths[k].name)}</button>`).join("");
  if ($("pace")) $("pace").outerHTML = `<span>${A.paces.map((p) => `<button data-p="${p}" aria-pressed="${p === store.pace}">${p}</button>`).join(" ")}</span>`;
  document.querySelectorAll(".pace button").forEach((b) => (b.onclick = () => { store.pace = +b.dataset.p; save(); document.querySelectorAll(".pace button").forEach((x) => x.setAttribute("aria-pressed", x === b)); summary(); }));
  let ship = { anims: [] };
  // Pause every map animation (the ship and the islands' bob and pulse) while the map is off screen or the tab is hidden.
  let live = true;
  const setLive = (on) => { if (on === live) return; live = on; sec.classList.toggle("paused", !on);
    ship.anims.forEach((a) => (on ? a.play() : a.pause())); };
  let onScreen = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; setLive(onScreen && !document.hidden); }).observe(sec);
  document.addEventListener("visibilitychange", () => setLive(onScreen && !document.hidden));
  function summary() { const k = store.goal, hrs = A.paths[k].hours, steps = A.paths[k].steps, done = steps.filter((s) => store.done.includes(s)).length;
    const wk = [Math.ceil(hrs[0] / store.pace), Math.ceil(hrs[1] / store.pace)];
    if ($("sum")) $("sum").innerHTML = `<div><b>${steps.length}</b><span>islands</span></div><div><b>${hrs[0]}–${hrs[1]}</b><span>hours</span></div><div><b>${wk[0]}–${wk[1]}</b><span>weeks · ${done}/${steps.length} done</span></div>`; }
  function route(k, animate = true) {
    store.goal = k; save(); const c = A.pathHue[k], steps = A.paths[k].steps; setHue(c);
    document.querySelectorAll("#goals .chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.k === k));
    if ($("blurb")) $("blurb").textContent = A.paths[k].blurb;
    if ($("pathName")) $("pathName").textContent = A.paths[k].name;
    $("openPath").href = A.paths[k].href; if ($("startIsl")) $("startIsl").href = I[steps.find((s) => !store.done.includes(s)) || steps[0]].href;
    A.islands.forEach((i) => { const el = document.getElementById("i-" + i.id); const on = steps.includes(i.id);
      el.classList.toggle("on", on); el.classList.toggle("off", !on); el.classList.toggle("done", store.done.includes(i.id)); });
    // route segments: consecutive steps that are linked; otherwise jump from the step's parent island
    const linked = new Set(A.linkPairs.flatMap(([a, b]) => [a + ">" + b, b + ">" + a])), parent = {}; A.linkPairs.forEach(([a, b]) => (parent[b] ||= a));
    const segs = []; steps.forEach((id, i) => { if (!i) return; const prev = steps[i - 1]; const from = linked.has(prev + ">" + id) ? prev : (parent[id] && steps.includes(parent[id]) ? parent[id] : prev); segs.push([from, id]); });
    const g = document.getElementById("route"); const d = segs.map(([a, b]) => curve(a, b)).join(" ");
    g.innerHTML = `<path class="route ${animate && !RM ? "draw" : ""}" d="${d}" stroke="${c}"/>`;
    const p = g.firstChild, len = p.getTotalLength(); p.style.setProperty("--len", len); p.style.setProperty("--dur", Math.min(3.2, 0.8 + len / 1400) + "s");
    // ship sails each segment in order
    // The ship is its own small layer (not part of the chart SVG), so moving it never repaints the chart.
    // The course is worked out once and handed to the browser as a transform animation, which runs on the
    // graphics chip: no script runs per frame. Same speed as before: 140 units a second, then a short rest.
    ship.anims.forEach((a) => a.cancel()); ship.anims = []; const shipEl = document.getElementById("ship"); shipEl.style.setProperty("--c", c);
    if (!RM && shipEl.animate) { const paths = segs.map(([a, b]) => { const q = document.createElementNS("http://www.w3.org/2000/svg", "path"); q.setAttribute("d", curve(a, b)); return q; });
      const lens = paths.map((q) => q.getTotalLength()), total = lens.reduce((a, b) => a + b, 0), cycle = total + 300, frames = [];
      paths.forEach((q, j) => { const before = lens.slice(0, j).reduce((a, b) => a + b, 0), n = Math.max(2, Math.ceil(lens[j] / 6));
        for (let s = 0; s <= n; s++) { const d = lens[j] * s / n, pt = q.getPointAtLength(d); frames.push({ offset: (before + d) / cycle, transform: `translate3d(${pt.x.toFixed(1)}px,${pt.y.toFixed(1)}px,0)` }); } });
      frames.push({ offset: 1, transform: frames[frames.length - 1].transform });
      const f = total / cycle, opts = { duration: cycle / 140 * 1000, iterations: Infinity, delay: animate ? 2200 : 0 };
      ship.anims = [shipEl.animate(frames, opts), shipEl.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: f }, { opacity: 0, offset: f }, { opacity: 0, offset: 1 }], opts)];
      if (!live) ship.anims.forEach((a) => a.pause()); }
    // list
    if ($("steps")) $("steps").innerHTML = steps.map((id, n) => { const i = I[id];
      return `<li><a href="${i.href}" data-id="${id}" style="--c:${i.hue}"><span class="n">${String(n + 1).padStart(2, "0")}</span>
        ${i.img ? `<img src="${i.img}" alt="" loading="lazy">` : `<span class="ph">${i.num}</span>`}<span class="t">${esc(i.title)}<small>${i.hrs[0]}–${i.hrs[1]} h</small></span>
        <span class="ok ${store.done.includes(id) ? "y" : ""}" title="${store.done.includes(id) ? "Finished" : "Not finished"}"></span></a></li>`; }).join("");
    document.querySelectorAll("#steps a").forEach((a) => { a.onmouseenter = () => peek(a.dataset.id, document.querySelector(`.med[data-id=${a.dataset.id}]`)); a.onmouseleave = hide; });
    summary(); if (!compact) history.replaceState(null, "", "#" + k);
  }
  document.querySelectorAll("#goals .chip").forEach((b) => (b.onclick = () => route(b.dataset.k)));

  /* ---------- peek card ---------- */
  const pk = document.getElementById("peek"); let pkId = null, hideT;
  function peek(id, anchor) {
    clearTimeout(hideT); const i = I[id]; pk.style.setProperty("--c", i.hue);
    if (pkId !== id) { pkId = id; document.getElementById("peekArt").innerHTML = i.img ? `<img class="pk-img" src="${i.img}" alt="">` : "";
      document.getElementById("pkN").innerHTML = `<b>Island ${i.num}</b> · ${esc(A.paths[i.track].name)}`; document.getElementById("pkH").textContent = `${i.hrs[0]}–${i.hrs[1]} h`;
      document.getElementById("pkT").textContent = i.title; document.getElementById("pkL").textContent = i.learn; }
    const r = anchor.getBoundingClientRect(), w = 300; let x = r.right + 18, y = r.top - 40;
    if (x + w > innerWidth - 12) x = r.left - w - 18; if (x < 12) x = 12; y = Math.max(80, Math.min(innerHeight - 380, y));
    pk.style.left = x + "px"; pk.style.top = y + "px"; pk.classList.add("show");
    document.querySelectorAll("#steps a").forEach((a) => a.classList.toggle("hl", a.dataset.id === id));
  }
  function hide() { hideT = setTimeout(() => { pk.classList.remove("show"); document.querySelectorAll("#steps a.hl").forEach((a) => a.classList.remove("hl")); }, 120); }
  document.querySelectorAll(".med").forEach((m) => {
    m.addEventListener("mouseenter", () => peek(m.dataset.id, m)); m.addEventListener("mouseleave", hide);
    m.addEventListener("focus", () => peek(m.dataset.id, m)); m.addEventListener("blur", hide);
    m.addEventListener("click", (e) => { const id = m.dataset.id;
      if (compact) { e.preventDefault(); const k = A.paths[store.goal].steps.includes(id) ? store.goal : I[id].track; if (k !== store.goal) route(k); peek(id, m); return; }   // home: light the path, don't leave the page
      if (matchMedia("(hover: none)").matches && pkId !== id) { e.preventDefault(); peek(id, m); return; }
      const im = m.querySelector("img"); if (im) im.style.viewTransitionName = "island-art"; (window.__go || ((u) => (location.href = u)))(I[id].href); });
  });
  if (!compact) { pk.addEventListener("click", () => { if (pkId) (window.__go || ((u) => (location.href = u)))(I[pkId].href); }); pk.style.cursor = "pointer"; }

  /* ---------- go ---------- */
  setView(view);
  const start = GOALS.includes(location.hash.slice(1)) ? location.hash.slice(1) : store.goal;
  route(start, true);
  const order = [...A.islands].sort((a, b) => (A.paths[start].steps.indexOf(a.id) + 1 || 99) - (A.paths[start].steps.indexOf(b.id) + 1 || 99));
  order.forEach((i, n) => setTimeout(() => document.getElementById("i-" + i.id).classList.remove("enter"), RM ? 0 : 200 + n * 45));
}
