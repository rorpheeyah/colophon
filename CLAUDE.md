# colophon

A library of design systems. Each system is one markdown file, written to be dropped into
another project so that AI-assisted development follows that system.

**The markdown file is the product.** The site is a browser for it. When a decision trades
site capability against file quality or consistency, the file wins.

---

## Rules

These are not guidelines. Follow them literally.

1. **The repo is the source of truth.** Not this conversation, not memory, not a summary of
   earlier work. Read the files before acting on them.

2. **Never modify any file under `systems/` other than the system currently being worked on.**
   If another system looks wrong, inconsistent, or out of date, say so and stop. Do not fix it
   as a side effect of another task.

3. **`index.json` is append-only.** Add entries at the end. Never regenerate it wholesale,
   never reorder it, never remove an entry, never edit an existing entry.

4. **Frontmatter fields added later are always optional, never required.** The required set is
   fixed and listed below. Never migrate existing system files to satisfy a field a newer
   system introduced.

5. **Never hand-write a preview.** Previews come from `scripts/build-previews.mjs`, which reads
   the tokens block out of the markdown. A preview must be physically incapable of showing
   something its system file does not say.

6. **Run `scripts/validate.mjs` before finishing any task.** Do not report done if it fails.

7. **Work on a branch and open a PR.** Never commit to `main` directly.

8. **If a file seems to be missing, ask.** Do not recreate it from memory or from an earlier
   version of itself.

9. **Archived systems are never deleted.** Projects already shipped against them need them to
   keep existing.

---

## Repo shape

```
CLAUDE.md
.claude/skills/
  new-design-system/SKILL.md     interview -> write a new own system
  scout-design-system/SKILL.md   interview -> write a new reference record
systems/
  <slug>/
    <slug>.md                    the deliverable
    preview.html                 generated, committed
    assets/                      optional, text only
scripts/
  lib.mjs                        shared parsing, so the two scripts cannot drift
  contrast.mjs                   WCAG ratios, opt-in via the `contrast` field
  build-previews.mjs             tokens block -> preview.html
  build-site.mjs                 system files -> site/
  validate.mjs                   format contract enforcement
site/
  assets/style.css               hand-written source
  index.html  compare.html       generated
  about.html  colophon.html      generated
  s/<slug>/                      generated: page, preview copy, .md copy
  data.json                      generated from frontmatter
index.json                       append-only ledger
LICENSE                          MIT on systems/, all rights reserved on the site
```

```
pnpm build     previews, then the site
pnpm check     validate; fails on a stale preview or a stale site
```

`scripts/site/html.mjs` escapes every interpolation. Inside a `<script>` that means a bare
interpolated string arrives as `&#39;...&#39;` and the script will not parse — use `json()` or
`raw()` for anything interpolated into script text. `build-site.mjs` parses every inline script
and JSON payload it emits and fails the build otherwise, so this cannot ship silently.

One dependency: `marked`, build-time only, for rendering a system file to HTML on
the system page. It pulls in nothing else. Hand-rolling GFM tables and fenced blocks
would be more code than the rest of the repo and a rendering bug would silently
corrupt the product. Nothing else may be added without the same justification.

`index.json` records only what never changes: `slug`, `path`, `origin`, `added`. Everything
mutable — version, status, register, density, filters — is read from frontmatter at build time
into `site/data.json`, which is regenerated freely. This is why the ledger can be append-only
and the site can never show stale metadata.

---

## Versioning

- A refinement bumps `version` in frontmatter. Same folder, same slug.
- A breaking change — different palette, different primitive — forks to a new slug
  (`lozenge-2`) and the previous system becomes `status: archived`.
- Archived systems stay on disk and stay in `index.json` forever. See rule 9.

---

## The system file format

### Frontmatter

Required, and this list does not grow:

```
system         display name
version        quoted string, e.g. "1.0" — never unquoted, YAML reads 1.10 as 1.1
status         active | draft | archived
origin         own | reference
register       one word, e.g. utility, editorial
density        compact | comfortable | spacious
scripts        inline array, e.g. [latin, khmer]
best-for       inline array
avoid-for      inline array
```

