# AI Atlas

The AI Atlas learning map, rebuilt in the "Renaissance machine age" design.

- **Content** comes from the interactive map (`source/Main.dc.html`). `npm run export:data`
  reads it and writes `public/island-art/data/atlas.json` without changing a word.
- **Design** comes from the design folder, unzipped as delivered into `public/island-art/`
  (start with `AGENT.md`, then `DESIGN.md`). When the two disagree, DESIGN.md wins.

## Run it

```
npm install
npm run dev        # work on it at http://localhost:4321
npm run build      # static site in dist/, every URL relative, works from any folder
```

`npm run build` also runs `tools/relativize.mjs`, which is what makes the built site
portable. `node tools/make-preview.mjs` then prepares a body-only page for sharing a preview.

## Where things are

```
source/                  the original interactive map, and the older data file that came with the design
public/island-art/       the design folder: art, depth maps, manifests, prototype, DESIGN.md
public/thumbs/           small versions of the path and island images, e.g. the route medallions (tools/make-thumbs.py)
src/lib/data.ts          build-time access to the content and the art manifests
src/layouts/Base.astro   page shell: fonts, nav, footer, skip link
src/components/          Logo, Credit, SpatialPhoto (a painting with depth), Rail (the path index that stays with the reader)
src/scripts/             motion (nav, reveals, smooth scroll), rail, spatial photos, demos, per-page behaviour
src/styles/              site.css (tokens + shared components), rail.css, one file per page
src/pages/               one file per page
tools/                   export-atlas, relativize, make-preview, make-thumbs, make-figure
```

## Pages

| Page | Status |
|---|---|
| Home (`index.html`), opening scene first | built, revised after the first review, in review |
| Atlas map (`atlas.html`) | next |
| Path (`path/<key>.html`) | to do |
| Island (`island/<id>.html`) | to do |
| Demos, Progress, About, 404 | to do |

## Home page, as revised in review (10 Nov 2026)

The first review asked for three things, and the home page now differs from DESIGN.md §4.1 in these ways:

- **The path index stays with the reader.** It starts in the opening title card and, on the first
  scroll, moves to the left edge (a bar along the bottom on screens under 1180px wide or 620px
  tall). It marks the chapter being read and every name is a link. One element does both jobs:
  `components/Rail.astro`, `styles/rail.css`, `scripts/rail.js`. The card only holds invisible
  place-holders for it.
- **Ten path chapters replace the grid of path cards.** Each path is a full scene (art, name,
  blurb, island and hour counts, the route as island medallions). On screens at least 861px wide
  and 661px tall each scene is pinned and the next slides over it behind a brushed ink edge;
  elsewhere, and with reduced motion, they simply follow one another. Order of sections: opening,
  machine, marquee, the ten chapters, Learn · Build · Grow, demo, atlas teaser.
- **Full figures for the opening scene** are to come as two generated images (see
  `public/island-art/IMAGE-PROMPTS.md` §1). Until they arrive the two hands stay.
  `tools/make-figure.py` turns each picture into a cut-out with a depth map and prints the size
  and fingertip anchor for its `pages.json` entry (usage at the top of the file).

Scroll, pacing and transitions take the feel of a reference site the reviewer named. Nothing of that
site is used here: the art, type, colours and code are this project's own.

Pictures far from the reader are released again (`scripts/spatial.js`), so the page never holds more
than a handful of WebGL contexts however long it gets.

## Notes

- The design folder's `data/atlas.json` was exported from an older map (29 islands). It is kept
  as `source/atlas.design-folder-v29.json`. The site uses the current map: 31 islands,
  10 paths, 131 resources. Two islands (SK, U5) have no painting or demo spec yet.
- `src/scripts/spatial-photo.js` is the app's copy of the design folder's component with one
  fix (see the comment at its top). The file in `public/island-art/` is untouched.
