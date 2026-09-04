---
name: pirate-design-system
description: Take a live design you admire — a URL, a screenshot, a running app — extract the concepts behind it, transform them deliberately, and land an origin own system with its own identity. Use when the user points at someone's work and wants something of their own in that spirit, with no reference record on the shelf. For recording a reading without building on it use scout-design-system; for forking a record that already exists use fork-design-system; for authoring from nothing use new-design-system.
---

# pirate-design-system

Goes straight from **a live source** to an installable `origin: own` system, in one pass.

Read `CLAUDE.md` first. It holds the format contract, the 42 `--clp-*` aliases, and the required
sections. This skill is the process; CLAUDE.md is the specification. Where they disagree,
CLAUDE.md wins.

This exists because the other two paths both have a precondition. `fork-design-system` needs a
reference record that usually does not exist yet. `scout-design-system` produces a record the
user often did not want — a reading on the shelf is a different deliverable from a system they
can install. When someone points at a site and says *build me something like that, but mine*,
this is the skill.

---

## What piracy means here, precisely

**Take the concept. Leave the execution.**

A concept is a rule that survives being restated without any of the original's values: *the
border moves while the thing is working*. *Chrome contracts once you start reading*. *The
brand colour appears exactly once per screen*. Concepts are ideas about how interfaces behave.
Nobody owns those, and copying them is how design has always worked.

An execution is the specific realisation: their hexes, their type stack, their spacing, their
copy, their icons, their images, their logo. Those are theirs.

So the deliverable is a system that a reader of the original would recognise as sharing its
*thinking* and would never mistake for its *output*.

Three hard lines, and they are the only ones:

- **Never copy an asset.** No images, no icon sets, no font files, no logo, no marks. `assets/`
  is text only, as it is everywhere in this repo.
- **Never copy prose.** Not headlines, not microcopy, not error strings.
- **Never claim to be them.** The new system must not present itself as the original's official
  system, and its name must not be the original's name with a suffix.

Everything else is fair. Take the palette structure, take the primitive, take the motion, take
the layout logic — and then transform them, because a system that changes nothing is a copy
wearing a new filename, and a copy is not yours to license.

---

## Boundaries

You may write:

- `systems/<new-slug>/<new-slug>.md`
- `systems/<new-slug>/preview.html`, `thumb-light.svg`, `thumb-dark.svg` — only by running
  `scripts/build-previews.mjs`
- `systems/<new-slug>/assets/` — text only, optional
- exactly one appended entry at the end of `index.json`

Never touch another system. Never regenerate `index.json`. Never edit `CLAUDE.md` or the scripts
to accommodate this system. If the format genuinely cannot hold what is being described, stop
and say so rather than widening it.

---

## Step 1 — go and look, and take real evidence

Do not work from memory or from the user's description alone. Open the source.

**Pull values, do not eyeball them.** A live site will hand you its own tokens if you ask. In a
browser, read every custom property declared on the root and filter out the framework's defaults:

```js
const rs = getComputedStyle(document.documentElement)
const props = new Set()
for (const sheet of document.styleSheets) {
  let rules; try { rules = sheet.cssRules } catch { continue }
  const walk = rl => { for (const r of rl) {
    if (r.cssRules) walk(r.cssRules)
    if (r.style) for (let i = 0; i < r.style.length; i++) {
      const p = r.style[i]; if (p.startsWith('--')) props.add(p) } } }
  if (rules) walk(rules)
}
[...props].sort().map(p => `${p}: ${rs.getPropertyValue(p).trim()}`).join('\n')
```

Also worth reading: `@keyframes` bodies for anything that moves, the computed styles of the one
or two elements the user specifically named, and whether a dark mode actually engages when you
toggle it — a declared dark token is not a working dark mode.

**Say which values are measured and which are read off a screenshot.** They are not the same
kind of evidence and the difference matters when something later looks wrong.

If the page is heavy enough that the renderer stalls, stop after two or three attempts and work
from what you have. Note what you could not observe rather than guessing at it.

## Step 2 — separate concept from execution, out loud

Write two lists and put them to the user before designing anything:

| Take | Leave |
|---|---|
| The rules and behaviours worth stealing, each stated as a portable sentence | The values, assets and copy that belong to the original |

The **Take** column is the brief. If it has fewer than three entries, the source is not
interesting enough to build on and you should say so.

Then ask the question that makes this a system rather than a tribute: **what is wrong with the
original?** Every source has something. A system built only from admiration inherits the faults
along with the virtues. Push if the user offers only praise — the faults are where the new
system earns its independence, and each one becomes an entry in the **Never** list, in the words
the user used to criticise it.

## Step 3 — transform deliberately, and name the transformation

A pirate copy that changes nothing is a forgery. State, explicitly, at least two axes on which
the new system diverges — and put them in the file so a reader can see the work was done:

| Axis | Example divergence |
|---|---|
| Palette | Their hue family swapped for one the user chose; their bolted-on framework neutrals replaced by a coherent ramp |
| Primitive | Their visual signature promoted from decoration to a state-carrying rule |
| Structure | Their surface separation replaced by edges, or the reverse |
| Reach | A script or a mode they never covered |
| Rigour | A contrast floor they never met |

