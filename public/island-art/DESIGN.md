# AI Atlas: design system and page specs

This is the full design direction for the AI Atlas website. The reference
prototype in `site/` implements everything described here. When this file and
the prototype disagree, this file wins; fix the prototype.

---

## 1. Concept: "the Renaissance machine age"

The site teaches people to learn AI from zero. Its visual idea: **the Renaissance
learned everything at once (art, maths, engineering, anatomy), and AI is the
next renaissance.** We tell that story with real museum objects:

- **Old-master paintings** for the 29 islands (one idea per island).
- **Engravings of inventions** (*Nova Reperta*, c. 1600) for the paths: the
  compass, clockwork, eyeglasses, printing, oil painting, watermills, windmills.
- **Machines that came before robots**: suits of armour, a 1620s automaton clock,
  a clockwork celestial globe, an astrolabe. They stand in for "AI / robots".
- **Neon light** in each track's colour is the "AI" layer on top: rim glows,
  routes drawn in light, sparks. Old world below, machine light on top.

Tone: confident, warm, a little playful, never cheesy. A museum at night with
the lights of a machine switching on.

**The one-line rule:** every page = one museum object brought to life (depth,
motion, glow) + clear, readable text + something the learner can *do*.

---

## 2. Tokens

Defined in `site/site.css` `:root`. Use the variables, never raw values.

### Colour

| token | value | use |
|---|---|---|
| `--ink` | `#0C0A0D` | page background (museum black, slightly warm) |
| `--ink-2` | `#120F14` | bands, demo canvas wells |
| `--panel` / `--panel-2` | `#17131B` / `#1E1923` | cards (gradient panel-2 → panel) |
| `--line` / `--line-2` | gold at 16% / 32% | hairlines, borders. Gilt, not grey |
| `--gold` / `--gold-2` | `#D9B26A` / `#F1D49A` | primary buttons, frames, compass roses, focus rings |
| `--gold-ink` | `#2A1F0D` | text on gold |
| `--ivory` | `#F3EBDD` | main text (contrast on ink ≈ 16:1) |
| `--ivory-2` | `#CEC3B1` | secondary text (≈ 11:1) |
| `--muted` | `#9C9182` | labels, meta (≈ 6.3:1, AA for body text) |
| `--hue` | per page | the current track colour. Set with `setHue()` |

