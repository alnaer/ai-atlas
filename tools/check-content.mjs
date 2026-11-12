// Checks that the built pages carry the atlas content word for word.
// Run after `npm run build`. Grows with the site: each page adds the strings it must show.
import fs from "node:fs";
import path from "node:path";

const atlas = JSON.parse(fs.readFileSync("public/island-art/data/atlas.json", "utf8"));
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const textOf = (file) => fs.readFileSync(path.join("dist", file), "utf8")
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m).replace(/\s+/g, " ");

const resources = atlas.islands.reduce((n, i) => n + i.res.length, 0);
const pages = {
  "index.html": [
    ...atlas.order.flatMap((k) => [atlas.paths[k].name, atlas.paths[k].blurb, `${atlas.paths[k].steps.length} islands`]),
    ` ${atlas.islands.length} `, ` ${atlas.order.length} `, ` ${resources} `,
  ],
};

let missing = 0, checked = 0;
for (const [file, strings] of Object.entries(pages)) {
  if (!fs.existsSync(path.join("dist", file))) { console.log(`skip ${file} (not built)`); continue; }
  const text = textOf(file);
  for (const s of strings) { checked++; if (!text.includes(s)) { missing++; console.log(`MISSING in ${file}: ${s.slice(0, 90)}`); } }
}
console.log(`${checked} strings checked, ${missing} missing`);
process.exit(missing ? 1 : 0);
