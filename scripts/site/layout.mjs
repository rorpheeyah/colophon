import { html, raw } from './html.mjs'

export const YEAR = new Date().getFullYear()
export const REPO = 'https://github.com/rorpheeyah/colophon'

export const NAV = [
  ['index.html', 'Library', 'library'],
  ['compare.html', 'Compare', 'compare'],
  ['about.html', 'About', 'about'],
]

// Recto / verso: one rule crossing the fold, flipping polarity. The two faces
// of a printed leaf, and the one thing every system here must satisfy — it
// works in light and in dark. Single colour, so it reverses without redrawing.
export const MARK = raw(`<svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
  <mask id="mk-cph">
    <rect width="64" height="64" fill="#fff"/>
    <rect x="32" width="32" height="64" fill="#000"/>
    <rect x="34" y="28" width="18" height="8" rx="4" fill="#fff"/>
    <rect x="12" y="28" width="18" height="8" rx="4" fill="#000"/>
  </mask>
  <rect x="3" y="3" width="58" height="58" rx="15" fill="currentColor" mask="url(#mk-cph)"/>
  <rect x="3" y="3" width="58" height="58" rx="15" fill="none" stroke="currentColor" stroke-width="4.5"/>
</svg>`)

// Mask-free variant: a favicon has to survive without a mask and without the
// page's background showing through, so the paper is painted rather than cut.
const FAVICON = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
  + `<rect x="3" y="3" width="58" height="58" rx="15" fill="#F2F0EA"/>`
  + `<path d="M32 3H18A15 15 0 0 0 3 18v28a15 15 0 0 0 15 15h14z" fill="#B03A2E"/>`
  + `<rect x="3" y="3" width="58" height="58" rx="15" fill="none" stroke="#B03A2E" stroke-width="5"/>`
  + `<rect x="12" y="28" width="18" height="8" rx="4" fill="#F2F0EA"/>`
  + `<rect x="34" y="28" width="18" height="8" rx="4" fill="#B03A2E"/></svg>`)

const THEME_ICONS = raw(`
<svg data-t="light" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
  <circle cx="8" cy="8" r="3.1" fill="currentColor"/>
  <path d="M8 .9v2.1M8 13v2.1M.9 8h2.1M13 8h2.1M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13"
    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
<svg data-t="dark" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M13.4 10.3A6.2 6.2 0 0 1 5.7 2.6a6.2 6.2 0 1 0 7.7 7.7z" fill="currentColor"/></svg>`)

export const lockup = (base, size = '') => html`<a class="lockup ${size}" href="${base}index.html">
  ${MARK}<span>colophon</span>
</a>`

export const shell = ({ base, title, current, body, systems = [] }) => html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="data:image/svg+xml,${raw(FAVICON)}">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${base}assets/style.css">
<script>
  // Resolved before first paint. Two states in the UI; the OS decides only
  // which one a first-time visitor lands in.
  try {
    var t = localStorage.getItem('colophon-theme');
    if (t !== 'light' && t !== 'dark') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = t;
  } catch (e) { document.documentElement.dataset.theme = 'light'; }
</script>
</head>
<body>
<header class="top"><div class="wrap">
  ${lockup(base)}
  <nav>${NAV.map(([href, label, key]) => html`<a href="${base}${href}"${
    key === current ? html` aria-current="page"` : ''}>${label}</a>`)}</nav>
  <div class="tools">
    <a class="ghost" href="${REPO}" rel="noreferrer">GitHub</a>
    <button class="theme" id="theme" aria-label="Switch theme">${THEME_ICONS}</button>
  </div>
</div></header>

${body}

<footer class="foot"><div class="wrap">
  <div class="foot-grid">
    <div class="foot-brand">
      ${lockup(base, 'sm')}
      <p>Design systems as drop-in markdown. Each one is a single file; the site is a browser for it.</p>
    </div>
    <div>
      <h2>Library</h2>
      ${systems.map(s => html`<a href="${base}s/${s.slug}/index.html">${s.system}</a>`)}
    </div>
    <div>
      <h2>Project</h2>
      <a href="${base}about.html">About</a>
      <a href="${base}colophon.html">Colophon</a>
      <a href="${REPO}" rel="noreferrer">Source</a>
    </div>
  </div>
  <div class="foot-legal">
    <p>&copy; ${YEAR} colophon (rorpheeyah). Site and writing all rights reserved.</p>
    <p>The design system files are <a href="${REPO}/blob/main/LICENSE">MIT licensed</a>.</p>
  </div>
</div></footer>

<script>
  (() => {
    const root = document.documentElement;
    const btn = document.getElementById('theme');
    const frames = () => document.querySelectorAll('iframe[data-follow-theme]');

    function set(t) {
      root.dataset.theme = t;
      btn.dataset.state = t;
      btn.title = t === 'dark' ? 'Switch to light' : 'Switch to dark';
      // card previews show the mode you are actually in
      for (const f of frames()) {
        const base = f.dataset.src;
        const next = base + (t === 'dark' ? '&mode=dark' : '&mode=light');
        if (f.getAttribute('src') !== next) f.setAttribute('src', next);
      }
      try { localStorage.setItem('colophon-theme', t); } catch (e) {}
    }
    set(root.dataset.theme === 'dark' ? 'dark' : 'light');
    btn.addEventListener('click', () => set(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  })();
</script>
</body>
</html>
`

export const crumbs = (base, trail) => html`<nav class="crumbs">
  <a href="${base}index.html">Library</a>${trail.map(t => html` <span>/</span> <b>${t}</b>`)}
</nav>`

export const tags = s => html`<div class="meta">
  <span class="tag">${s.register}</span>
  <span class="tag">${s.density}</span>
  ${s.scripts.map(x => html`<span class="tag">${x}</span>`)}
  ${s.origin === 'reference' && html`<span class="tag ref">reference</span>`}
  ${s.status !== 'active' && html`<span class="tag ref">${s.status}</span>`}
</div>`

export const SEARCH_ICON = raw(`<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
  <circle cx="6.8" cy="6.8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`)
