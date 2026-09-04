<img src="site/assets/mark.svg" width="52" alt="">

# colophon

A library of design systems. Each one is a single markdown file, written to be dropped into a
project so that AI-assisted development follows that system.

**The markdown file is the product.** The site is a browser for it.

```
systems/<slug>/<slug>.md        the deliverable
systems/<slug>/preview.html     generated from the file's own tokens block
systems/<slug>/demo-*.html      generated: whole pages built in the system
systems/<slug>/thumb-*.svg      generated, one per mode, for the library cards
site/                           generated browse UI: library, system pages, compare
index.json                      append-only ledger
LICENSE                         MIT on systems/, all rights reserved on the site
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

You can instead install it as `.claude/skills/design-system/SKILL.md` to load it on demand. That
costs less context, but it is not guaranteed to load on any given edit — which is how a system
quietly stops being followed. Prefer the import.

A system marked `origin: reference` is never installed. It is a reading of someone else's public
work; fork it into an `origin: own` system first.

## Adding a system

Use the skills. Each interviews first, proposes the prohibition list, shows you the draft before
writing, and validates afterwards.

```
/new-design-system       an original system
/scout-design-system     a reference record of someone else's public work
/fork-design-system      turn a reference record into an installable system of your own
```

Any of them writes to `systems/<slug>/` and appends exactly one entry to `index.json`. Nothing
else is touched — adding a system must never modify an existing one.

Doing it by hand instead means matching the format contract in [CLAUDE.md](CLAUDE.md): required
frontmatter, eight required body sections in order, one `css` block holding every custom
property, no colour literal anywhere outside it, and all 42 `--clp-*` aliases declared — using
`none` to refuse a concept the system does not have.

## Working on the repo

```
pnpm install     one dependency: marked, build-time only
pnpm dev         http://localhost:4321, rebuilds on save
pnpm build       previews and thumbnails, then the site
pnpm check       validate everything
```

Plus, while choosing a palette:

```
node scripts/contrast.mjs <slug>          WCAG text ratios and chart series separation
node scripts/contrast.mjs --all           including systems that have not opted in
```

`pnpm check` must pass before anything is called done.

## What is actually enforced

| check | catches |
|---|---|
| frontmatter and section order | a missing field, sections out of sequence, a `Never` list under five entries |
| one tokens block | a colour literal anywhere outside it, a custom property declared elsewhere |
| the 42 `--clp-*` aliases | a missing alias, an unknown one, `none` where the alias carries structure |
| coherence | a wash without its colour, a border colour without a width, a series palette with a gap |
| `contrast: AA` \| `AAA` | text under the floor in either mode — **only where a system declares it** |
| adjacent chart series | ΔE under 15 to a full-colour reader, or 6 under simulated colour blindness |
| appearance literals | the preview template asserting a colour, radius or shadow the system did not declare — in its stylesheet and in the specimen's markup, attributes included |
| container balance | an unclosed wrapper swallowing its siblings |
| inline scripts | generated JavaScript that does not parse |
| freshness | a committed preview, thumbnail or built page that is stale |
| `index.json` | a modified or reordered entry, checked against git history |

## Why the previews can be trusted

No preview is hand-written. Each embeds its system's own `css` block verbatim and renders one
shared template driven entirely by that system's declared aliases. A preview is therefore
incapable of showing a value its file does not contain — and when a system refuses a concept,
the preview shows the refusal by rendering nothing for it.

The limit is worth knowing too: the checks constrain what the template can *invent*, not where
it can *put* a declared value. `CLAUDE.md` keeps a closed list of every decision the template
makes on a system's behalf, because everything a preview renders that a file did not ask for is
the template's opinion wearing the system's colours.

## Serving the site

`site/` is fully static and committed, so any static host will serve it as-is, and `pnpm dev`
serves it locally. No deploy is configured in this repo.