Track colours (identical to the original map's `NEON` table, keep them):
understand `#00E5FF` · use `#FF2A6D` · train `#B45CFF` · build `#FCEE0A` ·
vision `#00FFC8` · language `#FF8A1F` · generative `#F43BFF` · rl `#FF3D3D` ·
mlops `#B8FF1F` · safety `#7F8CFF`.

Rules: track colours are **accents only** (rings, dots, lines, one button, glows).
Never use them for long text. Text on a track colour is always `#0C0A0D`.
Gold is the brand; neon is the machine.

### Type

| role | font | size | notes |
|---|---|---|---|
| Display (h1) | **Fraunces** (variable, opsz) 560 | `clamp(40px, 5vw, 70px)` / 1.02 | `letter-spacing:-.03em`, `text-wrap:balance` |
| h2 | Fraunces 560 | `clamp(30px, 3.6vw, 46px)` / 1.08 | |
| h3 | Fraunces 560 | `clamp(24px, 2.4vw, 30px)` / 1.18 | |
| Accent italic | Fraunces italic, `SOFT 100` | — | one word per headline at most (`em.gilt`) |
| Body | **Inter** 400 | 17px / 1.65 | max 65–70 characters per line |
| Lede | Inter 400 | `clamp(18px, 1.5vw, 21px)` / 1.6 | `--ivory-2` |
| Labels / eyebrows | **JetBrains Mono** 600 | 11.5–12px, uppercase, `letter-spacing:.13–.16em` | always short |

Readability rules: body never below 15px; never mono for sentences; serif only
for headings and short quotes; no text over a busy part of an image without
a gradient veil or text-shadow; check every text/background pair at **WCAG AA**
(4.5:1 body, 3:1 large).

Load with one Google Fonts request (see any page `<head>`). In production,
self-host the three families with `font-display: swap` and preload Fraunces 560
and Inter 400.

### Space, shape, depth

- Container `--max: 1240px`, side padding `--pad: clamp(20px, 5vw, 72px)`.
- Section rhythm `.sec`: `clamp(72px, 11vw, 150px)` top/bottom.
- Radius `--r-1 8` / `--r-2 14` / `--r-3 22`. Buttons and chips are pills.
- Frames (`.frame`): 1px gilt border + 6px ink gap + 1px hairline + a hue glow
  shadow. It reads like a gilded picture frame.
- A faint film-grain overlay sits on `body::before` (5% opacity). Keep it.

### Motion

| token | value | use |
|---|---|---|
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | default: fast start, soft landing |
| `--ease-io` | `cubic-bezier(.65,0,.35,1)` | drawing lines, frames |
| hands / big entrances | `cubic-bezier(.16,1,.3,1)` | long glide-ins |
| `--t-1` 180ms | hovers, presses | |
| `--t-2` 320ms | small state changes | |
| `--t-3` 640ms | reveals | |
| `--t-4` 1100ms | camera moves, page-level transitions | |

Principles:
1. **Things arrive, they don't pop.** Reveal = 28px rise + fade, 640ms, staggered 60–80ms.
2. **Everything breathes a little.** Idle drift on spatial photos, bobbing medallions,
   rotating astrolabe rings (140–220s per turn). Small amplitude, long periods.
3. **Scroll is a camera.** Pinned scenes map scroll progress `p` (0→1) to transforms;
   no scroll-jacking of the wheel itself. Smooth scrolling via Lenis (`lerp .09`).
4. **Interaction gets a physical response.** Hover lifts 6px, presses scale .98,
   needles overshoot slightly (`cubic-bezier(.3,1.4,.5,1)`).
5. **Reduced motion is a first-class mode.** `prefers-reduced-motion: reduce` turns
   off Lenis, pins, drifts, ship, bob, spark arcs and reveals. Everything is
   visible and static, and nothing is lost.
6. Animate only `transform`, `opacity`, `filter` (sparingly) and CSS variables
   read by transforms. Never animate layout properties.

Page transitions: cross-document View Transitions (`@view-transition { navigation: auto }`).
The clicked island medallion and the island page hero share
`view-transition-name: island-art`, so the painting grows from the map into
the page. Browsers without support just navigate normally.

---

## 3. Components

| component | where | notes |
|---|---|---|
| `nav` | all pages | sticky, blurred ink, hides on scroll down and returns on scroll up. Brand mark = compass rose SVG |
| `.btn` / `.btn.ghost` / `.btn.sm` | everywhere | gold pill primary, gilt-outline ghost. Min height 48 (40 for `.sm`) |
| `.chip` | goal pickers, demo options | `--c` sets its colour; `aria-pressed` drives the selected style |
| `.card` | everywhere | gradient panel, gilt hairline, lifts on hover |
| `.frame` | hero art, teasers | gilded double frame with hue glow |
| `.engr` | engravings | greyscale plate tinted with `--hue` (luminosity blend + gradient). Path cards, teasers |
| `<spatial-photo>` | art | see AGENT.md. Opaque paintings: `fit` cover. Cutouts: `transparent fit="contain"` |
| `.meter` / dials | path effort | half-circle gauge with needle (0–5) |
| `.demo` | island + home | header + canvas + control side panel; stacks on mobile |
| `.eyebrow` | above headings | mono caps with a short glowing line before it, in `--hue` |
| `.credit` | under every artwork | mono 12px, links to the Met object page |
| route timeline | path page | vertical line that fills with `--hue` as you scroll |
| peek card | atlas | floating island preview with a live spatial photo |

---

## 4. Pages

All pages: nav, footer with credits, skip link, one `h1`, landmarks (`main`,
`nav`, `aside`), `data-reveal` on blocks, Lenis smooth scroll, reduced-motion
support.

### 4.1 Home (`site/index.html`)

Sections in order:

**A. Genesis: the opening scene (Creation-of-Adam moment).** Required.
- Pinned section, height `210vh`, sticky stage `100svh`.
- Layers back to front: (1) sky: Claude Lorrain's *Pastoral Landscape* as a
  spatial photo (cover, pointer mode; the tall crop on phones); (2) veil gradient
  for text contrast; (3) **human hand**: Rodin's plaster *Study of a Hand*,
  entering from the left, fingers pointing right; (4) **machine hand**: a
  16th-century gilded and blued gauntlet (mirrored), entering from the right;
  (5) **spark** between the fingertips: white-gold core with glow and two
  crackling SVG arcs; (6) **title card**: a thin ivory outline box under the
  hands with "MMXXVI · A learning atlas", **The AI Atlas**, an italic line
  "Where human curiosity meets machine intelligence." and an index of the 10
  paths with Roman numerals I–X (each a link, turns its track colour on hover);
  (7) "Scroll to begin the voyage" cue bottom-left.
- Fingertip alignment: the human hand's anchor is at (96%, 65%) of its image,
  the gauntlet's at (0.5%, 61%). Both hands are positioned so these points sit
  either side of the touch point (`left:50%`, `top:--ty` = 34% desktop / 24%
  mobile), separated by `--g` (the gap, px).
- **Entrance timeline** (desktop):
  | t | what |
  |---|---|
  | 0 | sky fades from ink and settles from scale 1.08 → 1 (2.2–2.4s) |
  | 0.35s | human hand glides in from −70vw with −8° rotation → 0 (1.9s, `cubic-bezier(.16,1,.3,1)`) |
  | 0.5s | machine hand glides in from +70vw with +8° (2.1s) |
  | 1.5s | card border draws itself: top → right → bottom → left (1.2s `--ease-io`) |
  | 1.7s | card text and the 10 index lines rise in, 45ms stagger |
  | 2.4s | scroll cue fades in |
  | 2.6s | spark ignites; JS takes over the hands (float loop) |
- **Idle loop** (JS, rAF, paused off-screen): each hand bobs ±9px and rotates
  ±1.1° on different sine periods (≈10–13s); the gap "breathes" 46 ± 7px.
  **Pointer pull:** the closer the cursor is to the touch point (within 35% of
  the viewport width), the more the hands lean in (gap − up to 26px). Spark
  intensity `--sp = clamp((70 − gap) / 50)`; arcs re-randomise every 90ms.
- **Touch interaction:** the spark is a button ("Connect the human and the
  machine"). Click or Enter closes the gap to 2px, then a white-gold flash,
  three expanding ripples and the line "Connection made. Now learn how it works."
  After 3.2s it relaxes back.
- **Scroll choreography** (`p` 0 → 1 across the pin): hands drift apart (±38vw)
  and up (−22vh) and rotate away (±6°); the sky pushes in (scale + .18); the
  card lifts (−14vh) and fades (opacity 1 − 1.6p); a dark layer fades in so the
  next section starts on ink. Spark fades at 2× speed.
- Reduced motion: no pin (section = 100svh), hands placed, spark static at 0.8, no arcs.
- Optional upgrade: replace the hands with **full-figure** human and robot
  images made from `IMAGE-PROMPTS.md`. Keep the same anchors, timeline and code.

**B. "Every path builds part of the machine."** Full suit of armour (Henry VIII's
field armour, cut out, spatial, pointer mode) inside slowly rotating astrolabe
rings with the Latin ring text "MACHINA · DISCIT · ET · CRESCIT · MMXXVI".
Six neon callouts with drawn leader lines map body parts to paths: Eyes → Vision,
Voice → Language, Arms → Train, Hands → Use, Heart → Safety, Reflexes → RL. Lines
draw 300ms + 140ms stagger after the section appears. Left column: h2, lede,
two CTAs, three stats (islands, paths, resource count).

**C. Marquee:** slow italic serif ticker of key terms with gold ✦ separators (60s loop).

**D. Learn · Build · Grow (sticky story).** Left: a sticky visual that cross-fades
(0.8s) between the scholar with a celestial globe (painting, spatial), the
*Nova Reperta* title plate (engraving, gold-tinted) and the Urania automaton clock
(cutout, spatial). Right: three chapters (min-height 78vh) with a huge outlined
Roman numeral, eyebrow, h2, lede and three diamond bullets. The active chapter
is the one crossing the viewport's centre band.

**E. Ten paths grid:** 5 × 2 on desktop, 3 columns on tablet, 2 on phones. Each card: path image
(engraving tinted to the path colour, or a cutout glowing in it), name, 3-line
blurb, island count, hour range. First four tagged "Recommended / Goal".

**F. Live demo:** "How does a model pick its next word?" (the U1 demo).

**G. Atlas teaser:** framed compass engraving + copy + CTA.

### 4.2 Atlas (`site/atlas.html`): the redesigned map

The original map's **content stays exactly the same**: islands, positions,
links, goals, paths, hours, paces, progress. Its **look and motion** change to
an engraved sea chart:

- **Board** 1600×1080, island coordinates `X = 800 + x·1.15`, `Y = 600 + y·1.05`
  from the original `x, y`.
- **Sea:** ink with an engraved wave-hatch pattern, a faint 100px graticule,
  rhumb lines radiating from two compass roses (as on Renaissance portolan
  charts), a vignette, a double gilt border with tick marks, and a cartouche:
  *Atlas of Machine Learning · XXIX INSULAE · X ITINERA · MMXXVI*.
- **Region names** in italic serif: The Foundation Shoals, Archipelago of Use, The
  Training Isles, The Forge Isles, Sight, Lingua, Making, Reward, The Mills, The Guardians.
- **Islands = painted medallions.** The island's square painting in a circle with
  a gold double ring, a number + name tag, and a soft shadow on the sea. They
  are billboards: they counter-rotate the camera so they always stand upright.
  Sizes: core 92, path 80, specialisation 66px.
  - On route: lifted 16px, bobbing, a pulsing ring in the track colour.
  - Off route: desaturated, dimmed.
  - Finished: green ring.
- **Sea lanes:** every link is a dotted gilt curve. **Your route** draws itself in
  the goal colour (stroke-dash animation, 0.8s + length/1400 px per s, max 3.2s,
  glow filter), then a **glowing ship** sails the route on a loop (140px/s).
- **Camera:** three views with 1.1s eased transitions: Voyage (tilt 50°, spin −8°),
  Horizon (62°, −14°), Chart (flat, top-down; the default on phones). Pointer parallax
  ±4° on desktop. Drag to pan, buttons to zoom (Ctrl/⌘ + wheel too), Reset.
- **Entrance:** medallions rise in along the current route order (45ms stagger),
  then the route draws.
- **Panel** (glass, left; becomes a normal block under the map on phones): goal chips
  (4 goals + 6 specialisations), path blurb, summary (islands · hours · weeks at the
  chosen pace · done count), pace 5/10/20, the route's steps (thumbnail, hours,
  done dot), "Open this path" and "Start" buttons.
- **Peek card:** hover or focus a medallion (or a step in the list) → a card with a
  **live spatial photo** of the island, number, track, hours, title, 3-line summary.
  Touch devices: first tap peeks, second tap opens. Click → island page with the
  shared view transition.
- **Keyboard:** every medallion is a button with an aria-label; focus shows the peek;
  Enter opens. Goal and pace are toggle buttons with `aria-pressed`.
- **State:** `localStorage["ai-atlas-progress"] = { goal, pace, done:[ids], know:{id:[i]} }`.
  The URL hash carries the goal (`atlas.html#vision`).

### 4.3 Path page (`site/path.html#<path>`)

1. Hero: eyebrow "Path IV · Goal" (or "Specialisation"), h1 path name, blurb,
   CTAs (start the first unfinished island · see the route), fact pills (islands,
   hours, weeks at 10 h/week). Right: the path's machine (spatial cutout with hue
   halo) or engraving (spatial, tinted, 4:5) with credit.
