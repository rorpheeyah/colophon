---
system: Ration
version: "1.0"
status: active
origin: own
register: promotional
density: spacious
contrast: AA
scripts: [latin, khmer]
best-for: [product and marketing pages, pricing and plan comparison, launch announcements, documentation landing pages, bilingual promotional sites]
avoid-for: [operational dashboards, data entry, admin consoles, screens carrying live or transitional state]
---

# Ration

**Install:** copy this file into the target project as `.claude/design-system.md`, then add
this to that project's own `CLAUDE.md`:

```md
## Design system

This project follows Ration. The rules in @.claude/design-system.md are
binding for all UI work. Where a rule and your instinct disagree, the rule wins.
```

Everything below is binding.

A design system for pages that are selling something. Colour is rationed: it appears on the
thing the reader gets and on nothing else. Everything that carries structure — every border,
every label, every surface, every control — is achromatic. Large, light headlines; deep vertical
rhythm; nothing lifts.

---

## How to apply this file

Follow the rules literally. Where a rule and your instinct disagree, the rule wins.

When something isn't covered here, choose the option most consistent with the rules that are —
and prefer removing the element over inventing a new token for it. Do not introduce colours,
radii, shadows, borders, or type families that this file does not define. That is the most
common way a system decays.

Before colouring anything, answer one question: **is this the thing the reader gets?** If the
answer is no, it is neutral. See section 2.

**On installing this file.** Prefer the `@`-import above over pasting these rules into a
project's `CLAUDE.md`: the import keeps the system in context for every turn without displacing
the project's own rules, and updating the system later is a one-file copy. Installing instead as
`.claude/skills/design-system/SKILL.md` costs less context but is not guaranteed to load on any
given edit, which is how a system quietly stops being followed.

---

## 1. What this system changes

Several ideas here were taken from published product-marketing work: a headline where the phrase
naming the promise carries the accent, a small uppercase capsule announcing each section, large
headlines set light rather than bold, hairline-bordered cards that never lift, and a comparison
table that marks its recommended row by tinting the row. Those are behaviours, and behaviours
are portable.

What this system does differently:

| Axis | There | Here |
|---|---|---|
| **Chroma** | A brand hue and a slate neutral family, unreconciled — measured at two different hues | One chroma family, and neutrals at **exactly zero chroma**. The split is deliberate and checkable |
| **Placement** | Colour lands on payoff phrases, and also on glyphs, icon tiles and chrome | Colour lands on a payoff and nowhere else. Chrome is colourless by rule |
| **Gradient** | One gradient, on the hero, flat accents elsewhere — a pattern, not a stated rule | Stated: one gradient per page, hero only, never anywhere else |
| **Type** | Three families, including a monospace | One family. Figures align with `tabular-nums`, not with a second family |
| **States** | Framework state colours available and unused | No state colours at all. A page that is selling has nothing to report |
| **Reach** | Latin only | Latin and Khmer, with a per-script line-height rule |
| **Rigour** | No measured contrast floor | `contrast: AA` in both modes, enforced by the build |

The first row is the one that matters. There, the neutral family is a different hue from the
brand because a framework's defaults were never replaced — an accident. Here the neutrals are
colourless **on purpose**, because chroma is a scarce signal and spending it on a border is
spending it on nothing. Same visible split, opposite reasons, and only one of them can be
extrapolated to the next screen.

**Ration and Filament disagree, deliberately.** Filament makes every neutral a step of its
purple ramp, so the hue is everywhere and motion carries meaning. Ration keeps the hue almost
nowhere and lets its scarcity carry the meaning. They are opposite answers to the same question
and must never be mixed in one product.

---

## 2. The primitive

**Chroma is reserved for the payoff.** If a thing is coloured, it is the thing the reader gets.
Everything else is achromatic.

That is the whole system. Every other rule below is a consequence.

A payoff is one of exactly these, and nothing else:

| Payoff | Where colour is permitted |
|---|---|
| The promise | The phrase in a headline that names what the reader gets |
| The recommendation | The row, plan or option being recommended |
| The price | A figure the reader is being asked to accept |
| The quantity | A meter or single chart series showing what they receive |

Everything not on that list is neutral: borders, rules, labels, eyebrows, body copy, subheads,
captions, surfaces, nav, footer, buttons, icons, fine print. **A button is not a payoff** — it
is the invitation to collect one, so it is achromatic like the rest of the chrome.

The rule is machine-checkable, which is why it survives contact:

> **Every neutral in this system has equal red, green and blue channels.** If a hex is not of
> the form `#XXYYZZ` where `XX == YY == ZZ`, it is either a payoff colour or a bug.

