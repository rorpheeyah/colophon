---
name: scout-design-system
description: Interview the user and write a reference record of someone else's published design work into systems/<slug>/ with origin reference, source-url and credit. Use when scouting, reverse-engineering, or annotating a design system found in public work. For the user's own systems, use new-design-system instead.
---

# scout-design-system

Adds one reference record (`origin: reference`) to the library.

Read `CLAUDE.md` first. It holds the format contract. This skill is the process; CLAUDE.md is
the specification. Where they disagree, CLAUDE.md wins.

Follow `new-design-system` for the shared process — interview, propose the prohibitions, show
the draft, write, append one index entry, validate. This file covers only what differs.

**A reference record is the user's reading of someone's public work. It is never a claim of
authorship.** That has to be visible in the file and in the UI, in both directions: credit the
author for what is theirs, and do not attribute the user's annotations to them.

---

## Provenance is not optional

Frontmatter carries two extra required fields:

```
source-url     where the work was published
credit         author and title, quoted
```

`credit` must name the author. If the user does not have the name, ask for it. If they cannot
find it, say so in the file explicitly — "author not identified on the source page" — rather
than leaving a placeholder that reads as finished. Never invent, guess, or infer an author
from a URL.

Open the body with a provenance note in place of the install block, stating plainly that this
is the user's reading of someone else's public work, and that the tokens are approximations
extracted by eye rather than the author's values. A reference record carries no install block:
it is never installed into a project, only forked into an `origin: own` system that is.

## Do not reproduce assets

Record the reading, not the artefact. No copied images, no copied fonts, no copied icon sets,
no verbatim copy from the source. Tokens are approximations; label them as such. `assets/` is
text only, as it is everywhere in this repo.

## How to apply this file

A reference record's **How to apply this file** section says *don't* — directly. It is
something to compare against, borrow from, or argue with. If the user wants to build in this
style, the record is forked into an `origin: own` system first, with the recorded problems
fixed. Say that in the section.

## Two extra sections

Insert these after Components. They are what makes a reference record worth keeping, and a
record that only praises is not a reading:

- **What I would take** — specific, portable moves, each stated as a rule the user could
  actually adopt.
- **What is broken** — errors and structural problems, with evidence. Content errors,
  inverted information hierarchy, wrong domain assumptions, absent core flows.

Interview for both. If the user offers only admiration, ask what it gets wrong; if only
criticism, ask why it is in the library at all.

## Adapt the required sections rather than inventing new ones

Published work rarely documents everything. Where something was not published, say so in the
section — "Motion: not published" — and keep the section. Never delete a required section, and
never invent a value to fill one. "Dark mode was not published; any dark treatment would be
invented, not extracted" is the correct answer, and the preview will render the absence
honestly.

All 42 `--clp-*` aliases are still required, since the shared preview template reads them.
Alias only what was actually observed, and declare `none` for everything the source did not
publish — that is the honest record, and it is also what makes the omission visible. Where the
source published no dark block, omit `[data-mode="dark"]` entirely rather than inventing one.

Propose the block in one pass, as step 3 of `new-design-system` describes. Do not interview
the user alias by alias about work neither of you authored.

**Never add `contrast: AA` to a reference record.** The colours are approximations of someone
else's palette, and holding them to a floor the source never met would be inventing a standard
and then blaming the author for missing it. `node scripts/contrast.mjs <slug>` still reports the
numbers, and the adjacent series check still warns, which is the right level for a reading.

**Decline rather than guess, and say what was not observable.** A wash tint that cannot be read
off a screenshot with confidence is `none` with a sentence explaining why — not a plausible hex.
Everything in the file must be either observed or declined. Where a value is later found to be
wrong by the record's own standard — it asserts a relationship its numbers cannot produce — fix
it and record the measurement, but do not adjust an approximation to make a preview look
better.

## The Never section

For a reference record, **Never** is framed as *if forking this* — the prohibitions the user
would impose to fix what section "What is broken" records. Same minimum of five.

## Index entry

```json
{ "slug": "<slug>", "path": "systems/<slug>/<slug>.md", "origin": "reference", "added": "YYYY-MM-DD" }
```

Then validate, and open a PR. Never commit to `main`.
