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

5. **Never hand-write a preview or a demo.** Both come from `scripts/build-previews.mjs`,
   which reads the tokens block out of the markdown. They must be physically incapable of
   showing something their system file does not say.

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
  fork-design-system/SKILL.md    a reference record -> an installable own system
  pirate-design-system/SKILL.md  a live source -> an installable own system, in one pass
systems/
  <slug>/
    <slug>.md                    the deliverable
    preview.html                 generated, committed: the specimen sheet
    demo-<name>.html             generated, committed: a whole page in this system,
                                 one per demo, `origin: own` only — see *The demos*
    thumb-light.svg              generated, committed; the library card image
    thumb-dark.svg               generated where the system publishes a dark mode
    assets/                      optional, text only
scripts/
  lib.mjs                        shared parsing, so the two scripts cannot drift
  contrast.mjs                   WCAG ratios, opt-in via the `contrast` field
  build-previews.mjs             tokens block -> preview.html and demo-<name>.html
  preview-shared.mjs             what both artifacts must resolve identically
  demo-frame.mjs                 a demo's document shell, picker and mode toggle
  demos/index.mjs                the registry, in order; the first is the default
  demos/<name>.mjs               one composition each
  build-site.mjs                 system files -> site/
  validate.mjs                   format contract enforcement
site/
  assets/style.css               hand-written source
  assets/mark.svg                the mark, as a reusable file
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

**All 42 aliases are required.** A system that does not have a concept declares `none`:

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
| `--clp-card-fill` | Fill for a stat tile or panel; `none` leaves it on the page | yes |
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

### Motion and atmosphere — four optional aliases

Added after the required set was closed, and **the required set stays at 42.**

| Token | Role | `none` |
|---|---|---|
| `--clp-duration` | Base transition duration for a state change | yes |
| `--clp-glass` | Translucent fill for chrome the page scrolls beneath | yes |
| `--clp-glass-edge` | That surface's hairline | yes |
| `--clp-blur` | Its `backdrop-filter` blur radius | yes |
| `--clp-gradient` | The system's one gradient, as a full `background` value | yes |
| `--clp-weight-display` | Heading weight | yes |

**These are optional, and absent is a warning rather than an error.** Making them required
would mean editing every existing system file to add `--clp-duration: none`, which is the
migration rule 4 exists to prevent and which rule 2 makes expensive on purpose. So an author
sees the gap, and writes the refusal down when that file is next open for its own reasons.
Absence and `none` render identically — no motion, no glass. The only difference is whether the
refusal was written down.

`--clp-glass-edge` and `--clp-blur` both require `--clp-glass`: a hairline and a blur have
nothing to sit on without a translucent fill. That is an error, the same shape as a wash
requiring a colour.

**Glass goes only on chrome that page content scrolls beneath.** Filament states the test as a
question — *does page content scroll underneath this element?* — and answers no for cards,
tables, sidebars, forms and modals. A demo that put glass on a panel would be misplacing a
declared value, which is the same class of error as putting `--clp-shadow` on a container. In
practice that means the top bar and nothing else. Where a system declares no glass the bar is
opaque on the page ground and still sticky, because content scrolling under an opaque bar is
ordinary.

**`--clp-duration` is for state changes, not choreography.** The template transitions colour and
opacity on controls — a chip becoming active, a nav item hovered — and nothing more. Entrances,
scroll reveals and a contracting nav are per-screen choreography, which the file may specify in
prose and the template does not own. Declining a duration gives `0s`, so nothing moves.

**Every transition is wrapped in `@media (prefers-reduced-motion: no-preference)`.** Two systems
in the library require that wrapper by name, and no system in it carries meaning through motion
alone, so nothing is lost when it is honoured.

**The specimen does not transition.** It renders one static frame per mode, so the motion shim
lives in the demo frame rather than in `preview-shared.mjs` — adding it left every
`preview.html` byte-identical, which is the check that this stayed true. A system that then
declares the new aliases does change its own preview, by exactly the lines it added: the
specimen embeds the tokens block verbatim and reads nothing from these four.

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

