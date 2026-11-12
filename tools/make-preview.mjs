// Builds a shareable preview of the pages that exist so far, for review while the
// site is being rebuilt page by page. It turns dist/index.html into a body-only page
// (preview hosts add their own <html>/<head>) and lists every file that page needs.
// Links to pages that are not built yet show a short note instead of a broken page.
//   node tools/make-preview.mjs        → dist/preview.html + dist/preview-files.json
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(process.cwd(), "dist");
const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const head = /<head>([\s\S]*?)<\/head>/.exec(html)[1];
const bodyTag = /<body([^>]*)>/.exec(html);
const body = html.slice(bodyTag.index + bodyTag[0].length, html.lastIndexOf("</body>"));
const bodyClass = (/class="([^"]*)"/.exec(bodyTag[1]) || [])[1] || "";

// Keep styles, stylesheet and preload links and inline scripts from <head>; drop what the host provides.
const keep = [...head.matchAll(/<style[\s\S]*?<\/style>|<link[^>]*>|<script[\s\S]*?<\/script>/g)].map((m) => m[0]).join("\n");

// Pages present in this preview; grows as pages are built. Their links open normally, others show a note.
const built = new Set(["index.html", "atlas.html", ...fs.readdirSync(path.join(DIST, "path")).filter((f) => f.endsWith(".html")).map((f) => "path/" + f),
  ...fs.readdirSync(path.join(DIST, "island")).filter((f) => f.endsWith(".html")).map((f) => "island/" + f)]);
const guard = `<style>
.pv-note{position:fixed;left:50%;bottom:max(20px,env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);z-index:300;max-width:min(92vw,520px);padding:12px 18px;border-radius:12px;
  background:var(--panel-2);border:1px solid var(--line-2);color:var(--ivory);font:500 15px/1.45 var(--sans);box-shadow:0 20px 60px -20px #000;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s}
.pv-note.on{opacity:1;transform:translate(-50%,0)}
@media (max-width:1179px),(max-height:619px){.has-rail .pv-note{bottom:calc(max(20px,env(safe-area-inset-bottom,0px)) + var(--row,48px) + 6px)}}   /* clear of the index bar */
</style>
<div class="pv-note" role="status" aria-live="polite"></div>
<script>
(function () {
  var built = ${JSON.stringify([...built])}, note = document.querySelector(".pv-note"), timer;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var href = a.getAttribute("href");
    if (href.charAt(0) === "#" || /^[a-z]+:/i.test(href)) return;         // same-page and outside links work as usual
    var file = href.split("#")[0].replace(/^(\\.\\.\\/)+/, "");
    if (built.indexOf(file) >= 0) return;                                   // a built page: let the browser open it
    e.preventDefault();
    var copy = a.cloneNode(true); copy.querySelectorAll("[aria-hidden=true],small,svg").forEach(function (n) { n.remove(); });
    var name = a.getAttribute("aria-label") || (copy.querySelector("h3") || copy).textContent.trim().replace(/\\s+/g, " ").slice(0, 40);
    note.textContent = "“" + name + "” opens a page that is not built yet. It comes next.";
    note.classList.add("on"); clearTimeout(timer); timer = setTimeout(function () { note.classList.remove("on"); }, 3800);
  }, true);
})();
</script>`;

const page = `<title>AI Atlas</title>
<meta name="claude:viewport-fit-sides" content="cover">
${keep}
<style>:root{color-scheme:dark}</style><!-- preview hosts set a light scheme on :root; the site itself sets dark on html -->
<script>document.documentElement.lang = "en";${bodyClass ? ` document.body.className = ${JSON.stringify(bodyClass)};` : ""}</script>
${body}
${guard}
`;
fs.writeFileSync(path.join(DIST, "preview.html"), page);

// The other built pages are full documents: give them the same link guard, once.
const others = [...built].filter((f) => f !== "index.html");
for (const f of others) {
  const abs = path.join(DIST, f);
  let doc = fs.readFileSync(abs, "utf8");
  if (!doc.includes('class="pv-note"')) { doc = doc.replace("</body>", guard + "\n</body>"); fs.writeFileSync(abs, doc); }
}

// Every local file the page can ask for: URLs in the HTML (including the JSON in data-attrs), everything in assets/.
const files = new Set(fs.readdirSync(path.join(DIST, "assets")).map((f) => "assets/" + f));
for (const f of others) files.add(f);
for (const src of [html, ...others.map((f) => fs.readFileSync(path.join(DIST, f), "utf8"))])
  for (const m of src.replace(/&quot;/g, '"').matchAll(/["'(=,\s](?:\.\.\/)*((?:island-art|thumbs)\/[^"'()\s,]+\.(?:webp|png|jpe?g|svg|json|js))/g)) files.add(m[1]);
const TYPES = { ".html": "text/html", ".woff2": "font/woff2", ".webp": "image/webp", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const map = {}; let bytes = 0;
for (const f of [...files].sort()) {
  const abs = path.join(DIST, f);
  if (!fs.existsSync(abs)) { console.warn("missing:", f); continue; }
  bytes += fs.statSync(abs).size;
  map[f] = { from: f, contentType: TYPES[path.extname(f)] || "application/octet-stream" };
}
fs.writeFileSync(path.join(DIST, "preview-files.json"), JSON.stringify(map));
console.log(`preview: ${Object.keys(map).length} files, ${(bytes / 1048576).toFixed(1)} MB, page ${(page.length / 1024).toFixed(0)} KB`);
