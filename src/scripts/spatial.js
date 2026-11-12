// Upgrades the plain images rendered by <SpatialPhoto> into live <spatial-photo>
// elements (defined by ./spatial-photo.js).
import "./spatial-photo.js";

const BOOL = new Set(["transparent", "intro"]);
const SMALL = "(max-width: 760px)";
/** The reviewer asked for no depth effect on the pictures (10 Nov 2026): the plain images stay. Set to false to bring it back. */
const FLAT = true;

function upgrade(el) {
  if (el.dataset.spOn) return el.querySelector("spatial-photo");
  el.dataset.spOn = "1";
  const small = el.dataset.attrsSmall && matchMedia(SMALL).matches;
  const a = JSON.parse((small ? el.dataset.attrsSmall : el.dataset.attrs) || "{}");
  const sp = document.createElement("spatial-photo");
  for (const [k, v] of Object.entries(a)) {
    if (BOOL.has(k)) { if (v) sp.setAttribute(k, ""); }
    else if (v !== undefined && v !== null) sp.setAttribute(k, String(v));
  }
  const done = (live) => {
    el.classList.toggle("live", live);
    el.dataset.spDone = "1";
    el.dispatchEvent(new CustomEvent("sp-settled", { bubbles: true }));
  };
  sp.addEventListener("spatial-ready", () => done(true));
  sp.addEventListener("spatial-fallback", () => done(false));
  const img = el.querySelector("img");
  if (img) img.setAttribute("aria-hidden", "true");
  el.append(sp);
  return sp;
}

/** Give a live picture back: the plain image shows again and its WebGL context is freed. */
function release(el) {
  const sp = el.querySelector("spatial-photo");
  if (!sp) return;
  try { const ext = sp._gl && sp._gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext(); } catch { /* already gone */ }
  sp.remove();
  el.classList.remove("live");
  delete el.dataset.spOn; delete el.dataset.spDone;
  const img = el.querySelector("img");
  if (img) img.removeAttribute("aria-hidden");
}

/**
 * Mount every spatial photo under `scope`: eager ones now, the rest as they approach the screen.
 * A picture that is more than a screen and a half away is released again, so however long
 * the page is, only the few pictures around the reader hold a WebGL context.
 */
export function mountSpatial(scope = document) {
  let els = [...scope.querySelectorAll("[data-sp]:not([data-sp-on])")];
  if (FLAT) {   // pictures stay flat, as painted; only those marked depth keep the effect
    els.forEach((el) => { if (!el.dataset.spDepth) el.dataset.spOn = el.dataset.spDone = "1"; });
    els = els.filter((el) => el.dataset.spDepth);
  }
  if (!els.length) return;
  if (!("IntersectionObserver" in window) || !window.customElements) return;   // the plain images stay
  const near = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) upgrade(e.target); }), { rootMargin: "60% 0px 60% 0px" });
  const far = new IntersectionObserver((entries) => entries.forEach((e) => { if (!e.isIntersecting) release(e.target); }), { rootMargin: "150% 0px 150% 0px" });
  els.forEach((el) => { if (el.dataset.sp === "eager") upgrade(el); near.observe(el); far.observe(el); });
}

/** Resolves when a spatial photo holder has loaded (or fallen back), or after `ms`. */
export function settled(el, ms = 2500) {
  return new Promise((ok) => {
    if (!el || el.dataset.spDone) return ok();
    const t = setTimeout(ok, ms);
    el.addEventListener("sp-settled", () => { clearTimeout(t); ok(); }, { once: true });
  });
}

/** The live <spatial-photo> inside a holder, if it has been mounted. */
export const liveOf = (el) => el && el.querySelector("spatial-photo");
