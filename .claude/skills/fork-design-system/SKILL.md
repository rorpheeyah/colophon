---
name: fork-design-system
description: Fork an existing reference record into a new original design system, carrying what it got right and refusing what it got wrong. Use when the user wants to build in the style of a scouted reference, or to turn a reference record into something installable. For authoring from scratch use new-design-system; for recording someone else's work use scout-design-system.
---

# fork-design-system

Turns a reference record into an `origin: own` system that can actually be installed.

Read `CLAUDE.md` first. It holds the format contract, the 42 `--clp-*` aliases, and the
required sections. This skill is the process; CLAUDE.md is the specification. Where they
disagree, CLAUDE.md wins.

Every reference record already says this is the intended path — *"fork it into an `origin: own`
system first and fix what its problem sections list"*. Nothing automated it until now.

---

## Boundaries

You may write:

- `systems/<new-slug>/<new-slug>.md`
- `systems/<new-slug>/preview.html`, `thumb-light.svg`, `thumb-dark.svg` — only by running
  `scripts/build-previews.mjs`
- exactly one appended entry at the end of `index.json`

**Never modify the reference record you are forking from.** It is the evidence. If the fork
reveals that the record is wrong, say so and stop — correcting a reading is a separate change
with its own reasoning.

---

## Step 1 — read the record, and take its own verdicts seriously

A reference record is already an argument. It has a section naming what it got right and a
section naming what is broken. Those are the two halves of the brief.

**Carry over what the record praises.** Its "What I would take" section exists precisely to be
read at this moment. Quote each item back to the user and confirm it survives the fork.

**Refuse what the record criticises.** This is the part that makes the skill opinionated. If the
record says twelve summary cards above a four-row table inverted the hierarchy, the fork does
not get twelve summary cards, and the prohibition goes in the new file's **Never** section in
those words. If the user asks for something the record condemned, say plainly that the record
they are forking from argues against it, and make them overrule it explicitly rather than by
omission.

Do not carry over the record's structural problems as "inherited". A fork that reproduces the
faults is a copy, and a copy of someone else's work is not yours to license.

## Step 2 — interview only for what the record could not observe

A reading of published screenshots has gaps by construction, and those gaps are the interview.
Look at what the record declined and ask about each:

| commonly declined | ask |
|---|---|
| no `[data-mode="dark"]` block | the whole dark palette — this is usually the biggest gap |
| `--clp-gap` / `--clp-pad` | the spacing step, if any |
| the wash tints | whether states fill, border, or colour their text |
| `--clp-chart-*` | the series palette, in order, and how many |
| `--clp-font-data` | whether figures get their own family |
| `--clp-press`, `--clp-focus` | the interaction states |

Do not re-ask what the record already establishes. If it recorded an accent used exactly once
per screen, that is a decision already made; confirm it, do not reopen it.

## Step 3 — the palette is now yours, so it is now checked

The reference's colours were approximations of someone else's work and were never held to a
floor. **A fork is original work and should be.** Recommend `contrast: AA` and run
`node scripts/contrast.mjs <slug>` while values are being chosen — text roles in both modes, and
adjacent chart series at ΔE 15 normal and 6 simulated.

Expect the approximated values to fail. That is the normal outcome and the most valuable thing
the fork does: the record's tertiary text or its status colours will often be a step short,
because nobody measured them. Fix them here and say in the file that they were corrected.

## Step 4 — name it, and let the user choose

The new system needs its own name and slug. **Propose two or three and stop.** Naming is the
user's, not yours. Do not reuse the reference's name with a suffix — a fork that is called
`pharmly-2` reads as a version of someone else's work rather than a system of your own.

## Step 5 — credit the original, in the file

A fork of a reading of someone's work still owes them attribution. The new file is
`origin: own`, so it carries no `credit` field, and the acknowledgement goes in the body
instead — near the top, in the author's own words where possible:

```
Forked from a reference record of <work> by <authors>, published <where and when>.
The reading, the corrections and everything below are mine; the original design is theirs.
```

Then link the reference record's own page so the provenance chain stays walkable.

## Step 6 — the rest is `new-design-system`

Follow that skill's steps for the prohibition list, the one-pass token block, showing the draft
before writing, the install block, appending one `index.json` entry, and validating. A fork is a
normal `origin: own` system from here on.

```
pnpm build                       previews and thumbnails, then the site
node scripts/validate.mjs <slug>
node scripts/contrast.mjs <slug>
pnpm check
```

`pnpm build` rather than `build-previews.mjs` alone: `validate.mjs` checks the site's freshness
too, so a new slug that has no library card yet fails as `site out of date`.

Do not report done if any of those fail. Then open a PR. Never commit to `main`.