There is no second chroma family. There is no muted brand tint used "just for warmth". A colour
that is not carrying a payoff is spending a scarce signal on nothing, and the next person will
spend it on something else, and then the system is gone.

---

## 3. Tokens

```css
:root {
  --paper:   #FFFFFF;
  --sheet:   #F7F7F7;
  --ink:     #141414;
  --ink-2:   #565656;
  --ink-3:   #6A6A6A;
  --rule:    #E4E4E4;
  --onyx:    #121212;
  --on-onyx: #FFFFFF;

  --payoff:      #8B4188;
  --payoff-lift: #AD52AA;
  --payoff-wash: #F6EDF6;
  --scrim-c:     rgba(18, 18, 18, .6);

  --promise: linear-gradient(90deg, var(--payoff), var(--payoff-lift));

  --sans: "Inter", system-ui, sans-serif;
  --km:   "Noto Sans Khmer", "Inter", sans-serif;

  --capsule: 999px;
  --box:     16px;
  --hair:    1px;

  --gap-tight: 8px;
  --gap:       20px;
  --gap-loose: 40px;
  --section:   96px;
  --pad:       24px 28px;

  --settle: 200ms;

  --clp-bg:             var(--sheet);
  --clp-surface:        var(--paper);
  --clp-card-fill:      var(--paper);
  --clp-text:           var(--ink);
  --clp-text-2:         var(--ink-2);
  --clp-text-3:         var(--ink-3);
  --clp-line:           var(--rule);
  --clp-accent:         var(--payoff);
  --clp-radius-box:     var(--box);
  --clp-radius-control: var(--capsule);
  --clp-border-width:   var(--hair);
  --clp-border-color:   var(--rule);
  --clp-shadow:         none;
  --clp-press:          scale(0.98);
  --clp-focus:          var(--ink);
  --clp-button-bg:      var(--onyx);
  --clp-button-text:    var(--on-onyx);
  --clp-button2-bg:     var(--paper);
  --clp-state-text:     none;
  --clp-font-display:   var(--sans);
  --clp-font-body:      var(--sans);
  --clp-font-data:      none;
  --clp-gap:            var(--gap);
  --clp-pad:            var(--pad);
  --clp-success:        none;
  --clp-success-wash:   none;
  --clp-warn:           none;
  --clp-warn-wash:      none;
  --clp-alarm:          none;
  --clp-alarm-wash:     none;
  --clp-invert-bg:      var(--onyx);
  --clp-invert-text:    var(--on-onyx);
  --clp-invert-accent:  var(--payoff-lift);
  --clp-hatch:          none;
  --clp-font-script:    var(--km);
  --clp-scrim:          var(--scrim-c);
  --clp-shadow-surface: none;
  --clp-chart-1:        var(--payoff);
  --clp-chart-2:        none;
  --clp-chart-3:        none;
  --clp-chart-4:        none;
  --clp-chart-5:        none;
  --clp-duration:       var(--settle);
  --clp-glass:          none;
  --clp-glass-edge:     none;
  --clp-blur:           none;
  --clp-gradient:       var(--promise);
  --clp-weight-display: 500;
}

[data-mode="dark"] {
  --paper:   #161616;
  --sheet:   #0E0E0E;
  --ink:     #F2F2F2;
  --ink-2:   #A8A8A8;
  --ink-3:   #8E8E8E;
  --rule:    #2A2A2A;
  --onyx:    #050505;

  --payoff:      #C964C5;
  --payoff-lift: #E3A5E0;
  --payoff-wash: #2A122A;
}
```

Dark mode is required, not optional. Every screen must work in both. **Dark is a token layer**:
the block above redeclares values, and nothing anywhere else carries a mode-specific literal.

Set `data-mode="dark"` on the **root element**. Scoped to a wrapper it will not work: a `var()`
inside a custom property resolves where the property is declared, so the `--clp-*` aliases would
keep their light values.

**Count the neutrals.** `paper`, `sheet`, `ink`, `ink-2`, `ink-3`, `rule`, `onyx`, `on-onyx` —
eight tokens in each mode, every one with equal red, green and blue channels. Three tokens carry
chroma. That ratio is the system.

**There are no state colours.** `success`, `warn` and `alarm` are all declined, with their
washes. A page that is selling something has nothing to report — no deploy is failing, no job is
running. A surface that needs to report an operational state is the wrong surface for this
system, and Filament is the right one.

**`--clp-focus` is `ink`, not the payoff.** A focus ring is not a payoff, and the primitive does
not get an exception on its first page. Achromatic works in both modes and needs no carve-out.

