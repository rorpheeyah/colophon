#!/usr/bin/env node
// Renders systems/<slug>/preview.html from the system's own tokens block.
//
//   node scripts/build-previews.mjs           write every preview
//   node scripts/build-previews.mjs lozenge   write one
//   node scripts/build-previews.mjs --check    exit 1 if any is stale
//
// The tokens block is embedded verbatim, so the preview cannot show a value the
// file does not contain. Everything below it is one shared template driven only
// by --ds-* aliases. There is no per-system branch except resolving `none`.
//
// --ds-shadow is a *control* shadow and is applied only to pressables. A system
// may forbid elevation on containers while requiring it on buttons, and the
// template must not be able to violate that.
//
// One stage per document, with the mode set on the ROOT element. This matters:
// `--ds-bg: var(--paper)` is substituted where it is declared, so if the dark
// block is scoped to a descendant the alias keeps the light value and dark mode
// silently does nothing. The root is the only place the substitution sees the
// dark tokens.

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, systemSlugs, readSystem, tokensBlock, declaredAliases, scalar, list } from './lib.mjs'

// Spacing for a system that declines --ds-gap/--ds-pad. Chosen by the `density`
// field, which every system declares, so this is still the file speaking.
const DENSITY = {
  compact:     { gap: '8px',  pad: '12px 14px' },
  comfortable: { gap: '14px', pad: '18px 20px' },
  spacious:    { gap: '18px', pad: '22px 24px' },
}

// Consonant series and digits, not a sentence — a specimen cannot mistranslate.
const SPECIMEN = { khmer: 'ក ខ គ ឃ ង ច ឆ ជ ០១២៣៤៥៦៧៨៩', arabic: 'ا ب ت ث ج ح خ ٠١٢٣٤٥٦٧٨٩' }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const has = (t, name) => { const v = t.get(name); return v !== undefined && v !== 'none' }
const ref = (t, name, fallback) => (has(t, name) ? `var(${name})` : fallback)

// Every quoted family named in the tokens block, so the preview sets in the
// system's own type rather than in a fallback that flattens every system alike.
function fontLink(css) {
  const families = [...new Set([...css.matchAll(/"([A-Z][A-Za-z0-9 ]+)"/g)].map(m => m[1]))]
    .filter(f => !/^(system-ui|ui-monospace|sans-serif|serif|monospace)$/i.test(f))
  if (!families.length) return ''
  const q = families.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')
  return `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
         `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=swap">`
}

function stage(t, meta) {
  const states = [['success', 'Resolved'], ['warn', 'Attention'], ['alarm', 'Overdue']]
    .filter(([k]) => has(t, `--ds-${k}`))

  const swatches = ['bg', 'surface', 'accent', 'line', 'text', 'text-2', 'text-3',
                    'success', 'warn', 'alarm', 'invert-bg']
    .filter(n => has(t, `--ds-${n}`))
    .map(n => `<div class="sw"><i style="background:var(--ds-${n})"></i><code>${n}</code></div>`)
    .join('')

  const scripts = list(meta.scripts).filter(s => SPECIMEN[s])
    .map(s => `<p class="spec-x">${esc(SPECIMEN[s])}</p>`).join('')

  return `
<div class="stage">
  <div class="sws">${swatches}</div>

  <div class="specimen">
    <p class="spec-d">Aa Hamburgefonstiv</p>
    <p class="spec-b">The rule before the values, so an agent can extrapolate correctly.</p>
    ${scripts}
    ${has(t, '--ds-font-data') ? '<p class="spec-n">1,284.50 · 0912 · 24</p>' : ''}
  </div>

  <div class="card">
    <h3>Summary</h3>
    <div class="row">
      <button class="btn">Primary action</button>
      <span class="input">Search</span>
    </div>
  </div>

  ${has(t, '--ds-invert-bg') ? `
  <div class="card invert">
    <h3>Inverted</h3>
    ${has(t, '--ds-invert-accent') ? '<span class="chip">+12</span>' : ''}
  </div>` : ''}

  ${states.length ? `<div class="row states">${states
    .map(([k, label]) => `<span class="state s-${k}">${label}</span>`).join('')}</div>` : ''}

  ${has(t, '--ds-hatch') ? `
  <div class="bars"><span class="bar"><i style="width:64%"></i></span>
  <span class="bar"><i class="hatched" style="width:38%"></i></span></div>` : ''}

  <table>
    <thead><tr><th>Item</th><th>Status</th><th class="n">Qty</th></tr></thead>
    <tbody>
      <tr><td>First row</td><td>${states.length ? `<span class="state s-${states[0][0]}">${states[0][1]}</span>` : '—'}</td><td class="n">128</td></tr>
      <tr><td>Second row</td><td>${states.length > 1 ? `<span class="state s-${states[1][0]}">${states[1][1]}</span>` : '—'}</td><td class="n">1,284</td></tr>
      <tr><td>Third row</td><td>—</td><td class="n">6</td></tr>
    </tbody>
  </table>
</div>`
}

