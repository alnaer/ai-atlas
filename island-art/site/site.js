// Shared runtime for the AI Atlas reference pages: data, nav, smooth scroll, reveals.
import "../spatial-photo.js";

export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ROOT = new URL("../", import.meta.url).href;        // the island-art folder
export const asset = (p) => ROOT + p;

let _data;
export async function data() {
  if (_data) return _data;
  const j = (p) => fetch(asset(p)).then((r) => r.json());
  const [atlas, art, pages, demos] = await Promise.all([j("data/atlas.json"), j("islands.json"), j("pages/pages.json"), j("data/demos.json")]);
  const artBy = Object.fromEntries(art.islands.map((i) => [i.id, i]));
  const pageBy = Object.fromEntries(pages.pages.map((p) => [p.id, p]));
  const demoBy = Object.fromEntries(demos.demos.map((d) => [d.id, d]));
  const isl = Object.fromEntries(atlas.islands.map((i) => [i.id, i]));
  const HOME = { S: "understand", U: "use", T: "train", B: "build", V: "vision", L: "language", G: "generative", R: "rl", M: "mlops", A: "safety" };
  _data = {
    atlas, isl, artBy, pageBy, demoBy,
    hue: (id) => atlas.hue[id[0]],
    trackOf: (id) => HOME[id[0]],
    pathHours: (key) => atlas.paths[key].steps.reduce((a, id) => [a[0] + isl[id].hrs[0], a[1] + isl[id].hrs[1]], [0, 0]),
    num: (id) => String(atlas.islands.findIndex((i) => i.id === id) + 1).padStart(2, "0"),
  };
  return _data;
}

export const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const LOGO = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
  <circle cx="16" cy="16" r="13"/><circle cx="16" cy="16" r="8.5" stroke-dasharray="2 2.4"/>
  <path d="M16 2v6M16 24v6M2 16h6M24 16h6"/><path d="M16 9l2.4 7L16 23l-2.4-7z" fill="currentColor" stroke="none"/></svg>`;

export function chrome(active) {
  const links = [["index.html", "Home", "home"], ["atlas.html", "Atlas", "atlas", 1], ["path.html#understand", "Paths", "path"], ["island.html#S0", "Start", "island"]];
  document.body.prepend(h(`<header class="nav" id="nav"><div class="wrap nav-in">
    <a class="skip" href="#main">Skip to content</a>
    <a class="brand" href="index.html">${LOGO}<span>AI Atlas</span></a>
    <nav class="nav-links" aria-label="Main">${links.map(([u, t, k, keep]) =>
      `<a href="${u}" ${k === active ? 'aria-current="page"' : ""} class="${keep ? "keep" : ""}">${t}</a>`).join("")}</nav>
    <a class="btn sm" href="atlas.html">Open the atlas</a>
  </div></header>`));
  document.body.append(h(`<footer class="foot"><div class="wrap">
    <p>Paintings, engravings and objects: The Metropolitan Museum of Art, Open Access (CC0). Depth maps: Depth Anything V2 Small (Apache-2.0). Cut-outs: IS-Net via rembg (Apache-2.0).</p>
    <p class="mono"><a href="../library.html">Art library</a> · AI Atlas · MMXXVI</p></div></footer>`));
}

export function motion() {
  // hide nav on scroll down, show on scroll up
  let last = 0; const nav = document.getElementById("nav");
  addEventListener("scroll", () => { const y = scrollY; nav && nav.classList.toggle("hide", y > 120 && y > last); last = y; }, { passive: true });
  // reveals
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  const watch = () => document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => io.observe(el));
  watch(); new MutationObserver(watch).observe(document.body, { childList: true, subtree: true });
  // smooth scroll (Lenis), skipped for reduced motion
  if (!RM) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js";
    s.onload = () => {
      const lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
      window.__lenis = lenis;
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
      document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
        const t = document.querySelector(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80 }); }
      }));
    };
    document.head.append(s);
  }
}

export function setHue(c) { document.documentElement.style.setProperty("--hue", c); }

export function spatial(p, extra = "") {
  // <spatial-photo> tag for a page or island art entry
  const f = p.files, m = p.motion;
  const src = f.hero || f.cut, dep = f.heroDepth || f.cutDepth;
  const base = p.kind ? "pages/" : "";
  return `<spatial-photo src="${asset(base + src)}" depth="${asset(base + dep)}" alt="${esc(p.alt)}" hue="${p.hue}"
    strength="${m.strength}" focus="${m.focus ?? m.focusHero}" glow="${m.glow}" tint="${m.tint}" ${m.attrs || ""} ${extra}></spatial-photo>`;
}

export function creditLine(a) {
  return `${esc(a.artist)}, <i>${esc(a.title)}</i>, ${esc(a.date)}. <a href="${a.page}" target="_blank" rel="noopener">The Met</a> · CC0`;
}
