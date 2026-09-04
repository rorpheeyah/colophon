---
system: Prunella
version: "1.0"
status: active
origin: own
register: technical
density: spacious
contrast: AA
scripts: [latin, khmer]
best-for: [deployment and infrastructure consoles, developer tooling, service status and monitoring screens, bilingual technical products]
avoid-for: [print output, long-form reading, static marketing sites, screens with no live or transitional state]
---

# Prunella

**Install:** copy this file into the target project as `.claude/design-system.md`, then add
this to that project's own `CLAUDE.md`:

```md
## Design system

This project follows Prunella. The rules in @.claude/design-system.md are
binding for all UI work. Where a rule and your instinct disagree, the rule wins.
```

Everything below is binding.

A design system for software that is doing something while you watch it. One primitive — an
edge that moves when the thing it encloses is live — carried from a button to a service row to
the navigation itself. One purple ramp, one achromatic metal, one colour for broken. Spacious,
bilingual.

---

## How to apply this file

Follow the rules literally. Where a rule and your instinct disagree, the rule wins.

When something isn't covered here, choose the option most consistent with the rules that are —
and prefer removing the element over inventing a new token for it. Do not introduce colours,
radii, shadows, borders, or type families that this file does not define. That is the most
common way a system decays.

Before adding motion to anything, answer one question: **is this element live?** If the answer
is no, the motion is decoration and this system does not permit it. See section 7.

**On installing this file.** Prefer the `@`-import above over pasting these rules into a
project's `CLAUDE.md`: the import keeps the system in context for every turn without displacing
the project's own rules, and updating the system later is a one-file copy. Installing instead as
`.claude/skills/design-system/SKILL.md` costs less context but is not guaranteed to load on any
given edit, which is how a system quietly stops being followed.

---

## 1. The primitive

**An edge that moves means the thing inside it is live.** A still edge means it is not.

That is the whole system. Every other rule below is a consequence.

"Live" means one of exactly two things, and the **colour of the moving edge says which**:

| Moving edge | Means | Where |
|---|---|---|
| `steel` | **This is the way forward.** An invitation | The single primary action, and nothing else |
| `live` | **Work is happening.** A report | A deploy building, a job running, a request in flight |

Steel invites; purple reports. Both are motion, and motion always means live, so the primitive
holds without exception. Nothing else in this system moves.

The rule appears at three scales, and an agent should extrapolate to a fourth the same way:

| Scale | Live | Still |
|---|---|---|
| Button | The one primary action, in `steel` | Every secondary and ghost control |
| Row or card | This service is deploying, in `live` | This service is deployed |
| Navigation | A background task is running, in `live` | Nothing is running |

Because the edge carries the signal, **the edge is never decorative.** A border in this system
is a load-bearing statement about state. That is the opposite of Lozenge, which forbids borders
entirely and separates by surface step; the two systems disagree on structure deliberately and
should not be mixed.

Two edges, two weights: `--hair` at rest, `--edge` when live. There is no third weight.

---

## 2. Tokens