2. Sticky sub-nav: Overview · Route · Effort · Careers (highlights the section in view;
   sticks to the top when the main nav hides).
3. Overview: "What you'll be able to build" as a big serif quote, "Good fit if…",
   Why take it ✓ vs What it costs you ⓘ cards.
4. Route: vertical timeline that **fills with the path colour as you scroll**. Groups:
   "Shared foundation" then the path's own islands. Each stop: painting thumbnail,
   step + island number, title, 2-line summary, hours; finished stops get a green dot.
5. Effort: four gauges (Math, Code, GPU, Money, 0–5) whose needles swing to their
   value when scrolled into view, each with its note.
6. Careers: role pills + sourced demand stats (each links to its source).
7. Previous / next path.

### 4.4 Island page (`site/island.html#<ID>`)

1. Full-bleed hero: the island painting as a spatial photo (`view-transition-name:
   island-art`), gradient veil, eyebrow "Island 03 · Understand first", h1 title,
   pills for hours and every path that includes this island.
2. Main column: What you'll learn (+ note callout if any) · **Build this before you
   move on** (highlighted card) · **Interactive demo** (live component or its spec
   card from `data/demos.json`) · Resources (type, ★ pick, author, detail, cost
   badge with Free in green).
3. Sticky aside: "By the end, you can explain" checklist (saved), progress bar,
   **Mark island as finished**, **Ask an AI tutor** prompt with Copy, about-the-painting
   note with credit.
