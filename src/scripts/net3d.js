// The machine's mind in the opening scene: a neon, cyberpunk brain made of a neural network,
// drawn live with three.js. A glowing axon runs from the touch point (where the woman's finger
// reaches) into the front of the brain. Signals fire along the connections, faster as the two
// come together; the touch sends a surge through the whole mind. A scan line sweeps through it.
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, BufferGeometry, BufferAttribute, LineSegments,
  LineBasicMaterial, Points, PointsMaterial, CanvasTexture, AdditiveBlending, Vector3, Color,
} from "three";

const VIOLET = new Color("#6A2CFF"), MAGENTA = new Color("#FF2BD6"), CYAN = new Color("#21F3FF"), WHITE = new Color("#FFFFFF");
const BRAIN_X = 3.25;                 // the brain's centre, in units to the right of the touch point
const N = 460;                        // neurons in the brain
const AXON = 7;                       // nodes along the axon, the first one on the touch point

function dot() {                      // soft round sprite for neurons and signals
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(.2, "rgba(255,255,255,.85)");
  r.addColorStop(.5, "rgba(255,255,255,.22)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

/**
 * @param {HTMLCanvasElement} canvas  fills the opening stage
 * @param {{ still?: boolean }} opts
 */
export function initNet(canvas, { still = false } = {}) {
  let renderer;
  try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" }); }
  catch { return null; }                               // no WebGL: the scene simply has no mind
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const scene = new Scene(), cam = new PerspectiveCamera(32, 1, .1, 100);
  cam.position.set(0, 0, 12);
  const world = new Group(); scene.add(world);           // sways about the touch point, so the axon tip stays on it
  const brain = new Group(); brain.position.x = BRAIN_X; world.add(brain);   // turns about its own front-to-back axis

  let seed = 11; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // ---- neurons: two hemispheres with folds, denser near the surface (the cortex)
  const pts = [];
  while (pts.length < N) {
    const u = rand() * 2 - 1, th = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    const dir = new Vector3(s * Math.cos(th), u, s * Math.sin(th));
    const side = dir.z >= 0 ? 1 : -1;
    const fold = 1 + .07 * Math.sin(dir.x * 9 + dir.y * 5) * Math.sin(dir.y * 7 - dir.z * 4);
    const depth = Math.pow(rand(), .35);                 // most neurons sit near the surface
    const p = new Vector3(dir.x * 1.6, dir.y * 1.12 + (dir.y < -.5 ? .25 * (dir.y + .5) : 0), Math.abs(dir.z) * .86 * side).multiplyScalar(fold * depth);
    p.z += side * .1;                                    // the gap between the hemispheres
    if (p.y < -.55 && p.x > .7) continue;                // carve the underside at the back
    pts.push(p);
  }
  const front = pts.reduce((m, p, i) => (p.x - Math.abs(p.y) - Math.abs(p.z) < pts[m].x - Math.abs(pts[m].y) - Math.abs(pts[m].z) ? i : m), 0);
  pts[front].set(-1.62, 0, 0);                          // where the axon enters, on the turning axis

  // ---- the axon: from the touch point (0,0,0) to the front of the brain, a gentle curve
  const axon = [];
  for (let i = 0; i < AXON; i++) {
    const t = i / (AXON - 1);
    axon.push(new Vector3(t * (BRAIN_X - 1.62), Math.sin(t * Math.PI) * .18, 0));
  }

  // all nodes: axon first (in world space), then neurons (in brain space)
  const nodes = [...axon, ...pts];
  const isAxon = (i) => i < AXON;
  const entry = AXON + front;

  // ---- connections: each neuron to its nearest neighbours, plus the axon chain
  const edges = [], seen = new Set();
  const add = (a, b) => { const k = a < b ? a + "," + b : b + "," + a; if (!seen.has(k)) { seen.add(k); edges.push([a, b]); } };
  for (let i = 0; i < AXON - 1; i++) add(i, i + 1);
  add(AXON - 1, entry);
  for (let i = 0; i < pts.length; i++) {
    const near = [];
    for (let j = 0; j < pts.length; j++) if (j !== i) near.push([pts[i].distanceToSquared(pts[j]), j]);
    near.sort((a, b) => a[0] - b[0]);
    for (let n = 0; n < 3; n++) if (near[n][0] < .5) add(AXON + i, AXON + near[n][1]);
  }
  const adj = nodes.map(() => []);
  edges.forEach(([a, b], e) => { adj[a].push(e); adj[b].push(e); });

  // geometry: axon lines live in `world`, brain lines in `brain`
  const mat = () => new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false });
  const split = (pred) => {
    const list = edges.map((e, i) => i).filter(pred);
    const pos = new Float32Array(list.length * 6), col = new Float32Array(list.length * 6);
    list.forEach((e, k) => {
      const [a, b] = edges[e];
      const A = isAxon(a) ? nodes[a] : nodes[a], B = nodes[b];
      if (isAxon(a) && !isAxon(b)) {                    // the last axon link: draw it in world space to the entry point
        A.toArray(pos, k * 6); new Vector3(BRAIN_X - 1.62, 0, 0).toArray(pos, k * 6 + 3);
      } else { A.toArray(pos, k * 6); B.toArray(pos, k * 6 + 3); }
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3)); g.setAttribute("color", new BufferAttribute(col, 3));
    return { list, g, col };
  };
  const axonLines = split((e) => isAxon(edges[e][0]) || isAxon(edges[e][1]));
  const brainLines = split((e) => !isAxon(edges[e][0]) && !isAxon(edges[e][1]));
  world.add(new LineSegments(axonLines.g, mat()));
  brain.add(new LineSegments(brainLines.g, mat()));

  const tex = dot();
  const pmat = (size) => new PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false });
  const mkPoints = (arr) => {
    const pos = new Float32Array(arr.length * 3), col = new Float32Array(arr.length * 3);
    arr.forEach((v, i) => v.toArray(pos, i * 3));
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3)); g.setAttribute("color", new BufferAttribute(col, 3));
    return { g, col };
  };
  const axonPts = mkPoints(axon), brainPts = mkPoints(pts);
  world.add(new Points(axonPts.g, pmat(.3)));
  brain.add(new Points(brainPts.g, pmat(.2)));

  // ---- signals: they walk from neuron to neuron, branching as they go
  const MAX = 420, sig = [];
  const sW = mkPoints(Array.from({ length: MAX }, () => new Vector3())), sB = mkPoints(Array.from({ length: MAX }, () => new Vector3()));
  world.add(new Points(sW.g, pmat(.26))); brain.add(new Points(sB.g, pmat(.2)));
  const eHeat = new Float32Array(edges.length), nHeat = new Float32Array(nodes.length);
  const hue = pts.map((p) => (p.z > 0 ? 1 : 0));         // one hemisphere leans magenta, the other cyan

  const fire = (from, prev, hops) => {
    if (sig.length >= MAX || hops > 16) return;
    const opts = adj[from].filter((e) => e !== prev);
    if (!opts.length) return;
    const e = opts[(rand() * opts.length) | 0];
    const [a, b] = edges[e];
    sig.push({ e, from, to: a === from ? b : a, s: 0, v: 1.8 + rand() * 1.6, hops });
  };
  let wave = 0, emit = 0;

  function size() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  size();

  let last = 0, W = 1, H = 1;
  function update({ gap, ty, close, t, ptr }) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w !== W || h !== H) { W = w; H = h; size(); }
    const dt = last ? Math.min(.05, t - last) : .016; last = t;

    // the axon tip sits on the touch point: shift the view so the world origin lands there
    const cx = w / 2 + gap / 2, cy = h * ty;
    cam.setViewOffset(w, h, w / 2 - cx, h / 2 - cy, w, h);
    const unitPx = h / (2 * 12 * Math.tan((32 * Math.PI) / 360));
    world.scale.setScalar((w * .4) / ((BRAIN_X + 1.6) * unitPx));

    const px = ptr ? ptr[0] / w - .5 : 0, py = ptr ? ptr[1] / h - .5 : 0;
    world.rotation.y = still ? -.3 : -.3 + Math.sin(t * .2) * .12 + px * .2;
    world.rotation.x = still ? .1 : py * .1;
    brain.rotation.x = still ? .2 : Math.sin(t * .15) * .35;

    // firing: a steady trickle into the axon and random sparks inside, a stream as the hands meet, a surge on touch
    if (!still) {
      emit += dt * (2 + close * 16 + (wave > 0 ? 45 : 0));
      while (emit > 1) { emit -= 1; fire(0, -1, 0); if (rand() < .6) fire(AXON + ((rand() * pts.length) | 0), -1, 4); }
      wave = Math.max(0, wave - dt);
    }
    for (let i = sig.length - 1; i >= 0; i--) {
      const g = sig[i]; g.s += dt * g.v * (1 + close * .8);
      eHeat[g.e] = Math.min(1, eHeat[g.e] + dt * 7);
      if (g.s >= 1) {
        nHeat[g.to] = 1; sig.splice(i, 1);
        if (rand() < .9) fire(g.to, g.e, g.hops + 1);
        if (rand() < .22 + close * .3 + (wave > 0 ? .4 : 0)) fire(g.to, g.e, g.hops + 1);
      }
    }
    let nw = 0, nb = 0;
    const sp = (arr, k, v, c) => { v.toArray(arr, k * 3); };
    for (const g of sig) {
      const A = nodes[g.from], B = nodes[g.to];
      const inAxon = isAxon(g.from) || isAxon(g.to);
      let x, y, z;
      if (inAxon) {
        const Bw = isAxon(g.to) ? B : new Vector3(BRAIN_X - 1.62, 0, 0), Aw = isAxon(g.from) ? A : new Vector3(BRAIN_X - 1.62, 0, 0);
        x = Aw.x + (Bw.x - Aw.x) * g.s; y = Aw.y + (Bw.y - Aw.y) * g.s; z = Aw.z + (Bw.z - Aw.z) * g.s;
        const pos = sW.g.attributes.position.array; pos[nw * 3] = x; pos[nw * 3 + 1] = y; pos[nw * 3 + 2] = z;
        WHITE.toArray(sW.col, nw * 3); nw++;
      } else {
        x = A.x + (B.x - A.x) * g.s; y = A.y + (B.y - A.y) * g.s; z = A.z + (B.z - A.z) * g.s;
        const pos = sB.g.attributes.position.array; pos[nb * 3] = x; pos[nb * 3 + 1] = y; pos[nb * 3 + 2] = z;
        (z > 0 ? MAGENTA : CYAN).toArray(sB.col, nb * 3); nb++;
      }
    }
    void sp;
    sW.g.setDrawRange(0, nw); sB.g.setDrawRange(0, nb);
    for (const s of [sW, sB]) s.g.attributes.position.needsUpdate = s.g.attributes.color.needsUpdate = true;

    // a scan line sweeps up through the brain
    const scan = still ? 0 : ((t * .45) % 2.6) - 1.3;
    const decayE = Math.pow(.03, dt), decayN = Math.pow(.04, dt);
    const paint = (L) => L.list.forEach((e, k) => {
      const [a, b] = edges[e], m = eHeat[e];
      const ya = isAxon(a) ? 0 : nodes[a].y, za = isAxon(a) ? 0 : nodes[a].z;
      const sc = isAxon(a) ? 0 : Math.max(0, 1 - Math.abs(ya - scan) * 5) * .5;
      const hot = za > 0 ? MAGENTA : CYAN;
      const base = .22 + close * .15 + sc;
      for (let j = 0; j < 2; j++) {
        L.col[k * 6 + j * 3] = VIOLET.r * base + hot.r * m;
        L.col[k * 6 + j * 3 + 1] = VIOLET.g * base + hot.g * m;
        L.col[k * 6 + j * 3 + 2] = VIOLET.b * base + hot.b * m;
      }
    });
    paint(axonLines); paint(brainLines);
    for (let e = 0; e < edges.length; e++) eHeat[e] *= decayE;
    axonLines.g.attributes.color.needsUpdate = brainLines.g.attributes.color.needsUpdate = true;

    axon.forEach((_, i) => {
      const k = (i === 0 ? 1 + close * .8 : .6) + nHeat[i];
      axonPts.col[i * 3] = (CYAN.r * .6 + .4) * k; axonPts.col[i * 3 + 1] = (CYAN.g * .6 + .4) * k; axonPts.col[i * 3 + 2] = (CYAN.b * .6 + .4) * k;
    });
    pts.forEach((p, i) => {
      const n = AXON + i, sc = Math.max(0, 1 - Math.abs(p.y - scan) * 5);
      const k = .38 + sc * .7 + nHeat[n] * 1.2, c = hue[i] ? MAGENTA : CYAN;
      brainPts.col[i * 3] = c.r * k; brainPts.col[i * 3 + 1] = c.g * k; brainPts.col[i * 3 + 2] = c.b * k;
    });
    for (let i = 0; i < nodes.length; i++) nHeat[i] *= decayN;
    axonPts.g.attributes.color.needsUpdate = brainPts.g.attributes.color.needsUpdate = true;

    renderer.render(scene, cam);
  }

  return { update, size, pulse() { wave = 1.4; } };
}
