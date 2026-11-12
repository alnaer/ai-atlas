// Home page behaviour: the opening scene, the machine's callouts, the path chapters, the sticky story and the demo.
import { RM } from "./motion.js";
import { initRail, railEnter, PIN } from "./rail.js";
import { settled, liveOf } from "./spatial.js";
import { U1 } from "./demos.js";
// The 3D neural network (net3d.js) was taken out of the opening at the owner's request; the module stays for later use.

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (v) => v * v * (3 - 2 * v);

/* ===== A. Genesis =====
   CSS owns the entrance (keyframes that start when .g-stick gets .ready) and the
   scroll choreography (driven by --p). This loop only writes what changes every
   frame: --p, the gap between the fingertips (--g), the spark (--sp) and the
   hands' idle float. It stops while the scene is off screen.
   The title and the path index shown in the card belong to the rail (rail.js):
   the card only holds their places, and they leave for the edge on the first scroll. */
const GAP = 46, BREATHE = 7, PULL = 26, TOUCH_GAP = 2;
const T_FLOAT = 2.2, T_SPARK = 2.6;           // seconds into the entrance
const MESSAGE = "Connection made. Now learn how it works.";

function initGenesis() {
  const gen = document.getElementById("genesis");
  if (!gen) return;
  const stick = gen.querySelector(".g-stick"), hands = gen.querySelector(".g-hands");
  const spark = gen.querySelector(".spark"), flash = gen.querySelector(".flash"), msg = gen.querySelector(".g-msg");
  const touch = gen.querySelector(".touch"), arcs = [...spark.querySelectorAll("polyline")];
  const floats = [...gen.querySelectorAll(".h-float")];
  let touching = false;
  const net = null;

  initRail({ stage: stick, title: gen.querySelector(".g-title"), items: [...gen.querySelectorAll(".g-index .ix-it")] });

  // Touch: complete the connection.
  touch.addEventListener("click", () => {
    if (touching) return;
    touching = true;
    if (net) net.pulse();
    if (RM) hands.style.setProperty("--g", TOUCH_GAP + "px");
    setTimeout(() => {
      flash.classList.add("go");
      if (!RM) for (let i = 0; i < 3; i++) setTimeout(() => {
        const r = document.createElement("i"); r.className = "ripple"; hands.append(r);
        setTimeout(() => r.remove(), 1700);
      }, i * 220);
      msg.textContent = MESSAGE; msg.classList.add("show");
    }, RM ? 0 : 450);
    setTimeout(() => {
      touching = false; flash.classList.remove("go"); msg.classList.remove("show");
      if (RM) hands.style.setProperty("--g", "40px");
      setTimeout(() => { if (!touching) msg.textContent = ""; }, 700);
    }, 3200);
  });

  // Reduced motion: everything in place, a steady spark, no pin and no loop.
  if (RM) {
    stick.classList.add("ready");
    hands.style.setProperty("--g", "40px"); hands.style.setProperty("--sp", ".8");
    if (net) { const draw = () => net.update({ gap: 40, ty: (parseFloat(getComputedStyle(gen).getPropertyValue("--ty")) || 34) / 100, close: .6, t: 0, ptr: null }); draw(); addEventListener("resize", draw); }
    return;
  }

  // Layout numbers the loop needs, refreshed on resize rather than read every frame.
  let top = 0, span = 1, ty = .34, scale = 1;
  const measure = () => {
    top = gen.getBoundingClientRect().top + scrollY;
    span = getComputedStyle(stick).position === "sticky" ? gen.offsetHeight - innerHeight : 0;   // no scroll scene unless pinned
    document.documentElement.classList.toggle("gen-pin", span > 0);           // the next section rises over the pinned scene
    ty = (parseFloat(getComputedStyle(gen).getPropertyValue("--ty")) || 34) / 100;
    scale = clamp(innerWidth / 900, .62, 1);                    // a smaller gap for smaller hands
  };
  measure();
  addEventListener("resize", measure, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(gen);

  let ptr = null;
  addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") ptr = [e.clientX, e.clientY]; }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => (ptr = null));

  const drawArc = (el, gap, amp) => {
    const n = 9, pts = [];
    for (let i = 0; i <= n; i++) {
      const x = -gap / 2 + (gap * i) / n, y = i === 0 || i === n ? 0 : (Math.random() - .5) * amp;
      pts.push(x.toFixed(1) + "," + y.toFixed(1));
    }
    el.setAttribute("points", pts.join(" "));
  };

  let t0 = 0, started = false, onScreen = true, raf = 0;
  let gap = GAP * scale, lastP = -1, lastT = 0, lastArc = 0, ignited = false;
  const next = gen.nextElementSibling;
  let met = false;

  function frame(now) {
    raf = 0;
    if (!onScreen) return;                                      // the observer below restarts the loop
    raf = requestAnimationFrame(frame);

    const p = span > 1 ? clamp((scrollY - top) / span) : 0;
    const close = smooth(clamp(p / .42));                     // scroll: the hands come together and touch
    if (Math.abs(p - lastP) > .0004) {
      lastP = p; gen.style.setProperty("--p", p.toFixed(4));
      if (next) gen.style.setProperty("--q", span > 1 ? clamp((innerHeight * .95 - next.getBoundingClientRect().top) / (innerHeight * .75)).toFixed(4) : "0");   // the next heading rises: the scene fades out under it
    }
    if (!started) return;

    const t = (now - t0) / 1000, dt = Math.min(.05, (now - lastT) / 1000 || .016); lastT = now;
    const live = smooth(clamp((t - T_FLOAT) / 1.4));            // the float eases in as the glide ends

    // Pointer pull: the closer the cursor is to the touch point, the more the hands lean in.
    let pull = 0;
    if (ptr) pull = clamp(1 - Math.hypot(ptr[0] - innerWidth / 2, ptr[1] - innerHeight * ty) / (innerWidth * .35));
    const free = (GAP + Math.sin(t * .9) * BREATHE * live - pull * PULL * live) * scale;
    const target = touching ? TOUCH_GAP : free + (TOUCH_GAP - free) * close;
    gap += (target - gap) * (1 - Math.pow(.92, dt * 60));
    hands.style.setProperty("--g", gap.toFixed(2) + "px");
    if (net) {
      net.update({ gap, ty, close, t: now / 1000, ptr });
      if (close >= 1 && !met) { met = true; net.pulse(); } else if (close < .9) met = false;   // the touch: a wave through the network
    }

    floats[0].style.transform = `translateY(${(Math.sin(t * .62) * 9 * live).toFixed(2)}px) rotate(${(Math.sin(t * .5 + 1) * 1.1 * live).toFixed(3)}deg)`;
    if (floats[1]) floats[1].style.transform = `translateY(${(Math.sin(t * .55 + 2) * 9 * live).toFixed(2)}px) rotate(${(Math.sin(t * .47) * 1.1 * live).toFixed(3)}deg)`;

    const sp = Math.max(clamp((70 - gap / scale) / 50) * clamp((t - T_SPARK) / .5), close);
    hands.style.setProperty("--sp", sp.toFixed(3));
    if (!ignited && t >= T_SPARK) { ignited = true; spark.classList.add("ignite"); }
    if (sp > 0 && now - lastArc > 90) { lastArc = now; drawArc(arcs[0], gap, 10 + sp * 18); drawArc(arcs[1], gap, 6 + sp * 10); }
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) kick(); }).observe(gen);
  kick();

  // The landscape stays behind the next section until the first path has faded in over it.
  const anchor = document.getElementById("paths");
  if (anchor) { const sky = () => gen.classList.toggle("sky-off", anchor.getBoundingClientRect().top < 0); addEventListener("scroll", sky, { passive: true }); sky(); }

  // Home atlas: the landscape stays still behind it; only the chart and its card fade in, then out.
  const atl = document.getElementById("atlas");
  if (atl) { const fade = () => { const r = atl.getBoundingClientRect(), vh = innerHeight;
      const a = clamp((vh - r.top) / (vh * .7)) * (1 - clamp((vh * .85 - r.bottom) / (vh * .6)));
      atl.style.setProperty("--a", a.toFixed(3)); };
    addEventListener("scroll", fade, { passive: true }); addEventListener("resize", fade, { passive: true }); fade(); }

  // The entrance starts when the three pictures of the scene are ready (or after a short wait).
  Promise.all([...stick.querySelectorAll("[data-sp]")].map((el) => settled(el, 1000))).then(() => {
    stick.classList.add("ready");
    railEnter();
    t0 = lastT = performance.now(); started = true;
    kick();
  });
}