`preview.html` is a **specimen sheet, not a screen.** It shows every component the system
declares support for, side by side, so per-screen limits — "one accent per screen", "at most
three summary cards" — are not observed there and cannot be. The demos are the other half, and
do observe them. See *The demos*, below.

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

`build-previews.mjs` also refuses to emit a preview whose containers do not balance. The
generator emits HTML as strings, and an unclosed wrapper is invisible in the source and obvious
on screen — a table wrapper that never closed once swallowed the pagination, slider, avatars and
accordions into the table's own card.

`build-previews.mjs` refuses to emit a preview whose template region contains a colour literal,
a `border-radius` that is not a `var()`, or a `box-shadow` that is not exactly `none` or a
single `--clp-*` reference. The template therefore cannot invent an appearance; it can only
misplace a declared one.

**The specimen's markup is held to the same rule**, scoped between `<!-- specimen start -->`
and `<!-- specimen end -->`; the chrome around it is the preview page's own furniture and keeps
its own neutral palette. Every `fill`, `stroke`, `stop-color`, `flood-color`, `lighting-color`
and `color` attribute, and every inline paint declaration, must be a `var(--clp-*)`, `none`,
`transparent`, `currentColor` or `inherit`. That catches a named colour as well as a hex, which
scanning CSS alone could not — SVG carries appearance in attributes, so every `fill=` in the
charts and the avatars used to be on discipline.

One carve-out, enforced rather than assumed: inside a `<mask>`, `fill` may be `white` or
`black`. Those are the mask's 1 and 0 — the alpha channel, not an appearance — and they are
rejected on any other attribute, anywhere outside a mask, and in any other spelling. Losing
either marker fails the build, the same way losing the stylesheet marker does.

### Resolving a declined alias — four shims

| shim | when the alias is declined |
|---|---|
| `--_press` | `none`, so a control does not move |
| `--_data` | falls back to `--clp-font-body` |
| `--_script` | falls back to `--clp-font-body` |
| `--_gap` / `--_pad` | a preset chosen by the `density` field |
| `--_border` | `0`, so nothing draws an edge |
| `--_dur` | `0s`, so nothing transitions |
| `--_wdisplay` | `700`, which is what the template used before the alias existed |

### Compositions the template owns

- **The specimen is a sheet, not a screen.** Every declared component appears at once, so
  per-screen limits — one accent per screen, at most three summary cards — are not observed
  and cannot be. They are observed in the demos instead, which is why both artifacts exist.
- **`--clp-shadow` is a control shadow** and never goes on a container.
- **A ghost control** is transparent with `--clp-text-2`: the most conservative reading, not
  the system's word.
- **A tooltip** takes elevation, then an edge, then a contrasting fill, and is omitted if the
  system declares none of the three.
- **A state** is a fill with `--clp-state-text`, else coloured text on a wash, else coloured
  text with a border of the same colour.
- **A stat tile and a chart panel are filled only where `--clp-card-fill` says so**, and take an
  edge from `--clp-border-*` if the system draws one. The table is separate: it keeps
  `--clp-surface`, because a system can hold its summary cards unfilled and still put the work
  itself on a raised surface — which is exactly what Lozenge does.
- **A table** is enclosed the way the system encloses things: an edge where `--clp-border-width`
  is non-zero, giving a full grid, and a **surface step** where it is `0` — the table sits on
  `--clp-surface` against the page, with `--clp-radius-box`. Lozenge asks for exactly that:
  "Separation comes from surface steps... if you reach for a border, you have missed a surface
  step," and its `Never` list forbids "a border anywhere".
- **A delta** takes its colour from its direction, and shows unstated where the direction has
  no declared colour.
- **Thumbnails carry no typeface** — an `<img>` cannot load one, so text is set in the generic
  each declared stack ends with.
- **Overlapping avatars are separated by a 2px seam cut out of each.** A ring is a shadow and an
  outline is a border, and two of the three systems forbid each outright, so the separation is
  geometric. The cut follows the neighbour's own corner: it is that neighbour's outline offset
  outward by the seam, which for a rounded rect is the same shape at `--clp-radius-control`
  plus 2px. A capsule therefore reads as a disc behind a disc and a square as a square behind a
  square, and the template supplies only the 2px, which it already owns. **The row is drawn as
  SVG for this reason** — an HTML box cannot be masked by a shape whose radius is a `var()`, and
  SVG's own clamping of `rx` to half the side is what turns a declared `999px` into a true
  circle without the template naming a number. **The overlap is set by what the label needs,
  not by the stacking effect:** the initials centre in the slice that stays visible, so the tuck
  stops where two characters still fit clear of the cut.
