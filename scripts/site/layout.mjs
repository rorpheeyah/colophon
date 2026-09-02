import { html } from './html.mjs'

export const NAV = [
  ['index.html', 'Library', 'library'],
  ['compare.html', 'Compare', 'compare'],
  ['about.html', 'About', 'about'],
]

export const shell = ({ base, title, current, body }) => html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${base}assets/style.css">
<script>
  // Runs before paint so a chosen theme never flashes the other one.
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
  <button class="theme" id="theme" title="Theme: system" aria-label="Change theme">
    <span data-t="system">Auto</span><span data-t="light">Light</span><span data-t="dark">Dark</span>
  </button>
</div></div>
${body}
<footer><div class="wrap">Design systems as drop-in markdown. Generated from the repo — the file is the product.</div></footer>
<script>
  // Three states: system (no attribute), light, dark. The site chrome only —
  // a preview's own light and dark come from its tokens block, not from here.
  (() => {
    const order = ['system', 'light', 'dark'];
    const btn = document.getElementById('theme');
    const read = () => { try { return localStorage.getItem('colophon-theme') || 'system'; } catch { return 'system'; } };
    function show(t) {
      if (t === 'system') delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = t;
      btn.dataset.state = t;
      btn.title = 'Theme: ' + t;
    }
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

export const tags = s => html`<div class="meta">
  <span class="tag">${s.register}</span>
  <span class="tag">${s.density}</span>
  ${s.scripts.map(x => html`<span class="tag">${x}</span>`)}
  ${s.origin === 'reference' && html`<span class="tag ref">reference</span>`}
  ${s.status !== 'active' && html`<span class="tag ref">${s.status}</span>`}
</div>`
