# Image prompts (optional AI-generated art)

Everything the site ships with is **real public-domain museum art** (CC0). Use
these prompts only if you want extra images old masters never painted, such as
a full-figure human and robot reaching for each other. Keep them in the same
style so they sit next to the museum pieces.

## Rules

- Generate with a tool whose licence lets you use the output commercially, and
  keep a note of the tool and date in `pages/pages.json` (`"license": {"name": "AI-generated", "tool": "…", "date": "…"}`).
- Never ask for a living artist's style, a brand, a real person or Shopify's
  Editions artwork. "In the manner of Italian High Renaissance oil painting" is fine.
- No text, logos or watermarks in the image. Clothed figures only.
- One clear subject on a plain or simple background. That makes clean
  cut-outs and good depth maps.
- After generating: cut out (rembg / IS-Net) if it's a figure, run
  `tools/make-depth.py`, add it to the manifest, tune it in `library.html`.

## Shared style block (append to every prompt)

```
Italian High Renaissance oil painting, chiaroscuro, warm golden-hour light,
visible brushwork and fine craquelure, rich drapery folds, muted earth palette
with deep greens, ochre, umber and ivory, museum-quality, high detail,
no text, no frame, no watermark
```

## 1. Opening scene: full-figure version (replaces the two hands)

Human (left, faces right):

```
Full-length young woman in flowing ivory and rose silk robes, floating in mid-air
as if flying, body angled to the right, right arm stretched forward with the
index finger reaching out, calm focused expression, bare background in flat
neutral grey for easy cutout, [shared style block]
```

Machine (right, faces left):

```
Full-length humanoid robot built like a Renaissance suit of gilded and blued
steel armour with fine engraved gold ornament, visible clockwork joints at the
elbows and knees, faceless polished helmet with a soft cyan glow behind the
visor slit, floating in mid-air as if flying, body angled to the left, left
arm stretched forward with one articulated finger reaching out, flat neutral
grey background for easy cutout, [shared style block]
```

Sky background (if you want a wider one than Claude Lorrain's):

```
Wide Roman pastoral landscape at golden hour, tall umbrella pines and cypress
trees framing the left and right edges, open sky with soft cumulus clouds in
the centre third, distant blue hills and a river, 16:9, [shared style block]
```

Anchors: after cutting out, find each fingertip (x%, y% of the image) and set
`--ox/--oy` and the `translate(-X%, -Y%)` values in the genesis CSS (see DESIGN.md §4.1).

## 2. "Learning with machines" scenes (home, about, progress)

```
A Renaissance scholar's study at night, a young student and a brass-and-steel
automaton sit side by side at a wooden desk reading an open book together,
astrolabes, globes and clockwork parts on the shelves, candlelight, [shared style block]
```

```
A Renaissance workshop where apprentices and a gilded clockwork robot assemble
a large brass orrery together, sawdust and tools on the floor, light from a high
window, [shared style block]
```

```
A young woman teaching a small clockwork robot to paint at an easel, both
holding brushes, a half-finished landscape on the canvas, [shared style block]
```

## 3. One extra figure per path (optional)

| path | subject |
|---|---|
| understand | a scholar dissecting a clockwork brain on a table, gears laid out like an anatomy lesson |
| use | a merchant at a counter dictating to a brass automaton scribe that writes letters |
| train | a horse trainer and a mechanical horse in a riding school |
| build | a craftsman assembling a clockwork head from hundreds of small gears |
| vision | a robot with crystal lens eyes examining a painting through a magnifying glass |
| language | a robot scribe copying a manuscript beside a monk, two inkwells |
| generative | a clockwork painter finishing a portrait while the sitter watches |
| rl | a robot and a nobleman playing chess in a loggia |
| mlops | windmills and waterwheels driving a large calculating machine in a mill |
| safety | an armoured knight guarding a sleeping automaton with a lantern |

Prompt template: `"[subject], [shared style block]"`. Crop: 16:9 hero + 4:5 tall.
