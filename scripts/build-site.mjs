#!/usr/bin/env node
// Builds the static browse UI into site/ from the system files.
//
//   node scripts/build-site.mjs           write the site
//   node scripts/build-site.mjs --check   exit 1 if anything is stale
//
// site/assets/style.css is hand-written source. Everything else under site/ is
// generated and committed, so GitHub Pages needs no build step.
//
// index.json stays the append-only ledger; site/data.json is derived from
// frontmatter on every build, so the site can never show stale metadata.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'
import { ROOT, systemSlugs, readSystem, scalar, list } from './lib.mjs'

marked.setOptions({ gfm: true, mangle: false, headerIds: false })

const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
// JSON embedded in a <script> must not be able to close the tag early.
const json = v => JSON.stringify(v).replace(/</g, '\\u003c')

const FILTERS = ['register', 'density', 'origin', 'status']

function load() {
  const ledger = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8'))
  const added = Object.fromEntries(ledger.map(e => [e.slug, e.added]))
  return systemSlugs().map(slug => {
    const sys = readSystem(slug)
    const f = sys.data
    return {
      slug,
      system: scalar(f.system), version: scalar(f.version), status: scalar(f.status),
      origin: scalar(f.origin), register: scalar(f.register), density: scalar(f.density),
      scripts: list(f.scripts), bestFor: list(f['best-for']), avoidFor: list(f['avoid-for']),
      credit: scalar(f.credit), sourceUrl: scalar(f['source-url']),
      added: added[slug] ?? null,
      // the leading h1 is dropped; the page renders its own
      body: sys.body.replace(/^\s*#\s+.*\n/, ''),
    }
  })
}

const shell = (base, title, current, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${base}assets/style.css">
</head>
<body>
<div class="top"><div class="wrap">
  <b>colophon</b>
  <nav>
    <a href="${base}index.html"${current === 'library' ? ' aria-current="page"' : ''}>Library</a>
    <a href="${base}compare.html"${current === 'compare' ? ' aria-current="page"' : ''}>Compare</a>
  </nav>
</div></div>
${body}
<footer><div class="wrap">Design systems as drop-in markdown. Generated from the repo — the file is the product.</div></footer>
</body>
</html>
`

const tags = s => `<div class="meta">
  <span class="tag">${esc(s.register)}</span>
  <span class="tag">${esc(s.density)}</span>
  ${s.scripts.map(x => `<span class="tag">${esc(x)}</span>`).join('')}
  ${s.origin === 'reference' ? '<span class="tag ref">reference</span>' : ''}
  ${s.status !== 'active' ? `<span class="tag ref">${esc(s.status)}</span>` : ''}
</div>`

// ── library ──────────────────────────────────────────────────────────────────

function libraryPage(all) {
  const groups = FILTERS.map(key => {
    const values = [...new Set(all.map(s => s[key]).filter(Boolean))].sort()
    return values.length < 2 ? '' : `<div class="fgroup"><span>${key}</span>${values
      .map(v => `<button class="chip" data-k="${key}" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`)
      .join('')}</div>`
  }).join('')

  const scripts = [...new Set(all.flatMap(s => s.scripts))].sort()
  const scriptGroup = scripts.length < 2 ? '' : `<div class="fgroup"><span>scripts</span>${scripts
    .map(v => `<button class="chip" data-k="scripts" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`)
    .join('')}</div>`

  const cards = all.map(s => `
<article class="card" data-slug="${esc(s.slug)}">
  <a class="thumb" href="s/${esc(s.slug)}/index.html" aria-label="Open ${esc(s.system)}">
    <iframe src="s/${esc(s.slug)}/preview.html?mode=light&amp;chrome=0" loading="lazy"
            title="${esc(s.system)} preview" tabindex="-1" scrolling="no"></iframe>
  </a>
  <div class="body">
    <h2><a href="s/${esc(s.slug)}/index.html">${esc(s.system)}</a> <em>${esc(s.version)}</em></h2>
    ${tags(s)}
    <p class="for"><b>Best for</b> ${esc(s.bestFor.slice(0, 3).join(', '))}</p>
    <p class="for"><b>Avoid for</b> ${esc(s.avoidFor.slice(0, 2).join(', '))}</p>
    <div class="actions">
      <a class="btn primary" href="s/${esc(s.slug)}/${esc(s.slug)}.md" download>Download .md</a>
      <a class="btn" href="s/${esc(s.slug)}/index.html">Open</a>
    </div>
  </div>
</article>`).join('')

  return shell('', 'colophon — design system library', 'library', `
<div class="wrap">
  <h1>Library</h1>
  <p class="lede">Each system is one markdown file. Pick one, drop it into a project as
  <code>CLAUDE.md</code> or reference it from one, and development follows that system.</p>
  <div class="filters">
    ${groups}${scriptGroup}
    <span class="count" id="count"></span>
  </div>
  <div class="grid" id="grid">${cards}</div>
  <p class="empty" id="empty" hidden>No system matches those filters.</p>
</div>
<script>
  const data = ${json(all.map(s => ({ slug: s.slug, register: s.register, density: s.density,
    origin: s.origin, status: s.status, scripts: s.scripts })))};
  const on = {};
  const cards = new Map([...document.querySelectorAll('.card')].map(c => [c.dataset.slug, c]));

  function apply() {
    let shown = 0;
    for (const s of data) {
      const ok = Object.entries(on).every(([k, vals]) =>
        !vals.length || (Array.isArray(s[k]) ? s[k].some(v => vals.includes(v)) : vals.includes(s[k])));
      cards.get(s.slug).hidden = !ok;
      if (ok) shown++;
    }
    document.getElementById('count').textContent = shown + ' of ' + data.length;
    document.getElementById('empty').hidden = shown > 0;
  }
  for (const chip of document.querySelectorAll('.chip')) {
    chip.addEventListener('click', () => {
      const { k, v } = chip.dataset;
      on[k] ??= [];
      const i = on[k].indexOf(v);
      i === -1 ? on[k].push(v) : on[k].splice(i, 1);
      chip.setAttribute('aria-pressed', i === -1);
      apply();
    });
  }
  apply();
</script>`)
}

// ── system page ──────────────────────────────────────────────────────────────

function systemPage(s) {
  const prov = s.origin === 'reference' ? `<p class="prov">
    <strong>Reference record.</strong> This is a reading of someone else's public work, not an
    original system and not a claim of authorship. ${esc(s.credit)}
    ${s.sourceUrl ? `<a href="${esc(s.sourceUrl)}">Source</a>.` : ''}
    Token values are approximations, not the author's own.</p>` : ''

  return shell('../../', `${s.system} — colophon`, null, `
<div class="wrap">
  <div class="head">
    <div>
      <h1>${esc(s.system)} <em style="font-style:normal;font-weight:400;color:var(--fg-3)">${esc(s.version)}</em></h1>
      ${tags(s)}
    </div>
    <div class="actions">
      <button class="btn primary" id="copy">Copy file</button>
      <a class="btn" href="${esc(s.slug)}.md" download>Download .md</a>
    </div>
  </div>
  ${prov}
  <div class="frame">
    <b>Generated preview — light and dark</b>
    <iframe src="preview.html?chrome=0" title="${esc(s.system)} preview" loading="lazy"></iframe>
  </div>
  <div class="doc">${marked.parse(s.body)}</div>
</div>
<script id="src" type="application/json">${json(s.body)}</script>
<script>
  const raw = JSON.parse(document.getElementById('src').textContent);
  const btn = document.getElementById('copy');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(raw);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Copy failed — use Download';
    }
    setTimeout(() => { btn.textContent = 'Copy file'; }, 2200);
  });
</script>`)
}

// ── compare ──────────────────────────────────────────────────────────────────

function comparePage(all) {
  const options = all.map(s => `<option value="${esc(s.slug)}">${esc(s.system)}</option>`).join('')
  return shell('', 'Compare — colophon', 'compare', `
<div class="wrap">
  <h1>Compare</h1>
  <p class="lede">Two systems on the same generated preview, in the same mode. Everything shown
  comes from each system's own tokens block.</p>
  <div class="cbar">
    <label>Left <select id="a">${options}</select></label>
    <label>Right <select id="b">${options}</select></label>
    <div class="modes">
      <button class="btn" data-mode="light" aria-pressed="true">Light</button>
      <button class="btn" data-mode="dark" aria-pressed="false">Dark</button>
    </div>
  </div>
  <div class="cpair">
    <div><h2 id="ha"></h2><iframe id="fa" title="Left system preview"></iframe></div>
    <div><h2 id="hb"></h2><iframe id="fb" title="Right system preview"></iframe></div>
  </div>
  <div class="crow" id="facts"></div>
</div>
<script>
  const data = ${json(all.map(s => ({ slug: s.slug, system: s.system, version: s.version,
    register: s.register, density: s.density, scripts: s.scripts, origin: s.origin,
    status: s.status, bestFor: s.bestFor, avoidFor: s.avoidFor })))};
  const by = Object.fromEntries(data.map(s => [s.slug, s]));
  const q = new URLSearchParams(location.search);
  const el = id => document.getElementById(id);
  let mode = q.get('mode') === 'dark' ? 'dark' : 'light';

  el('a').value = by[q.get('a')] ? q.get('a') : data[0].slug;
  el('b').value = by[q.get('b')] ? q.get('b') : (data[1] ?? data[0]).slug;

  const facts = s => ['register', 'density', 'origin', 'status']
    .map(k => '<li><b>' + k + '</b> — ' + s[k] + '</li>').join('')
    + '<li><b>scripts</b> — ' + s.scripts.join(', ') + '</li>'
    + '<li><b>best for</b> — ' + s.bestFor.join(', ') + '</li>'
    + '<li><b>avoid for</b> — ' + s.avoidFor.join(', ') + '</li>';

  function draw() {
    const a = by[el('a').value], b = by[el('b').value];
    for (const [side, s] of [['a', a], ['b', b]]) {
      el('f' + side).src = 's/' + s.slug + '/preview.html?mode=' + mode + '&chrome=0';
      el('h' + side).innerHTML = '<a href="s/' + s.slug + '/index.html">' + s.system +
        '</a> <em>' + s.version + '</em>';
    }
    el('facts').innerHTML = '<section><h3>' + a.system + '</h3><ul>' + facts(a) + '</ul></section>' +
                            '<section><h3>' + b.system + '</h3><ul>' + facts(b) + '</ul></section>';
    history.replaceState(null, '', '?a=' + a.slug + '&b=' + b.slug + '&mode=' + mode);
  }
  el('a').addEventListener('change', draw);
  el('b').addEventListener('change', draw);
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
</script>`)
}

// ── run ──────────────────────────────────────────────────────────────────────

const check = process.argv.includes('--check')
const all = load()
const files = new Map()

files.set('index.html', libraryPage(all))
files.set('compare.html', comparePage(all))
files.set('data.json', JSON.stringify(all.map(({ body, ...rest }) => rest), null, 2) + '\n')

for (const s of all) {
  files.set(`s/${s.slug}/index.html`, systemPage(s))
  files.set(`s/${s.slug}/${s.slug}.md`, readFileSync(join(ROOT, 'systems', s.slug, `${s.slug}.md`), 'utf8'))
  files.set(`s/${s.slug}/preview.html`, readFileSync(join(ROOT, 'systems', s.slug, 'preview.html'), 'utf8'))
}

if (check) {
  const stale = [...files].filter(([rel, content]) => {
    const abs = join(ROOT, 'site', rel)
    return !existsSync(abs) || readFileSync(abs, 'utf8') !== content
  }).map(([rel]) => rel)

  // a system removed from the repo must not linger in the built site
  const built = existsSync(join(ROOT, 'site', 's'))
    ? readdirSync(join(ROOT, 'site', 's')) : []
  const orphans = built.filter(slug => !all.some(s => s.slug === slug)).map(s => `s/${s}`)

  for (const f of [...stale, ...orphans]) console.log(`stale: site/${f}`)
  process.exit(stale.length + orphans.length ? 1 : 0)
}

for (const slug of existsSync(join(ROOT, 'site', 's')) ? readdirSync(join(ROOT, 'site', 's')) : []) {
  if (!all.some(s => s.slug === slug)) rmSync(join(ROOT, 'site', 's', slug), { recursive: true })
}
for (const [rel, content] of files) {
  const abs = join(ROOT, 'site', rel)
  mkdirSync(join(abs, '..'), { recursive: true })
  writeFileSync(abs, content)
}
console.log(`  wrote site/ — ${files.size} files, ${all.length} system(s)`)
