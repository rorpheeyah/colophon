#!/usr/bin/env node
// Renders systems/<slug>/preview.html from the system's own tokens block.
//
//   node scripts/build-previews.mjs           write every preview
//   node scripts/build-previews.mjs lozenge   write one
//   node scripts/build-previews.mjs --check    exit 1 if any is stale
//
// The tokens block is embedded verbatim, so the preview cannot show a value the
// file does not contain. Everything below it is one shared template driven only
// by --clp-* aliases. There is no per-system branch except resolving `none`.
//
// --clp-shadow is a *control* shadow and is applied only to pressables. A system
// may forbid elevation on containers while requiring it on buttons, and the
// template must not be able to violate that.
//
// One stage per document, with the mode set on the ROOT element. This matters:
// `--clp-bg: var(--paper)` is substituted where it is declared, so if the dark
// block is scoped to a descendant the alias keeps the light value and dark mode
// silently does nothing. The root is the only place the substitution sees the
// dark tokens.

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, systemSlugs, readSystem, tokensBlock, declaredAliases, scalar, list } from './lib.mjs'
import { barChart, lineChart, sparkline, donut, stacked, legend, ranked } from './preview-charts.mjs'

// Spacing for a system that declines --clp-gap/--clp-pad. Chosen by the `density`
// field, which every system declares, so this is still the file speaking.
const DENSITY = {
  compact:     { gap: '8px',  pad: '12px 14px' },
  comfortable: { gap: '14px', pad: '18px 20px' },
  spacious:    { gap: '18px', pad: '22px 24px' },
}

// Letterforms and digits, never a sentence — a specimen cannot mistranslate.
// A system declares its reach in `scripts`; anything listed here gets a line.
// One family covers several of these at once, because --clp-font-script takes a
// stack: "Noto Sans Khmer", "Noto Sans Thai", sans-serif.
const SPECIMEN = {
  khmer:      { text: 'ក ខ គ ឃ ង ច ឆ ជ ០១២៣៤៥៦៧៨៩', name: 'Khmer' },
  thai:       { text: 'ก ข ค ฆ ง จ ฉ ช ๐๑๒๓๔๕๖๗๘๙', name: 'Thai' },
  lao:        { text: 'ກ ຂ ຄ ງ ຈ ຊ ຍ ດ ໐໑໒໓໔໕໖໗໘໙', name: 'Lao' },
  myanmar:    { text: 'က ခ ဂ ဃ င စ ဆ ဇ ၀၁၂၃၄၅၆၇၈၉', name: 'Myanmar' },
  devanagari: { text: 'क ख ग घ ङ च छ ज ०१२३४५६७८९', name: 'Devanagari' },
  tamil:      { text: 'க ங ச ஞ ட ண த ந ௦௧௨௩௪௫௬௭௮௯', name: 'Tamil' },
  cyrillic:   { text: 'А Б В Г Д Е Ж З И К Л М Н О П', name: 'Cyrillic' },
  greek:      { text: 'Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ Ν Ξ Ο', name: 'Greek' },
  arabic:     { text: 'ا ب ت ث ج ح خ ٠١٢٣٤٥٦٧٨٩', name: 'Arabic', rtl: true },
  hebrew:     { text: 'א ב ג ד ה ו ז ח ט ٠ י כ ל מ נ', name: 'Hebrew', rtl: true },
  japanese:   { text: 'あ い う え お ア イ ウ エ オ 一二三四五', name: 'Japanese' },
  korean:     { text: 'ㄱ ㄴ ㄷ ㄹ ㅁ 가 나 다 라 마 一二三四五', name: 'Korean' },
  han:        { text: '永 東 國 書 語 文 字 體 一二三四五六七八九', name: 'Han' },
}

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
// A tooltip has to separate from whatever sits behind it. The three ways are
// elevation, an edge, or a contrasting fill — and the system says which of
// those it owns. A system declaring none of the three gets no tooltip rather
// than one composed from nothing.
function tipTreatment(t) {
  const bw = t.get('--clp-border-width') ?? '0'
  if (has(t, '--clp-shadow-surface')) {
    return `background:var(--clp-surface);color:var(--clp-text);` +
      `box-shadow:var(--clp-shadow-surface);border:0`
  }
  if (has(t, '--clp-border-color') && !/^0[a-z]*$/.test(bw)) {
    return `background:var(--clp-surface);color:var(--clp-text);` +
      `border:var(--clp-border-width) solid var(--clp-border-color)`
  }
  if (has(t, '--clp-invert-bg')) {
    return `background:var(--clp-invert-bg);color:var(--clp-invert-text);border:0`
  }
  return null
}