```css
:root {
  --wash:        #F7EEF7;
  --panel:       #FFFFFF;
  --ink:         #1E121D;
  --ink-2:       #5C4A5B;
  --ink-3:       #736173;
  --rule:        #E9DAE8;
  --dusk:        #8B4188;
  --on-dusk:     #FBF2FA;
  --live:        #A6289F;
  --live-pale:   #E0A9DD;
  --obsidian:    #141014;
  --on-obsidian: #FFFFFF;
  --ember:       #A8231C;

  --steel-deep: #262626;
  --steel-mid:  #8C8C8C;
  --steel-hi:   #F5F5F5;

  --glass:      rgba(255, 255, 255, .72);
  --glass-edge: rgba(255, 255, 255, .58);
  --glass-blur: 18px;
  --scrim-c:    rgba(30, 18, 29, .62);

  --sans: "Onest", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;
  --km:   "Noto Sans Khmer", "Onest", sans-serif;

  --capsule: 999px;
  --box:     16px;

  --hair: 1px;
  --edge: 2px;

  --gap-tight: 8px;
  --gap:       16px;
  --gap-loose: 28px;
  --pad:       20px 24px;

  --edge-run:  2.4s;
  --steel-run: 3.6s;
  --settle:    180ms;

  --clp-bg:             var(--wash);
  --clp-surface:        var(--panel);
  --clp-card-fill:      var(--panel);
  --clp-text:           var(--ink);
  --clp-text-2:         var(--ink-2);
  --clp-text-3:         var(--ink-3);
  --clp-line:           var(--rule);
  --clp-accent:         var(--live);
  --clp-radius-box:     var(--box);
  --clp-radius-control: var(--capsule);
  --clp-border-width:   var(--hair);
  --clp-border-color:   var(--rule);
  --clp-shadow:         none;
  --clp-press:          scale(0.97);
  --clp-focus:          var(--live);
  --clp-button-bg:      var(--obsidian);
  --clp-button-text:    var(--on-obsidian);
  --clp-button2-bg:     var(--panel);
  --clp-state-text:     none;
  --clp-font-display:   var(--sans);
  --clp-font-body:      var(--sans);
  --clp-font-data:      var(--mono);
  --clp-gap:            var(--gap);
  --clp-pad:            var(--pad);
  --clp-success:        none;
  --clp-success-wash:   none;
  --clp-warn:           none;
  --clp-warn-wash:      none;
  --clp-alarm:          var(--ember);
  --clp-alarm-wash:     none;
  --clp-invert-bg:      var(--dusk);
  --clp-invert-text:    var(--on-dusk);
  --clp-invert-accent:  var(--live-pale);
  --clp-hatch:          none;
  --clp-font-script:    var(--km);
  --clp-scrim:          var(--scrim-c);
  --clp-shadow-surface: none;
  --clp-chart-1:        var(--live);
  --clp-chart-2:        var(--live-pale);
  --clp-chart-3:        none;
  --clp-chart-4:        none;
  --clp-chart-5:        none;
}

[data-mode="dark"] {
  --wash:        #180B18;
  --panel:       #251126;
  --ink:         #FBF2FA;
  --ink-2:       #C69CC4;
  --ink-3:       #AE87AC;
  --rule:        #3D203C;
  --live:        #D963D4;
  --live-pale:   #F2C4F0;
  --obsidian:    #0B050B;
  --ember:       #F08078;

  --glass:      rgba(37, 17, 38, .62);
  --glass-edge: rgba(255, 255, 255, .10);
}
```

Dark mode is required, not optional. Every screen must work in both.

Set `data-mode="dark"` on the **root element**. Scoped to a wrapper it will not work: a
`var()` inside a custom property resolves where the property is declared, so the `--clp-*`
aliases would keep their light values.

**`dusk` is the same value in both modes.** The brand ground does not change when the lights go
out. It is the one token that is mode-independent, and that is deliberate.

**In dark mode the primary button goes darker than the page, not lighter.** `obsidian` sits
below `wash`, so the button is a hole rather than a block, and its steel edge is what makes it a
control. This follows from the primitive: the edge does the work, so the fill does not have to.

**The metal ramp is not in the tokens' purple family and does not need to be.** It is strictly
achromatic — every step has equal red, green and blue channels. That is what keeps it a
*material* rather than a second brand colour, and it is a rule an agent can check by reading the
hex. See section 8.

### Colour rules

| Token | Means |
|---|---|
| `dusk` | The ground — nav rail, inverted panels, the brand surface in both modes |
| `live` | **Work is happening.** The reporting edge, the focus ring, the first data series |
| `live-pale` | The second data series, and the accent on an inverted surface |
| `steel-*` | **The way forward.** The primary action's edge, and nothing else |
| `ink-3` | Resolved, idle, nothing to do here |
| `ember` | **Broken.** A failed deploy, an unrecoverable error |

