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

// Each group renders only what the system declared. A group whose aliases are
// all `none` disappears rather than being approximated.
const group = (title, ...parts) => {
  const body = parts.filter(Boolean).join('\n')
  return body ? `<section class="grp"><h4>${title}</h4>${body}</div></section>` : ''
}
const rows = body => `<div class="rows">${body}`

function stage(t, meta) {
  const states = [['success', 'Resolved'], ['warn', 'Attention'], ['alarm', 'Overdue']]
    .filter(([k]) => has(t, `--ds-${k}`))
  const series = [1, 2, 3, 4, 5].filter(n => has(t, `--ds-chart-${n}`))
  const script = list(meta.scripts).find(x => SPECIMEN[x])

  const swatches = ['bg', 'surface', 'accent', 'line', 'text', 'text-2', 'text-3',
                    'success', 'warn', 'alarm', 'invert-bg', ...series.map(n => `chart-${n}`)]
    .filter(n => has(t, `--ds-${n}`))
    .map(n => `<div class="sw"><i style="background:var(--ds-${n})"></i><code>${n}</code></div>`)
    .join('')

  return `
<div class="stage">
  <section class="grp"><h4>Colour</h4><div class="sws">${swatches}</div></section>

  <section class="grp"><h4>Type</h4>
    <div class="specimen">
      <p class="spec-d">Aa Hamburgefonstiv</p>
      <p class="spec-b">The rule before the values, so an agent can extrapolate correctly.</p>
      ${script ? `<p class="spec-x">${esc(SPECIMEN[script])}</p>` : ''}
      ${has(t, '--ds-font-data') ? '<p class="spec-n">1,284.50 · 0912 · 24</p>' : ''}
    </div>
  </section>

  ${group('Base', rows(`
    <div class="row">
      <button class="btn">Primary</button>
      <button class="btn b2">Secondary</button>
      <button class="btn b3">Ghost</button>
      <button class="btn" disabled>Disabled</button>
    </div>
    <div class="row">
      <span class="badge">Badge</span>
      ${has(t, '--ds-invert-bg') ? '<span class="avatar">SK</span>' : ''}
      <a class="lnk" href="#">A link</a>
      <span class="kbd">⌘K</span>
    </div>
    <hr class="rule">`))}

  ${group('Forms', rows(`
    <div class="field">
      <label>Batch number</label>
      <span class="input">AC-4192</span>
      <em class="help">Printed on the carton.</em>
    </div>
    ${has(t, '--ds-alarm') ? `<div class="field bad">
      <label>Quantity</label>
      <span class="input err">0</span>
      <em class="help err">Must be at least one.</em>
    </div>` : ''}
    <div class="row">
      <span class="input sel">Supplier<i class="caret"></i></span>
      <span class="check on"><i></i>Received</span>
      <span class="check">Damaged</span>
      <span class="radio on"><i></i>Cash</span>
      <span class="radio">Card</span>
      <span class="switch on"><i></i></span>
    </div>`))}

  ${group('Data', rows(`
    <div class="stats">
      <div class="stat">
        <span>Revenue today</span><b>1,284.50</b>
        ${states.length ? `<em class="state s-${states[0][0]}">+12%</em>` : ''}
      </div>
      ${has(t, '--ds-invert-bg') ? `<div class="stat inv">
        <span>Stock value</span><b>48,210</b>
        ${has(t, '--ds-invert-accent') ? '<em class="chip">+4%</em>' : ''}
      </div>` : ''}
    </div>
    <dl class="kv"><dt>Supplier</dt><dd>Mekong Pharma</dd><dt>Received</dt><dd>12 Aug</dd></dl>
    <div class="meter">${[1, 1, 1, 1, 1, 0, 0].map(f =>
      `<i class="${f ? 'on' : 'off'}"></i>`).join('')}</div>
    <table>
      <thead><tr><th>Item</th><th>Status</th><th class="n">Qty</th></tr></thead>
      <tbody>
        <tr><td>Paracetamol 500mg</td><td>${states[0] ? `<span class="state s-${states[0][0]}">${states[0][1]}</span>` : '—'}</td><td class="n">128</td></tr>
        <tr><td>Amoxicillin 250mg</td><td>${states[1] ? `<span class="state s-${states[1][0]}">${states[1][1]}</span>` : '—'}</td><td class="n">1,284</td></tr>
        <tr><td>Saline 500ml</td><td>—</td><td class="n">6</td></tr>
      </tbody>
    </table>
    <div class="row pager">
      <span class="pg">Prev</span><span class="pg on">1</span><span class="pg">2</span>
      <span class="pg">3</span><span class="pg">Next</span>
    </div>
    <div class="skel"><i></i><i></i><i></i></div>
    <p class="none">No records match this filter.</p>`))}

  ${group('Navigation', rows(`
    <div class="tabs"><span class="on">Stock</span><span>Orders</span><span>Suppliers</span></div>
    <div class="bcrumb">Inventory <i>/</i> Stock <b>Paracetamol</b></div>
    ${has(t, '--ds-invert-bg') ? `<div class="rail">
      <span class="on">Dashboard</span><span>Stock</span><span>Orders</span></div>`
      : `<div class="railplain">
      <span class="on">Dashboard</span><span>Stock</span><span>Orders</span></div>`}`))}

  ${group('Feedback',
    states.length ? rows(states.map(([k, label]) =>
      `<div class="alert a-${k}"><b>${label}</b> Two batches expire within seven days.</div>`).join('')
      + (has(t, '--ds-shadow-surface')
        ? '<div class="toast">Saved</div>'
        : '<p class="none">No floating surface: this system declares no elevation for one.</p>')
      + (has(t, '--ds-scrim')
        ? '<div class="scrimbox"><div class="dialog"><b>Discard changes?</b><div class="row"><button class="btn">Discard</button><button class="btn b2">Keep</button></div></div></div>'
        : '<p class="none">No dialog: this system declares no scrim.</p>')) : '')}

  ${group('Charts', series.length ? rows(`
    <div class="bars">
      <span class="bar"><i style="width:64%;background:var(--ds-chart-1)"></i></span>
      <span class="bar"><i style="width:41%;background:var(--ds-chart-1)"></i></span>
      ${has(t, '--ds-hatch') ? '<span class="bar"><i class="hatched" style="width:28%"></i></span>' : ''}
    </div>
    ${series.length > 1 ? `<div class="stack">${series.map((n, i) =>
      `<i style="width:${[38, 26, 18, 12, 6][i]}%;background:var(--ds-chart-${n})"></i>`).join('')}</div>
    <div class="legend">${series.map(n =>
      `<span><i style="background:var(--ds-chart-${n})"></i>Series ${n}</span>`).join('')}</div>`
      : '<p class="none">One series declared, so no multi-series chart is shown.</p>'}`)
    : '')}

  ${series.length ? '' : '<p class="none">No chart palette declared, so no chart is shown.</p>'}
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
    `--_script: ${ref(t, '--ds-font-script', 'var(--ds-font-body)')};`,
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

/* Everything below reads --ds-* only, plus the four --_ shims above, which
   exist solely to resolve aliases this system declined. */
.stage{${shim}
  background:var(--ds-bg);color:var(--ds-text);font-family:var(--ds-font-body);
  padding:var(--_pad);display:flex;flex-direction:column;gap:calc(var(--_gap) * 2);
  /* no effect inside a preview frame; keeps standalone viewing readable */
  max-width:900px;margin-inline:auto}
.stage p{margin:0}
.grp{display:flex;flex-direction:column;gap:var(--_gap)}
.grp > h4{margin:0;font:600 9.5px/1 var(--_data);letter-spacing:.12em;text-transform:uppercase;
  color:var(--ds-text-3);padding-bottom:5px;border-bottom:1px solid var(--ds-line)}
.rows{display:flex;flex-direction:column;gap:var(--_gap)}
.row{display:flex;gap:var(--_gap);align-items:center;flex-wrap:wrap}
.rule{border:0;border-top:1px solid var(--ds-line);margin:0;width:100%}
.none{font-size:12px;color:var(--ds-text-3)}

/* colour */
.sws{display:flex;flex-wrap:wrap;gap:var(--_gap)}
.sw{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--ds-text-3)}
.sw i{width:20px;height:20px;border-radius:var(--ds-radius-box);
  outline:1px solid var(--ds-line);outline-offset:-1px}
.sw code{font-family:var(--_data)}

/* type */
.specimen{display:flex;flex-direction:column;gap:4px}
.spec-d{font-family:var(--ds-font-display);font-size:26px;font-weight:700;line-height:1.15}
.spec-b{font-size:15px;color:var(--ds-text-2)}
.spec-x{font-family:var(--_script);font-size:15px;line-height:2}
.spec-n{font-family:var(--_data);font-size:15px;font-variant-numeric:tabular-nums}

/* base */
.btn{background:var(--ds-button-bg);color:var(--ds-button-text);border:var(--_border);
  border-radius:var(--ds-radius-control);box-shadow:var(--ds-shadow);
  font:600 13px/1 var(--ds-font-body);padding:10px 15px;cursor:pointer}
.btn.b2{background:var(--ds-surface);color:var(--ds-text)}
.btn.b3{background:transparent;color:var(--ds-text-2);border:0;box-shadow:none}
.btn[disabled]{background:var(--ds-line);color:var(--ds-text-3);border:0;box-shadow:none;cursor:default}
.badge{background:var(--ds-line);color:var(--ds-text-2);border-radius:var(--ds-radius-control);
  padding:2px 9px;font:600 11px/1.6 var(--_data)}
.avatar{display:grid;place-items:center;width:26px;height:26px;border-radius:var(--ds-radius-control);
  background:var(--ds-invert-bg);color:var(--ds-invert-text);font:700 10px/1 var(--_data)}
.lnk{color:var(--ds-text);text-decoration:underline;text-underline-offset:2px;font-size:13px}
.kbd{border:1px solid var(--ds-line);border-radius:var(--ds-radius-box);padding:1px 6px;
  font:11px/1.6 var(--_data);color:var(--ds-text-2)}

/* forms */
.field{display:flex;flex-direction:column;gap:4px;max-width:260px}
.field label{font:600 10px/1.4 var(--_data);letter-spacing:.09em;text-transform:uppercase;color:var(--ds-text-2)}
.input{background:var(--ds-bg);color:var(--ds-text);border:var(--_border);
  border-radius:var(--ds-radius-control);padding:9px 13px;font-size:13px}
.field .input{color:var(--ds-text)}
.help{font-size:11.5px;color:var(--ds-text-3);font-style:normal}
.input.err,.help.err{color:var(--ds-alarm)}
.input.err{outline:1px solid var(--ds-alarm);outline-offset:-1px}
.input.sel{display:inline-flex;align-items:center;gap:8px;color:var(--ds-text-2)}
.caret{width:0;height:0;border:4px solid transparent;border-top-color:var(--ds-text-3);margin-top:3px}
.check,.radio{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--ds-text-2)}
.check::before,.radio::before{content:"";width:15px;height:15px;box-sizing:border-box;
  border:1px solid var(--ds-line);background:var(--ds-bg)}
.check::before{border-radius:var(--ds-radius-box)}
.radio::before{border-radius:999px}
.check.on::before,.radio.on::before{background:var(--ds-text);border-color:var(--ds-text)}
.check.on,.radio.on{color:var(--ds-text)}
.check i,.radio i{display:none}
.switch{width:34px;height:19px;border-radius:999px;background:var(--ds-line);position:relative;display:inline-block}
.switch.on{background:var(--ds-text)}
.switch i{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:999px;
  background:var(--ds-bg)}
.switch.on i{left:17px}

/* data */
.stats{display:flex;gap:var(--_gap);flex-wrap:wrap}
.stat{background:var(--ds-surface);border:var(--_border);border-radius:var(--ds-radius-box);
  padding:var(--_pad);display:flex;flex-direction:column;gap:3px;min-width:150px}
.stat span{font-size:11.5px;color:var(--ds-text-3)}
.stat b{font:800 26px/1.1 var(--_data);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.stat em{font-style:normal;align-self:flex-start}
.stat.inv{background:var(--ds-invert-bg);color:var(--ds-invert-text);border:0}
.stat.inv span{color:inherit;opacity:.72}
.chip{background:var(--ds-invert-accent);color:var(--ds-invert-bg);
  border-radius:var(--ds-radius-control);padding:2px 9px;font:700 11px/1.6 var(--_data)}
.kv{display:grid;grid-template-columns:auto 1fr;gap:2px var(--_gap);margin:0;font-size:13px}
.kv dt{font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--ds-text-3);
  font-family:var(--_data);padding-top:3px}
.kv dd{margin:0;color:var(--ds-text)}
.meter{display:flex;gap:3px}
.meter i{width:22px;height:13px;border-radius:var(--ds-radius-control);background:var(--ds-line)}
.meter i.on{background:var(--ds-chart-1,var(--ds-text))}
.pg{border-radius:var(--ds-radius-control);padding:4px 10px;font:500 12px/1.5 var(--_data);
  color:var(--ds-text-2);background:var(--ds-line)}
.pg.on{background:var(--ds-text);color:var(--ds-bg)}
.skel{display:flex;flex-direction:column;gap:6px;max-width:280px}
.skel i{height:9px;border-radius:var(--ds-radius-control);background:var(--ds-line)}
.skel i:nth-child(2){width:74%}.skel i:nth-child(3){width:52%}

/* navigation */
.tabs{display:flex;gap:var(--_gap);border-bottom:1px solid var(--ds-line)}
.tabs span{font-size:13px;color:var(--ds-text-3);padding:0 0 7px;border-bottom:2px solid transparent}
.tabs span.on{color:var(--ds-text);font-weight:600;border-bottom-color:var(--ds-text)}
.bcrumb{font-size:12.5px;color:var(--ds-text-3);display:flex;gap:6px;align-items:center}
.bcrumb i{font-style:normal}
.bcrumb b{color:var(--ds-text);font-weight:500}
.rail{background:var(--ds-invert-bg);color:var(--ds-invert-text);border-radius:var(--ds-radius-box);
  padding:8px;display:flex;flex-direction:column;gap:3px;max-width:180px}
.rail span{border-radius:var(--ds-radius-control);padding:7px 11px;font-size:13px;opacity:.7}
.rail span.on{background:var(--ds-invert-accent);color:var(--ds-invert-bg);font-weight:700;opacity:1}
.railplain{display:flex;flex-direction:column;max-width:180px}
.railplain span{padding:7px 0;font-size:13px;color:var(--ds-text-2);border-bottom:1px solid var(--ds-line)}
.railplain span.on{color:var(--ds-text);font-weight:600}

/* feedback */
.state{border-radius:var(--ds-radius-control);padding:3px 10px;
  font:600 11px/1.6 var(--_data);letter-spacing:.04em;display:inline-block}
.alert{border-radius:var(--ds-radius-box);padding:10px 13px;font-size:12.5px}
.alert b{font-weight:700}
${['success', 'warn', 'alarm'].filter(k => has(t, `--ds-${k}`)).map(k => {
  const wash = has(t, `--ds-${k}-wash`)
  return `.s-${k}{color:var(--ds-${k});` + (wash ? `background:var(--ds-${k}-wash)}` : `border:1px solid var(--ds-${k})}`) +
    `\n.a-${k}{color:var(--ds-${k});` + (wash
      ? `background:var(--ds-${k}-wash)}`
      : `border:1px solid var(--ds-${k})}`)
}).join('\n')}
.toast{background:var(--ds-surface);color:var(--ds-text);border:var(--_border);
  border-radius:var(--ds-radius-box);box-shadow:var(--ds-shadow-surface);
  padding:10px 15px;font-size:13px;align-self:flex-start}
.scrimbox{background:var(--ds-scrim);border-radius:var(--ds-radius-box);padding:22px;
  display:grid;place-items:center}
.dialog{background:var(--ds-surface);color:var(--ds-text);border:var(--_border);
  border-radius:var(--ds-radius-box);box-shadow:var(--ds-shadow-surface);
  padding:var(--_pad);display:flex;flex-direction:column;gap:var(--_gap);min-width:220px}

/* charts */
.bars{display:flex;flex-direction:column;gap:6px}
.bar{display:block;height:14px;background:var(--ds-line);border-radius:var(--ds-radius-control);overflow:hidden}
.bar i{display:block;height:100%;border-radius:var(--ds-radius-control)}
.bar i.hatched{background:var(--ds-hatch);color:var(--ds-chart-1)}
.stack{display:flex;height:14px;border-radius:var(--ds-radius-control);overflow:hidden;background:var(--ds-line)}
.stack i{display:block;height:100%}
.legend{display:flex;gap:var(--_gap);flex-wrap:wrap;font-size:11px;color:var(--ds-text-3)}
.legend span{display:flex;align-items:center;gap:5px}
.legend i{width:9px;height:9px;border-radius:var(--ds-radius-control)}

/* table */
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
