// Shared page motion: the nav that hides on the way down, reveals on scroll,
// and Lenis smooth scrolling. All of it steps aside for reduced motion.
import Lenis from "lenis";
import { mountSpatial } from "./spatial.js";
import { initPageWipe } from "./pagewipe.js";

export const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initMotion() {
  initPageWipe();
  mountSpatial();

  // Nav: hide on scroll down, return on scroll up. Ignores the rubber-band bounce past either end and
  // small jitters (under 12px), and stays put on touch screens: that stops the header flickering on phones.
  const nav = document.getElementById("nav");
  const touch = matchMedia("(hover:none) and (pointer:coarse)");
  let last = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (!nav || y < 0 || y > max || touch.matches) return;
    if (y <= 120) { nav.classList.remove("hide"); last = y; return; }
    const d = y - last;
    if (Math.abs(d) < 12) return;
    nav.classList.toggle("hide", d > 0);
    last = y;
  }, { passive: true });

  // Reveals: things arrive, they don't pop.
  const targets = document.querySelectorAll("[data-reveal]");
  if (RM || !("IntersectionObserver" in window)) targets.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
  }

  // Smooth scrolling. Native scrolling stays in charge on touch screens.
  if (!RM) {
    const lenis = new Lenis({ lerp: 0.13, wheelMultiplier: 1, smoothWheel: true });   // was 0.09 / 0.9: felt slow and floaty
    window.__lenis = lenis;
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      // A number, not the element: Lenis would add the page's scroll-padding on top of the offset.
      lenis.scrollTo(target.getBoundingClientRect().top + scrollY + +(a.dataset.scrollOffset ?? -80));
      try { history.replaceState(null, "", id); } catch { /* sandboxed previews may refuse; the scroll still happens */ }
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }));
  }
}
