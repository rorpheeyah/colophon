---
system: Lozenge
version: "1.0"
status: active
origin: own
register: utility
density: compact
scripts: [latin, khmer]
best-for: [dense data tables, retail and POS interfaces, inventory and status screens, bilingual products]
avoid-for: [long-form reading, marketing pages, editorial layouts]
---

# Lozenge

**Install:** copy this file into the target project as `.claude/design-system.md`, then add
this to that project's own `CLAUDE.md`:

```md
## Design system

This project follows Lozenge. The rules in @.claude/design-system.md are
binding for all UI work. Where a rule and your instinct disagree, the rule wins.
```

Everything below is binding.

A design system for retail and operational software. One primitive — the capsule — repeated at every scale, from a coverage segment to a chart bar. Built for dense, bilingual, decision-oriented screens.

---

## How to apply this file

Follow the rules literally. Where a rule and your instinct disagree, the rule wins.

When something isn't covered here, choose the option most consistent with the rules that are — and prefer removing the element over inventing a new token for it. Do not introduce colours, radii, shadows, borders, or type families that this file does not define. That is the most common way a system decays.


**On installing this file.** Prefer the `@`-import above over pasting these rules into a
project's `CLAUDE.md`: the import keeps the system in context for every turn without displacing
the project's own rules, and updating the system later is a one-file copy. Installing instead as
`.claude/skills/design-system/SKILL.md` costs less context but is not guaranteed to load on any
given edit, which is how a system quietly stops being followed.
---

## 1. The primitive

Every element that **carries data or invites a press** is a lozenge — fully rounded, `999px`.
Every element that **only contains other things** is a rounded box — `14px`.

There is no third radius, and no case where a container is fully rounded or a button is boxed. Shape encodes role, which is why this system needs no borders at all.

The same shape appears at every scale:

| Scale | Use |
|---|---|
| ~14px tall | Coverage segment, meter cell |
| ~20px tall | Status pill, badge, delta chip |
| ~34px tall | Input, search field |
| ~36px tall | Button, active nav item |
| ~80px tall | Chart bar |

---

## 2. Tokens

```css
:root {
  --hemlock:   #0C2822;
  --hemlock-2: #164237;
  --citron:    #D8ED4B;
  --paper:     #F1F3F2;
  --card:      #FFFFFF;
  --ink:       #111815;
  --ink-2:     #5B665F;
  --ink-3:     #8E9992;
  --mist:      #DFE4E1;
  --amber:     #E0952B;
  --amber-w:   #FBF0DC;
  --verm:      #E04B33;
  --verm-w:    #FCE6E1;

  --on-hemlock: #E9EFEB;
  --nav-idle:   rgba(255,255,255,.66);
  --ghost:      rgba(255,255,255,.12);

  --sans: "Figtree", system-ui, sans-serif;
  --km:   "Noto Sans Khmer", "Figtree", sans-serif;

  --lz:  999px;
  --box: 14px;

  --gap-tight: 6px;
  --gap:       10px;
  --gap-loose: 16px;
  --pad-card:  14px 16px;
  --pad-main:  20px 22px;

  --ds-bg:             var(--paper);
  --ds-surface:        var(--card);
  --ds-text:           var(--ink);
  --ds-text-2:         var(--ink-2);
  --ds-text-3:         var(--ink-3);
  --ds-line:           var(--mist);
  --ds-accent:         var(--citron);
  --ds-radius-box:     var(--box);
  --ds-radius-control: var(--lz);
  --ds-border-width:   0;
  --ds-border-color:   none;
  --ds-shadow:         none;
  --ds-button-bg:      var(--citron);
  --ds-button-text:    var(--hemlock);
  --ds-button2-bg:     var(--mist);
  --ds-font-display:   var(--sans);
  --ds-font-body:      var(--sans);
  --ds-font-data:      none;
  --ds-gap:            var(--gap);
  --ds-pad:            var(--pad-card);
  --ds-success:        none;
  --ds-success-wash:   none;
  --ds-warn:           var(--amber);
  --ds-warn-wash:      var(--amber-w);
  --ds-alarm:          var(--verm);
  --ds-alarm-wash:     var(--verm-w);
  --ds-invert-bg:      var(--hemlock);
  --ds-invert-text:    var(--on-hemlock);
  --ds-invert-accent:  var(--citron);
  --ds-hatch: repeating-linear-gradient(
    45deg, currentColor, currentColor 2px, transparent 2px, transparent 4px);
  --ds-font-script:    var(--km);
  --ds-scrim:          none;
  --ds-shadow-surface: none;
  --ds-chart-1:        var(--hemlock);
  --ds-chart-2:        none;
  --ds-chart-3:        none;
  --ds-chart-4:        none;
  --ds-chart-5:        none;
}

[data-mode="dark"] {
  --hemlock:   #0A211C;
  --hemlock-2: #153A31;
  --paper:     #0E1412;
  --card:      #161E1B;
  --ink:       #E9EFEB;
  --ink-2:     #9BA8A1;
  --ink-3:     #6B7873;
  --mist:      #27322D;
  --amber-w:   #2E230F;
  --verm-w:    #2F1712;
}
```

