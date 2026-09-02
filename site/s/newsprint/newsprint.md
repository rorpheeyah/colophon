---
system: Newsprint
version: "1.0"
status: active
origin: own
register: editorial
density: comfortable
contrast: AA
scripts: [latin, khmer]
best-for: [long-form reading, documentation, reports and printed output, bilingual editorial layouts, ruled data tables]
avoid-for: [high-speed data entry, dense operational dashboards, touch-first mobile interfaces]
---

# Newsprint

**Install:** copy this file into the target project as `.claude/design-system.md`, then add
this to that project's own `CLAUDE.md`:

```md
## Design system

This project follows Newsprint. The rules in @.claude/design-system.md are
binding for all UI work. Where a rule and your instinct disagree, the rule wins.
```

Everything below is binding.

> **Every text colour here clears WCAG AA on both surfaces**, in both modes. That is a
> constraint of the system, not a coincidence: status is carried by type colour and a 1px border
> of the same colour, never by a fill, so `teal`, `mark` and `flag` have to be legible as text.
> A replacement colour that does not clear 4.5:1 on `paper` and on `stock` is not a candidate.

An editorial, print-inspired system with first-class Khmer and Latin support. Intended as a shared foundation across projects: documentation, reports, reading surfaces, and anything that will eventually be printed.

---

## How to apply this file

Follow the rules literally. Where a rule and your instinct disagree, the rule wins.

When something isn't covered here, choose the option most consistent with the rules that are — and prefer removing the element over inventing a new token for it. Do not introduce colours, shadows, type families, or decorative details this file does not define.


**On installing this file.** Prefer the `@`-import above over pasting these rules into a
project's `CLAUDE.md`: the import keeps the system in context for every turn without displacing
the project's own rules, and updating the system later is a one-file copy. Installing instead as
`.claude/skills/design-system/SKILL.md` costs less context but is not guaranteed to load on any
given edit, which is how a system quietly stops being followed.
---

## 1. The core idea

The page is a printed page. Structure is carried by **rules and column alignment**, not by cards, fills, or elevation. Where a screen design would reach for a container, this system reaches for a hairline and a shared baseline.

Two consequences that explain most of what follows:

- **Depth is not a spatial metaphor here.** The single shadow in the system is a zero-blur offset — a printer's registration mark, not a drop shadow. It means *pressable*, and nothing else.
- **Print is not an export target, it is the native register.** Receipts, reports, and checklists inherit the screen rules directly, at 58mm and A5.

---

## 2. Tokens

```css
:root {
  --paper:   #F4F2EC;
  --stock:   #FFFFFF;
  --ink:     #1B1A17;
  --ink-2:   #545149;
  --ink-3:   #726E65;
  --rule:    #D8D5CB;
  --rule-2:  #B4B0A4;
  --teal:    #0E6E60;
  --mark:    #8A5A0B;
  --flag:    #A32A1E;

  --offset:  3px;
  --radius:  2px;

  --gap-tight: 8px;
  --gap:       16px;
  --gap-loose: 28px;
  --pad:       20px 22px;


  --display: "Archivo", system-ui, sans-serif;
  --body:    "Kantumruy Pro", system-ui, sans-serif;
  --data:    "JetBrains Mono", ui-monospace, monospace;

  --ds-bg:             var(--paper);
  --ds-surface:        var(--stock);
  --ds-text:           var(--ink);
  --ds-text-2:         var(--ink-2);
  --ds-text-3:         var(--ink-3);
  --ds-line:           var(--rule);
  --ds-accent:         var(--ink);
  --ds-radius-box:     var(--radius);
  --ds-radius-control: var(--radius);
  --ds-border-width:   1px;
  --ds-border-color:   var(--ink);
  --ds-shadow:         var(--offset) var(--offset) 0 var(--ink);
  --ds-button-bg:      var(--stock);
  --ds-button-text:    var(--ink);
  --ds-button2-bg:     var(--stock);
  --ds-font-display:   var(--display);
  --ds-font-body:      var(--body);
  --ds-font-data:      var(--data);
  --ds-gap:            var(--gap);
  --ds-pad:            var(--pad);
  --ds-success:        var(--teal);
  --ds-success-wash:   none;
  --ds-warn:           var(--mark);
  --ds-warn-wash:      none;
  --ds-alarm:          var(--flag);
  --ds-alarm-wash:     none;
  --ds-invert-bg:      none;
  --ds-invert-text:    none;
  --ds-invert-accent:  none;
  --ds-state-text:     none;
  --ds-hatch:          none;
  --ds-font-script:    var(--body);
  --ds-scrim:          none;
  --ds-shadow-surface: none;
  --ds-chart-1:        none;
  --ds-chart-2:        none;
  --ds-chart-3:        none;
  --ds-chart-4:        none;
  --ds-chart-5:        none;
}

[data-mode="dark"] {
  --paper:   #191917;
  --stock:   #212020;
  --ink:     #EDEBE3;
  --ink-2:   #AEABA1;
  --ink-3:   #8B877D;
  --rule:    #302F2B;
  --rule-2:  #494640;
  --teal:    #54C1AF;
  --mark:    #DCA842;
  --flag:    #EB8B76;
}
```

Dark mode is required, not optional. Every surface must work in both.