**One purple ramp, one metal, one exception.** Every hue in this system is a step of the purple
ramp except `ember`. The metal ramp is permitted because it carries no hue at all. A reader who
sees any non-purple *hue* already knows what it means before reading the label: something has
failed.

**There is no success colour and no warning colour.** A resolved state recedes to `ink-3` and
carries no colour at all. A state that needs attention soon does not exist — either work is
happening, or it is finished, or it is broken.

**A state is an edge, not a fill.** `--clp-state-text` and `--clp-alarm-wash` are both declined,
which means a state renders as coloured text inside a border of the same colour. Nothing in this
system is a filled pill.

`live` is an edge, a focus ring and a data mark. It is never a page background, never a filled
region, never button fill, and never body text.

---

## 3. Type

Two Latin families, no third: `sans` for everything Latin, `mono` for figures and identifiers.
`km` covers Khmer.

Mono is not decoration here and is not optional. Service IDs, commit SHAs, log lines, byte
counts, durations and IP addresses all set in `mono`, because they are scanned character by
character and compared down a column rather than read.

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Page title | 24px | 600 | −0.02em |
| Section title | 18px | 600 | −0.01em |
| Body, table cell | 15px | 400 | 0 |
| Secondary | 13px | 400 | 0 |
| Label, column head | 12px | 600 | +0.06em, uppercase |
| Data, identifier | 13px | 400 | 0, `mono` |

Uppercase is permitted **only** on column headers and small labels. Never on headings, buttons,
or body text.

### Bilingual conventions

Khmer sets in `km` at the same weight as its Latin sibling, with line-height raised roughly 0.15
above the Latin value so bilingual rows keep an even rhythm. Khmer and Latin frequently share a
line — never assume a row is one script.

Identifiers, log output and figures stay in `mono` and stay Latin, in both interfaces. A service
name may be Khmer; a service ID never is.

---

## 4. Structure

**Three grounds, and the third is reserved.** The page is `wash`. The work sits on `panel`.
Chrome that **floats over content** sits on `glass`.

Glass is not a decorative finish and is not available as one. The test is a single question:
**does page content scroll underneath this element?** If yes, it is glass. If no, it is `panel`,
whatever it looks like. A card, a table, a form panel and a sidebar are never glass, because
nothing passes beneath them.

| Ground | Used by |
|---|---|
| `wash` | The page itself |
| `panel` | Cards, tables, forms, sidebars, modals — anything the page contains |
| `glass` | The condensed nav, popovers, dropdowns, a command palette — anything the page passes under |

A glass surface is `--glass` fill, `backdrop-filter: blur(var(--glass-blur))`, and a `--hair`
inner edge in `--glass-edge`. It takes no shadow, like everything else here. There is no
intermediate tint between these three: a surface is one of the grounds, never a blend of two.

**Every opaque surface has an edge.** A `--hair` border in `rule`, radius `box`. A surface is
defined by its edge, never by a shadow and never by a fill alone — which is why `card-fill` and
`surface` are the same value: the fill is not what separates them, the edge is.

**Controls are capsules, containers are boxes.** `capsule` for anything pressable, `box` for
anything that only contains other things. There is no third radius. The capsule is not
arbitrary: a travelling edge on a capsule is a continuous loop with no corners to accelerate
through, which is the geometry the primitive needs.

**Spacing.** `gap-tight` inside a group, `gap` between groups, `gap-loose` between sections,
`pad` for container padding. Four steps, no fifth, and no arbitrary margin between them.

**Chrome contracts as you descend.** Persistent navigation begins flush and full-width against
the page, on `panel`. Once the view is scrolled past its first section, it detaches into a
floating `capsule` on `glass`, inset from the edges, narrower than the bar it replaced. It does
not lift — there is no shadow. It separates by contracting and by changing ground, and the blur
is what proves it is above the page rather than part of it. See section 7 for the timing.

