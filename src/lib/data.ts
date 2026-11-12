// Build-time access to the atlas content and the art manifests.
// Everything is read from public/island-art, the folder the browser also sees.
import fs from "node:fs";
import path from "node:path";

const ART_DIR = path.resolve(process.cwd(), "public/island-art");
const read = <T>(p: string): T => JSON.parse(fs.readFileSync(path.join(ART_DIR, p), "utf8")) as T;

/* ---------- content (data/atlas.json) ---------- */
export type Resource = [kind: string, title: string, by: string, detail: string, cost: string, url: string, pick: 0 | 1];
export interface Island {
  id: string; x: number; y: number; k: "c" | "p" | "s"; icon: string; short: string; title: string;
  hrs: [number, number]; learn: string; build: string; know: string[]; quiz?: [string, string][];
  pre?: [string, string][]; gap?: string; note?: string; reg?: string; res: Resource[];
}
export interface Path { name: string; icon: string; steps: string[]; blurb: string }
export interface PathInfo {
  build: string; fit: string; benefits: string[]; tradeoffs: string[]; roles: string[];
  demand: { t: string; s: string; u: string }[];
  effort: Record<"math" | "code" | "gpu" | "money", [number, string]>;
}
export interface Atlas {
  islands: Island[]; paths: Record<string, Path>; info: Record<string, PathInfo>;
  goals: { id: string; desc: string; feature?: boolean; tag?: string }[];
  specs: string[]; order: string[]; core: string[]; home: Record<string, string>;
  linkPairs: [string, string][]; icons: Record<string, string>; paces: number[];
  hue: Record<string, string>; pathHue: Record<string, string>;
  effortNames: Record<string, string>; stageName: Record<string, string>; show: Record<string, string>;
  reviewDays: number[]; tutorPrompt: string; copy: Record<string, any>;
}

/* ---------- art (islands.json, pages/pages.json) ---------- */
export interface Artwork { title: string; artist: string; date: string; page: string; medium?: string }
export interface ArtMotion { strength: number; focus?: number; focusHero?: number; focusCard?: number; glow: number; tint: number; attrs?: string }
export interface ArtEntry {
  id: string; hue: string; alt: string; why?: string; kind?: "flat" | "cutout"; role?: string;
  files: Record<string, string>; size: Record<string, [number, number]>;
  motion: ArtMotion; artwork: Artwork; credit: string;
}

export const atlas = read<Atlas>("data/atlas.json");
const islandArt = read<{ islands: ArtEntry[] }>("islands.json").islands;
const pageArt = read<{ pages: ArtEntry[] }>("pages/pages.json").pages;
export const demos = read<{ demos: { id: string; title: string; does: string; shows: string; build: string; status: string; needs?: string }[] }>("data/demos.json").demos;

export const isl: Record<string, Island> = Object.fromEntries(atlas.islands.map((i) => [i.id, i]));
export const artBy: Record<string, ArtEntry> = Object.fromEntries(islandArt.map((a) => [a.id, a]));
export const pageBy: Record<string, ArtEntry> = Object.fromEntries(pageArt.map((p) => [p.id, p]));
export const demoBy = Object.fromEntries(demos.map((d) => [d.id, d]));

/** Track colour of an island (by the first letter of its id). */
export const hueOf = (id: string) => atlas.hue[id[0]];
/** The path an island belongs to. */
export const trackOf = (id: string) => atlas.home[id[0]];
/** Total hours of a path as [min, max]. */
export const pathHours = (key: string): [number, number] =>
  atlas.paths[key].steps.reduce<[number, number]>((a, id) => [a[0] + isl[id].hrs[0], a[1] + isl[id].hrs[1]], [0, 0]);
/** Island number on the whole map, "01"… */
export const numOf = (id: string) => String(atlas.islands.findIndex((i) => i.id === id) + 1).padStart(2, "0");
export const resourceCount = atlas.islands.reduce((n, i) => n + i.res.length, 0);

/* ---------- art helpers ---------- */
/** Folder of an art entry inside island-art/ ("pages/" for page art). */
const baseOf = (e: ArtEntry) => (e.kind ? "pages/" : "");

export interface SpatialProps {
  src: string; depth: string; alt: string; hue: string; strength: number; focus: number; glow: number; tint: number;
  transparent: boolean; fit: "cover" | "contain"; width: number; height: number;
}
/**
 * Attributes for a <spatial-photo> built from a manifest entry.
 * variant: "hero" (16:9), "tall" (4:5 or 9:16), "card" (1:1) or "cut" (transparent cut-out).
 */
export function spatialOf(e: ArtEntry, variant?: "hero" | "tall" | "card" | "cut"): SpatialProps {
  const v = variant ?? (e.files.cut ? "cut" : "hero");
  const src = e.files[v], depth = e.files[v + "Depth"];
  if (!src || !depth) throw new Error(`Art entry ${e.id} has no "${v}" image`);
  const m = e.motion;
  const focus = v === "card" ? m.focusCard ?? m.focus ?? m.focusHero : m.focus ?? m.focusHero;
  const [width, height] = e.size[v];
  return {
    src: `island-art/${baseOf(e)}${src}`, depth: `island-art/${baseOf(e)}${depth}`, alt: e.alt, hue: e.hue,
    strength: m.strength, focus: focus ?? 0.5, glow: m.glow, tint: m.tint,
    transparent: v === "cut", fit: v === "cut" ? "contain" : "cover", width, height,
  };
}
/** Site-relative URL of one of an entry's files. */
export const artFile = (e: ArtEntry, variant: string) => `island-art/${baseOf(e)}${e.files[variant]}`;

/* ---------- words ---------- */
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
  "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
/** 31 → "thirty-one". Numbers in the design copy follow the data. */
export function numberWord(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  return String(n);
}
export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** 31 → "XXXI". */
export function roman(n: number): string {
  const map: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

/** The picture for a path. */
export const pathArtOf = (key: string): ArtEntry => pageBy["path-" + key];
