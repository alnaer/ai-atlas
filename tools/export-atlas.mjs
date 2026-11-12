// Export the content of the original AI Atlas map (source/Main.dc.html) into
// public/island-art/data/atlas.json, unchanged.
//
//   node tools/export-atlas.mjs
//
// The original map keeps its content in two places: constants in its logic
// script (islands, paths, path info …) and a few passages written straight into
// the template (how to study, how to use the map, how the numbers were made).
// This script reads both. It never rewrites text: every string in the output is
// copied from the source file.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "source/Main.dc.html");
const OUT = path.join(ROOT, "public/island-art/data/atlas.json");

const html = fs.readFileSync(SRC, "utf8");
const afterHelmet = html.split("</helmet>")[1];
const script = /<script[^>]*>([\s\S]*?)<\/script>/.exec(afterHelmet)[1];
const template = afterHelmet.replace(/<script[\s\S]*?<\/script>/g, "");

/* ---------- 1. constants from the logic script ---------- */
const NAMES = ["ICONS", "ISLANDS", "CORE", "PATHS", "INFO", "GOALS", "SPECS", "ORDER", "HOME", "VIEWS", "PACES",
  "EFFORT_NAMES", "LINK_PAIRS", "NEON", "PATH_HUE", "STAGE_NAME", "SHOW", "REVIEW_DAYS", "TUTOR_PROMPT", "STORE_KEY"];
const ctx = {
  __out: null, console, Math, JSON, Date, parseInt, setTimeout() {}, clearTimeout() {}, navigator: {}, document: {},
  window: { localStorage: { getItem: () => null, setItem() {} } },
};
vm.createContext(ctx);
vm.runInContext(`class DCLogic { constructor(p) { this.props = p; } }\n${script}\n;__out = {${NAMES.join(",")}};`, ctx);
const C = JSON.parse(JSON.stringify(ctx.__out));
for (const n of NAMES) if (C[n] === undefined) throw new Error(`Missing constant ${n} in the source script`);

/* ---------- 2. passages written into the template ---------- */
const ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };
const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, (e) => ENT[e] ?? e).replace(/\s+/g, " ").trim();
const one = (re, what) => { const m = re.exec(template); if (!m) throw new Error(`Could not find ${what} in the template`); return m; };
const all = (re) => [...template.matchAll(re)];
const sectionOf = (cls) => one(new RegExp(`<(section|footer) class="wrap ${cls}"[\\s\\S]*?</\\1>`), cls)[0];

const hero = sectionOf("hero");
const learn = sectionOf("learn-sec");
const cmp = sectionOf("cmp-sec");
const foot = sectionOf("foot");
const within = (block, re, what) => { const m = re.exec(block); if (!m) throw new Error(`Could not find ${what}`); return m; };
const link = (block) => { const m = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block); return { label: text(m[2]), url: m[1] }; };

const ledes = [...hero.matchAll(/<p class="lede">([\s\S]*?)<\/p>/g)].map((m) => text(m[1]));
const tip = within(hero, /<div class="tip">[\s\S]*?<p><b>([\s\S]*?)<\/b>([\s\S]*?)<\/p>/, "the start tip");
const market = within(cmp, /<p class="market">([\s\S]*?)<\/p>/, "the market note")[1];
const method = within(foot, /<p class="method"><b>([\s\S]*?)<\/b>([\s\S]*?)<\/p>/, "the method note");

