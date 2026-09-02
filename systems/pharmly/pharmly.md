---
system: Pharmly
version: "1.0"
status: active
origin: reference
register: utility
density: spacious
scripts: [latin]
best-for: [admin dashboards, list-and-detail CRUD interfaces, portfolio presentation]
avoid-for: [point of sale, high-density catalogues, non-Latin scripts, anything requiring speed at a counter]
source-url: https://www.behance.net/
credit: "Pharmly — Pharmacy Management Admin Dashboard UI Design, published on Behance. Author credit to be filled in from the project page."
---

# Pharmly — scouted reference

> **This is my reading of someone else's public work, not my design.** Tokens below are extracted by eye from published screenshots and are approximations, not the original author's values. No assets are reproduced. Credit and source above; fill in the author's name before publishing this entry.

A pharmacy admin dashboard concept. Included because it does three things unusually well and gets three things visibly wrong, and both halves are useful.

---

## How to apply this file

**Don't apply it directly.** This is a reference record, not a system to build in. Use it to compare against, to borrow specific ideas from, or to argue with. If a project should be built in this style, fork it into an `origin: own` system first and fix what section 10 lists.

---

## 1. The core idea

A dark rail plus a light content area, with every screen built from the same template: summary cards → search and actions → data table → pagination. Consistency is total; the trade-off is that no individual screen is designed for its own job.

The distinguishing move is a **capsule chart language** — bars drawn as rounded pills against a ghost track showing the maximum. In a pharmacy product this is a domain idiom rather than a default, and it costs nothing.

---

## 2. Tokens

Approximated from screenshots. The type family, the spacing steps, and the status-pill wash
colours were **not** extracted: the family is named in the published work but never specified,
the spacing was added during migration because the preview template needs a step, and the wash
tints were not readable from the screenshots with any confidence. The three wash aliases are
declared `none` rather than guessed, so the preview renders status labels without a fill it
cannot vouch for.

```css
:root {
  --pine:      #1D4237;
  --pine-deep: #133029;
  --lime:      #C8E64C;
  --paper:     #F7F7F5;
  --card:      #FFFFFF;
  --ink:       #14201B;
  --ink-2:     #5C6660;
  --ink-3:     #929B96;
  --mist:      #E6E9E7;
  --ok:        #2EA05C;
  --warn:      #E3A33A;
  --fail:      #E15241;

  --radius-card: 16px;
  --radius-pill: 999px;

  --sans: "Poppins", system-ui, sans-serif;

  --gap:  12px;
  --pad:  18px 20px;

  --ds-bg:             var(--paper);
  --ds-surface:        var(--card);
  --ds-text:           var(--ink);
  --ds-text-2:         var(--ink-2);
  --ds-text-3:         var(--ink-3);
  --ds-line:           var(--mist);
  --ds-accent:         var(--lime);
  --ds-radius-box:     var(--radius-card);
  --ds-radius-control: var(--radius-pill);
  --ds-border-width:   0;
  --ds-border-color:   none;
  --ds-shadow:         none;
  --ds-button-bg:      var(--lime);
  --ds-button-text:    var(--ink);
  --ds-font-display:   var(--sans);
  --ds-font-body:      var(--sans);
  --ds-font-data:      none;
  --ds-gap:            var(--gap);
  --ds-pad:            var(--pad);
  --ds-success:        var(--ok);
  --ds-success-wash:   none;
  --ds-warn:           var(--warn);
  --ds-warn-wash:      none;
  --ds-alarm:          var(--fail);
  --ds-alarm-wash:     none;
  --ds-invert-bg:      var(--pine);
  --ds-invert-text:    var(--card);
  --ds-invert-accent:  var(--lime);
  --ds-hatch: repeating-linear-gradient(
    45deg, currentColor, currentColor 2px, transparent 2px, transparent 4px);
}
```

Dark mode was not published. Any dark treatment would be invented, not extracted.

### Colour rules, as observed

| Token | Means |
|---|---|
| `pine` | Nav rail, and exactly one filled stat card per screen |
| `lime` | **Action.** Active nav item plus the one primary button |
| `ok` / `warn` / `fail` | Status pills, as pale washes with strong text |

---

## 3. Type

A rounded geometric sans throughout — `sans` is Poppins or a close relative. One family, all weights. Figures are not tabular, which shows in the table columns.

---

## 4. Structure

Fixed ~220px dark rail with icon-and-label navigation, a promotional block pinned to its base, and logout beneath. Content on `paper`, everything in white 16px cards. Pill-shaped search, filters, export, and date range. Tables with per-row icon actions and pill pagination.

---

## 5. What it gets right

**Accent discipline.** Lime appears on exactly one element per screen — active nav plus one primary button — held across every published screen without a slip. That restraint is the single best thing in the project.

**Hatch as a secondary encoding.** The selected chart bar is diagonally hatched rather than recoloured, and the hour-by-weekday heatmap pairs hatch with tint. Meaning never rests on colour alone.

**Capsule bars over a ghost track.** The maximum stays visible behind every value, so a bar reads as a proportion rather than a height. Domain-appropriate and free.

**One filled card among unfilled ones.** Cheap hierarchy that needs no chart and no extra colour.

**Orders-by-time heatmap.** Genuinely actionable — it tells an owner when to staff.

---

## 6. Components worth noting

**Status pill** — pale wash, strong text, 999px. In stock / low stock / out of stock. Simple and it works.

**Stat card** — label, large value, delta chip with an arrow and a "since last week" caption. The filled variant inverts to pine with a lime chip.

**Capsule bar** — pine pill inside a `mist` pill track, hatched when selected.

---

## 7. Motion

Not published.

---

## 8. What I would take

- One accent, one use per screen — verbatim
- Capsule bars over a ghost track
- Hatch as a second encoding, promoted to a stated rule
- One filled card among unfilled ones
- Status pills as pale wash plus strong text

## 9. What is broken

Errors visible in the published screens, worth recording because they show the project was designed as an image rather than modelled:

- **"Total Customer — $12,500."** A currency symbol on a headcount.
- **Settings: Appearance reads "English", Language reads "Light."** The two values are swapped.
- **Mobile settings: "Desktop Notification — Select your language."** Wrong caption.
- **Top Selling Medicine lists Keytruda, Ozempic, Dupixent, Eliquis, Darzalex.** Specialty biologics — hospital and specialty-pharmacy drugs. An independent retail pharmacy sells none of them. That list came from a pharma revenue ranking, not from a shop.
- **20,579 products, 1,200 customers with email addresses.** That is a distributor, not a corner pharmacy.
- **Payment methods are Credit Card, PayPal, Bank Transfer.** Region-blind.

## 10. Structural problems

**Twelve summary cards above a four-row table**, on a catalogue of 20,579 products. The ratio is inverted: the cards are decoration and the table is the tool.

**Every screen is the same template.** Payments, Products, Customers, and Orders differ only in column headings. Efficient to produce, but it means no screen was designed for what it is for.

**There is no point of sale.** No cart, no cash tendered, no change, no barcode. The actual bottleneck in a pharmacy — selling quickly at a counter with a queue — does not exist in the project. That absence is the largest gap, and the clearest opening for anything built in response.

---

## 11. Never — if forking this

- A currency symbol on a count
- More than three summary cards
- One template applied to every screen regardless of purpose
- Placeholder data drawn from a different market or a different kind of business
- Shipping a management system with no till
