import { html } from './html.mjs'
import { shell } from './layout.mjs'

export const aboutPage = all => shell({
  base: '', current: 'about', title: 'About — colophon',
  body: html`
<div class="wrap narrow">
  <h1>About</h1>
  <p class="lede">colophon is a library of design systems. Each one is a single markdown file
  written to be dropped into a project so that AI-assisted development follows that system.
  The file is the product; this site is a browser for it.</p>

  <h2>What a system file is</h2>
  <p>One file, with frontmatter describing where it fits and a body written for a coding agent
  rather than a human reader — <code>--gap: 10px</code> and "two is a bug", not "generous
  spacing" and "restrained accent use". Eight required sections, in order:</p>
  <ol>
    <li><b>How to apply this file</b> — including what to do when a case is not covered</li>
    <li><b>The primitive</b> — the rule before the values, so an agent can extrapolate</li>
    <li><b>Tokens</b> — one css block, light and dark, copy-pasteable as-is</li>
    <li><b>Type</b> — families, scale, weights, and per-script rules where bilingual</li>
    <li><b>Structure</b> — layout, density, what carries separation</li>
    <li><b>Components</b> — described by token reference, never by restated value</li>
    <li><b>Motion</b></li>
    <li><b>Never</b> — an explicit prohibition list</li>
  </ol>
  <p>The last one matters most. Systems do not decay because a stated value gets used wrongly;
  they decay because something not in the system gets added — an extra radius, a subtle shadow,
  a fourth colour. So every file forbids explicitly.</p>

  <h2>Own systems and reference records</h2>
  <p>A system marked <code>own</code> is original work. One marked
  <code>reference</code> is a reading of someone else's public work: credited, annotated, with
  token values approximated by eye rather than taken from the author. A reference record is
  never a claim of authorship, and it is not meant to be built in directly — fork it into an
  <code>own</code> system first.</p>

  <h2>Why the previews can be trusted</h2>
  <p>No preview on this site is hand-written. Each one embeds its system's own css block
  verbatim and renders a single shared template driven entirely by that system's declared
  aliases. A preview is therefore incapable of showing a value its file does not contain, and
  when a system refuses a concept — no success colour, no filled surfaces, no monospace — the
  preview shows that refusal by rendering nothing for it.</p>

  <h2>Versioning</h2>
  <p>A refinement bumps the version in place. A breaking change — different palette, different
  primitive — forks to a new slug and the previous system becomes <code>archived</code>.
  Archived systems are never deleted, because projects already shipped against them need them
  to keep existing.</p>

  <h2>Currently in the library</h2>
  <ul>${all.map(s => html`<li><a href="s/${s.slug}/index.html">${s.system}</a> — ${s.register},
    ${s.density}${s.origin === 'reference' ? ', reference record' : ''}</li>`)}</ul>
</div>`,
})
