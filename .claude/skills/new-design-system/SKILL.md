---
name: new-design-system
description: Interview the user and write a new original design system into systems/<slug>/. Use when the user wants to add, create, or author a design system of their own. For reverse-engineering someone else's published work, use scout-design-system instead.
---

# new-design-system

Adds one original system (`origin: own`) to the library.

Read `CLAUDE.md` first. It holds the format contract, the required frontmatter set, the
required sections, and the `--ds-*` preview contract. This skill is the process; CLAUDE.md is
the specification. Where they disagree, CLAUDE.md wins.

**Your job is coherence.** System twelve must have the same shape as system two, or the files
stop being reliably drop-in. That matters more than capturing every nuance of this one system.

---

## Boundaries

You may write:

- `systems/<slug>/<slug>.md`
- `systems/<slug>/preview.html` — only by running `scripts/build-previews.mjs`
- `systems/<slug>/assets/` — text only, optional
- exactly one appended entry at the end of `index.json`

You may not write anything else. In particular: never touch another system, never regenerate
`index.json`, never edit `CLAUDE.md` or the scripts to accommodate this system. If the format
genuinely cannot hold what the user is describing, stop and say so rather than widening it.

---

## Step 1 — interview

**Write nothing until the interview is done and the draft is approved.** Ask in batches of
two or three; do not fire all of these at once, and do not ask what earlier answers already
settled.

Cover all of it:

1. **The core idea or primitive.** The one rule that generates the rest. Push until you have a
   sentence an agent could extrapolate from — "every element that carries data or invites a
   press is a capsule" is a primitive; "clean and modern" is not.
2. **Register and density.** Where it sits, how tight it packs.
3. **Intended uses, and unsuitable ones.** The second list is the more useful one. A system
   with no `avoid-for` has not been thought about.
4. **Scripts.** If more than Latin, ask about per-script line-height and whether scripts share
   a line.
5. **Palette, and what each colour *means*.** Not the hex — the job. "Needs attention now."
   "Structure." A colour with no meaning is decoration and will be misused.
6. **Type families**, and the job of each. If there are three, ask what justifies the third.
7. **Shape and depth.** Radii, borders, shadows — including the ones the system refuses.
8. **The signature element.** The detail that makes it recognisable, and how often it may
   appear.
9. **Prohibitions.** See step 2.

### Push back when an answer is vague

Vague answers produce files an agent cannot follow. Say so plainly and ask again:

| The user says | Ask for |
|---|---|
| "generous spacing" | the number |
| "restrained accent use" | how many elements per screen — one? |
| "modern sans" | the family name and the fallback stack |
| "subtle shadows" | the exact `box-shadow`, or confirmation there are none |
| "it should feel premium" | which concrete rule produces that |

Write for a coding agent, not a human reader. `--gap: 10px` and "two is a bug", never
"generous spacing" and "restrained accent use".

## Step 2 — propose the prohibitions yourself

The **Never** section is the most important part of the file. Systems do not decay because a
stated value is used wrongly; they decay because something not in the system gets added.

Do not ask the user for an open-ended list — they will forget most of it. Derive a draft from
their answers and ask them to confirm or cut. Every strong rule implies a prohibition:

- two radii → a third radius is forbidden
- one accent, one use → the accent on a second element is forbidden
- no shadows → any shadow, including a subtle one, is forbidden
- two families → a third family, and monospace specifically, is forbidden
- uppercase on labels only → uppercase headings and buttons are forbidden

Always end the list with a catch-all: a colour, size, or family not defined in this file.
Minimum five entries. Aim for eight to ten.

## Step 3 — show the draft before writing

Show the complete file in the conversation and get explicit approval. Not a summary of it —
the actual content, especially the tokens block and the Never list. It is much cheaper to fix
here than after it is on disk and indexed.

## Step 4 — write

- Slug is kebab-case from the system name.
- `version: "1.0"`, quoted. `status: active`, or `draft` if values are still provisional.
- One fenced `css` block in the Tokens section, holding every custom property including font
  families, light and dark, copy-pasteable as-is.
- Declare the full required `--ds-*` alias set, pointing at the system's own tokens with
  `var()` references. Declare optional aliases only where the system genuinely has that
  concept — a system with no success colour must not declare `--ds-positive`, so that its
  preview shows the absence honestly.
- No colour literal anywhere outside the tokens block. Components are described by token
  reference: "`--ds-button-bg` fill, `--ds-radius-control`", never a restated hex.
- Open the body with the binding line: **Drop this file into a project as `CLAUDE.md`, or
  reference it from one. Everything below is binding.**

## Step 5 — index

Append **one** entry to the end of `index.json`. Do not touch any other entry, do not reorder,
do not rewrite the file wholesale:

```json
{ "slug": "<slug>", "path": "systems/<slug>/<slug>.md", "origin": "own", "added": "YYYY-MM-DD" }
```

## Step 6 — validate

```
node scripts/build-previews.mjs
node scripts/validate.mjs <slug>
node scripts/validate.mjs
```

Do not report done if either fails. Fix the new system's file — never the validator, never
another system, never the format.

Then open a PR. Never commit to `main`.