const copy = {
  intro: {
    eyebrow: text(within(hero, /<p class="eyebrow">([\s\S]*?)<\/p>/, "hero eyebrow")[1]),
    title: text(within(hero, /<h1[^>]*>([\s\S]*?)<\/h1>/, "hero title")[1]),
    ledes,
    startTip: { title: text(tip[1]), text: text(tip[2]) },
    pickerTitle: text(within(hero, /<h2[^>]*class="picker-h[^"]*"[^>]*>([\s\S]*?)<\/h2>/, "picker title")[1]),
  },
  study: {
    eyebrow: text(within(learn, /<p class="eyebrow">([\s\S]*?)<\/p>/, "study eyebrow")[1]),
    title: text(within(learn, /<h2[^>]*>([\s\S]*?)<\/h2>/, "study title")[1]),
    intro: text(within(learn, /<p class="sec-p">([\s\S]*?)<\/p>/, "study intro")[1]),
    habits: [...learn.matchAll(/<li class="rule">[\s\S]*?<h3 class="rule-h">([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p>/g)].map((m) => ({ title: text(m[1]), text: text(m[2]) })),
    promptTitle: text(within(learn, /<p id="prompt-h" class="k">([\s\S]*?)<\/p>/, "prompt title")[1]),
    promptNote: text(within(learn, /<p class="prompt-note">([\s\S]*?)<\/p>/, "prompt note")[1]),
    studies: [...learn.matchAll(/<article class="study">([\s\S]*?)<\/article>/g)].map((m) => ({
      source: text(within(m[1], /<p class="study-src">([\s\S]*?)<\/p>/, "study source")[1]),
      figure: text(within(m[1], /<p class="study-big">([\s\S]*?)<\/p>/, "study figure")[1]),
      text: text(within(m[1], /<p class="study-d">([\s\S]*?)<\/p>/, "study text")[1]),
      link: link(m[1]),
    })),
  },
  compare: {
    eyebrow: text(within(cmp, /<p class="eyebrow">([\s\S]*?)<\/p>/, "compare eyebrow")[1]),
    title: text(within(cmp, /<h2[^>]*>([\s\S]*?)<\/h2>/, "compare title")[1]),
    market: { text: text(market.replace(/<a [\s\S]*?<\/a>/, "")), source: link(market) },
    columns: [...cmp.matchAll(/<span role="columnheader">([\s\S]*?)<\/span>/g)].map((m) => text(m[1])),
  },
  guide: {
    title: text(within(foot, /<h2[^>]*>([\s\S]*?)<\/h2>/, "guide title")[1]),
    tips: [...foot.matchAll(/<div class="tip-card">[\s\S]*?<p>([\s\S]*?)<\/p>/g)].map((m) => text(m[1])),
    method: { title: text(method[1]), text: text(method[2]) },
    fine: text(within(foot, /<p class="fine">([\s\S]*?)<\/p>/, "fine print")[1]),
  },
};
if (copy.study.habits.length !== 6 || copy.study.studies.length !== 2 || copy.guide.tips.length !== 3 || ledes.length !== 2)
  throw new Error("The template passages did not parse as expected");

/* ---------- 3. write atlas.json (same shape as the design folder's file, plus the newer fields) ---------- */
const atlas = {
  source: { file: "source/Main.dc.html", title: /<title>([^<]*)<\/title>/.exec(html)[1], exported: new Date().toISOString().slice(0, 10) },
  islands: C.ISLANDS,                 // id, x, y, k, icon, short, title, hrs, learn, build, know, quiz, pre, gap?, note?, reg?, res
  paths: C.PATHS,
  info: C.INFO,
  goals: C.GOALS,
  specs: C.SPECS,
  order: C.ORDER,
  core: C.CORE,
  home: C.HOME,                       // id letter → the path an island belongs to
  linkPairs: C.LINK_PAIRS,
  icons: C.ICONS,
  paces: C.PACES,
  views: C.VIEWS,
  hue: C.NEON,
  pathHue: C.PATH_HUE,
  effortNames: C.EFFORT_NAMES,
  stageName: C.STAGE_NAME,            // stage titles used when a route is grouped into stages
  show: C.SHOW,                       // "to show at the end" of a stage, by the stage's last island
  reviewDays: C.REVIEW_DAYS,          // spaced review: days until a finished island's question comes back
  tutorPrompt: C.TUTOR_PROMPT,
  originalStoreKey: C.STORE_KEY,
  copy,
};
fs.writeFileSync(OUT, JSON.stringify(atlas, null, 1) + "\n");

const res = atlas.islands.reduce((n, i) => n + i.res.length, 0);
const quiz = atlas.islands.reduce((n, i) => n + (i.quiz || []).length, 0);
console.log(`atlas.json written: ${atlas.islands.length} islands, ${Object.keys(atlas.paths).length} paths, ${res} resources, ${quiz} quiz questions, ${atlas.linkPairs.length} links.`);