**Density is spacious and that is a commitment.** This system trades rows-on-screen for legible
state. If a screen needs forty rows visible at once, it is the wrong system — Lozenge is the
right one.

---

## 5. Components

Every value below is a token reference. Nothing here restates a colour.

| Component | Rule |
|---|---|
| Primary button | `--clp-button-bg` fill, `--clp-button-text`, `capsule`, `pad`. Carries the travelling `steel` edge |
| Secondary button | `--clp-button2-bg` fill, `--clp-text`, `capsule`, `--hair` edge in `rule` |
| Ghost button | Transparent, `--clp-text-2`, no edge until hover |
| Input, search | `panel` fill, `--hair` edge in `rule`, `capsule`. Edge becomes `live` at `--edge` on focus |
| Card, panel | `--clp-card-fill`, `--hair` edge in `rule`, `box`, `pad` |
| Table | On `panel` inside a `box` container with a `--hair` edge; `rule` hairlines between rows |
| Service row | Idle: `--hair` edge in `rule`. Deploying: travelling `--edge` in `live`. Failed: still `--edge` in `ember` |
| State label | Coloured text inside a border of the same colour, `capsule`. Never a fill |
| Nav, flush | `panel` ground, `--hair` bottom edge in `rule` |
| Nav, condensed | `glass` ground, `capsule`, `--hair` edge in `--glass-edge`, inset from the page edges |
| Nav rail | `dusk` ground, `--clp-invert-text`, active item marked by `--clp-invert-accent` |
| Popover, dropdown | `glass` ground, `box`, `--hair` edge in `--glass-edge` |
| Chart | `--clp-chart-1` then `--clp-chart-2`, in that order, never cycled. Axes and grid in `--clp-line` |
| Modal, drawer | `panel` on `--clp-scrim`, `box`, `--hair` edge. Not glass — a modal blocks the page rather than floating over it |
| Focus ring | `--clp-focus` at `--edge`. Never removed |

**One steel edge per view, never two.** There is only ever one way forward. If a screen appears
to need two primary actions, one of them is secondary and has not been demoted yet.

**Purple edges may appear on as many elements as are genuinely processing.** Each reports its
own work rather than competing for primacy, so three deploying rows carry three moving edges and
that is correct. Steel and purple may coexist: they are answering different questions.

**Charts stop at two series.** The ramp is monochrome, and a third purple would not be tellable
apart from its neighbours. A view needing a third series needs a different chart, not a third
colour.

---

## 6. Figures and identifiers

Written for infrastructure interfaces; carry these forward wherever they apply.

- Durations are absolute and unrounded under a minute: `47s`, never `<1m`.
- Byte counts carry their unit at every scale, in `mono`, right-aligned down a column.
- A service ID is shown in full or not at all. Never truncate with an ellipsis in the middle —
  the tail is the part that distinguishes two IDs.
- Derived and estimated numbers carry a tilde: `~4m remaining`, never `4m remaining`.
- A timestamp shows relative time with the absolute value available on hover, never the reverse.

---

## 7. Motion

Motion in this system means exactly one thing: **this is live.** There is no motion that
signifies anything else, and there is no decorative animation.

Both travelling edges are the same mechanism — a conic gradient rotated through a registered
custom property, masked to the border box so only the edge shows. They differ in what fills the
gradient and how fast it turns.

