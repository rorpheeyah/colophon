import { html } from './html.mjs'
import { shell, crumbs } from './layout.mjs'

export const aboutPage = all => shell({
  base: '', current: 'about', title: 'About — colophon',
  body: html`
<div class="wrap narrow about">
  ${crumbs('', ['About'])}
  <h1>About</h1>
  <p class="lede">A library of design systems. Each one is a single markdown file, written to be
  dropped into a project so that AI-assisted development follows that system. The file is the
  product; this site is a browser for it.</p>

  <h2>The format</h2>
  <p>Frontmatter for where it fits, then a body written for a coding agent rather than a human
  reader — <code>--gap: 10px</code> and "two is a bug", not "generous spacing". Eight required
  sections, in order:</p>
  <ol>
    <li><b>How to apply this file</b> — including what to do when a case is not covered</li>
    <li><b>The primitive</b> — the rule before the values, so an agent can extrapolate</li>
    <li><b>Tokens</b> — one css block, light and dark, copy-pasteable</li>
    <li><b>Type</b> — families, scale, and per-script rules where bilingual</li>
    <li><b>Structure</b> — layout, density, what carries separation</li>
    <li><b>Components</b> — by token reference, never by restated value</li>
    <li><b>Motion</b></li>
    <li><b>Never</b> — an explicit prohibition list</li>
  </ol>
  <p>The last matters most. Systems decay not because a stated value is used wrongly, but
  because something not in the system gets added — an extra radius, a subtle shadow, a fourth
  colour. So every file forbids explicitly.</p>

  <h2>Own and reference</h2>
  <p><code>own</code> is original work. <code>reference</code> is a reading of someone else's
  public work: credited, annotated, tokens approximated by eye. A reference record is never a
  claim of authorship and is not for direct use — fork it first.</p>

  <h2>Why the previews can be trusted</h2>
  <p>None is hand-written. Each embeds its system's own css block verbatim and renders one
  shared template driven by that system's declared aliases, so a preview cannot show a value
  its file does not contain. When a system refuses a concept — no success colour, no filled
  surfaces, no monospace — the preview renders nothing for it.</p>

  <h2>Versioning</h2>
  <p>A refinement bumps the version in place. A breaking change forks to a new slug and the
  previous becomes <code>archived</code>. Archived systems are never deleted: projects already
  shipped against them need them to keep existing.</p>

  <h2>In the library</h2>
  <ul>${all.map(s => html`<li><a href="s/${s.slug}/index.html">${s.system}</a> — ${s.register},
    ${s.density}${s.origin === 'reference' ? ', reference' : ''}</li>`)}</ul>
</div>`,
})