Dark mode is required, not optional. Every screen must work in both.

Set `data-mode="dark"` on the **root element**. Scoped to a wrapper it will not work: a
`var()` inside a custom property resolves where the property is declared, so the `--ds-*`
aliases would keep their light values.

### Colour rules

| Token | Means |
|---|---|
| `hemlock` | Structure — nav rail, filled cards, filled data |
| `citron` | **Action.** One element per screen |
| `mist` | Neutral, resolved, nothing to do here |
| `amber` | Needs attention soon |
| `verm` | Needs attention now |

**Citron appears on exactly one element per screen** — the active nav item, or the single primary action, not both. If two things are citron, one of them is a bug. Citron is never a chart fill, never a status pill, never a background, never text.

**There is no success colour.** A resolved state renders in `mist` and recedes. Colour means something needs doing.

---

## 3. Hatch means projection

Diagonal hatch is the second encoding, so meaning never rests on colour alone.

- **Solid fill = a fact.** Stock you have. Revenue already taken.
- **Hatched fill = a forecast or a risk.** Days you'd be out of stock. A day still in progress. Inventory that may expire.

```css
background: repeating-linear-gradient(
  45deg, var(--verm), var(--verm) 2px, transparent 2px, transparent 4px
);
```

Apply the same rule everywhere. Never use hatch decoratively.

---

## 4. Type

Two families, no third: `sans` for Latin, `km` for Khmer. No monospace — column alignment comes from `font-variant-numeric: tabular-nums`, applied at `body` level.

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Page title | 19px | 700 | −0.02em |
| Big figure | 27–36px | 800 | −0.04em |
| Body, table cell | 14–15px | 400–600 | 0 |
| Secondary | 12.5px | 400 | 0 |
| Label, column head | 11px | 700 | +0.07em, uppercase |

Uppercase is permitted **only** on table column headers and small labels. Never on headings, buttons, or body text. Everything else is sentence case.

Khmer sets in `--km` at the same weight as its Latin sibling, with line-height raised roughly 0.15 above the Latin value so bilingual rows keep an even rhythm. Khmer and Latin frequently share a line — never assume a row is one script.

---

## 5. Structure

**No borders. No shadows.** Separation comes from surface steps: `paper` behind, `card` in front. If you reach for a border, you have missed a surface step.

**Maximum three summary cards per screen.** If a screen seems to need more, the screen has no point of view — cut, don't add. Exactly one card may be filled `hemlock`; the rest sit on `paper`.

**Tables dominate.** Cards are a glance, the table is the work. A screen where cards occupy more vertical space than rows is wrong.

Column heads sit on a `paper` lozenge strip. Rows separate with a 1px `mist` line — the one permitted line in the system, and it is a row separator, never a container edge.

---

## 6. Components

**Button** — lozenge, 36px, no border. Primary is `citron` on `hemlock` text. Secondary is `mist` on `ink`. On dark surfaces, secondary is `ghost`.

**Status pill** — lozenge, 11.5px/700, wash background with the matching strong colour as text: `mist`/`ink-2`, `amber-w`/`amber`, `verm-w`/`verm`. An at-risk state adds hatch over the wash.

**Stat card** — `14px` box. Label 12px `ink-3`, value 27px/800, delta as a lozenge chip beneath. The filled variant inverts to `hemlock`, text `on-hemlock`, with a `citron` chip.

**Nav item** — lozenge, 36px. Inactive is `nav-idle` on `hemlock`. Active is filled `citron` with `hemlock` text and weight 700.

**Chart bar** — a `hemlock` lozenge inside a full-height `mist` lozenge track, so the maximum is always visible behind the value. In-progress periods use hatch.

**Coverage meter** — ten lozenge segments in a row. Filled segments are days remaining; hatched segments are days short. Colour follows the state.

**Input** — lozenge, 34px, `paper` fill, no border, placeholder `ink-3`.

---

## 7. Currency and bilingual rules

Written for Cambodian retail; carry these forward wherever both apply.

- A KHR figure sits permanently beneath every USD total. Never behind a toggle, never on hover.
- Change is displayed in the denominations physically handed over, not as a decimal.
- Derived and estimated numbers carry a tilde: `~5 days`, never `5 days`.
- Product and person names may be Khmer, Latin, or both on one line.

---

## 8. Motion

One moment per screen, tied to a user action that changed data. Nothing ambient, nothing on load, nothing decorative. Wrap everything in `@media (prefers-reduced-motion: no-preference)`.

---

## 9. Never

- A third radius, or a border anywhere
- Any shadow, including subtle ones
- Citron on more than one element per screen
- A green or blue "success" state
- Hatch used decoratively
- A monospace family
- Uppercase outside column heads and small labels
- More than three summary cards
- A colour, size, or family not defined in this file
