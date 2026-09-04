---
name: new-design-system
description: Interview the user and write a new original design system into systems/<slug>/. Use when the user wants to add, create, or author a design system of their own. For reverse-engineering someone else's published work, use scout-design-system instead.
---

# new-design-system

Adds one original system (`origin: own`) to the library.

Read `CLAUDE.md` first. It holds the format contract, the required frontmatter set, the
required sections, and the `--clp-*` preview contract. This skill is the process; CLAUDE.md is
the specification. Where they disagree, CLAUDE.md wins.

**Your job is coherence.** System twelve must have the same shape as system two, or the files
stop being reliably drop-in. That matters more than capturing every nuance of this one system.

---

## Boundaries

You may write:

- `systems/<slug>/<slug>.md`
- `systems/<slug>/preview.html`, `thumb-light.svg`, `thumb-dark.svg` — only by running
  `scripts/build-previews.mjs`
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

Stay at the level of rules and meaning here. Individual token values come in step 3, in one
pass, not as a nine-question tail to this interview.

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

## Step 3 — propose the whole token block in one pass

The `--clp-*` contract is **42 required aliases**. **Do not walk the user through 42 questions.**
Forty-two lines in a file is a checklist; forty-two questions is a chore, and a chore is what
stops a library reaching system twelve.

Interview only on the aliases that carry the system's identity, because these are the ones
where guessing wrong produces a system the user did not ask for:

- `--clp-accent` — and what the accent *means* here
- `--clp-button-bg` / `--clp-button-text` — **always ask, never infer.** Often not the accent: a
  system whose accent is a semantic state will have a button built from surface, border, and
  shadow instead. Inferring the button from the palette is right about two times in three,
  which is the failure rate that looks reliable and is not.

  When they *are* the same, say so out loud — "so the button is the accent, `--clp-button-bg:
  var(--citron)`" — and have the user confirm it. A system where the two diverge must not be
  distinguished from one where they coincide only by the absence of a question.
- `--clp-success` / `--clp-warn` / `--clp-alarm` and their washes — including whether the system
  refuses one. A system where colour means "something needs doing" may have no success colour
  at all
- `--clp-shadow` — the exact value, or `none`
- `--clp-state-text` — declared means a state pill is *filled* and this is the text on it;
  declined means states are coloured text on a wash, or coloured text with a border
- `--clp-card-fill` — declared means a stat tile or panel carries a fill; declined means it sits
  on the page. Two systems that declare the same `--clp-surface` can want opposite answers, so
  this cannot be inferred
- `--clp-chart-1` … `--clp-chart-5` — the series palette, **in order and never cycled**. One
  colour gets bars, line, area, sparkline and a gauge; two adds stacked and a legend; three adds
  the donut. Adjacent series must clear ΔE 15 to a full-colour reader and 6 under simulated
  colour blindness — run `node scripts/contrast.mjs <slug>` and it will tell you
- `--clp-press` — the transform a control takes while pressed, or `none`. If the system also
  declares a shadow, the shadow flattens on press
- `--clp-focus` — the keyboard focus ring, or `none`, which leaves the platform's own ring

Ask whether the system should hold itself to a contrast floor. If the palette is being authored
now rather than transcribed, `contrast: AA` in frontmatter is usually right: it makes
`validate.mjs` fail on any text colour under 4.5:1 in either mode, and it promotes the adjacent
series check from a warning to an error, so a later colour swap cannot quietly break either.
Run `node scripts/contrast.mjs <slug>` while choosing values. Do not add the field to a system
whose colours are approximations of someone else's work.

Ask which non-Latin scripts the system covers, and put them in `scripts`. The preview renders a
letterform specimen for each one it knows, right-to-left where the script reads that way, plus a
mixed line for a bilingual system. `--clp-font-script` names one family, but a font stack is not
limited to one — a trilingual system writes
`"Noto Sans Khmer", "Noto Sans Thai", sans-serif` and needs nothing else.

**Set `data-mode="dark"` on the root element**, and say so in the file. A `var()` inside a custom
property is substituted where it is declared, so scoping the dark block to a wrapper leaves every
alias holding its light value and dark mode silently does nothing.

Infer the rest from answers already given. Then present the complete block once, as CSS, and
ask the user to confirm or amend it in a single pass.

Every alias is required. Where the system does not have a concept, declare `none` — that is a
statement the author made, not a gap. `--clp-font-data: none` in a system that forbids
monospace restates its own prohibition in machine-checkable form, which is the point.

Twenty-eight of the 42 may be declined; `CLAUDE.md` marks each one in the contract table and
`CLP_NONE_PERMITTED` in `validate.mjs` is the enforced list. The **fourteen that may not** are
the ones carrying structure, and they are the shorter list to remember:

```
--clp-bg  --clp-surface  --clp-text  --clp-text-2  --clp-text-3  --clp-line  --clp-accent
--clp-radius-box  --clp-radius-control  --clp-border-width
--clp-button-bg  --clp-button-text  --clp-font-display  --clp-font-body
```

`--clp-bg: none` is not a design decision. Everything else — including `--clp-card-fill`,
`--clp-press`, `--clp-focus`, `--clp-button2-bg`, `--clp-state-text`, the spacing step and all
five chart series — is a concept a system is entitled to refuse. A state colour and its wash
must agree.

## Step 4 — show the draft before writing

Show the complete file in the conversation and get explicit approval. Not a summary of it —
the actual content, especially the tokens block and the Never list. It is much cheaper to fix
here than after it is on disk and indexed.

## Step 5 — write

- Slug is kebab-case from the system name.
- `version: "1.0"`, quoted. `status: active`, or `draft` if values are still provisional.
- One fenced `css` block in the Tokens section, holding every custom property including font
  families, light and dark, copy-pasteable as-is.
- Declare all 42 `--clp-*` aliases, pointing at the system's own tokens with `var()`
  references, exactly as confirmed in step 3. `none` where the system declines a concept.
- No colour literal anywhere outside the tokens block. Components are described by token
  reference: "`--clp-button-bg` fill, `--clp-radius-control`", never a restated hex.
- Open the body with the install block described in `CLAUDE.md` — copy to
  `.claude/design-system.md`, plus the `@`-import stanza for the project's own `CLAUDE.md`,
  naming this system. Never tell the reader to overwrite a project's `CLAUDE.md`.
- Close the **How to apply this file** section with the note on why the import is preferred
  over the skill form.

## Step 6 — index

Append **one** entry to the end of `index.json`. Do not touch any other entry, do not reorder,
do not rewrite the file wholesale:

```json
{ "slug": "<slug>", "path": "systems/<slug>/<slug>.md", "origin": "own", "added": "YYYY-MM-DD" }
```

## Step 7 — validate

```
pnpm build                      previews and thumbnails, then the site
node scripts/validate.mjs <slug>
pnpm check                      the whole library
```

**Build the site, not just the previews.** `validate.mjs` runs `build-site.mjs --check` and
fails a new system as `site out of date`, because the library card and the system page do not
exist yet. `pnpm build` does both halves. Regenerating `site/` is the build's job, never
something to write by hand.

Do not report done if any of them fails. Fix the new system's file — never the validator, never
another system, never the format.

Then open a PR. Never commit to `main`.
