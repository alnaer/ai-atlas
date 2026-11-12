// After `astro build`: rewrite the absolute /assets/ URLs Astro emits into relative
// ones, so the built site works from any folder (a sub-path, a file share, a preview).
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(process.cwd(), "dist");
const ASSETS = "assets";                       // build.assets in astro.config.mjs
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? (e.name === "island-art" ? [] : walk(p)) : [p];
});

let changed = 0;
for (const file of walk(DIST)) {
  const ext = path.extname(file);
  if (![".html", ".css", ".js"].includes(ext)) continue;
  const src = fs.readFileSync(file, "utf8");
  // Path from this file's folder back to dist/, e.g. "" for index.html, "../" for path/use.html.
  const up = path.relative(path.dirname(file), DIST).split(path.sep).filter(Boolean).map(() => "../").join("");
  // Inside assets/ the files sit next to each other, so "/assets/x" becomes "./x".
  const inAssets = path.dirname(file) === path.join(DIST, ASSETS);
  const prefix = inAssets ? "./" : up + ASSETS + "/";
  const out = src.replace(new RegExp(`(["'(=,\\s])/${ASSETS}/`, "g"), (_, lead) => lead + prefix);
  if (out !== src) { fs.writeFileSync(file, out); changed++; }
}
console.log(`relativize: ${changed} file(s) rewritten`);
