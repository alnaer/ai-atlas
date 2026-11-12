import { defineConfig } from "astro/config";

// Static site. Pages are written as plain files (atlas.html, path/understand.html)
// and tools/relativize.mjs makes every URL relative after the build, so the
// site runs from any folder or sub-path without configuration.
export default defineConfig({
  output: "static",
  // Bundled CSS, JS and fonts go to assets/ (some hosts reserve names that start with "_").
  build: { format: "file", assets: "assets" },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