`origin: reference` additionally requires:

```
source-url     where the work was published
credit         author and title, as a quoted string
```

Anything else is optional and may be added freely. See rule 4. One optional field is
enforced when present:

```
contrast       AA | AAA — opt in to a contrast floor on text
```

`AA` is 4.5:1, `AAA` is 7:1. Declaring it makes `validate.mjs` resolve the `--clp-*` text roles
through the alias layer, in both modes, and fail the build on anything under the floor: primary,
secondary and tertiary text on `--clp-bg` and `--clp-surface`; each state colour on its wash where
one is declared and on the page where none is; button text on button fill; inverted text on the
inverted surface. `--clp-accent` is not checked, because a system may declare an accent and
forbid it as text.

**A system that declares nothing is not checked.** A floor it never agreed to is not its rule —
that is what keeps the field optional in the sense rule 4 requires, and it is why a reference
record, whose colours are approximations of someone else's work, is never held to one.

`node scripts/contrast.mjs [slug]` prints the table for authoring; `--all` includes systems that
have not opted in.

### Required body sections

In this relative order. Extra sections may be inserted anywhere between them.

1. **How to apply this file** — instructions aimed at an AI reading it, including what to do
   when a case is not covered
2. **The primitive** / **The core idea** — the rule before the values, so an AI can
   extrapolate correctly
3. **Tokens** — one fenced `css` block, light and dark, copy-pasteable as-is
4. **Type** — families, scale, weights, tracking, and per-script line-height rules where
   the system is bilingual
5. **Structure** — layout, density, surfaces, what carries separation
6. **Components** — described by token reference, never by restated value
7. **Motion**
8. **Never** — an explicit prohibition list, at least five entries

Headings may be numbered. Validation strips a leading number and matches on the title, so
inserting an optional section never forces a renumber elsewhere.

### The install block

The body opens with an install block, not with a bare instruction to overwrite a project's
`CLAUDE.md`. A target project needs its own `CLAUDE.md` for its own build commands and
conventions, so the system file is copied alongside it and imported:

```
.claude/design-system.md      the system file, verbatim, never edited in place
CLAUDE.md                     the project's own file, plus an @-import stanza
```

The import keeps the whole system in context on every turn without displacing anything, and
updating the system later is a one-file copy. The skill form
(`.claude/skills/design-system/SKILL.md`) is documented as a secondary option: it costs less
context but is not guaranteed to load on a given edit, which is how a system quietly stops
being followed. A reference record is never installed — it is forked into an `origin: own`
system first.

**Section 8 is the most important section in the file.** Systems do not decay because a stated
value is used wrongly. They decay because something not in the system gets added — an extra
radius, a subtle shadow, a fourth colour. Every system file must forbid explicitly.

### The tokens block is the single source of truth

The Tokens section contains **exactly one** fenced `css` block. It holds every custom property
the system defines, including font families.

**No colour literal may appear anywhere else in the file** — not in prose, not in a table, not
in another code block. No hex, no `rgb()`, `rgba()`, `hsl()`, `hsla()`. Validation enforces
this. Other code blocks are illustrative recipes and may reference `var(--token)` only.

Sizes in prose are permitted — a type scale reads better as a table than as fourteen custom
properties — but any value that exists as a token must be referenced by name.

### The `--clp-*` preview contract

The preview generator renders **one shared template** for every system, with no branching. It
can only do that if the differences between systems live in token values rather than in code.
So each system declares an alias layer inside its tokens block, pointing stable role names at
its own tokens.

Aliases are `var()` references, never copied values, so the tokens block stays the single
source of truth. Declare each one exactly once, in `:root` — never re-declare `--clp-*` inside
the dark block.

**`data-mode` must be set on the root element.** A `var()` inside a custom property is
substituted where that property is *declared*, not where it is used. So `--clp-bg: var(--paper)`
declared in `:root` resolves against whatever `--paper` is on `:root`, and that resolved colour
inherits down unchanged. Scope the dark block to a wrapper element and every alias keeps its
light value: `--paper` goes dark, `--clp-bg` does not, and dark mode silently does nothing. The
root is the only place the substitution sees the dark tokens. The preview generator therefore
renders one mode per document and sets `data-mode` on `<html>`.

