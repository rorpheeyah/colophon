import { html } from './html.mjs'
import { shell, crumbs, YEAR, REPO } from './layout.mjs'

// A colophon is the note at the back of a book saying how it was made — the
// typefaces, the stock, the press. This one does that, and doubles as the
// privacy page, because there is exactly one privacy-relevant fact to state.
export const colophonPage = all => shell({
  base: '', current: null, systems: all,
  title: 'Colophon — how this site is made',
  body: html`
<div class="wrap narrow prose">
  ${crumbs('', ['Colophon'])}
  <h1>Colophon</h1>
  <p class="lede">A note on how this site is made, what it collects, and who owns what. Named
  for the thing it is.</p>

  <h2>What this site collects</h2>
  <p><strong>Nothing.</strong> There are no accounts, no forms, no analytics, no tracking
  pixels and no cookies. Nothing you do here is recorded or sent anywhere.</p>
  <p>Two qualifications, both worth stating plainly rather than burying:</p>
  <ul>
    <li>Your light or dark choice is kept in your own browser's <code>localStorage</code>, under
      the key <code>colophon-theme</code>. It never leaves your machine. Clear your site data and
      it is gone.</li>
    <li>Typefaces are served by <strong>Google Fonts</strong>. Loading a page therefore makes a
      request to <code>fonts.googleapis.com</code> and <code>fonts.gstatic.com</code>, which
      means Google receives your IP address and user-agent. That is the only third party
      involved in this site, and the only way it could know you were here.</li>
  </ul>

  <h2>How it is set</h2>
  <dl class="spec">
    <dt>Interface</dt><dd>Instrument Sans</dd>
    <dt>Wordmark</dt><dd>Newsreader, lowercase — a colophon is set in the book's own text face</dd>
    <dt>Data &amp; labels</dt><dd>IBM Plex Mono</dd>
    <dt>Specimens</dt><dd>Each system's own declared families, loaded per preview</dd>
    <dt>Mark</dt><dd>Recto / verso — one rule crossing the fold, flipping polarity</dd>
    <dt>Accent</dt><dd>A single seal red, used on the mark and nowhere else</dd>
    <dt>Built with</dt><dd>Node, and <code>marked</code> for rendering markdown. Nothing else.</dd>
  </dl>
  <p>The chrome is deliberately neutral. It displays systems that contradict each other in
  almost every respect, and a chrome with a strong palette would quietly tell you which one to
  prefer.</p>

  <h2>Licensing</h2>
  <h3>The design systems</h3>
  <p>The markdown files under <code>systems/</code> and their generated previews are
  <a href="${REPO}/blob/main/LICENSE">MIT licensed</a>. Copy them into any project, commercial
  or otherwise, change them, ship them. That is what they are for — every one of them opens
  with instructions to do exactly that.</p>

  <h3>The site</h3>
  <p>The site, its source and its written content are &copy; ${YEAR} rorpheeyah, all rights
  reserved.</p>

  <h3>Reference records</h3>
  <p>A system marked <code>reference</code> is a reading of someone else's published work. The
  annotations, the extracted approximations and the criticism are mine and fall under the
  licence above. <strong>The design being described does not.</strong> It belongs to its
  authors, is credited on its page and in its file, and no assets from it are reproduced
  anywhere in this repository.</p>
  <p>Currently that means
  ${all.filter(s => s.origin === 'reference').map((s, i, a) => html`<a href="s/${s.slug}/index.html">${s.system}</a>${i < a.length - 1 ? ', ' : ''}`)}.
  If you are one of its authors and want the record changed or removed,
  <a href="${REPO}/issues">open an issue</a> and it will be.</p>

  <h2>Terms</h2>
  <p>There are none. Nothing here is sold, nothing requires an account, and there is nothing to
  agree to. The files are provided as they are, with no warranty — the MIT licence says so in
  the usual words.</p>
</div>`,
})
