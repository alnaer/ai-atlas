// Shared ink shapes.

/** A ragged, dry-brush edge: the leading edge of a chapter as it slides over the one before. */
export function brushEdge(seed: number, w = 1200, h = 64): string {
  let s = seed >>> 0;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  let x = 0, d = `M0 ${h}L0 ${(h * 0.6).toFixed(1)}`;
  while (x < w) {
    x = Math.min(w, x + 3 + rnd() * 20);
    const base = h * 0.56 + Math.sin(x / 95 + seed) * h * 0.17 + Math.sin(x / 21 + seed * 2.3) * h * 0.07;
    const y = base + (rnd() < 0.24 ? -rnd() * h * 0.5 : rnd() * h * 0.12);
    d += `L${x.toFixed(1)} ${Math.max(1, Math.min(h - 1, y)).toFixed(1)}`;
  }
  return d + `L${w} ${h}Z`;
}