- **Line weights** are the template's: 1px for a hairline, 2px for emphasis. No alias describes
  them, which is a known gap rather than a decision made silently.
- **Sample content and layout** — figures, labels, record names, how many stat tiles, how many
  table rows.

---

## The demos

A demo is a whole page built in a system: `systems/<slug>/demo-<name>.html`, one file per demo,
generated from the same tokens block as the specimen. They exist because a specimen cannot show
what a system looks like *doing something* — per-screen limits, the rules an agent most needs to
follow, had nowhere to be demonstrated.

**Nothing in the file decides which demos a system gets.** An earlier version mapped `register`
to one composition, so Ration was shown a dashboard because a table said so. That is the
generator making an editorial judgment about the file, and it was wrong: a design system can be
used for whatever its owner wants. Every `origin: own` system gets every demo, and the viewer
picks with the selector in the demo's chrome.

`best-for` and `avoid-for` stay in the frontmatter and stay on the site. They are the author
telling you something true about the system, which is content in the product — they are simply
not a gate on rendering. Adding a demo is a composition decision and belongs in `scripts/demos/`.

**One link, not two.** The system page previously offered *Full screen*, which opened the
specimen that is already embedded directly below it — a second tab showing the same artifact no
larger in substance. A demo is the only destination that is a *different* artifact, so it is the
only one that earns a link: **In use**, beside *Copy file*. The picker remembers the viewer's
choice in `localStorage`, and the system page rewrites its own link to match, so picking a demo
on one system opens the same one on the next. It rewrites the href rather than redirecting on
arrival, which would fight the back button.

**Demos open at full size in their own tab, and are never embedded.** A demo is fluid and
full-bleed, so fitting one into a column meant rendering it at a fixed desktop width and scaling
it to roughly a third — neither legible nor honest.

**A reference record gets no demo.** Its tokens are approximations of someone else's work. A
specimen sheet in approximated colours reads as the reading it is; a whole realised page in them
would read as a claim about work that is not ours. A reference is never installed either — it is
forked into an `origin: own` system first, and that fork gets the demos.

**A demo branches; the specimen does not.** That is the one addition to the closed list above,
and the line it draws is:

- **Appearance never branches.** Every demo is scanned by the same assertions as the specimen,
  so none of them can introduce a paint, a radius or a shadow the system did not declare. The
  guarantee that matters is untouched.
- **Composition is a free choice.** Which demo you are looking at is the viewer's, not the
  file's and not the generator's.

### The demos, and what each spends its accent on

| Demo | Composition | Accent |
|---|---|---|
| `dashboard` | A service reliability console | none — a console has no payoff |
| `landing` | A product and pricing page | one, on the hero's promise phrase |
| `editorial` | A long-form report | none — an article has no payoff, and Newsprint aliases its accent to the ink ramp, so an accented phrase would be the colour of the text beside it |
| `pos` | A point-of-sale till | one, on the amount due — unless the Charge button has already spent it |

Each demo answers the strictest rule in the library that applies to it, not the average one.
`editorial` is the clearest case: Newsprint says *"Rules, not cards. Do not wrap content in
filled containers to group it"*, so structure there is a hairline and a shared column edge and
nothing on the page is a panel. It also caps uppercase at mono labels and column heads, which is
why the kicker, the section bar and the figure labels are the only uppercase on it.

**A product grid and a ticket take the same enclosure ladder as the table**, not the one summary
tiles take: an edge where `--clp-border-width` is non-zero, a **surface step** where it is `0`.
They are the work itself rather than a summary of it, which is why they are enclosed at all, and
Lozenge's own words are the reason the ladder ends where it does — "separation comes from surface
steps... if you reach for a border, you have missed a surface step."

