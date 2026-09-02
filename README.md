# colophon

A library of design systems. Each one is a single markdown file, written to be dropped into a
project so that AI-assisted development follows that system.

**The markdown file is the product.** The site is a browser for it.

```
systems/<slug>/<slug>.md      the deliverable
systems/<slug>/preview.html   generated from the file's own tokens block
site/                         generated browse UI: library, system pages, compare
index.json                    append-only ledger
```

## Using a system in a project

1. Download the system's `.md` from its page, or copy it out of `systems/<slug>/`.
2. Save it into the target project as `.claude/design-system.md`.
3. Add this to that project's own `CLAUDE.md`:

```md
## Design system

This project follows Lozenge. The rules in @.claude/design-system.md are
binding for all UI work. Where a rule and your instinct disagree, the rule wins.
```

The import keeps the whole system in context on every turn without displacing the project's own
rules, and updating the system later is a one-file copy.

You can instead install it as `.claude/skills/design-system/SKILL.md` to load it on demand.
That costs less context, but it is not guaranteed to load on any given edit — which is how a
system quietly stops being followed. Prefer the import.

A system marked `origin: reference` is never installed. It is a reading of someone else's public
work; fork it into an `origin: own` system first.

## Adding a system

Use the skills. They interview first, propose the prohibition list, show you the draft before
writing anything, and validate afterwards.

```
/new-design-system      an original system
/scout-design-system    a reference record of someone else's public work
```

Either one writes to `systems/<slug>/` and appends exactly one entry to `index.json`. Nothing
else is touched — adding a system must never modify an existing one.

Doing it by hand instead means matching the format contract in [CLAUDE.md](CLAUDE.md):
required frontmatter, eight required body sections in order, one `css` block holding every
custom property, no colour literal anywhere outside it, and all 29 `--ds-*` aliases declared —
using `none` to refuse a concept the system does not have.

## Working on the repo

```
pnpm install     one dependency: marked, build-time only
pnpm dev         http://localhost:4321, rebuilds on save
pnpm build       previews, then the site
pnpm check       validate everything

node scripts/contrast.mjs <slug>    WCAG ratios while choosing a palette
```

`pnpm check` must pass before anything is called done. It enforces the format, checks
`index.json` is still append-only against git history, and fails if a committed preview or the
built site is stale.

## Why previews can be trusted

No preview is hand-written. Each one embeds its system's own `css` block verbatim and renders a
single shared template driven entirely by that system's declared `--ds-*` aliases. A preview is
therefore incapable of showing a value its file does not contain — and when a system refuses a
concept, the preview shows the refusal by rendering nothing for it.

## Serving the site

`site/` is fully static and committed, so any static host will serve it as-is, and
`pnpm dev` serves it locally. No deploy is configured in this repo.