const group = (title, ...parts) => {
  const body = parts.filter(Boolean).join('\n')
  return body ? `<section class="grp"><h4>${title}</h4>${body}</div></section>` : ''
}
const rows = body => `<div class="rows">${body}`

function stage(t, meta) {
  const tipStyle = tipTreatment(t)
  const states = [['success', 'Resolved'], ['warn', 'Attention'], ['alarm', 'Overdue']]
    .filter(([k]) => has(t, `--clp-${k}`))
  const series = [1, 2, 3, 4, 5].filter(n => has(t, `--clp-chart-${n}`))
  const scripts = list(meta.scripts).map(x => SPECIMEN[x]).filter(Boolean)

  const swatches = ['bg', 'surface', 'accent', 'line', 'text', 'text-2', 'text-3',
                    'success', 'warn', 'alarm', 'invert-bg', ...series.map(n => `chart-${n}`)]
    .filter(n => has(t, `--clp-${n}`))
    .map(n => `<div class="sw"><i style="background:var(--clp-${n})"></i><code>${n}</code></div>`)
    .join('')

  const bar = (w, n) => `<span class="bar"><i style="width:${w}%;background:var(--clp-chart-${n})"></i></span>`

  return `
<div class="stage">
  <section class="grp"><h4>Overview</h4>
    <div class="dash">
      <div class="dash-top">
        <div><b>Website analytics</b><span>21 Aug \u2013 17 Sep</span></div>
        <div class="row">
          ${has(t, '--clp-button2-bg') ? '<button class="btn b2">Export</button>' : ''}
          <button class="btn">New report</button>
        </div>
      </div>

      <div class="stats">
        ${[['Daily active', '3,450', '+12.1%'], ['Sessions', '1,342', '\u22129.8%'],
           ['Duration', '5.2m', '+7.7%'], ['Conversion', '2.8%', '+4.3%']]
          .map(([label, value, delta], i) => {
            const up = delta.startsWith('+')
            const key = up ? 'success' : 'alarm'
            const styled = has(t, `--clp-${key}`)
            return `<div class="stat${i === 3 && has(t, '--clp-invert-bg') ? ' inv' : ''}">
              <span>${label}</span><b>${value}</b>
              <em class="delta${styled ? ` state s-${key}` : ''}">${delta}</em>
            </div>`
          }).join('')}
      </div>

      <div class="panels">
        <div class="panel">
          <div class="panel-h"><b>Sessions</b><span>Last 7 days</span></div>
          ${series.length ? barChart(series[0]) : `<div class="meter">${
            [1, 1, 1, 1, 1, 0, 0].map(f => `<i class="${f ? 'on' : 'off'}"></i>`).join('')}</div>
            <p class="none">No chart palette declared, so this is the meter instead.</p>`}
        </div>
        <div class="panel">
          <div class="panel-h"><b>By source</b><span>935 total</span></div>
          ${series.length >= 3 ? donut(series) + legend(series) : series.length ? ranked(series[0])
            : '<p class="none">No chart palette declared.</p>'}
        </div>
      </div>

      <table>
        <thead><tr><th>Name</th><th>Status</th><th class="n">Value</th></tr></thead>
        <tbody>
          <tr><td>Northwind</td><td>${states[0] ? `<span class="state s-${states[0][0]}">${states[0][1]}</span>` : '\u2014'}</td><td class="n">128</td></tr>
          <tr><td>Atlas</td><td>${states[1] ? `<span class="state s-${states[1][0]}">${states[1][1]}</span>` : '\u2014'}</td><td class="n">1,284</td></tr>
          <tr><td>Beacon</td><td>\u2014</td><td class="n">6</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="grp"><h4>Colour</h4><div class="sws">${swatches}</div></section>

  <section class="grp"><h4>Type</h4>
    <div class="specimen">
      <p class="spec-d">Aa Hamburgefonstiv</p>
      <p class="spec-b">The rule before the values, so an agent can extrapolate correctly.</p>
      ${scripts.map(x => `<p class="spec-x"${x.rtl ? ' dir="rtl"' : ''}>${esc(x.text)}</p>`).join('')}
      ${scripts.length ? `<p class="spec-mix">Aa Bb Cc ${esc(scripts[0].text.split(' ').slice(0, 4).join(' '))} 128</p>` : ''}
      ${has(t, '--clp-font-data') ? '<p class="spec-n">1,284.50 · 0912 · 24</p>' : ''}
    </div>
  </section>

  ${group('Base', rows(`
    <div class="row">
      <button class="btn">Primary</button>
      ${has(t, '--clp-button2-bg') ? '<button class="btn b2">Secondary</button>' : ''}
      <button class="btn b3">Ghost</button>
      <button class="btn" disabled>Disabled</button>
    </div>
    <div class="row">
      <span class="badge">Badge</span>
      ${has(t, '--clp-invert-bg') ? '<span class="avatar">SK</span>' : ''}
      <a class="lnk" href="#">A link</a>
      <span class="kbd">⌘K</span>
    </div>
    <hr class="rule">`))}

  ${group('Forms', rows(`
    <div class="field">
      <label>Reference</label>
      <input class="input" value="AC-4192" aria-label="Reference">
      <em class="help">Shown on every record.</em>
    </div>
    ${has(t, '--clp-alarm') ? `<div class="field bad">
      <label>Quantity</label>
      <input class="input err" value="0" aria-label="Quantity" aria-invalid="true">
      <em class="help err">Must be at least one.</em>
    </div>` : ''}
    <div class="row">
      <label class="sel"><select><option>Owner</option><option>Operations</option>
        <option>Finance</option></select></label>
      <label class="check"><input type="checkbox" checked><span></span>Updated</label>
      <label class="check"><input type="checkbox"><span></span>Archived</label>
      <label class="radio"><input type="radio" name="plan" checked><span></span>Monthly</label>
      <label class="radio"><input type="radio" name="plan"><span></span>Yearly</label>
      <label class="switch"><input type="checkbox" checked><span></span></label>
    </div>`))}

  ${group('Data', rows(`
    <div class="stats">
      <div class="stat">
        <span>Revenue</span><b>1,284.50</b>
        ${states.length ? `<em class="state s-${states[0][0]}">+12%</em>` : ''}
      </div>
      ${has(t, '--clp-invert-bg') ? `<div class="stat inv">
        <span>Active</span><b>48,210</b>
        ${has(t, '--clp-invert-accent') ? '<em class="chip">+4%</em>' : ''}
      </div>` : ''}
    </div>
    <dl class="kv"><dt>Owner</dt><dd>Operations</dd><dt>Updated</dt><dd>12 Aug</dd></dl>
    <div class="meter">${[1, 1, 1, 1, 1, 0, 0].map(f =>
      `<i class="${f ? 'on' : 'off'}"></i>`).join('')}</div>
    <table>
      <thead><tr><th>Item</th><th>Status</th><th class="n">Qty</th></tr></thead>
      <tbody>
        <tr><td>Northwind</td><td>${states[0] ? `<span class="state s-${states[0][0]}">${states[0][1]}</span>` : '—'}</td><td class="n">128</td></tr>
        <tr><td>Atlas</td><td>${states[1] ? `<span class="state s-${states[1][0]}">${states[1][1]}</span>` : '—'}</td><td class="n">1,284</td></tr>
        <tr><td>Beacon</td><td>—</td><td class="n">6</td></tr>
      </tbody>
    </table>
    <div class="row pager">
      <button class="pg" data-step>Prev</button><button class="pg on" aria-current="page">1</button>
      <button class="pg">2</button><button class="pg">3</button><button class="pg" data-step>Next</button>
    </div>
    <div class="prog"><i style="width:62%"></i></div>
    <div class="slider"><span class="track"><i style="width:44%"></i></span><span class="knob"></span></div>
    <div class="avatars"><span>SK</span><span>MR</span><span>AL</span><span class="more">+3</span></div>
    <div class="skel"><i></i><i></i><i></i></div>
    <details class="acc" open><summary>What this system refuses</summary>
      <p>Declining an alias is a statement, not a gap.</p></details>
    <details class="acc"><summary>How spacing is derived</summary>
      <p>From the declared step, or from the density field.</p></details>
    <p class="none">No records match this filter.</p>`))}

  ${group('Navigation', rows(`
    <div class="tabs" role="tablist"><button role="tab" aria-selected="true">Records</button>
      <button role="tab" aria-selected="false">Reports</button>
      <button role="tab" aria-selected="false">Owners</button></div>
    <div class="bcrumb">Workspace <i>/</i> Records <b>Northwind</b></div>
    <div class="${has(t, '--clp-invert-bg') ? 'rail' : 'railplain'}">
      <button class="on" aria-current="page">Dashboard</button>
      <button>Records</button><button>Reports</button></div>`))}

  ${group('Feedback',
    states.length ? rows(states.map(([k, label]) =>
      `<div class="alert a-${k}"><b>${label}</b> Three items need review before Friday.</div>`).join('')
      + (has(t, '--clp-shadow-surface')
        ? '<div class="toast">Saved</div>'
        : '<p class="none">No floating surface: this system declares no elevation for one.</p>')
      + (has(t, '--clp-scrim')
        ? '<div class="scrimbox"><div class="dialog"><b>Discard changes?</b><div class="row">'
          + '<button class="btn">Discard</button>'
          + (has(t, '--clp-button2-bg') ? '<button class="btn b2">Keep</button>' : '')
          + '</div></div></div>'
        : '<p class="none">No dialog: this system declares no scrim.</p>')) : '')}

  ${group('Charts', series.length ? rows(`
    <div class="chart-row">
      <div><h5>Trend</h5>${lineChart(series[0])}</div>
      <div><h5>Area</h5>${lineChart(series[0], { area: true })}</div>
    </div>
    <div class="row"><span class="spark-wrap">${sparkline(series[0])}</span>
      <b class="spark-n">84</b><span class="none">sparkline, no axes</span></div>
    ${series.length >= 2
      ? `<div><h5>Composition</h5>${stacked(series)}${legend(series)}</div>`
      : '<p class="none">One series declared, so no stacked or donut chart is shown.</p>'}
    ${has(t, '--clp-hatch') ? `<div class="bars"><span class="bar"><i class="hatched" style="width:38%"></i></span></div>
      <p class="none">Hatch marks a projection rather than a fact.</p>` : ''}`) : '')}

  ${series.length ? '' : '<p class="none">No chart palette declared, so no chart is shown.</p>'}
  ${tipStyle ? '<div class="tip" role="status" hidden></div>' : ''}
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
  const spacingFromDensity = !has(t, '--clp-gap') || !has(t, '--clp-pad')

  // The only per-system CSS: resolving the aliases this system declined.
  const tipStyle = tipTreatment(t)


  const shim = [
    `--_gap: ${ref(t, '--clp-gap', density.gap)};`,
    `--_pad: ${ref(t, '--clp-pad', density.pad)};`,
    `--_data: ${ref(t, '--clp-font-data', 'var(--clp-font-body)')};`,
    `--_script: ${ref(t, '--clp-font-script', 'var(--clp-font-body)')};`,
    `--_press: ${ref(t, '--clp-press', 'none')};`,
    `--_border: ${has(t, '--clp-border-color') ? 'var(--clp-border-width) solid var(--clp-border-color)' : '0'};`,
  ].join(' ')

  const notes = [
    hasDark ? '' : 'Dark mode was not published for this system, so none is shown.',
    spacingFromDensity ? `Spacing from <code>density: ${esc(meta.density)}</code> — this system declares no spacing step.` : '',
    has(t, '--clp-success') ? '' : 'This system declares no success colour.',
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

/* Everything below reads --clp-* only, plus the four --_ shims above, which
   exist solely to resolve aliases this system declined. */
.stage{${shim}
  background:var(--clp-bg);color:var(--clp-text);font-family:var(--clp-font-body);
  padding:var(--_pad);display:flex;flex-direction:column;gap:calc(var(--_gap) * 2);
  /* no effect inside a preview frame; keeps standalone viewing readable */
  max-width:900px;margin-inline:auto}
.stage p{margin:0}
.grp{display:flex;flex-direction:column;gap:var(--_gap)}
.grp > h4{margin:0;font:600 9.5px/1 var(--_data);letter-spacing:.12em;text-transform:uppercase;
  color:var(--clp-text-3);padding-bottom:5px;border-bottom:1px solid var(--clp-line)}
.rows{display:flex;flex-direction:column;gap:var(--_gap)}
.row{display:flex;gap:var(--_gap);align-items:center;flex-wrap:wrap}
.rule{border:0;border-top:1px solid var(--clp-line);margin:0;width:100%}
.none{font-size:12px;color:var(--clp-text-3)}

/* overview */
.dash{background:var(--clp-bg);border:var(--_border);border-radius:var(--clp-radius-box);
  padding:var(--_pad);display:flex;flex-direction:column;gap:var(--_gap)}
.dash-top{display:flex;align-items:flex-start;gap:var(--_gap);flex-wrap:wrap}
.dash-top > div:first-child{display:flex;flex-direction:column;gap:2px}
.dash-top b{font-family:var(--clp-font-display);font-size:17px;font-weight:700}
.dash-top span{font-size:11.5px;color:var(--clp-text-3)}
.dash-top .row{margin-left:auto}
.dash .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:var(--_gap)}
.dash .stat{min-width:0}
.dash table{margin-top:2px}
.panels{display:grid;grid-template-columns:1.6fr 1fr;gap:var(--_gap)}
@media(max-width:560px){.panels{grid-template-columns:minmax(0,1fr)}}
.panel{border:var(--_border);border-radius:var(--clp-radius-box);padding:var(--_pad);
  display:flex;flex-direction:column;gap:var(--_gap);min-width:0;background:var(--clp-surface)}
.panel-h{display:flex;align-items:baseline;gap:8px}
.panel-h b{font-family:var(--clp-font-display);font-size:14px;font-weight:700}
.panel-h span{font-size:11px;color:var(--clp-text-3);margin-left:auto}

/* Press and focus come from the system. A control that moves has to land
   somewhere, so a system declaring both a press transform and a shadow has the
   shadow flattened while pressed. Declining --clp-focus leaves the platform's
   own ring in place rather than removing the indicator. */
.btn:active,.pg:active,.tabs button:active,.chip:active{transform:var(--_press)}
${has(t, '--clp-press') && has(t, '--clp-shadow') ? '.btn:active{box-shadow:none}' : ''}
${has(t, '--clp-focus') ? `:focus-visible{outline:2px solid var(--clp-focus);outline-offset:2px}` : ''}
button,select,input,summary{font-family:inherit}

${tipStyle ? `.tip{position:fixed;z-index:9;pointer-events:none;${tipStyle};
  border-radius:var(--clp-radius-box);padding:5px 9px;font:500 11.5px/1.5 var(--_data);
  transform:translate(-50%,-140%);white-space:nowrap}` : ''}
[data-tip]{cursor:default}
.cross{stroke:var(--clp-line);stroke-width:1}

/* charts — marks take the declared series colours, text never does */
.chart{display:block;width:100%;height:auto}
.ax{font:500 9px var(--_data);fill:var(--clp-text-3);letter-spacing:.04em}
.gridline{stroke:var(--clp-line);stroke-width:1}
.donut{display:block;width:100%;max-width:150px;margin:0 auto;height:auto}
.donut-n{font:800 22px var(--_data);fill:var(--clp-text)}
.spark{display:block;width:110px;height:32px}
.spark-wrap{display:inline-block}
.spark-n{font:800 20px/1 var(--_data);font-variant-numeric:tabular-nums}
.chart-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--_gap)}
.chart-row h5,.grp h5{margin:0 0 6px;font:600 10px/1 var(--_data);letter-spacing:.1em;
  text-transform:uppercase;color:var(--clp-text-3)}
.ranked{display:flex;flex-direction:column;gap:7px}
.rank{display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:12px}
.rank b{font-family:var(--_data);font-variant-numeric:tabular-nums}
.rbar{grid-column:1/-1;display:block;height:5px;border-radius:var(--clp-radius-control);
  background:var(--clp-line);overflow:hidden}
.rbar s{display:block;height:100%;text-decoration:none}

/* colour */
.sws{display:flex;flex-wrap:wrap;gap:var(--_gap)}
.sw{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--clp-text-3)}
.sw i{width:20px;height:20px;border-radius:var(--clp-radius-box);
  outline:1px solid var(--clp-line);outline-offset:-1px}
.sw code{font-family:var(--_data)}

/* type */
.specimen{display:flex;flex-direction:column;gap:4px}
.spec-d{font-family:var(--clp-font-display);font-size:26px;font-weight:700;line-height:1.15}
.spec-b{font-size:15px;color:var(--clp-text-2)}
.spec-x{font-family:var(--_script);font-size:15px;line-height:2}
.spec-mix{font-size:15px;line-height:2;color:var(--clp-text-2)}
.spec-n{font-family:var(--_data);font-size:15px;font-variant-numeric:tabular-nums}

/* base */
.btn{background:var(--clp-button-bg);color:var(--clp-button-text);border:var(--_border);
  border-radius:var(--clp-radius-control);box-shadow:var(--clp-shadow);
  font:600 13px/1 var(--clp-font-body);padding:10px 15px;cursor:pointer}
.btn.b2{background:var(--clp-button2-bg);color:var(--clp-text)}
.btn.b3{background:transparent;color:var(--clp-text-2);border:0;box-shadow:none}
.btn[disabled]{background:var(--clp-line);color:var(--clp-text-3);border:0;box-shadow:none;cursor:default}
.badge{background:var(--clp-line);color:var(--clp-text-2);border-radius:var(--clp-radius-control);
  padding:2px 9px;font:600 11px/1.6 var(--_data)}
.avatar{display:grid;place-items:center;width:26px;height:26px;border-radius:var(--clp-radius-control);
  background:var(--clp-invert-bg);color:var(--clp-invert-text);font:700 10px/1 var(--_data)}
.lnk{color:var(--clp-text);text-decoration:underline;text-underline-offset:2px;font-size:13px}
.kbd{border:1px solid var(--clp-line);border-radius:var(--clp-radius-box);padding:1px 6px;
  font:11px/1.6 var(--_data);color:var(--clp-text-2)}

/* forms */
.field{display:flex;flex-direction:column;gap:4px;max-width:260px}
.field label{font:600 10px/1.4 var(--_data);letter-spacing:.09em;text-transform:uppercase;color:var(--clp-text-2)}
.input{background:var(--clp-bg);color:var(--clp-text);border:var(--_border);
  border-radius:var(--clp-radius-control);padding:9px 13px;font-size:13px}
.field .input{color:var(--clp-text)}
.help{font-size:11.5px;color:var(--clp-text-3);font-style:normal}
.input.err,.help.err{color:var(--clp-alarm)}
.input.err{outline:1px solid var(--clp-alarm);outline-offset:-1px}
.input.sel{display:inline-flex;align-items:center;gap:8px;color:var(--clp-text-2)}
.caret{width:0;height:0;border:4px solid transparent;border-top-color:var(--clp-text-3);margin-top:3px}
.check,.radio{display:inline-flex;align-items:center;gap:7px;font-size:13px;
  color:var(--clp-text-2);cursor:pointer}
.check input,.radio input,.switch input{position:absolute;opacity:0;width:0;height:0}
.check span,.radio span{width:15px;height:15px;box-sizing:border-box;flex:none;
  border:1px solid var(--clp-line);background:var(--clp-bg)}
.check span{border-radius:var(--clp-radius-box)}
.radio span{border-radius:999px}
.check :checked + span,.radio :checked + span{background:var(--clp-text);border-color:var(--clp-text)}
.check:has(:checked),.radio:has(:checked){color:var(--clp-text)}
.switch{position:relative;display:inline-flex;width:34px;height:19px;cursor:pointer}
.switch span{position:absolute;inset:0;border-radius:999px;background:var(--clp-line)}
.switch span::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;
  border-radius:999px;background:var(--clp-bg);transition:left .13s}
.switch :checked + span{background:var(--clp-text)}
.switch :checked + span::after{left:17px}
.sel{display:inline-flex}
.sel select{background:var(--clp-bg);color:var(--clp-text);border:var(--_border);
  border-radius:var(--clp-radius-control);padding:9px 13px;font:13px var(--clp-font-body);cursor:pointer}
input.input{font:13px var(--clp-font-body);width:100%}
.tabs button,.pg,.rail button,.railplain button{font:inherit;cursor:pointer;border:0;background:none}

/* data */
.stats{display:flex;gap:var(--_gap);flex-wrap:wrap}
.stage table{min-width:0}
.stat{background:var(--clp-surface);border:var(--_border);border-radius:var(--clp-radius-box);
  padding:var(--_pad);display:flex;flex-direction:column;gap:3px;min-width:150px}
.stat span{font-size:11.5px;color:var(--clp-text-3)}
.stat b{font:800 26px/1.1 var(--_data);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.stat em{font-style:normal;align-self:flex-start}
.delta{font:600 11px/1.6 var(--_data);color:var(--clp-text-2)}
.stat.inv{background:var(--clp-invert-bg);color:var(--clp-invert-text);border:0}
.stat.inv span{color:inherit;opacity:.72}
.stat.inv .delta{color:inherit;opacity:.8}
.chip{background:var(--clp-invert-accent);color:var(--clp-invert-bg);
  border-radius:var(--clp-radius-control);padding:2px 9px;font:700 11px/1.6 var(--_data)}
.kv{display:grid;grid-template-columns:auto 1fr;gap:2px var(--_gap);margin:0;font-size:13px}
.kv dt{font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--clp-text-3);
  font-family:var(--_data);padding-top:3px}
.kv dd{margin:0;color:var(--clp-text)}
.meter{display:flex;gap:3px}
.meter i{width:22px;height:13px;border-radius:var(--clp-radius-control);background:var(--clp-line)}
.meter i.on{background:var(--clp-chart-1,var(--clp-text))}
.pg{border-radius:var(--clp-radius-control);padding:4px 10px;font:500 12px/1.5 var(--_data);
  color:var(--clp-text-2);background:var(--clp-line)}
.pg.on{background:var(--clp-text);color:var(--clp-bg)}
.prog{height:8px;border-radius:var(--clp-radius-control);background:var(--clp-line);overflow:hidden;max-width:280px}
.prog i{display:block;height:100%;background:var(--clp-text);border-radius:var(--clp-radius-control)}
.slider{display:flex;align-items:center;max-width:280px;position:relative}
.slider .track{flex:1;height:5px;border-radius:var(--clp-radius-control);background:var(--clp-line);overflow:hidden}
.slider .track i{display:block;height:100%;background:var(--clp-text)}
.slider .knob{width:15px;height:15px;border-radius:999px;background:var(--clp-surface);
  border:2px solid var(--clp-text);margin-left:-8px}
.avatars{display:flex}
.avatars span{display:grid;place-items:center;width:26px;height:26px;border-radius:999px;
  background:var(--clp-line);color:var(--clp-text-2);font:700 10px/1 var(--_data);
  margin-left:-7px;box-shadow:0 0 0 2px var(--clp-bg)}
.avatars span:first-child{margin-left:0}
.avatars .more{background:var(--clp-text);color:var(--clp-bg)}
.acc{border-bottom:1px solid var(--clp-line);padding:8px 0;max-width:340px}
.acc summary{cursor:pointer;font-size:13px;font-weight:600}
.acc p{margin:6px 0 0;font-size:12.5px;color:var(--clp-text-2)}
.skel{display:flex;flex-direction:column;gap:6px;max-width:280px}
.skel i{height:9px;border-radius:var(--clp-radius-control);background:var(--clp-line)}
.skel i:nth-child(2){width:74%}.skel i:nth-child(3){width:52%}

/* navigation */
.tabs{display:flex;gap:var(--_gap);border-bottom:1px solid var(--clp-line)}
.tabs button{font-size:13px;color:var(--clp-text-3);padding:0 0 7px;border-bottom:2px solid transparent}
.tabs button[aria-selected="true"]{color:var(--clp-text);font-weight:600;border-bottom-color:var(--clp-text)}
.bcrumb{font-size:12.5px;color:var(--clp-text-3);display:flex;gap:6px;align-items:center}
.bcrumb i{font-style:normal}
.bcrumb b{color:var(--clp-text);font-weight:500}
.rail{background:var(--clp-invert-bg);color:var(--clp-invert-text);border-radius:var(--clp-radius-box);
  padding:8px;display:flex;flex-direction:column;gap:3px;max-width:180px}
.rail button{border-radius:var(--clp-radius-control);padding:7px 11px;font-size:13px;
  opacity:.7;color:inherit;text-align:left}
.rail button.on{background:var(--clp-invert-accent);color:var(--clp-invert-bg);font-weight:700;opacity:1}
.railplain{display:flex;flex-direction:column;max-width:180px}
.railplain button{padding:7px 0;font-size:13px;color:var(--clp-text-2);text-align:left;
  border-bottom:1px solid var(--clp-line)}
.railplain button.on{color:var(--clp-text);font-weight:600}

/* feedback */
.state{border-radius:var(--clp-radius-control);padding:3px 10px;
  font:600 11px/1.6 var(--_data);letter-spacing:.04em;display:inline-block}
.alert{border-radius:var(--clp-radius-box);padding:10px 13px;font-size:12.5px}
.alert b{font-weight:700}
${['success', 'warn', 'alarm'].filter(k => has(t, `--clp-${k}`)).map(k => {
  const wash = has(t, `--clp-${k}-wash`)
  // Three treatments, chosen by what the system declared: a fill with
  // --clp-state-text on it, coloured text on a wash, or coloured text with a
  // border. A pill and a banner can differ — a system may fill the small one
  // and tint the large one, which is what --clp-state-text plus a wash means.
  const pill = has(t, '--clp-state-text')
    ? `background:var(--clp-${k});color:var(--clp-state-text)}`
    : wash
      ? `color:var(--clp-${k});background:var(--clp-${k}-wash)}`
      : `color:var(--clp-${k});border:1px solid var(--clp-${k})}`
  const banner = wash
    ? `background:var(--clp-${k}-wash);color:${has(t, '--clp-state-text') ? 'var(--clp-text)' : `var(--clp-${k})`}}`
    : `color:var(--clp-${k});border:1px solid var(--clp-${k})}`
  return `.s-${k}{${pill}\n.a-${k}{${banner}`
}).join('\n')}
.toast{background:var(--clp-surface);color:var(--clp-text);border:var(--_border);
  border-radius:var(--clp-radius-box);box-shadow:var(--clp-shadow-surface);
  padding:10px 15px;font-size:13px;align-self:flex-start}
.scrimbox{background:var(--clp-scrim);border-radius:var(--clp-radius-box);padding:22px;
  display:grid;place-items:center}
.dialog{background:var(--clp-surface);color:var(--clp-text);border:var(--_border);
  border-radius:var(--clp-radius-box);box-shadow:var(--clp-shadow-surface);
  padding:var(--_pad);display:flex;flex-direction:column;gap:var(--_gap);min-width:220px}

/* charts */
.bars{display:flex;flex-direction:column;gap:6px}
.bar{display:block;height:14px;background:var(--clp-line);border-radius:var(--clp-radius-control);overflow:hidden}
.bar i{display:block;height:100%;border-radius:var(--clp-radius-control)}
.bar i.hatched{background:var(--clp-hatch);color:var(--clp-chart-1)}
.stack{display:flex;gap:2px;height:14px;border-radius:var(--clp-radius-control);overflow:hidden;background:var(--clp-line)}
.stack i{display:block;height:100%}
.legend{display:flex;gap:var(--_gap);flex-wrap:wrap;font-size:11px;color:var(--clp-text-3)}
.legend span{display:flex;align-items:center;gap:5px}
.legend i{width:9px;height:9px;border-radius:var(--clp-radius-control)}

/* table */
table{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}
td,th{overflow:hidden;text-overflow:ellipsis}
th{text-align:left;font:700 10px/1.6 var(--_data);letter-spacing:.07em;text-transform:uppercase;
   color:var(--clp-text-2);padding:6px 8px;border-bottom:1px solid var(--clp-line)}
td{padding:9px 8px;border-bottom:1px solid var(--clp-line);color:var(--clp-text)}
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
  // Set before paint. data-mode must live on the root element or the --clp-*
  // aliases keep their light values — see the note at the top of the generator.
  const q = new URLSearchParams(location.search)
  const root = document.documentElement
  if (q.get('chrome') === '0') root.dataset.nochrome = ''
  // Tabs, pagination and the nav rail move between two states the system has
  // already declared — active and inactive. Nothing here invents a treatment;
  // it only changes which element wears the one that exists. Card thumbnails
  // set pointer-events:none, so they stay still.
  for (const group of document.querySelectorAll('[role="tablist"], .pager, .rail, .railplain')) {
    group.addEventListener('click', e => {
      const hit = e.target.closest('button')
      if (!hit || hit.dataset.step !== undefined) return
      const tabs = group.getAttribute('role') === 'tablist'
      for (const b of group.querySelectorAll('button')) {
        if (b.dataset.step !== undefined) continue
        const on = b === hit
        if (tabs) b.setAttribute('aria-selected', String(on))
        else { b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current') }
      }
    })
  }

  // Hover readout. The surface it wears is whichever separation the system
  // declared — elevation, an edge, or a contrasting fill. A system declaring
  // none of the three gets no tooltip rather than one drawn from nothing.
  const tip = document.querySelector('.tip')
  if (tip) {
    const cross = c => document.querySelectorAll('.cross').forEach(l => {
      if (c === null) return l.setAttribute('hidden', '')
      l.removeAttribute('hidden'); l.setAttribute('x1', c); l.setAttribute('x2', c)
    })
    addEventListener('pointerover', e => {
      const m = e.target.closest('[data-tip]')
      if (!m) return
      tip.textContent = m.dataset.tip
      tip.hidden = false
      cross(m.dataset.x ?? null)
    })
    addEventListener('pointermove', e => {
      if (tip.hidden) return
      tip.style.left = e.clientX + 'px'
      tip.style.top = e.clientY + 'px'
    })
    addEventListener('pointerout', e => {
      if (!e.target.closest('[data-tip]')) return
      tip.hidden = true
      cross(null)
    })
  }

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