**All 41 aliases are required.** A system that does not have a concept declares `none`:

```css
--clp-success: none;
```

That is a statement, not a gap. A missing alias is always an error, so a refusal is something
the author wrote down rather than something inferred from an absence. The preview renders only
what is declared, which means a system with no success colour shows no success state — because
it said so.

| Token | Role | `none` |
|---|---|---|
| `--clp-bg` | Page background | |
| `--clp-surface` | Raised or contained surface | |
| `--clp-text` | Primary text | |
| `--clp-text-2` | Secondary text | |
| `--clp-text-3` | Tertiary text, captions, placeholders | |
| `--clp-line` | Row rules and hairlines | |
| `--clp-accent` | The system's accent, whatever it means here | |
| `--clp-radius-box` | Containers | |
| `--clp-radius-control` | Buttons, inputs, pills | |
| `--clp-border-width` | Container edge; `0` if the system forbids borders | |
| `--clp-border-color` | Container edge colour | yes |
| `--clp-shadow` | Full `box-shadow` value, applied to controls only | yes |
| `--clp-press` | `transform` for a control being pressed | yes |
| `--clp-focus` | Keyboard focus ring colour | yes |
| `--clp-button-bg` | Primary button fill | |
| `--clp-button-text` | Primary button text | |
| `--clp-button2-bg` | Secondary button fill; its text is `--clp-text` | yes |
| `--clp-state-text` | Text on a state *fill*; declining it means states are coloured text | yes |
| `--clp-font-display` | Headings | |
| `--clp-font-body` | Body text | |
| `--clp-font-data` | Figures and mono labels | yes |
| `--clp-gap` | Base spacing step | yes |
| `--clp-pad` | Base container padding | yes |
| `--clp-success` | Healthy, resolved, correct | yes |
| `--clp-success-wash` | Its pale background | yes |
| `--clp-warn` | Needs attention soon | yes |
| `--clp-warn-wash` | Its pale background | yes |
| `--clp-alarm` | Needs attention now, or an error | yes |
| `--clp-alarm-wash` | Its pale background | yes |
| `--clp-invert-bg` | Inverted surface, where the system has one | yes |
| `--clp-invert-text` | Text on it | yes |
| `--clp-invert-accent` | Accent on it | yes |
| `--clp-hatch` | Full `background` value for a hatch pattern | yes |
| `--clp-font-script` | Family for a non-Latin script, where the body family does not cover it | yes |
| `--clp-scrim` | Overlay behind a modal or drawer | yes |
| `--clp-shadow-surface` | Elevation for a floating surface — toast, popover, dialog | yes |
| `--clp-chart-1` … `--clp-chart-5` | Categorical series palette, in order | yes |

Only the aliases marked `none` may be declined. The rest carry structure, and `none` in one of
them is an error rather than an escape hatch — `--clp-bg: none` is not a design decision.

How a state renders follows from what the system declared, and the preview and the contrast
check read it the same way:

| declared | treatment | contrast pair |
|---|---|---|
| `--clp-state-text` | filled with the state colour, that token as text | state-text on the state colour |
| a wash, no state-text | coloured text on the wash | state colour on its wash |
| neither | coloured text with a border of the same colour | state colour on the page |

A system may declare both: `--clp-state-text` fills the small pill while the wash tints a larger
banner, which is what Lozenge does. `--clp-state-text` without any state colour is an error —
there is nothing to fill.

Two coherence rules, both there to stop a system inventing a value it does not have:

- A wash needs a colour to pair with, so `--clp-warn-wash` without `--clp-warn` is an error. The
  reverse does not hold — a system may mark states with a border or with type colour alone and
  never fill anything.
- `--clp-border-color` may only be declined where `--clp-border-width` is `0`.
- `--clp-shadow` describes the shadow on a pressable control. The preview never puts it on a
  container, because a system may require it on a button and forbid it on a card. A system
  that needs container elevation is a gap in this contract — raise it, do not work around it.
