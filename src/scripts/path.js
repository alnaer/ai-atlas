// Path page: progress marks, the route line that fills as you scroll, effort needles and the sub-nav.
import { RM } from "./motion.js";

const KEY = "ai-atlas-progress";

export function initPath() {
  const main = document.querySelector("main[data-path]");
  if (!main) return;
  let done = [];
  try { done = JSON.parse(localStorage.getItem(KEY))?.done || []; } catch { done = []; }

  // Finished islands get a green dot; "Start" points at the first unfinished one.
  const stops = [...document.querySelectorAll(".stop")];
  stops.forEach((s) => s.classList.toggle("done", done.includes(s.dataset.id)));
  const next = stops.find((s) => !done.includes(s.dataset.id));
  const start = document.getElementById("pStart");
  if (next && start) start.href = next.href;

  // Route line fills with the path colour as you scroll.
  const route = document.getElementById("pRoute");
  const fill = () => {
    if (!route) return;
    const r = route.getBoundingClientRect();
    route.style.setProperty("--rp", RM ? 1 : Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height)).toFixed(4));
  };
  addEventListener("scroll", fill, { passive: true }); addEventListener("resize", fill); fill();

  // Effort needles swing to their value when seen.
  const dials = document.querySelectorAll("[data-dial]");
  if (RM || !("IntersectionObserver" in window)) dials.forEach((d) => d.classList.add("in"));
  else {
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .4 });
    dials.forEach((d) => io.observe(d));
  }

  // Sub-nav marks the section in view.
  const links = [...document.querySelectorAll(".subnav a")];
  const sio = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  ["route", "overview", "effort", "careers"].forEach((id) => { const el = document.getElementById(id); if (el) sio.observe(el); });
}