4. Previous / next island within the learner's current goal path.

### 4.5 Pages to add (spec only, not in the prototype)

- **Progress** (`progress.html`): astrolabe cutout hero (`pages/progress`);
  circular progress per path drawn like astrolabe rings; islands finished,
  ideas ticked, hours done vs planned at the chosen pace, a "next island" card;
  export/import progress as JSON (copy/paste, since downloads may be blocked).
- **About / method:** why this order, how resources were picked, the art credits
  (all 48 objects, from `islands.json` and `pages/pages.json`), and accessibility notes.
- **404:** the compass engraving with "Off the map. Back to the atlas →".

---

## 5. Responsive rules

| width | layout |
|---|---|
| ≥ 1180 | full layouts, 5-column path grid, map panel overlay |
| 860–1180 | 3-column grid; hero columns stay side by side above 960 |
| < 860 | single column; map becomes Chart view on top with the panel below; demos stack controls under the canvas |
| < 520 | nav keeps the brand and Atlas link only; hero hands at ~60vw, touch point at 24% |

Touch targets ≥ 44px. No hover-only information: every hover has a focus or tap equivalent.

---

## 6. Performance budget

- LCP image ≤ 250 KB (the sky hero is about 100 KB at 1920 wide; serve the 900×1600 tall crop on phones).
- At most **6 live WebGL contexts per page** (home: sky, two hands, armour, story ×2);
  the map uses 1 (the peek card). Everything else is `<img loading="lazy">`.
- JS per page ≤ 60 KB of our code (excluding Lenis about 18 KB).
- 60 fps target: transforms and opacity only, rAF loops pause off-screen.
- Fonts: 3 families, subset to Latin, `font-display: swap`.

## 7. Accessibility checklist

- One h1 per page, logical heading order, landmarks, skip link.
- Every image has alt text from the manifests. Decorative layers are `aria-hidden`.
- Focus visible everywhere (gold 2px outline, 3px offset).
- All interactions keyboard-operable (map medallions, spark button, demo controls, checklists).
- `aria-pressed` on toggles, `aria-live` on demo outputs and the touch message.
- Reduced motion fully supported (see §2 Motion).
- Colour contrast AA for all text. Neon is never the only signal: tags, labels and icons carry meaning too.
