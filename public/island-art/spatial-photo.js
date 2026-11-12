/*!
 * <spatial-photo> — turns a flat painting + depth map into a "spatial photo"
 * (2.5D parallax), for the AI Atlas island library.
 *
 * Zero dependencies. Plain WebGL 1. Works in plain HTML, React, Next.js, Vue.
 *
 *   <script type="module" src="/island-art/spatial-photo.js"></script>
 *   <spatial-photo
 *       src="/island-art/images/S0-hero.webp"
 *       depth="/island-art/depth/S0-hero-depth.webp"
 *       alt="Rembrandt's Aristotle resting his hand on a bust of Homer"
 *       hue="#00E5FF" strength="1" focus="0.55" glow="0.35" tint="0" intro>
 *   </spatial-photo>
 *
 * Attributes (all optional except src + depth):
 *   src, depth   image and its depth map (white = near, black = far)
 *   alt          accessible description (also used for the fallback <img>)
 *   hue          neon colour for the rim glow / tint (use the island's track colour)
 *   strength     how far the layers move. 0 = flat, 1 = default, 2 = a lot
 *   focus        depth (0..1) that stays still. Set it to the subject's depth so
 *                the subject is anchored and the background swings around it
 *   glow         0..1 neon rim light along depth edges (cyberpunk touch)
 *   tint         0..1 duotone towards the hue (0 = original painting colours)
 *   mode         "pointer" (default: mouse + idle drift + scroll), "scroll", "idle", "static"
 *   intro        play the depth "reveal" when it first scrolls into view
 *   transparent  the image has an alpha channel (cutouts of armour, automata…):
 *                the element background stays see-through and the neon rim
 *                follows the silhouette. Use with fit="contain".
 *   fit          "cover" (default) or "contain"
 *   bg           page background colour behind the image (default #0B0810)
 *
 * Methods:   el.play()  re-run the reveal (e.g. when an island is selected)
 *            el.setTilt(x, y)  drive the camera yourself (-1..1), e.g. from the map camera
 * Events:    "spatial-ready", "spatial-fallback" (no WebGL → shows the plain image)
 *
 * Respects prefers-reduced-motion (renders still, no drift, no reveal).
 * Pauses when off screen. Caps pixel ratio at 2.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; vUv.y = 1.0 - vUv.y; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D uImg, uDepth;
uniform vec2  uOff;      // camera offset (uv units)
uniform vec2  uCover;    // object-fit: cover scale
uniform vec2  uTexel;    // 1 / depth size
uniform float uFocus, uZoom, uGlow, uTint, uReveal, uTime, uAlpha, uContain;
uniform vec3  uHue, uBg;
varying vec2 vUv;

float D(vec2 p){ return texture2D(uDepth, p).r; }

void main(){
  vec2 uv = (vUv - 0.5) * uCover / uZoom + 0.5;

  // iterative parallax: find the pixel that lands here after displacement
  vec2 p = uv;
  for (int i = 0; i < 5; i++) { p = uv - uOff * (D(p) - uFocus); }
  float inside = (uContain > 0.5 && (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)) ? 0.0 : 1.0;
  p = clamp(p, 0.001, 0.999);

  vec4 tx = texture2D(uImg, p);
  vec3 c = tx.rgb;
  float a = mix(1.0, tx.a, uAlpha) * inside;
  float d = D(p);

  // neon rim light on depth discontinuities, brighter on the near side
  float e = abs(D(p + vec2(uTexel.x * 2.0, 0.0)) - D(p - vec2(uTexel.x * 2.0, 0.0)))
          + abs(D(p + vec2(0.0, uTexel.y * 2.0)) - D(p - vec2(0.0, uTexel.y * 2.0)));
  float rim = smoothstep(0.02, 0.18, e) * d;
  float sweep = 0.75 + 0.25 * sin(uTime * 0.9 + p.x * 6.0 + p.y * 3.0);
  c += uHue * rim * uGlow * 0.9 * sweep;

  // optional duotone towards the track hue
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, mix(uBg, uHue, l), uTint);

  // reveal: near things arrive first, far things last, out of the map's ink colour
  float m = smoothstep(0.0, 0.35, uReveal * 1.4 - (1.0 - d) * 0.9);
  vec3 edgeGlow = uHue * (1.0 - m) * m * 1.6 * uGlow;   // glowing front edge while revealing
  if (uAlpha > 0.5) {
    // cutout: neon halo just outside the silhouette; premultiplied output
    float halo = 0.0;
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.785398;
      halo += texture2D(uImg, p + vec2(cos(ang), sin(ang)) * uTexel * 5.0).a;
    }
    halo = clamp(halo / 8.0 - a, 0.0, 1.0) * uGlow * 1.4 * inside;
    a *= m;
    gl_FragColor = vec4(c * a + uHue * halo * m + edgeGlow * a, clamp(a + halo * m, 0.0, 1.0));
  } else {
    c = mix(uBg, c, m) + edgeGlow;
    gl_FragColor = vec4(c, 1.0) * inside + vec4(uBg, 1.0) * (1.0 - inside);
  }
}`;

const RM = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)");
const hex = (h, f) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((h || "").trim());
  if (!m) return f;
  const n = parseInt(m[1], 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
};
const loadImg = (src) => new Promise((ok, bad) => {
  const i = new Image(); i.crossOrigin = "anonymous"; i.decoding = "async";
  i.onload = () => ok(i); i.onerror = bad; i.src = src;
});

class SpatialPhoto extends HTMLElement {
  static get observedAttributes() { return ["src", "depth", "alt", "hue", "strength", "focus", "glow", "tint", "mode", "fit", "transparent", "bg"]; }

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      :host{display:block;position:relative;overflow:hidden;aspect-ratio:16/9;background:#0B0810;contain:content}
      :host([transparent]){background:transparent}
      :host([fit=contain]) img{object-fit:contain}
      canvas,img{position:absolute;inset:0;width:100%;height:100%;display:block}
      img{object-fit:cover;transition:opacity .4s}
      :host([data-live]) img{opacity:0}
    </style><img part="fallback" alt=""><canvas part="canvas" aria-hidden="true"></canvas>`;
    this._img = root.querySelector("img");
    this._cv = root.querySelector("canvas");
    this._cur = [0, 0]; this._tgt = [0, 0]; this._ext = null;
    this._reveal = 1; this._revealT0 = 0; this._visible = false; this._t0 = performance.now();
    this._onMove = this._onMove.bind(this); this._onLeave = () => { this._hover = false; };
    this._frame = this._frame.bind(this);
  }

  connectedCallback() {
    this._img.alt = this.getAttribute("alt") || "";
    this.setAttribute("role", "img");
    this.setAttribute("aria-label", this.getAttribute("alt") || "");
    this.addEventListener("pointermove", this._onMove);
    this.addEventListener("pointerleave", this._onLeave);
    this._io = new IntersectionObserver(([en]) => {
      this._visible = en.isIntersecting;
      if (this._visible && this.hasAttribute("intro") && !this._introDone) { this._introDone = true; this.play(); }
      if (this._visible) this._kick();
    }, { rootMargin: "100px" });
    this._io.observe(this);
    this._ro = new ResizeObserver(() => { this._resize(); this._kick(); });
    this._ro.observe(this);
    this._load();
  }

  disconnectedCallback() {
    this._io && this._io.disconnect(); this._ro && this._ro.disconnect();
    cancelAnimationFrame(this._raf); this._raf = 0;
    this.removeEventListener("pointermove", this._onMove);
    this.removeEventListener("pointerleave", this._onLeave);
  }

  attributeChangedCallback(n) {
    if (!this.isConnected) return;
    if (n === "src" || n === "depth") this._load();
    if (n === "fit") this._resize();
    if (n === "alt") { this._img.alt = this.getAttribute("alt") || ""; this.setAttribute("aria-label", this._img.alt); }
    this._kick();
  }

  play() {
    if (RM && RM.matches) { this._reveal = 1; this._kick(); return; }
    this._reveal = 0; this._revealT0 = performance.now(); this._kick();
  }

  setTilt(x, y) { this._ext = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))]; this._kick(); }

  _num(n, f) { const v = parseFloat(this.getAttribute(n)); return Number.isFinite(v) ? v : f; }

  _onMove(e) {
    const r = this.getBoundingClientRect();
    this._hover = true;
    this._ptr = [((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1];
    this._kick();
  }

  async _load() {
    const src = this.getAttribute("src"), dep = this.getAttribute("depth");
    if (!src) return;
    this._img.src = src;
    const token = (this._token = {});
    try {
      if (!dep) throw new Error("no depth map");
      const [a, b] = await Promise.all([loadImg(src), loadImg(dep)]);
      if (token !== this._token) return;
      this._setup(a, b);
      this.toggleAttribute("data-live", true);
      this.dispatchEvent(new CustomEvent("spatial-ready", { bubbles: true }));
      this._kick();
    } catch (err) {
      this.removeAttribute("data-live");
      this.dispatchEvent(new CustomEvent("spatial-fallback", { bubbles: true, detail: String(err) }));
    }
  }

  _setup(img, dep) {
    let gl = this._gl;
    if (!gl) {
      const alpha = this.hasAttribute("transparent");
      gl = this._cv.getContext("webgl", { antialias: false, premultipliedAlpha: true, alpha });
      if (!gl) throw new Error("WebGL unavailable");
      this._cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this._gl = null; this.removeAttribute("data-live"); });
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
        if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(pr); gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this._u = {}; ["uImg", "uDepth", "uOff", "uCover", "uTexel", "uFocus", "uZoom", "uGlow", "uTint", "uReveal", "uTime", "uHue", "uBg", "uAlpha", "uContain"]
        .forEach((n) => (this._u[n] = gl.getUniformLocation(pr, n)));
      this._tex = [gl.createTexture(), gl.createTexture()];
      this._gl = gl;
    }
    [img, dep].forEach((im, i) => {
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this._tex[i]);
      const fmt = i === 0 && this.hasAttribute("transparent") ? gl.RGBA : gl.RGB;
      gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
    gl.uniform1i(this._u.uImg, 0); gl.uniform1i(this._u.uDepth, 1);
    gl.uniform2f(this._u.uTexel, 1 / dep.naturalWidth, 1 / dep.naturalHeight);
    this._ar = img.naturalWidth / img.naturalHeight;
    this._resize();
  }

  _resize() {
    if (!this._gl) return;
    const r = this.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    this._cv.width = Math.max(1, Math.round(r.width * dpr)); this._cv.height = Math.max(1, Math.round(r.height * dpr));
    this._gl.viewport(0, 0, this._cv.width, this._cv.height);
    const box = r.width / Math.max(1, r.height), ar = this._ar || box;
    const contain = this.getAttribute("fit") === "contain";
    this._cover = contain ? (box > ar ? [box / ar, 1] : [1, ar / box])      // object-fit: contain
                          : (box > ar ? [1, ar / box] : [box / ar, 1]);     // object-fit: cover
  }

  _kick() { if (!this._raf && this._gl && this._visible) this._raf = requestAnimationFrame(this._frame); }

  _frame(now) {
    this._raf = 0;
    const gl = this._gl; if (!gl || !this._visible) return;
    const still = (RM && RM.matches) || this.getAttribute("mode") === "static";
    const mode = this.getAttribute("mode") || "pointer";
    const t = (now - this._t0) / 1000;

    // target camera position (-1..1)
    let tx = 0, ty = 0;
    if (!still) {
      if (this._ext) [tx, ty] = this._ext;
      else if (mode === "pointer" && this._hover && this._ptr) [tx, ty] = this._ptr;
      else if (mode !== "scroll") { tx = Math.sin(t * 0.35) * 0.55; ty = Math.sin(t * 0.23 + 1.3) * 0.35; }   // idle drift
      if (mode !== "idle") {   // scroll adds vertical parallax
        const r = this.getBoundingClientRect(), vh = window.innerHeight || 1;
        ty += Math.max(-1, Math.min(1, ((r.top + r.height / 2) / vh - 0.5) * 1.6)) * 0.6;
      }
    }
    this._tgt = [tx, ty];
    this._cur[0] += (this._tgt[0] - this._cur[0]) * 0.07;
    this._cur[1] += (this._tgt[1] - this._cur[1]) * 0.07;

    if (this._reveal < 1) this._reveal = Math.min(1, (now - this._revealT0) / 1600);
    const rv = 1 - Math.pow(1 - this._reveal, 3);

    const s = this._num("strength", 1) * 0.028;
    const over = this.getAttribute("fit") === "contain" ? 0.2 : 1.25;
    const zoom = 1 + Math.abs(s) * over + (1 - rv) * 0.06;     // over-scan hides edge stretching; slight dolly on reveal
    const u = this._u, hue = hex(this.getAttribute("hue"), [0, 0.9, 1]);
    gl.uniform2f(u.uOff, this._cur[0] * s, this._cur[1] * s * 0.7);
    gl.uniform2f(u.uCover, this._cover[0], this._cover[1]);
    gl.uniform1f(u.uFocus, this._num("focus", 0.5));
    gl.uniform1f(u.uZoom, zoom);
    gl.uniform1f(u.uGlow, still ? this._num("glow", 0.35) * 0.6 : this._num("glow", 0.35));
    gl.uniform1f(u.uTint, this._num("tint", 0));
    gl.uniform1f(u.uReveal, still ? 1 : rv);
    gl.uniform1f(u.uTime, still ? 0 : t);
    gl.uniform3fv(u.uHue, hue);
    gl.uniform3fv(u.uBg, hex(this.getAttribute("bg"), [0.043, 0.031, 0.063]));   // page background (default #0B0810)
    gl.uniform1f(u.uAlpha, this.hasAttribute("transparent") ? 1 : 0);
    gl.uniform1f(u.uContain, this.getAttribute("fit") === "contain" ? 1 : 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const moving = Math.abs(this._tgt[0] - this._cur[0]) + Math.abs(this._tgt[1] - this._cur[1]) > 0.0005;
    if (!still || moving || this._reveal < 1) this._kick();
  }
}

if (!customElements.get("spatial-photo")) customElements.define("spatial-photo", SpatialPhoto);
export default SpatialPhoto;