### Colour rules

| Token | Means |
|---|---|
| `payoff` | The thing the reader gets. The promise phrase, the recommended row, the price |
| `payoff-lift` | The far end of the hero gradient, and the accent on an inverted surface |
| `payoff-wash` | The tint on a recommended row, and nothing else |
| `promise` | The **one** gradient. Hero headline phrase only |
| `ink-3` | Fine print, captions, anything the reader may skip |
| `onyx` | Every control, and the inverted surface |

**One gradient per page.** `promise` sets the hero's payoff phrase and appears nowhere else —
not on a button, not on a card, not on a border, not on a second heading. A gradient used twice
is a decoration; used once it is the loudest thing on the page, which is what the top of a page
is for.

**Flat below the fold.** Every payoff after the hero is flat `payoff`. Depth of treatment marks
rank, so there is exactly one first place.

---

## 4. Type

**One family.** `sans` sets everything Latin; `km` covers Khmer. There is no display face and no
monospace — figures align with `font-variant-numeric: tabular-nums`, applied at `body` level,
which is what a monospace would have been imported to do.

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Hero headline | 88px | 500 | −0.03em |
| Section headline | 48px | 500 | −0.02em |
| Subhead | 18px | 400 | 0 |
| Body | 16px | 400 | 0 |
| Price figure | 32px | 500 | −0.02em, tabular |
| Eyebrow | 12px | 700 | +0.06em, uppercase |
| Fine print | 13px | 400 | 0 |

**Size carries emphasis, weight does not.** Both headline roles are weight 500 — the same weight
as a price and lighter than an eyebrow. An 88px headline does not need to be bold to be loud,
and setting it bold makes a page shout at a reader who has not yet been told anything. There is
no headline heavier than 500 in this system.

**The eyebrow is the only uppercase.** 12px, weight 700, tracked +0.06em, inside a `capsule`
with a `--hair` border. It names the section's subject in two or three words and never contains
a verb. Uppercase appears nowhere else — not on buttons, not on column heads, not on labels.

**The promise phrase.** Every headline is one sentence in which exactly one phrase carries
`payoff`, and that phrase is the one naming what the reader gets. Not the verb, not the subject
— the payoff. *"Build, deploy and scale **without limits**."* If a headline has no such phrase,
it is not finished; if it has two, one of them is not a payoff.

### Bilingual conventions

Khmer sets in `km` at the same weight as its Latin sibling, with line-height raised roughly 0.15
above the Latin value so bilingual blocks keep an even rhythm. Khmer and Latin frequently share a
line — never assume a block is one script.

**Khmer headlines do not take the Latin tracking.** The negative tracking in the table above
applies to Latin only; Khmer sets at 0. Tightening Khmer collides its marks.

A promise phrase in a Khmer headline carries `payoff` exactly as a Latin one does. The rule is
about meaning, not about script.

---

## 5. Structure

**One column, centred, the whole way down.** Sections are centred; content inside a card is
left-aligned. There is no two-column marketing layout in this system and no left-aligned section
heading.

**A section is three parts, in this order:** eyebrow capsule, headline, subhead. The eyebrow is
optional, the other two are not, and nothing else may sit between them.

**Vertical rhythm is the separation.** `--section` between sections, `gap-loose` between blocks
within one, `gap` between grouped items, `gap-tight` inside a group. **Sections are never
separated by alternating background bands** — the page is one ground from top to bottom, and
distance does the work a stripe would have done.

| Ground | Used by |
|---|---|
| `sheet` | The page |
| `paper` | Cards, tables, panels — anything the page contains |
| `onyx` | The inverted band, and every control |

**Every surface has an edge and nothing lifts.** A `--hair` border in `rule`, radius `box`. No
shadow on a card, a control, a nav, a popover or a modal. Separation is the edge and the rhythm.

**Cards are equal.** A grid of cards is a grid of equals: same padding, same edge, same fill. A
card is never enlarged, tinted or elevated to mark it as important — if one option is
recommended, that belongs in a table row, where the comparison is legible.

**A comparison table marks its recommendation by tinting the row** in `payoff-wash`, with the
plan name in `payoff`. One row per table, never two. The tint is a payoff and is the only place
`payoff-wash` appears.

**Density is spacious and that is a commitment.** This system trades screens-per-scroll for
room. If content needs to be dense, it is the wrong system.

---

## 6. Components

Every value below is a token reference. Nothing here restates a colour.