- The series palette is declared in order with no gaps: `--clp-chart-3` with `--clp-chart-2` at
  `none` is an error. A system that declines `--clp-chart-1` gets no chart at all, because the
  alternative is the template choosing a data colour the file never named. Note that the accent
  is *not* a fallback — Lozenge declares an accent and forbids it as a chart fill.
- `--clp-gap` and `--clp-pad` may be declined by a system that never specified a spacing step.
  The preview then falls back to a preset chosen by the `density` field, which every system
  declares. That is still the file speaking — it is not the generator inventing a value.

A system with no `[data-mode="dark"]` block renders as "no dark mode published" rather than
having one invented for it.

### Scripts and charts in the preview

The `scripts` field declares reach and the preview renders one specimen line per script it
knows — letterforms and digits, never a sentence, so a specimen cannot mistranslate. Scripts
read right-to-left are rendered that way. A bilingual system also gets a mixed line, because
both bilingual systems in the library state that scripts share a row.

`--clp-font-script` names one family, but a font stack is not limited to one: a trilingual
system writes `"Noto Sans Khmer", "Noto Sans Thai", sans-serif` and needs no extra alias.

Charts take `--clp-chart-1` … `--clp-chart-5` **in the order declared, never cycled.** A chart
needing more series than the system declared is not drawn — there is no generated sixth hue and
no fallback to the accent. Text in a chart wears `--clp-text-*`, never a series colour, so
identity is carried by the mark beside a label rather than by the label. Grid and axis lines
are `--clp-line` and stay recessive. A legend appears for two or more series and never for one,
where the card title already names the series.

### Interaction states

`--clp-press` is the `transform` a control takes while it is being pressed — Newsprint declares
`translate(var(--offset), var(--offset))`, which is its whole interaction language and which no
preview showed until it could be declared. **A system that declares both a press transform and a
shadow has its shadow flattened on press**, because a control that moves has to land somewhere;
that is the template's reading, stated here so it is not a surprise.

`--clp-focus` is the keyboard focus ring. Declining it does **not** mean no focus ring — it means
the platform's own ring stands, which is the accessible default. The template never removes a
focus indicator, only replaces one the system asked for.

A chart's hover readout wears whichever separation the system declared, in this order:
elevation (`--clp-shadow-surface`), then an edge (`--clp-border-*` with a non-zero width), then a
contrasting fill (`--clp-invert-bg`). A system declaring none of the three gets no tooltip rather
than one composed from nothing — the same ladder the states and the buttons use.

**Adjacent series must be tellable apart.** `scripts/contrast.mjs` measures every neighbouring
pair in the declared order as OKLab ΔE×100, unsimulated and under simulated protanopia and
deuteranopia. Below 15 to a full-colour reader, or below 6 under simulation, is a failure; 6–8
under simulation is a warning. Like the text floor it is an error only for a system that
declared `contrast`, and a warning otherwise — a floor a system never agreed to is not its rule.

The status colours are reserved. They are never reused as a series, and a delta takes its
colour from its direction — a system with no success colour shows a rise unstated rather than
borrowing the attention colour for it.

The preview is a **specimen sheet, not a screen.** It shows every component the system declares
support for, side by side, so per-screen limits — "one accent per screen", "at most three
summary cards" — are not observed there and cannot be.

A system that declines `--clp-button2-bg` gets no secondary button, rather than one composed from
`--clp-surface`. The ghost treatment is still derived — transparent with `--clp-text-2` — and is
the template's most conservative reading rather than the system's own word.

---

## What the template decides

The preview is a design system too, and everything it renders that a file did not ask for is
its opinion wearing the system's colours. Four rule violations shipped before this was written
down — chart bars in an accent the file forbids as a fill, Khmer in the wrong family, filled
status pills in a system that forbids them, and a square button in a system whose primitive is
the capsule. Every one used a declared *value* in a place the prose ruled out.

So the list below is closed. **Adding to it is a decision, not a line of CSS.**