function render(sys) {
  const meta = Object.fromEntries(Object.entries(sys.data)
    .map(([k, v]) => [k, Array.isArray(v) ? v : v.value]))
  const block = tokensBlock(sys.blocks)[0]
  if (!block) throw new Error(`${sys.slug}: no tokens block`)

  const t = declaredAliases(block.code)
  const density = DENSITY[meta.density] ?? DENSITY.comfortable
  const hasDark = /\[data-mode\s*=\s*["']?dark["']?\]/.test(block.code)
  const spacingFromDensity = !has(t, '--ds-gap') || !has(t, '--ds-pad')

  // The only per-system CSS: resolving the aliases this system declined.
  const shim = [
    `--_gap: ${ref(t, '--ds-gap', density.gap)};`,
    `--_pad: ${ref(t, '--ds-pad', density.pad)};`,
    `--_data: ${ref(t, '--ds-font-data', 'var(--ds-font-body)')};`,
    `--_border: ${has(t, '--ds-border-color') ? 'var(--ds-border-width) solid var(--ds-border-color)' : '0'};`,
  ].join(' ')

  const notes = [
    hasDark ? '' : 'Dark mode was not published for this system, so none is shown.',
    spacingFromDensity ? `Spacing from <code>density: ${esc(meta.density)}</code> — this system declares no spacing step.` : '',
    has(t, '--ds-success') ? '' : 'This system declares no success colour.',
  ].filter(Boolean)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.system)} — preview</title>
${fontLink(block.code)}
<style>
/* Generated by scripts/build-previews.mjs. Do not edit.
   The block below is copied verbatim from ${esc(sys.path)}. */
${block.code}

/* ── shared template ──────────────────────────────────────────────────── */
*{box-sizing:border-box}
body{margin:0;background:#f4f4f5;color:#18181b;font:14px/1.5 system-ui,sans-serif}
.chrome{padding:16px 20px;border-bottom:1px solid #d4d4d8}
.chrome h1{margin:0 0 4px;font-size:17px}
.chrome dl{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0;font-size:12px;color:#52525b}
.chrome dt{font-weight:600}.chrome dd{margin:0 0 0 4px}
.chrome dt,.chrome dd{display:inline}
.prov{margin:10px 0 0;padding:8px 10px;background:#fff7ed;border:1px solid #fed7aa;
      border-radius:4px;font-size:12px;color:#7c2d12;max-width:72ch}
.notes{margin:8px 0 0;font-size:12px;color:#52525b}
.notes li{margin:2px 0}

/* ?chrome=0 hides the header; ?mode=dark sets data-mode on the root element. */
[data-nochrome] .chrome{display:none}
.nodark{margin:0;padding:22px;color:#71717a;font-size:13px}
[data-nodark] .stage{display:none}

/* Everything below reads --ds-* only. */
.stage{${shim}
  background:var(--ds-bg);color:var(--ds-text);font-family:var(--ds-font-body);
  padding:var(--_pad);display:flex;flex-direction:column;gap:var(--_gap)}
.stage h3{margin:0;font-family:var(--ds-font-display);font-size:15px}
.stage p{margin:0}
.row{display:flex;gap:var(--_gap);align-items:center;flex-wrap:wrap}

.sws{display:flex;flex-wrap:wrap;gap:var(--_gap)}
.sw{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--ds-text-3)}
.sw i{width:20px;height:20px;border-radius:var(--ds-radius-box);
      outline:1px solid var(--ds-line);outline-offset:-1px}
.sw code{font-family:var(--_data)}

.specimen{display:flex;flex-direction:column;gap:4px}
.spec-d{font-family:var(--ds-font-display);font-size:26px;font-weight:700;line-height:1.15}
.spec-b{font-size:15px;color:var(--ds-text-2)}
.spec-x{font-size:15px;line-height:2.1}
.spec-n{font-family:var(--_data);font-size:15px;font-variant-numeric:tabular-nums}

.card{background:var(--ds-surface);border-radius:var(--ds-radius-box);border:var(--_border);
      padding:var(--_pad);display:flex;flex-direction:column;gap:var(--_gap)}
.card.invert{background:var(--ds-invert-bg);color:var(--ds-invert-text);border:0}
.card.invert h3,.card.invert p{color:inherit}
.chip{align-self:flex-start;background:var(--ds-invert-accent);color:var(--ds-invert-bg);
      border-radius:var(--ds-radius-control);padding:2px 10px;font:700 11px/1.6 var(--_data)}

.btn{background:var(--ds-button-bg);color:var(--ds-button-text);border:var(--_border);
     border-radius:var(--ds-radius-control);box-shadow:var(--ds-shadow);
     font:600 13px/1 var(--ds-font-body);padding:11px 16px;cursor:pointer}
.input{background:var(--ds-bg);color:var(--ds-text-3);border:var(--_border);
       border-radius:var(--ds-radius-control);padding:10px 14px;font-size:13px}

.state{border-radius:var(--ds-radius-control);padding:3px 10px;
       font:600 11px/1.6 var(--_data);letter-spacing:.04em;display:inline-block}
${['success', 'warn', 'alarm'].filter(k => has(t, `--ds-${k}`)).map(k =>
`.s-${k}{color:var(--ds-${k});` + (has(t, `--ds-${k}-wash`)
    ? `background:var(--ds-${k}-wash)}`
    : `border:1px solid var(--ds-${k})}`)).join('\n')}

.bars{display:flex;flex-direction:column;gap:6px}
.bar{display:block;height:14px;background:var(--ds-line);border-radius:var(--ds-radius-control);overflow:hidden}
.bar i{display:block;height:100%;background:var(--ds-accent);border-radius:var(--ds-radius-control)}
.bar i.hatched{background:var(--ds-hatch);color:var(--ds-accent)}

table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font:700 10px/1.6 var(--_data);letter-spacing:.07em;text-transform:uppercase;
   color:var(--ds-text-2);padding:6px 8px;border-bottom:1px solid var(--ds-line)}
td{padding:9px 8px;border-bottom:1px solid var(--ds-line);color:var(--ds-text)}
.n{text-align:right;font-family:var(--_data);font-variant-numeric:tabular-nums}
</style>
</head>
<body>
<div class="chrome">
  <h1>${esc(meta.system)} <span style="font-weight:400;color:#71717a">${esc(meta.version)}</span></h1>
  <dl>
    <div><dt>status</dt><dd>${esc(meta.status)}</dd></div>
    <div><dt>origin</dt><dd>${esc(meta.origin)}</dd></div>
    <div><dt>register</dt><dd>${esc(meta.register)}</dd></div>
    <div><dt>density</dt><dd>${esc(meta.density)}</dd></div>
    <div><dt>scripts</dt><dd>${esc(list(meta.scripts).join(', '))}</dd></div>
  </dl>
  ${meta.origin === 'reference' ? `<p class="prov"><strong>Reference record.</strong>
    A reading of someone else's public work, not an original system.
    ${esc(meta.credit ?? '')} <a href="${esc(meta['source-url'] ?? '')}">Source</a>.
    Tokens are approximations, not the author's values.</p>` : ''}
  ${notes.length ? `<ul class="notes">${notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
</div>
${stage(t, meta)}
<p class="nodark" hidden>Dark mode was not published for this system, so there is nothing to show.</p>
<script>
  // Set before paint. data-mode must live on the root element or the --ds-*
  // aliases keep their light values — see the note at the top of the generator.
  const q = new URLSearchParams(location.search)
  const root = document.documentElement
  if (q.get('chrome') === '0') root.dataset.nochrome = ''
  if (q.get('mode') === 'dark') {
    if (${hasDark}) root.dataset.mode = 'dark'
    else { root.dataset.nodark = ''; document.querySelector('.nodark').hidden = false }
  }
</script>
</body>
</html>
`
}

// ── run ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const check = args.includes('--check')
const only = args.filter(a => !a.startsWith('-'))
const slugs = only.length ? only : systemSlugs()

let stale = 0
for (const slug of slugs) {
  const sys = readSystem(slug)
  if (!sys) { console.error(`no such system: ${slug}`); process.exit(2) }

  const html = render(sys)
  const out = join(ROOT, 'systems', slug, 'preview.html')

  if (check) {
    const current = existsSync(out) ? readFileSync(out, 'utf8') : null
    if (current !== html) { console.log(`stale: systems/${slug}/preview.html`); stale++ }
  } else {
    writeFileSync(out, html)
    console.log(`  wrote systems/${slug}/preview.html`)
  }
}

if (check && stale) process.exit(1)
if (check) console.log(`${slugs.length} preview(s) up to date`)
