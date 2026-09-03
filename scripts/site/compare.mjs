import { html, json } from './html.mjs'
import { shell, crumbs } from './layout.mjs'

export const comparePage = all => shell({
  base: '', current: 'compare', systems: all, title: 'Compare — colophon',
  body: html`
<div class="wrap">
  ${crumbs('', ['Compare'])}
  <h1>Compare</h1>

  <div class="cbar">
    <label>Left <select id="a">${all.map(s => html`<option value="${s.slug}">${s.system}</option>`)}</select></label>
    <label>Right <select id="b">${all.map(s => html`<option value="${s.slug}">${s.system}</option>`)}</select></label>
    <span class="modes">
      <button class="chip" data-mode="light" aria-pressed="true">Light</button>
      <button class="chip" data-mode="dark" aria-pressed="false">Dark</button>
      <button class="chip" id="swap">Swap</button>
    </span>
  </div>

  <div class="cpair">
    <div><h2 id="ha"></h2><iframe id="fa" title="Left system preview"></iframe></div>
    <div><h2 id="hb"></h2><iframe id="fb" title="Right system preview"></iframe></div>
  </div>

  <h2 class="crule">Stated facts</h2>
  <div class="crow" id="facts"></div>

  <h2 class="crule">Where they disagree</h2>
  <div class="cdiff" id="diff"></div>
</div>
<script>
  const data = ${json(all.map(s => ({
    slug: s.slug, system: s.system, version: s.version, register: s.register,
    density: s.density, scripts: s.scripts, origin: s.origin, status: s.status,
    bestFor: s.bestFor, avoidFor: s.avoidFor, aliases: Object.fromEntries(s.aliases),
  })))};
  const by = Object.fromEntries(data.map(s => [s.slug, s]));
  const q = new URLSearchParams(location.search);
  const el = id => document.getElementById(id);
  let mode = q.get('mode') === 'dark' ? 'dark' : 'light';

  el('a').value = by[q.get('a')] ? q.get('a') : data[0].slug;
  el('b').value = by[q.get('b')] ? q.get('b') : (data[1] ?? data[0]).slug;

  const FACTS = ['register', 'density', 'origin', 'status'];
  const row = (k, v) => '<dt>' + k + '</dt><dd>' + v + '</dd>';
  const facts = s => FACTS.map(k => row(k, s[k])).join('') +
    row('scripts', s.scripts.join(', ')) +
    row('for', s.bestFor.join(', ')) +
    row('not', s.avoidFor.join(', '));

  function diff(a, b) {
    const names = [...new Set([...Object.keys(a.aliases), ...Object.keys(b.aliases)])].sort();
    const rows = names.filter(n => a.aliases[n] !== b.aliases[n]).map(n =>
      '<tr><td><code>' + n + '</code></td>' +
      '<td class="' + (a.aliases[n] === 'none' ? 'declined' : '') + '"><code>' + (a.aliases[n] ?? '—') + '</code></td>' +
      '<td class="' + (b.aliases[n] === 'none' ? 'declined' : '') + '"><code>' + (b.aliases[n] ?? '—') + '</code></td></tr>').join('');
    return rows
      ? '<table class="aliases"><thead><tr><th>Alias</th><th>' + a.system + '</th><th>' +
        b.system + '</th></tr></thead><tbody>' + rows + '</tbody></table>'
      : '<p class="empty">These two declare every alias identically.</p>';
  }

  function draw() {
    const a = by[el('a').value], b = by[el('b').value];
    for (const [side, s] of [['a', a], ['b', b]]) {
      el('f' + side).src = 's/' + s.slug + '/preview.html?mode=' + mode + '&chrome=0';
      el('h' + side).innerHTML = '<a href="s/' + s.slug + '/index.html">' + s.system +
        '</a> <em>' + s.version + '</em>';
    }
    el('facts').innerHTML =
      '<section><h3>' + a.system + '</h3><dl>' + facts(a) + '</dl></section>' +
      '<section><h3>' + b.system + '</h3><dl>' + facts(b) + '</dl></section>';
    el('diff').innerHTML = diff(a, b);
    history.replaceState(null, '', '?a=' + a.slug + '&b=' + b.slug + '&mode=' + mode);
  }

  // Fit each frame to the preview inside it: no dead space, nothing clipped,
  // whatever a given system's content adds up to. Measured from the parent
  // because both documents are same-origin — messaging from the frame would
  // race the parent's listener and usually lose.
  function fit(f) {
    const doc = f.contentDocument;
    if (!doc) return;
    const set = () => {
      const h = Math.ceil(doc.body.getBoundingClientRect().height) + 2;
      if (Math.abs(h - parseFloat(f.style.height || 0)) > 1) f.style.height = h + 'px';
    };
    set();
    if (doc.fonts) doc.fonts.ready.then(set);
    new ResizeObserver(set).observe(doc.body);
  }
  function fitAll(frames) {
    for (const f of frames) {
      f.addEventListener('load', () => fit(f));
      if (f.contentDocument && f.contentDocument.readyState === 'complete') fit(f);
    }
  }
  fitAll([el('fa'), el('fb')]);

  el('a').addEventListener('change', draw);
  el('b').addEventListener('change', draw);
  el('swap').addEventListener('click', () => {
    const t = el('a').value; el('a').value = el('b').value; el('b').value = t; draw();
  });
  for (const btn of document.querySelectorAll('[data-mode]')) {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      document.querySelectorAll('[data-mode]').forEach(x =>
        x.setAttribute('aria-pressed', x.dataset.mode === mode));
      draw();
    });
  }
  document.querySelectorAll('[data-mode]').forEach(x =>
    x.setAttribute('aria-pressed', x.dataset.mode === mode));
  draw();
</script>`,
})