### Enforced mechanically

`build-previews.mjs` refuses to emit a preview whose template region contains a colour literal,
a `border-radius` that is not a `var()`, or a `box-shadow` that is not exactly `none` or a
single `--clp-*` reference. The template therefore cannot invent an appearance; it can only
misplace a declared one.

### Resolving a declined alias — four shims

| shim | when the alias is declined |
|---|---|
| `--_press` | `none`, so a control does not move |
| `--_data` | falls back to `--clp-font-body` |
| `--_script` | falls back to `--clp-font-body` |
| `--_gap` / `--_pad` | a preset chosen by the `density` field |
| `--_border` | `0`, so nothing draws an edge |

### Compositions the template owns

- **The specimen is a sheet, not a screen.** Every declared component appears at once, so
  per-screen limits — one accent per screen, at most three summary cards — are not observed
  and cannot be.
- **`--clp-shadow` is a control shadow** and never goes on a container.
- **A ghost control** is transparent with `--clp-text-2`: the most conservative reading, not
  the system's word.
- **A tooltip** takes elevation, then an edge, then a contrasting fill, and is omitted if the
  system declares none of the three.
- **A state** is a fill with `--clp-state-text`, else coloured text on a wash, else coloured
  text with a border of the same colour.
- **A table** is enclosed the way the system encloses things: an edge where `--clp-border-width`
  is non-zero, giving a full grid, and a **surface step** where it is `0` — the table sits on
  `--clp-surface` against the page, with `--clp-radius-box`. Lozenge asks for exactly that:
  "Separation comes from surface steps... if you reach for a border, you have missed a surface
  step," and its `Never` list forbids "a border anywhere".
- **A delta** takes its colour from its direction, and shows unstated where the direction has
  no declared colour.
- **Thumbnails carry no typeface** — an `<img>` cannot load one, so text is set in the generic
  each declared stack ends with.
- **Line weights** are the template's: 1px for a hairline, 2px for emphasis. No alias describes
  them, which is a known gap rather than a decision made silently.
- **Sample content and layout** — figures, labels, record names, how many stat tiles, how many
  table rows.

---

## Working on this repo

- Node 22+. No dependencies in `scripts/`. The frontmatter parser is deliberately hand-rolled
  against a restricted YAML subset: `key: value`, `key: "quoted value"`, and
  `key: [inline, array]`. Do not add a YAML library to support syntax the format does not use.
- Adding a system writes to `systems/<slug>/` and appends exactly one entry to `index.json`.
  Nothing else. Regenerating `site/data.json` belongs to the build, not to the intake skill.
- `thumb-light.svg` and `thumb-dark.svg` are generated beside the preview, with every `var()`
  resolved to hex, and are what the library cards use. They carry **no text**: an `<img>` cannot
  load the system's typeface, so any text there would render in whatever the viewer happens to
  have and would misrepresent the one thing a specimen is most careful about. A thumbnail
  carries colour, radius, density, surface treatment and whether the system charts at all — type
  identity belongs on the system page, at a size where it is legible.
- `preview.html` is committed. GitHub Pages serves it with no build step, the repo stays
  self-contained, and a token change shows up as a reviewable diff. `validate.mjs` regenerates
  previews and fails if a committed one is stale.

## The chrome

The site chrome is deliberately neutral. It displays systems that contradict each other in
almost every respect, so a chrome with a strong palette would quietly tell a visitor which one
to prefer. Neutral is not the same as undesigned: the greys carry a warm bias toward the one
accent, and **the accent — a single seal red — appears on the mark and nowhere else.** Adding it
to a tag, a button or a focus ring breaks that rule.

Theme is two-state, light and dark, stamped on the root before first paint. A first-time
visitor's OS preference decides which one they land in; after that the choice is theirs and is
kept in `localStorage`. There is no "system" option in the UI.

## Out of scope

Do not build, and do not offer to build: authentication, accounts, sharing, comments,
in-browser editing, a code playground, version history UI, Figma import, AI generation of
systems from the site, analytics, a component library, a UI kit.
