// The path index that stays with the reader (markup: components/Rail.astro, styles: styles/rail.css).
//   state "card": on the home page, at the top, the title and the index sit in the opening
//                 scene's title card;
//   state "side": they rest at the edge (a rail on wide screens, a bar along the bottom on small ones).
// Every item keeps one size. This script measures where each one rests and where its place-holder
// in the card is, and hands the difference to CSS (--fx, --fy), which moves it with a transition.
// It also marks the chapter you are reading (aria-current) from the scroll position.
import { RM } from "./motion.js";

/** Screens where chapters are pinned and slide over one another (same query as styles/home.css). */
export const PIN = "(min-width:861px) and (min-height:661px) and (prefers-reduced-motion:no-preference)";

const html = document.documentElement;
let enter = () => {};
/** Called by the opening scene when its entrance starts: the items rise into the card. */
export const railEnter = () => enter();

/**
 * @param {{ stage: Element, title: Element, items: Element[] } | null} card  the title card's stage and
 *        place-holders (home page only). Without it the index simply rests at the edge.
 */
export function initRail(card = null) {
  const rail = document.getElementById("rail");
  if (!rail) return;
  const list = rail.querySelector(".rail-index"), links = [...list.querySelectorAll("a")], its = links.map((a) => a.querySelector(".it"));
  const titleLink = rail.querySelector(".rail-title a"), rt = rail.querySelector(".rt");
  const nav = document.getElementById("nav"), brand = nav && nav.querySelector(".brand span");
  const pin = matchMedia(PIN);
  let state = "", dockT = 0, stuck = false;

  const px = (v) => v.toFixed(1) + "px";
  function measure() {
    rail.classList.add("measuring");
    if (rt && brand) {                                   // at rest the title lands on the brand in the top bar and fades into it
      const r = rt.getBoundingClientRect(), b = brand.getBoundingClientRect(), n = nav.getBoundingClientRect();
      const s = parseFloat(getComputedStyle(brand).fontSize) / parseFloat(getComputedStyle(rt).fontSize);
      const top = b.top - n.top + (parseFloat(getComputedStyle(nav).top) || 0);       // as if the bar were showing
      titleLink.style.setProperty("--bs", s.toFixed(4));
      titleLink.style.setProperty("--bx", px(b.right - r.width * s - r.left));
      titleLink.style.setProperty("--by", px(top + b.height / 2 - (r.height * s) / 2 - r.top));
    }
    if (card) {
      const base = card.stage.getBoundingClientRect();   // the stage is at the top of the window whenever the card shows
      stuck = getComputedStyle(card.stage).position === "sticky";
      if (rt) {
        const r = rt.getBoundingClientRect(), g = card.title.getBoundingClientRect();
        titleLink.style.setProperty("--fx", px(g.left - base.left - r.left));
        titleLink.style.setProperty("--fy", px(g.top - base.top + (g.height - r.height) / 2 - r.top));
      }
      const bar = getComputedStyle(list).display === "flex";        // the bar: items sit side by side
      const rects = its.map((it, i) => [it.getBoundingClientRect(), card.items[i].getBoundingClientRect(), card.items[i].parentElement.getBoundingClientRect().width]);
      its.forEach((it, i) => {
        const [r, g, slot] = rects[i];
        const a = links[i];
        a.style.setProperty("--fx", px(g.left - base.left - r.left));
        a.style.setProperty("--fy", px(g.top - base.top + (g.height - r.height) / 2 - r.top));
        a.style.setProperty("--fw", px(slot));                       // room for the name in the card (narrow cards wrap it)
        a.parentElement.style.width = bar ? px(Math.ceil(r.width * 10) / 10) : "";   // its seat in the bar keeps its size meanwhile
      });
    }
    // Back to where they were, without a transition: the new numbers take effect in one step.
    rail.classList.add("settling"); rail.classList.remove("measuring");
    void rail.offsetWidth;
    rail.classList.remove("settling");
  }

  function apply(next, instant) {
    if (next === state) return;
    clearTimeout(dockT);
    if (next === "card") { rail.classList.remove("docked"); list.scrollLeft = 0; measure(); }
    else dockT = setTimeout(() => { rail.classList.add("docked"); centre(); }, instant ? 0 : 1000);   // the bar may scroll once the items have landed
    state = next;
    rail.dataset.state = html.dataset.rail = next;
    if (titleLink) titleLink.tabIndex = next === "card" ? 0 : -1;
  }
  // The card state needs the pinned stage. Where the opening scene is not pinned (short windows, reduced
  // motion) the index rests at the edge from the start and the card shows the title on its own.
  const want = () => (card && stuck && scrollY < (state === "card" ? 28 : 6) ? "card" : "side");

  // Where you are: the last chapter whose top has passed the middle of the window.
  const targets = links.map((a) => { const h = a.getAttribute("href"); return h.charAt(0) === "#" ? document.getElementById(h.slice(1)) : null; });
  let active = -1;
  function mark() {
    const mid = innerHeight / 2, cover = pin.matches ? innerHeight : 0;      // pinned chapters are covered by the next one for a screen
    let now = -1;
    targets.forEach((t, i) => {
      if (!t) return;
      const r = t.getBoundingClientRect();
      if (r.top <= mid && r.bottom - cover > mid) now = i;
    });
    if (now === active) return;
    active = now;
    links.forEach((a, i) => (i === now ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    if (now < 0) delete rail.dataset.active; else rail.dataset.active = links[now].dataset.key;
    centre();
  }
  // In the bar, keep the current chapter's name in view.
  function centre() {
    if (active < 0 || !rail.classList.contains("docked") || list.scrollWidth <= list.clientWidth) return;
    const li = links[active].parentElement;
    list.scrollTo({ left: li.offsetLeft - (list.clientWidth - li.offsetWidth) / 2, behavior: RM ? "auto" : "smooth" });
  }

  let raf = 0;
  const tick = () => { raf = 0; apply(want(), false); mark(); };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener("scroll", onScroll, { passive: true });

  let rs = 0;
  const remeasure = () => { cancelAnimationFrame(rs); rs = requestAnimationFrame(() => { measure(); mark(); }); };
  addEventListener("resize", remeasure, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if (card && "ResizeObserver" in window) new ResizeObserver(remeasure).observe(card.items[0].parentElement.parentElement);

  rail.classList.add("booting");
  measure();
  apply(want(), true);
  mark();
  void rail.offsetWidth;
  requestAnimationFrame(() => rail.classList.remove("booting"));
  if (state === "card" && !RM) {
    html.classList.add("rail-wait");
    enter = () => {
      enter = () => {};
      html.classList.remove("rail-wait"); html.classList.add("rail-in");
      setTimeout(() => html.classList.remove("rail-in"), 3800);              // then the items answer to hover and "you are here" again
    };
  }
  rail.dataset.init = "1";
}
