import { html, json } from './html.mjs'
import { shell, tags } from './layout.mjs'

const FILTERS = ['register', 'density', 'origin', 'status']

const group = (key, values) => values.length < 2 ? '' : html`<div class="fgroup">
  <span>${key}</span>
  ${values.map(v => html`<button class="chip" data-k="${key}" data-v="${v}" aria-pressed="false">${v}</button>`)}
</div>`

const card = s => html`
<article class="card" data-slug="${s.slug}">
  <a class="thumb" href="s/${s.slug}/index.html" aria-label="Open ${s.system}">
    <iframe src="s/${s.slug}/preview.html?mode=light&amp;chrome=0" loading="lazy"
            title="${s.system} preview" tabindex="-1" scrolling="no"></iframe>
  </a>
  <div class="body">
    <h2><a href="s/${s.slug}/index.html">${s.system}</a> <em>${s.version}</em></h2>
    ${tags(s)}
    <p class="summary">${s.summary}</p>
    <p class="for"><b>Best for</b> ${s.bestFor.slice(0, 3).join(', ')}</p>
    <p class="for"><b>Avoid for</b> ${s.avoidFor.slice(0, 2).join(', ')}</p>
    <div class="actions">
      <a class="btn primary" href="s/${s.slug}/${s.slug}.md" download>Download .md</a>
      <a class="btn" href="s/${s.slug}/index.html">Open</a>
    </div>
  </div>
</article>`

export const libraryPage = all => shell({
  base: '', current: 'library', title: 'colophon — design system library',
  body: html`
<div class="wrap">
  <h1>Library</h1>
  <p class="lede">Each system is one markdown file. Pick one, install it into a project, and
  AI-assisted development follows that system.</p>

  <div class="filters">
    <label class="search">
      <span>Search</span>
      <input id="q" type="search" placeholder="POS, long-form reading, khmer…" autocomplete="off">
    </label>
    ${FILTERS.map(key => group(key, [...new Set(all.map(s => s[key]).filter(Boolean))].sort()))}
    ${group('scripts', [...new Set(all.flatMap(s => s.scripts))].sort())}
    <span class="count" id="count"></span>
    <button class="chip clear" id="clear" hidden>Clear</button>
  </div>

  <div class="grid" id="grid">${all.map(card)}</div>
  <p class="empty" id="empty" hidden>No system matches those filters.</p>
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
    const active = term || Object.values(on).some(v => v.length);
    document.getElementById('count').textContent = shown + ' of ' + data.length;
    document.getElementById('empty').hidden = shown > 0;
    document.getElementById('clear').hidden = !active;
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
