// Page wipe between the site's pages. Works in every browser (no View Transitions needed).
// Leaving: html.pt-leave runs the ink sheet up over the page, then the browser navigates.
// Arriving: the inline script in Base.astro set html.pt-enter before first paint; we lift the sheet off.
import { RM } from "./motion.js";

const FLAG = "ai-atlas-wipe";
const OUT_MS = 760;

/** Navigate to a page of this site with the wipe. */
export function go(url) {
  const html = document.documentElement;
  if (RM || html.classList.contains("pt-leave")) { location.href = url; return; }
  try { sessionStorage.setItem(FLAG, "1"); } catch {}
  html.classList.remove("pt-enter", "pt-lift");
  html.classList.add("pt-leave");
  setTimeout(() => { location.href = url; }, OUT_MS);
}

/** Is this link one of our own pages, opened in this tab? */
function ours(a, e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  const href = a.getAttribute("href") || "";
  if (!href || href.charAt(0) === "#" || /^[a-z]+:/i.test(href)) return false;
  const u = new URL(a.href, location.href);
  if (u.origin !== location.origin) return false;
  if (u.pathname === location.pathname && u.hash) return false;   // a jump within this page
  return /\.html$/.test(u.pathname) || u.pathname.endsWith("/");
}

export function initPageWipe() {
  const html = document.documentElement;
  window.__go = go;
  // arrive
  if (html.classList.contains("pt-enter")) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      html.classList.add("pt-lift");
      setTimeout(() => html.classList.remove("pt-enter", "pt-lift"), 1500);
    }));
  }
  // leave (bubble phase, so the preview's link guard and page handlers run first)
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || !ours(a, e)) return;
    e.preventDefault();
    go(a.href);
  });
  // coming back with the browser's Back button: never stay covered
  addEventListener("pageshow", (e) => { if (e.persisted) html.classList.remove("pt-leave", "pt-enter", "pt-lift"); });
}