**Promoting a decorative move to a semantic one is the single most valuable transformation**
available here, and it should be the first thing considered. The original animates a border
because it looks good; the new system animates a border *if and only if the thing is live*. Same
appearance, entirely different system, and the second one is generative — an agent can
extrapolate it and the original cannot be extrapolated at all.

## Step 4 — the palette is yours now, so it is checked

The original's colours were theirs and were held to nothing. **The new palette is original work
and should be held to a floor.** Recommend `contrast: AA` and measure while values are being
chosen, not after:

```
node scripts/contrast.mjs <slug>
```

Text roles in both modes at 4.5:1, and adjacent chart series at ΔE 15 unsimulated / 6 under
simulated protanopia and deuteranopia.

**Expect the source's values to fail.** That is the normal outcome and one of the most useful
things this skill does. Their tertiary text, their status colours, or their brand colour used as
text will often be a step short, because nobody measured them. Fix it here.

To iterate without writing anything to `systems/` yet, `scripts/contrast.mjs` exports `check`
and `checkSeries`, both of which take a tokens block as a string. Measure a candidate palette in
a scratch file, land it only once it passes.

**A monochrome ramp cannot carry three chart series.** If the identity is one hue and the user
wants three or more series, those are incompatible and the user has to choose. Say so before
they pick, not after.

## Step 5 — name it, and let the user choose

The new system needs its own name and slug. **Propose two or three and stop.** Naming is the
user's, not yours.

Never reuse the original's name with a suffix. Prefer a name that points at the primitive over
one that points at the palette: the repo forks to a new slug on a palette change, so a system
named after its colour is brittle under its own versioning rule. If the user wants a colour name
anyway, that is their call — offer to put the colour name on the ground token instead, so it
appears throughout the file without being load-bearing.

## Step 6 — provenance is offered, not imposed

An `origin: own` system carries **no `credit` field** — the required set is fixed and does not
grow, and a system of the user's own has no author but them.

So acknowledgement is a choice. Offer a line near the top of the body naming what informed the
work, and accept the answer either way without arguing it twice:

```
Informed by <source>, whose <specific move> and <specific move> are the two ideas this
system generalises. The reading, the palette and everything below are mine.
```

If the user declines, drop it and say nothing further. The three hard lines in *What piracy
means here* are not negotiable; a courtesy line is.

## Step 7 — check every new ask against the prohibitions already written

This is where a system quietly stops being coherent, and it happens after the file exists.

The user will come back wanting one more thing from the source — a glass nav, a metallic button,
a second accent. **Before implementing it, read the `Never` list and the rules in sections 1 and
4, and check whether the new ask contradicts one.** It very often does, because the source was
never a system and had no prohibitions to violate.

When it collides, do not quietly widen the system. Put the collision to the user in a table:
what they asked for, which rule it breaks, and where that rule lives. Then offer resolutions —
usually one of:

- **Carve out**, narrowly and with a testable boundary. *Glass is a third ground, used only by
  chrome that content scrolls beneath.* A rule an agent can answer yes or no to survives; a rule
  that says "used tastefully" does not.
- **Amend the rule** so the new thing is principled rather than excepted. *No hue outside the
  ramp except ember* lets an achromatic metal in without opening the door to a fourth colour.
- **Refuse**, and say why, when the ask would cost the primitive.

Whichever is chosen, the amended rule goes back into the file. A prohibition that was
overridden once and not rewritten is no longer a prohibition.

## Step 8 — say what the preview cannot show

The 42 aliases carry colour, radius, spacing, type and one press transform. They carry **no**
motion beyond the press, no translucency, no backdrop blur, no gradient, no metal.

A pirated system is disproportionately likely to need exactly those, because the moves people
notice on a live site are the animated and the atmospheric ones. So:

- Specify them in prose anyway. The file is the product and it can be right even where the
  preview is partial.
- **Say plainly, in the Motion section, which of the system's signatures the specimen cannot
  render.** A reader who opens the preview and does not see the thing the system is named for
  should find that already explained.
- **Never invent an alias, and never bend a declared value to fake one.** A gap in the contract
  gets raised, not worked around. See CLAUDE.md, *What the template decides* — that list is
  closed, and adding to it is a decision rather than a line of CSS.

## Step 9 — the rest is `new-design-system`

Follow that skill for the prohibition list, the one-pass token block, showing the draft before
writing, the install block, appending one `index.json` entry, and validating. From here on this
is an ordinary `origin: own` system.

```
pnpm build                       previews and thumbnails, then the site
node scripts/validate.mjs <slug>
node scripts/contrast.mjs <slug>
pnpm check
```

`pnpm build` rather than `build-previews.mjs` alone: `validate.mjs` checks the site's freshness
too, so a new slug with no library card yet fails as `site out of date`.

Do not report done if any of those fail. Then open a PR. Never commit to `main`.
