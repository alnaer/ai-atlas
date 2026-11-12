# AI Atlas: instructions for the coding agent

Start here. This folder is everything you need to build the AI Atlas website in
its "Renaissance machine age" style: the art library, the 3D "spatial photo"
component, all the content data, a working reference prototype of every key
page, and the specs.

Read in this order:
1. **AGENT.md** (this file): what's here, rules, build order, acceptance checklist.
2. **DESIGN.md**: design system, motion system and a spec for every page.
3. **DEMOS.md**: one interactive demo per island.
4. **IMAGE-PROMPTS.md**: optional AI-generated art in the same style.

Then open the prototype: serve this folder (`python3 -m http.server`) and visit
`/site/index.html`. `/library.html` is the art library and tuning tool.

---

## Rule zero: what may change and what may not

- **Content and data are fixed.** Islands, their ids and order, titles, hours,
  what you learn, what you build, the "you can explain" lists, resources,
  links between islands, goals and paths, path info (benefits, trade-offs, effort,
  roles, sourced job stats), paces and the tutor prompt all come from
  `data/atlas.json`, exported unchanged from the original map (`Main.dc.html`).
  Don't rewrite, reorder or invent content. If something looks wrong, flag it to
  the person.
- **The look and motion of the map are being redesigned** (the person asked for
  this). Follow DESIGN.md §4.2. Keep the track colours (the original `NEON` table).
- **Only use the art in this folder** (public-domain CC0 from The Met, credited
  in the manifests) or images the person generates from IMAGE-PROMPTS.md. No
  stock photos, no copyrighted art, nothing from Shopify's Editions site. We share
  an *idea* with it (Renaissance art remix), never its assets or layout details.
- No nudity, no real living people, no brand logos in art.

---

## What's in the folder

```
island-art/
  AGENT.md  DESIGN.md  DEMOS.md  IMAGE-PROMPTS.md
  index.html               redirects to site/index.html
  library.html             art library preview + tuning tool (sliders → copy tag)
  spatial-photo.js         <spatial-photo> component (WebGL 1, zero deps, ~14 KB)
  islands.json             29 island paintings: files, alt, why, motion, credits, licence
  images/ depth/           island art: <ID>-hero (1600×900), <ID>-card (800×800) + depth maps
  pages/
    pages.json             19 page images (opening scene, home, map, progress, 10 path heroes)
    images/ depth/         flat images: -hero (16:9) and -tall (4:5 or 9:16)
                           cutouts: -cut.webp with transparency (+ depth)
  data/
    atlas.json             ALL map content (islands, paths, info, goals, links, hues, tutor prompt)
    demos.json             29 demo specs (status live/spec)
  site/                    reference prototype (plain HTML + ES modules, no build step)
    site.css               design tokens + shared components
    site.js                data loading, nav/footer, Lenis smooth scroll, reveals, helpers
    demos.js               live demos: S2, S3, U1
    index.html             Home (opening scene, machine diagram, story, paths, demo, teaser)
    atlas.html             the redesigned map
    path.html#<path>       path template (all 10 paths)
    island.html#<ID>       island template (all 29 islands)
  tools/make-depth.py      depth map for any new image
```

### The data, in short

`data/atlas.json`:
- `islands[]`: `{ id, x, y, k ("c" core / "p" path / "s" specialisation), icon, short, title, hrs:[min,max], learn, build, know:[…], res:[[type, title, by, detail, cost, url, pick(1/0)]], note? }`
- `paths{key}`: `{ name, icon, steps:[ids], blurb }` for `understand use train build vision language generative rl mlops safety`
- `info{key}`: `{ build, fit, benefits[], tradeoffs[], roles[], demand:[{t, s, u}], effort:{math|code|gpu|money:[0-5, note]} }`
- `goals[]`, `specs[]`, `order[]`, `linkPairs[]`, `paces` (5, 10, 20), `views`, `icons` (SVG path data), `hue` (by id letter), `pathHue` (by path), `tutorPrompt`

`islands.json` (island art) and `pages/pages.json` (page art) entries:
`{ id, files, size, alt, why, hue, motion:{strength, focus|focusHero/focusCard, glow, tint, attrs?}, artwork:{title, artist, date, medium, page, originalImage, …}, license, credit }`.
Page images also have `kind` (`flat` | `cutout`) and `role`.

Page image ids: `hero-sky`, `hero-hand-human`, `hero-hand-machine` (opening scene) ·
`home-hero` (armour) · `home-learn` · `home-build` · `home-grow` · `map` · `progress` ·
`path-<key>` for each of the 10 paths.

---

## The `<spatial-photo>` component

```html
<script type="module" src="/island-art/spatial-photo.js"></script>

<!-- opaque painting -->
<spatial-photo src="…/images/S2-hero.webp" depth="…/depth/S2-hero-depth.webp"
  alt="…" hue="#00E5FF" strength="0.8" focus="0.44" glow="0.3" tint="0.18" intro></spatial-photo>

<!-- transparent cutout (armour, automaton, hands) -->
<spatial-photo src="…/pages/images/home-hero-cut.webp" depth="…/pages/depth/home-hero-cut-depth.webp"
  alt="…" hue="#D9B26A" strength="1" focus="0.6" glow="0.6" transparent fit="contain" bg="#0C0A0D" intro></spatial-photo>
```

