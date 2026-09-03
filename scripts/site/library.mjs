import { html, json } from './html.mjs'
import { shell, tags, SEARCH_ICON } from './layout.mjs'

// Group labels are dropped: the values name themselves, and five uppercase
// labels for eleven chips was more label than content. `title` carries the
// field name for the two groups that are not self-evident.
const GROUPS = ['register', 'density', 'origin', 'status']

const chips = (key, values) => values.map(v =>
  html`<button class="chip" data-k="${key}" data-v="${v}" title="${key}: ${v}" aria-pressed="false">${v}</button>`)

// The thumbnail follows the site theme rather than being pinned to light —
// a system's whole claim is that it works in both, so the card should show
// the one the reader is actually in. The paired view lives on the system page.
//
// A system that published no dark mode is the exception: following the theme
// would render its "not published" notice, and an empty card reads as broken
// rather than as a statement. Those stay in light and say so.
const card = s => html`
<article class="card" data-slug="${s.slug}">
  <a class="thumb" href="s/${s.slug}/index.html" aria-label="Open ${s.system}" tabindex="-1">
    <iframe src="s/${s.slug}/preview.html?chrome=0&amp;mode=light"
            ${s.hasDark ? html`data-follow-theme data-src="s/${s.slug}/preview.html?chrome=0"` : ''}
            loading="lazy" title="${s.system} preview" tabindex="-1" scrolling="no"></iframe>
    ${!s.hasDark && html`<span class="pin">light only</span>`}
  </a>
  <div class="body">
    <h2><a href="s/${s.slug}/index.html">${s.system}</a> <em>${s.version}</em></h2>
    ${tags(s)}
    <dl class="fit">
      <dt>For</dt><dd>${s.bestFor.slice(0, 3).join(', ')}</dd>
      <dt>Not</dt><dd>${s.avoidFor.slice(0, 2).join(', ')}</dd>
    </dl>
    <div class="actions">
      <a class="btn primary" href="s/${s.slug}/${s.slug}.md" download>Download .md</a>
      <a class="btn" href="s/${s.slug}/index.html">Open</a>
    </div>
  </div>
</article>`

export const libraryPage = all => {
  const groups = GROUPS
    .map(key => [key, [...new Set(all.map(s => s[key]).filter(Boolean))].sort()])
    .concat([['scripts', [...new Set(all.flatMap(s => s.scripts))].sort()]])
    .filter(([, values]) => values.length > 1)

  return shell({
    base: '', current: 'library', systems: all,
    title: 'colophon — design system library',
    body: html`
<div class="wrap">
  <h1>Library</h1>
  <p class="lede">One markdown file per system. Drop it into a project and
  AI-assisted development follows it.</p>

  <div class="bar">
    <label class="searchwrap">
      ${SEARCH_ICON}
      <input id="q" type="search" placeholder="Search" aria-label="Search systems" autocomplete="off">
    </label>
    <div class="chips">${groups.map(([key, values], i) =>
      html`${i > 0 && html`<i class="sep"></i>`}${chips(key, values)}`)}</div>
    <span class="count" id="count"></span>
    <button class="clear" id="clear" hidden>Clear</button>
  </div>

  <div class="grid" id="grid">${all.map(card)}</div>
  <p class="empty" id="empty" hidden>Nothing matches those filters.</p>
</div>
<script>
  const data = ${json(all.map(s => ({
    slug: s.slug, register: s.register, density: s.density, origin: s.origin,
    status: s.status, scripts: s.scripts,
    text: [s.system, s.register, s.density, s.summary, ...s.scripts, ...s.bestFor, ...s.avoidFor]
      .join(' ').toLowerCase(),
  })))};
  const on = {};
  const cards = new Map([...document.querySelectorAll('.card')].map(c => [c.dataset.slug, c]));
  const q = document.getElementById('q');

  function apply() {
    const term = q.value.trim().toLowerCase();
    let shown = 0;
    for (const s of data) {
      const chips = Object.entries(on).every(([k, vals]) => !vals.length ||
        (Array.isArray(s[k]) ? s[k].some(v => vals.includes(v)) : vals.includes(s[k])));
      const ok = chips && (!term || s.text.includes(term));
      cards.get(s.slug).hidden = !ok;
      if (ok) shown++;
    }
    document.getElementById('count').textContent = shown + ' of ' + data.length;
    document.getElementById('empty').hidden = shown > 0;
    document.getElementById('clear').hidden = !(term || Object.values(on).some(v => v.length));
  }

  for (const chip of document.querySelectorAll('.chip[data-k]')) {
    chip.addEventListener('click', () => {
      const { k, v } = chip.dataset;
      on[k] ??= [];
      const i = on[k].indexOf(v);
      i === -1 ? on[k].push(v) : on[k].splice(i, 1);
      chip.setAttribute('aria-pressed', i === -1);
      apply();
    });
  }
  q.addEventListener('input', apply);
  document.getElementById('clear').addEventListener('click', () => {
    q.value = '';
    for (const k in on) on[k] = [];
    document.querySelectorAll('.chip[data-k]').forEach(c => c.setAttribute('aria-pressed', 'false'));
    apply();
  });
  apply();
</script>`,
  })
}
