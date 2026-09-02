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

5. **Never hand-write a preview.** Previews come from `scripts/build-previews.mjs`, which reads
   the tokens block out of the markdown. A preview must be physically incapable of showing
   something its system file does not say.

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
systems/
  <slug>/
    <slug>.md                    the deliverable
    preview.html                 generated, committed
    assets/                      optional, text only
scripts/
  build-previews.mjs             tokens block -> preview.html
  validate.mjs                   format contract enforcement
site/                            static browse UI
index.json                       append-only ledger
```

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

Anything else is optional and may be added freely. See rule 4.

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

### The `--ds-*` preview contract

The preview generator renders **one shared template** for every system, with no branching. It
can only do that if the differences between systems live in token values rather than in code.
So each system declares a thin alias layer inside its tokens block, pointing stable role names
at its own tokens.

Aliases are `var()` references, never copied values, so the tokens block stays the single
source of truth. The dark block redefines the underlying tokens and the aliases resolve
through automatically — never re-declare `--ds-*` in the dark block.

Required:

| Token | Role |
|---|---|
| `--ds-bg` | Page background |
| `--ds-surface` | Raised or contained surface |
| `--ds-text` | Primary text |
| `--ds-text-2` | Secondary text |
| `--ds-text-3` | Tertiary text, captions, placeholders |
| `--ds-line` | Row rules and hairlines |
| `--ds-accent` | The system's accent, whatever it means here |
| `--ds-radius-box` | Containers |
| `--ds-radius-control` | Buttons, inputs, pills |
| `--ds-border-width` | Container edge; `0` if the system forbids borders |
| `--ds-border-color` | Container edge colour |
| `--ds-shadow` | Full `box-shadow` value; `none` if the system forbids shadows |
| `--ds-button-bg` | Primary button fill |
| `--ds-button-text` | Primary button text |
| `--ds-font-display` | Headings |
| `--ds-font-body` | Body text |
| `--ds-gap` | Base spacing step |
| `--ds-pad` | Base container padding |

Optional. The template renders only what is declared, so an absence is honest — a system with
no success colour shows no success state, because it never declared one:

```
--ds-positive        --ds-positive-wash
--ds-warn            --ds-warn-wash
--ds-alarm           --ds-alarm-wash
--ds-invert-bg       --ds-invert-text        --ds-invert-accent
--ds-font-data       --ds-hatch
```

A system with no `[data-mode="dark"]` block renders as "no dark mode published" rather than
having one invented for it.

---

## Working on this repo

- Node 22+. No dependencies in `scripts/`. The frontmatter parser is deliberately hand-rolled
  against a restricted YAML subset: `key: value`, `key: "quoted value"`, and
  `key: [inline, array]`. Do not add a YAML library to support syntax the format does not use.
- Adding a system writes to `systems/<slug>/` and appends exactly one entry to `index.json`.
  Nothing else. Regenerating `site/data.json` belongs to the build, not to the intake skill.
- `preview.html` is committed. GitHub Pages serves it with no build step, the repo stays
  self-contained, and a token change shows up as a reviewable diff. `validate.mjs` regenerates
  previews and fails if a committed one is stale.

## Out of scope

Do not build, and do not offer to build: authentication, accounts, sharing, comments,
in-browser editing, a code playground, version history UI, Figma import, AI generation of
systems from the site, analytics, a component library, a UI kit.