Set `data-mode="dark"` on the **root element**. Scoped to a wrapper it will not work: a
`var()` inside a custom property resolves where the property is declared, so the `--ds-*`
aliases would keep their light values.

### Colour rules

| Token | Means |
|---|---|
| `ink` | All text, all rules, the offset shadow |
| `teal` | **The positive pole.** Healthy, resolved, correct |
| `mark` | Needs attention soon |
| `flag` | Needs attention now, or an error |
| `rule` / `rule-2` | Hairlines. `rule-2` for structural divisions, `rule` for rows |

Three semantic states — positive, attention, alarm. Enough to be read without a legend. Do not add a fourth.

---

## 3. Type

Three families — `display`, `body`, `data` — each with a fixed job. Never substitute one for another's role.

| Family | Carries |
|---|---|
| **Archivo** | Masthead, section headings, component titles. Display only — never body text |
| **Kantumruy Pro** | All body text, in **both** Khmer and Latin, at one optical weight |
| **JetBrains Mono** | Every figure — prices, quantities, dates, IDs, batch numbers — and small tracked-uppercase labels |

| Role | Family | Size | Weight | Tracking |
|---|---|---|---|---|
| Masthead | display | 42px | 800 | −0.03em |
| Section head | display | 15px | 700 | +0.01em |
| Body | body | 15px | 400 | 0 |
| Secondary | body | 13px | 400 | 0 |
| Figure, large | data | 26–30px | 700 | −0.04em |
| Figure, inline | data | 14px | 500 | 0 |
| Label | data | 10–11px | 500 | +0.08em, uppercase |

**Mono is not decoration.** It exists so that every figure in a table right-aligns into one vertical spine down the page. That spine is what makes a ruled table scannable, and it is the reason a third family is justified at all.

Uppercase is permitted **only** on mono labels and column heads. Everything else is sentence case.

### Bilingual conventions

Kantumruy Pro sets Khmer and Latin at one optical weight, so a mixed row keeps even colour without per-script overrides. Raise line-height roughly 0.15 above the Latin value on any block that may contain Khmer — which is most of them.

- **Fully Khmer interface:** Khmer label, Khmer value, no Latin fallback in the label.
- **Mixed interface:** Latin label, value in whichever script the data is in. Never translate a product or person's name to match the label.

---

## 4. Structure

**Rules, not cards.** A hairline and a shared column edge carry the structure. Do not wrap content in filled containers to group it.

**One `ink` rule per structural division**, `rule` hairlines between rows, `rule-2` between columns and sections. A container gets a 1px `ink` border; it never gets a fill to distinguish it from the page.

**Column alignment is the layout.** Figures right-align, labels left-align, and the alignment holds down the whole page. Breaking alignment for one row breaks the system.

**Vertical rhythm.** `gap-tight` inside a group, `gap` between groups, `gap-loose` between
sections, `pad` for container padding. Four steps, no fifth, and no arbitrary margin between
them — the rhythm is what makes a ruled page read as typeset rather than assembled.

`--radius: 2px` — effectively square. This is a print system; nothing here is a pill.

---

## 5. Depth — the offset shadow

```css
box-shadow: var(--offset) var(--offset) 0 var(--ink);
```

Zero blur, 3px, `ink`. This is the entire interaction language of the system.

- Applied **only to controls** — buttons, and at most one hero block per page.
- **Never** on containers, cards, tables, headers, or navigation.
- On press: `transform: translate(3px, 3px)` and drop the shadow to zero, so the element lands flush.

If a shadow appears on something that cannot be pressed, it is wrong.

---

## 6. The deckle

A torn-paper edge, rendered as an SVG path, is the system's single signature detail.

**It appears exactly once per surface** — beneath the masthead, or on printed output. Used twice it stops being a signature and becomes a texture. There is no second decorative element in this system, and none should be added.

---

## 7. Components

**Button** — 2px radius, 1px `ink` border, `stock` fill, offset shadow. Press translates and flattens.

**Table** — column heads in mono, tracked uppercase, on `paper`. Rows separated by 1px `rule`. Figures right-aligned in mono. No zebra striping, no row fills, no hover fill.

**Group header** — Archivo title, a mono count in a 1px bordered box, and exactly one underlined text action on the right. Nothing else.

**Status label** — mono, 11px, tracked, in `teal` / `mark` / `flag`, with a 1px border of the same colour. Not a filled pill.

**Print surfaces** — receipt, checklist, report — inherit these rules unchanged at 58mm and A5. Design them last; if they need special rules, the screen rules were wrong.

---

## 8. Motion

One moment per surface, tied to a user action that changed data, plus the press state on controls. Nothing ambient, nothing on load. Wrap in `@media (prefers-reduced-motion: no-preference)`.

---

## 9. Never

- A blurred, soft, or coloured shadow of any kind
- The offset shadow on anything that cannot be pressed
- The deckle more than once per surface
- A second decorative detail
- Archivo in body text, or Kantumruy Pro carrying figures
- Filled cards or pills used to group content
- A radius above 2px
- A fourth semantic colour
- A fifth spacing step, or a margin that is not one of the four
- A text colour that does not clear 4.5:1 on both `paper` and `stock`, in both modes
- Uppercase outside mono labels and column heads
- Print treated as an afterthought