**Hiding uses the `hidden` attribute, and the frame resets it with
`[hidden]{display:none!important}`.** A demo's own `display` rule beats the UA stylesheet, so
without the reset the DOM reports a row hidden, every derived figure agrees with the DOM, and the
reader still sees the row. That is exactly how a filtered product grid and a zeroed ticket line
both stayed on screen while every automated check passed.

### What a demo observes that a sheet cannot

- **`--clp-accent` appears at most once, and only on a payoff.** The count is a ceiling and
  `build-previews.mjs` fails the build on a second use, but **the count was never the hard part
  — the placement is.** Lozenge caps citron at one element per screen; Ration goes further and
  says where: *never colour anything that is not a payoff — not a border, not an icon, not an
  eyebrow, not a nav item, not a button.* A rule that only counted was satisfied by an accent
  dot on the active environment, which is a nav item and an icon at once, and which shipped.

  So a demo may spend its one accent only on the thing the reader gets, and **zero is a legal
  answer.** The dashboard has no payoff and uses none: current location is carried by weight and
  by a neutral fill. A landing page does have one — the hero's promise — and spends it there.
  Where a demo cannot name its payoff in a sentence, it has no accent to spend.

  **And the count is of colours a reader sees, not of alias references.** Lozenge points
  `--clp-accent` and `--clp-button-bg` at the same token, so an accent phrase beside a primary
  button is citron twice while the reference count reads one. A demo therefore checks whether the
  invitation has already spent the accent — the two aliases holding the same value — and if so
  the payoff takes none. That is why a landing page carries exactly one primary button: two
  invitations in such a system would break the rule before the hero said anything.

  A declared `--clp-gradient` is a payoff colour too, and the same ceiling applies: it goes on
  the hero's promise phrase and nowhere else, which is Ration's rule verbatim.
- **Three summary tiles, never four.** Lozenge forbids more than three.
- **One surface step.** Containment comes from the system's own edge where it draws one and from
  `--clp-surface` where it does not. Nothing is doubled.
- **No decorative element used twice.** Newsprint allows its deckle once per surface.

These are the template's reading of the strictest system in the library, so a demo under-uses a
permissive system rather than violating a strict one. That is the acceptable failure direction.

### Every figure is derived

Placeholder content reads as placeholder mostly because its numbers do not agree with each
other. So a demo computes them: the summary tiles sum the table beneath them, a chart's caption
sums that chart's own bars, a status banner names the record that is actually failing, and a row
count is the number of rows. A demo declares its sample data once and derives everything else
from it. **A hand-typed total that happens to match is not the same thing** — it stops matching
the moment the sample data changes, and then the demo is quietly lying.

### A demo owns its own behaviour

The frame owns what is generic: the hover readout, and moving the active state within any
container marked `data-group`. What a selection *means* belongs to the demo, so a demo may
export `script(t, meta)` beside its `css()` and `body()`, and listen for the `demo:select` event
the frame dispatches.

**The group selector is a data attribute rather than a list of class names**, because a list
means every new demo has to register its groups in the shared frame — and the first demo that
forgot shipped an inert nav and an inert pricing toggle. A demo opts in where its markup is.

Behaviour is held to the same rule as appearance: a filter hides rows and never restyles them,
and any figure it changes is recomputed from the rows still on screen. The dashboard's tally and
the landing page's prices both do that, so the build-time rule about derived figures holds at
runtime too.

### Latin copy only

A page needs sentences where a specimen needs only letterforms, and a generated sentence in a
script the generator cannot read is exactly the mistranslation the specimen sheet is careful to
avoid. So a demo sets in Latin and does not exercise `--clp-font-script`; script reach stays the
specimen's job, and the demo says so in its own notes.

### What demos still cannot show

Translucency, backdrop blur and a state-change duration are expressible now — see *Motion and
atmosphere* above. Two things still are not, and neither may be worked around:

- **Choreography, and anything a token cannot hold.** Filament's travelling edge is a conic
  gradient rotated through a registered `@property` — no token can express it, and inventing
  `--clp-live-edge` for one system would be the shared template growing a special case. That CSS
  is already written in Filament's own markdown, which is why the open question is whether a
  designated block in a system file should be *executed* rather than merely illustrative.

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