| attribute | meaning |
|---|---|
| `src`, `depth` | image + depth map (white = near) |
| `alt` | always from the manifest |
| `hue` | neon colour of the rim light / halo / tint |
| `strength` | parallax amount (0 flat, 1 default, 2 strong) |
| `focus` | depth that stays still (use the manifest value) |
| `glow` | neon rim (0–1) |
| `tint` | duotone towards `hue` (0 = original colours) |
| `mode` | `pointer` (default), `scroll`, `idle`, `static` |
| `transparent` | image has alpha; halo follows the silhouette |
| `fit` | `cover` (default) or `contain` |
| `bg` | page colour behind it (default `#0C0A0D`) |
| `intro` | near-to-far reveal on first view |

Methods: `play()` re-runs the reveal; `setTilt(x, y)` drives the camera (−1…1).
Events: `spatial-ready`, `spatial-fallback` (shows the plain image if WebGL fails).
It pauses off-screen, caps pixel ratio at 2 and respects reduced motion.
`site/site.js → spatial(entry, extraAttrs)` builds the tag from any manifest entry.

React / Next.js: `useEffect(() => { import("/island-art/spatial-photo.js") }, [])`
once on the client, then render `<spatial-photo …/>` (string attributes; boolean
attributes as `intro=""`). Add a TypeScript JSX declaration for the tag.

**Limit:** browsers allow about 16 WebGL contexts. Max 6 live per page (see DESIGN.md §6).
Use plain `<img>` everywhere else.

---

## Build order (recommended)

1. **Set up** the app (Next.js App Router or Astro both work; the prototype is plain
   HTML so either can copy it). Copy this folder to `public/island-art/`.
   Port `site.css` tokens into your styling system (CSS variables or Tailwind theme).
2. **Fonts + tokens + nav/footer + reveal + Lenis** (from `site.css` / `site.js`).
3. **Home**: port `site/index.html` section by section, starting with the opening scene
   (DESIGN.md §4.1 has the full timeline and maths). Check it at 1440×900, 1024×768, 390×844.
4. **Atlas map** (`site/atlas.html`, DESIGN.md §4.2). Keep the progress store key
   `ai-atlas-progress` and its shape.
5. **Path template** and **Island template** with routes `/path/[key]` and
   `/island/[id]` (statically generated from `atlas.json`). Keep the cross-page
   `view-transition-name: island-art`.
6. **Demos**: port S2, S3, U1, then build the rest from DEMOS.md, one per island.
   Ship islands with a spec card until their demo is done.
7. **Progress, About, 404** pages (DESIGN.md §4.5).
8. **Polish pass**: performance budget, accessibility checklist, reduced motion,
   mobile, credits page.

Show the person each page as it's finished, starting with the opening scene, before moving on.

---

## Acceptance checklist (every page)

- [ ] Matches DESIGN.md tokens. No raw colours or fonts outside the variables.
- [ ] Text readable: body ≥ 15px, AA contrast, veils behind any text on art.
- [ ] One h1, landmarks, skip link, visible focus, every control usable by keyboard.
- [ ] Every artwork has alt text and a credit linking to its Met page.
- [ ] Animations use transform/opacity only; loops pause off-screen; 60 fps on a mid laptop.
- [ ] Reduced motion: no pins, no drift, no smooth scroll, nothing hidden.
- [ ] ≤ 6 live spatial photos; images lazy-loaded below the fold.
- [ ] Works at 390, 768, 1024, 1440 wide; touch targets ≥ 44px; no hover-only info.
- [ ] Content identical to `data/atlas.json`.
- [ ] Progress survives reload (localStorage, wrapped in try/catch).

## Credits line (footer + About)

"Paintings, engravings and objects: The Metropolitan Museum of Art, Open Access
(CC0). Depth maps: Depth Anything V2 Small (Apache-2.0). Cut-outs: IS-Net via
rembg (Apache-2.0)." CC0 needs no attribution, but credit the museum anyway.

## Adding or replacing art

Public domain only (The Met `isPublicDomain: true`, or another CC0 museum:
Art Institute of Chicago, National Gallery of Art, Rijksmuseum, Cleveland
Museum of Art). European 1400–1800 for paintings; *Nova Reperta*-style engravings
for paths; armour, automata, clocks and instruments for "machine" images. Then:

1. Crop (hero 16:9, card 1:1, or tall 4:5) or cut out (rembg with the `isnet-general-use` model).
2. `python tools/make-depth.py <image> --out <depth.webp> --size <half width>`.
3. Add the entry to the right manifest (same fields as its neighbours).
4. Tune strength / focus / glow in `library.html` and copy the values into `motion`.