| Component | Rule |
|---|---|
| Primary button | `--clp-button-bg` fill, `--clp-button-text`, `capsule`, `pad`. Never coloured |
| Secondary button | `--clp-button2-bg` fill, `--clp-text`, `capsule`, `--hair` edge in `rule` |
| Ghost button | Transparent, `--clp-text-2`, no edge until hover |
| Eyebrow capsule | `paper` fill, `--hair` edge in `rule`, `capsule`, text in `--clp-text-2` |
| Announcement pill | `paper` fill, `--hair` edge in `rule`, `capsule`, with a trailing arrow |
| Card | `--clp-card-fill`, `--hair` edge in `rule`, `box`, `pad` |
| Card grid | Equal cards, `gap`. Never a featured card |
| Comparison table | On `paper` in a `box` container, `rule` hairlines between rows; recommended row tinted `payoff-wash` |
| Price | `payoff`, tabular, with its period in `--clp-text-3` beside it |
| Tab switcher | `capsule` track in `sheet`, active tab `onyx` with `--clp-invert-text` |
| Inverted band | `--clp-invert-bg`, `--clp-invert-text`, accent `--clp-invert-accent` |
| Q&A card | Same as card. Question in `--clp-text`, answer in `--clp-text-2` |
| Chart, meter | `--clp-chart-1` only. Axes and grid in `--clp-line` |
| Focus ring | `--clp-focus` at 2px. Never removed |

**One chart series, and no legend.** A promotional chart shows one quantity — what the reader
gets. Two series is a comparison, and a comparison belongs in the table.

**One inverted band per page at most.** It is the second loudest thing after the hero, and two
of them means neither is.

---

## 7. Motion

Motion here is functional and quiet. Nothing in this system moves to attract attention.

**Chrome contracts as you descend.** Persistent navigation begins flush and full-width on
`paper`. Once the page is scrolled past the hero it detaches into a floating `capsule`, inset
from the edges and narrower than the bar it replaced. It transitions width, inset and ground
over `--settle`. It does not lift, because nothing lifts.

**Press.** `--clp-press` on every control. There is no shadow to flatten.

**Reveal on scroll is permitted once per section, and must be a fade only** — no translate, no
scale, no stagger. A section that assembles itself as you arrive is telling the reader to wait,
which is the opposite of what a page selling something should do.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, reveals are removed entirely and the
nav contracts without transition. Nothing in this system carries meaning through motion, so
nothing is lost.

**A note on the specimen.** The generated preview renders one static frame per mode and has no
alias for a gradient, so `promise` — the hero treatment, and the system's loudest single
decision — does not appear in the specimen at all. The preview will show `payoff` flat wherever
a gradient belongs. That is a limitation of the preview contract, not a softening of the rule,
and no alias was invented to work around it.

---

## 8. Never

- **Never colour anything that is not a payoff.** Not a border, not an icon, not a label, not an
  eyebrow, not a nav item, not a button. If it is coloured, name the payoff or make it neutral.
- **Never introduce a neutral that is not strictly achromatic.** Every neutral has equal red,
  green and blue channels. A "slightly warm grey" is a second chroma family arriving quietly.
- **Never add a second chroma family.** One hue, three tokens. A teal for variety is the end of
  the system.
- **Never use the gradient more than once per page**, and never anywhere but the hero's promise
  phrase.
- **Never colour the primary button.** It is the invitation, not the payoff.
- **Never set a headline heavier than 500.** Size carries emphasis. A bold headline shouts at a
  reader who has not been told anything yet.
- **Never use uppercase outside the eyebrow.** Not on buttons, column heads, labels or headings.
- **Never put a shadow on anything.** Not on a card, a control, a nav, a popover or a modal.
- **Never separate sections with alternating background bands.** The page is one ground and
  rhythm does the work.
- **Never feature a card by enlarging, tinting or elevating it.** A recommendation belongs in a
  table row.
- **Never tint two rows in one table.** One recommendation, or none.
- **Never add a state colour.** No success, no warning, no alarm. A surface needing one is the
  wrong surface for this system.
- **Never add a monospace family.** `tabular-nums` is why it is not needed.
- **Never add a second chart series.** A comparison belongs in the table.
- **Never let a scroll reveal translate, scale or stagger.** Fade only, once per section.
- **Never ship Latin-only.** Khmer is declared in `scripts`, and a Khmer headline carries its
  promise phrase in `payoff` exactly as a Latin one does.
- **Never apply Latin negative tracking to Khmer.** It collides the marks.
- **Never set `data-mode="dark"` on anything but the root element.**
- **Never mix this system with Filament.** They are opposite answers to where colour belongs.
- **Never introduce a colour, radius, spacing step, border width, duration or type family this
  file does not define.**
