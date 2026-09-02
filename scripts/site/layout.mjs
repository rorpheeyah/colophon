import { html } from './html.mjs'

export const NAV = [
  ['index.html', 'Library', 'library'],
  ['compare.html', 'Compare', 'compare'],
  ['about.html', 'About', 'about'],
]

const ICONS = html`
<svg data-t="system" width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
  <circle cx="8" cy="8" r="5.9" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <path d="M8 2.1a5.9 5.9 0 000 11.8z" fill="currentColor"/></svg>
<svg data-t="light" width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
  <circle cx="8" cy="8" r="3.1" fill="currentColor"/>
  <path d="M8 .9v2.1M8 13v2.1M.9 8h2.1M13 8h2.1M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13"
    stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
<svg data-t="dark" width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M13.4 10.3A6.2 6.2 0 015.7 2.6a6.2 6.2 0 107.7 7.7z" fill="currentColor"/></svg>`

export const shell = ({ base, title, current, body }) => html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${base}assets/style.css">
<script>
  // Before paint, so a chosen theme never flashes the other one.
  try {
    const t = localStorage.getItem('colophon-theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch {}
</script>
</head>
<body>
<div class="top"><div class="wrap">
  <b>colophon</b>
  <nav>${NAV.map(([href, label, key]) => html`<a href="${base}${href}"${
    key === current ? html` aria-current="page"` : ''}>${label}</a>`)}</nav>
  <button class="theme" id="theme" aria-label="Change theme">${ICONS}</button>
</div></div>
${body}
<footer><div class="wrap eyebrow">Generated from the repo</div></footer>
<script>
  // Site chrome only. A preview's light and dark come from its tokens block.
  (() => {
    const order = ['system', 'light', 'dark'];
    const btn = document.getElementById('theme');
    const read = () => { try { return localStorage.getItem('colophon-theme') || 'system'; } catch { return 'system'; } };
    const show = t => {
      if (t === 'system') delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = t;
      btn.dataset.state = t;
      btn.title = 'Theme: ' + t;
    };
    show(read());
    btn.addEventListener('click', () => {
      const next = order[(order.indexOf(read()) + 1) % order.length];
      try { localStorage.setItem('colophon-theme', next); } catch {}
      show(next);
    });
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

export const SEARCH_ICON = html`<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
  <circle cx="6.8" cy="6.8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