/* ===== B. The machine: leader lines draw once the armour is on screen ===== */
function initMachine() {
  const m = document.getElementById("machine");
  if (!m) return;
  if (RM || !("IntersectionObserver" in window)) { m.classList.add("on"); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { m.classList.add("on"); io.disconnect(); } }, { threshold: .35 });
  io.observe(m);
}

/* ===== E. Path chapters =====
   Every chapter's title rises word by word the first time its scene is well on screen.
   Where scenes are pinned (the PIN query, same as in styles/home.css) each one also gets three
   numbers from the scroll position: --e while it slides in, --d while it is pinned and --x while
   the next one covers it. CSS turns them into the parallax, the fade and the dimming. */
function initChapters() {
  const secs = [...document.querySelectorAll(".pch")];
  if (!secs.length) return;
  if (RM || !("IntersectionObserver" in window)) { secs.forEach((s) => s.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.parentElement.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .42 });
  const stages = secs.map((s) => s.querySelector(".pch-stage"));
  stages.forEach((st) => io.observe(st));

  const pin = matchMedia(PIN), VARS = ["--e", "--d", "--x"];
  let geo = [], vh = 1, raf = 0, on = false;
  const measure = () => {
    on = pin.matches;
    if (!on) { secs.forEach((s) => { VARS.forEach((v) => s.style.removeProperty(v)); const sp = liveOf(s.querySelector(".sp")); if (sp && sp.setScroll) sp.setScroll(null); }); return; }
    vh = stages[0].offsetHeight || innerHeight;
    geo = secs.map((s) => { const r = s.getBoundingClientRect(); return [r.top + scrollY, r.height]; });
    frame();
  };
  function frame() {
    raf = 0;
    if (!on) return;
    const y = scrollY;
    secs.forEach((s, i) => {
      const [t, h] = geo[i];
      if (y < t - vh * 1.25 || y > t + h + vh * .25) { s.style.setProperty("--e", y > t ? "1" : "0"); s.classList.toggle("on", y > t); s.classList.toggle("gone", y > t + h - vh); return; }   // far away
      s.style.setProperty("--e", clamp((y - (t - vh)) / vh).toFixed(4));
      s.style.setProperty("--d", clamp((y - t) / Math.max(1, h - vh)).toFixed(4));
      s.style.setProperty("--x", clamp((y - (t + h - 2 * vh)) / vh).toFixed(4));
      s.classList.toggle("on", y > t - vh * .12);                    // its title is up near the middle: cut to its picture
      s.classList.toggle("gone", y > t + h - vh);
      const sp = liveOf(s.querySelector(".sp"));                         // the scene is pinned, so its picture is moved by how far you are through it
      if (sp && sp.setScroll) sp.setScroll(clamp((y - (t - vh)) / (h + vh)) * 2 - 1);
    });
  }
  addEventListener("scroll", () => { if (on && !raf) raf = requestAnimationFrame(frame); }, { passive: true });
  secs.forEach((s) => s.addEventListener("sp-settled", () => { if (on && !raf) raf = requestAnimationFrame(frame); }));   // a picture came live: give it the scroll position
  let rs = 0;
  const again = () => { cancelAnimationFrame(rs); rs = requestAnimationFrame(measure); };
  addEventListener("resize", again, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(again).observe(document.body);   // something above changed height
  measure();
}

/* ===== D. Story: the picture follows the chapter crossing the middle of the screen ===== */
function initStory() {
  const figs = [...document.querySelectorAll(".story-fig")];
  if (!figs.length || !("IntersectionObserver" in window)) return;
  let current = 0;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const i = +e.target.dataset.i;
    if (i === current) return;
    current = i;
    figs.forEach((f, k) => f.classList.toggle("on", k === i));
    const sp = liveOf(figs[i]);
    if (sp && sp.play) sp.play();
  }), { rootMargin: "-45% 0px -45% 0px" });
  document.querySelectorAll(".chapter").forEach((c) => io.observe(c));
}

/* ===== F. Demo ===== */
function initDemo() {
  const el = document.getElementById("demoU1");
  if (el) U1(el, { hue: el.dataset.hue });
}

export function initHome() {
  initGenesis();
  initMachine();
  initChapters();
  initStory();
  initDemo();
}