```css
@property --edge-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.is-live,
.is-forward {
  position: relative;
  border-radius: var(--capsule);
}

.is-live::before,
.is-forward::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: var(--edge);
  border-radius: inherit;
  mask: linear-gradient(currentColor 0 0) content-box,
        linear-gradient(currentColor 0 0);
  mask-composite: exclude;
}

/* Work is happening. One spark, one revolution. */
.is-live::before {
  background: conic-gradient(
    from var(--edge-angle),
    transparent 0turn,
    var(--live) 0.08turn,
    transparent 0.18turn,
    transparent 1turn);
  animation: edge-run var(--edge-run) linear infinite;
}

/* This is the way forward. Liquid metal — two highlight passes per turn. */
.is-forward::before {
  background: conic-gradient(
    from var(--edge-angle),
    var(--steel-deep) 0turn,
    var(--steel-hi)   0.12turn,
    var(--steel-mid)  0.25turn,
    var(--steel-deep) 0.37turn,
    var(--steel-mid)  0.50turn,
    var(--steel-hi)   0.62turn,
    var(--steel-mid)  0.75turn,
    var(--steel-deep) 0.87turn,
    var(--steel-deep) 1turn);
  animation: edge-run var(--steel-run) linear infinite;
}

@keyframes edge-run {
  to { --edge-angle: 1turn; }
}
```

**Two highlight passes per revolution is what makes it read as metal** rather than as a single
spark going round. One pass reads as a signal; two read as a surface catching light. Steel turns
at `--steel-run` and purple at `--edge-run` — steel is the slower of the two, because a heavy
material does not flick.

Both are linear, never eased. An eased revolution reads as a thing speeding up and slowing down,
which claims something about the work that is not true.

**Chrome contraction.** The navigation transitions width, inset, ground and `backdrop-filter`
over `--settle`, and nothing else. It does not fade, scale, or lift.

**Press.** `--clp-press` on every control. There is no shadow to flatten, because there is no
shadow.

**Reduced motion is not a downgrade.** Under `prefers-reduced-motion: reduce` both edges stop
travelling and become solid `--edge` borders — `live` for work in flight, `--steel-mid` for the
primary action. The state is still carried; only the motion goes. Motion must never be the only
channel a state is available on.

**A note on the specimen.** The generated preview renders one static frame per mode, and the 42
`--clp-*` aliases have no way to express translucency, backdrop blur, or a metal gradient. So
the specimen shows this system's edges but never shows them moving, and renders glass as an
opaque surface. **Two of this system's three signatures are invisible in its own specimen
sheet.** That is a known limitation of the preview contract, not a softening of the rules.

---

## 8. Never

- **Never add a third radius.** Containers are `box`, controls are `capsule`. There is no third.
- **Never put a shadow on anything.** Not on a control, a card, a nav, a popover, a modal or a
  tooltip, however subtle. Separation is the edges and the three grounds.
- **Never animate the edge of something that is not live.** A travelling edge is a claim that
  work is happening. On an idle element it is a lie, and it destroys the one signal this system
  has.
- **Never show two steel edges in one view.** There is only ever one way forward.
- **Never put a steel edge on anything but the single primary action.** Not on a card, not on a
  secondary button, not on an input, not on the nav.
- **Never introduce a *hue* outside the purple ramp except `ember`.** The metal ramp is
  permitted only because it is strictly achromatic — every step has equal red, green and blue
  channels. A tinted metal is a new hue and is forbidden.
- **Never add a success or a warning colour.** A resolved state recedes to `ink-3`. There is no
  attention-soon state.
- **Never fill a state.** No filled status pills, no washes behind state labels. A state is
  coloured text inside a border of the same colour.
- **Never use `live` as a fill for a region, a button, or a page.** It is an edge, a focus ring
  and a data mark.
- **Never put glass on anything that content does not pass beneath.** A card, a table, a form
  panel, a sidebar and a modal are all `panel`, however much a frosted one would look good.
- **Never blend two grounds.** A surface is `wash`, `panel` or `glass`. There is no intermediate
  tint and no partially translucent `panel`.
- **Never add a third series to a chart.** Two is the ceiling a monochrome ramp supports.
- **Never let motion be the only carrier of state.** Under reduced motion both edges must still
  read as edges.
- **Never add a third Latin family.** `sans` and `mono` only; `km` covers Khmer.
- **Never set `data-mode="dark"` on anything but the root element.**
- **Never introduce a colour, radius, spacing step, border width, duration or type family this
  file does not define.**
