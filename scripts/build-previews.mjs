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
import { ROOT, systemSlugs, readSystem, tokensBlock, declaredAliases, scalar, list, FAVICON } from './lib.mjs'
import {
  esc, has, ref, densityFor, shimBlock, borderless, fontLink, tipTreatment,
} from './preview-shared.mjs'
import { barChart, lineChart, sparkline, donut, gauge, stacked, legend, ranked } from './preview-charts.mjs'
import { thumbnail } from './preview-thumb.mjs'
import { demoDocument } from './demo-frame.mjs'
import { DEMOS, demoFile } from './demos/index.mjs'

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

// Each group renders only what the system declared. A group whose aliases are
// all `none` disappears rather than being approximated.

// Overlapping avatars, drawn as SVG so the seam can follow the neighbour's own
// corner radius instead of cutting straight across it. A straight cut left a
// capsule with a flat trailing edge, which read as a sliced slab rather than as
// a disc behind a disc.
//
// The cutter is the neighbour's outline offset outward by the seam width, and
// for a rounded rect that offset is the same shape at radius + seam. So the
// curvature is the system's own --clp-radius-control and the template only
// supplies the 2px, which it already owns.
//
// rx is set in CSS and never as an attribute, so it stays a var() reference.
// SVG clamps rx to half the side, and that clamp is what turns Lozenge's 999px
// into a true circle and its cutter into a true crescent — no min() needed. A
// system declaring a unitless 0 makes the calc invalid, rx falls back to 0, and
// the cut is straight, which is the right answer for a square anyway.
//
// The mask's white and black are its 1 and 0 — the alpha channel of a luminance
// mask, not an appearance. They are the only two literals in here.
const AV = 26, SEAM = 2, TUCK = 6
function avatarStack(labels, { lap = false } = {}) {
  const pitch = lap ? AV - TUCK : AV + 4
  const slice = pitch - SEAM              // what stays visible of a tucked avatar
  const W = AV + pitch * (labels.length - 1)
  const named = labels.filter(l => !l.startsWith('+'))
  const more = labels.find(l => l.startsWith('+'))

  const items = labels.map((label, i) => {
    const cut = lap && i < labels.length - 1
    return `<g transform="translate(${i * pitch} 0)">` +
      `<g class="av${label.startsWith('+') ? ' more' : ''}"${cut ? ' mask="url(#av-seam)"' : ''}>` +
      `<rect width="${AV}" height="${AV}"/>` +
      // the label centres in the slice that stays visible, not in the whole avatar
      `<text x="${cut ? slice / 2 : AV / 2}" y="${AV / 2}">${esc(label)}</text>` +
      `</g></g>`
  }).join('')

  const mask = lap ? `<mask id="av-seam" maskUnits="userSpaceOnUse"
      x="0" y="0" width="${AV}" height="${AV}">
      <rect width="${AV}" height="${AV}" fill="white"/>
      <rect class="av-cut" x="${pitch - SEAM}" y="${-SEAM}"
            width="${AV + SEAM * 2}" height="${AV + SEAM * 2}" fill="black"/>
    </mask>` : ''

  return `<svg class="avstack" viewBox="0 0 ${W} ${AV}" width="${W}" height="${AV}" role="img"
    aria-label="${esc(`Assigned to ${named.join(', ')}${more ? `, and ${more.slice(1)} more` : ''}`)}"
    >${mask}${items}</svg>`
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
          ${series.length >= 3 ? donut(series) + legend(series)
            : series.length ? gauge(series[0]) + ranked(series[0])
            : '<p class="none">No chart palette declared.</p>'}
        </div>
      </div>

      <div class="tblock"><table>
        <thead><tr><th>Name</th><th>Status</th><th class="n">Value</th></tr></thead>
        <tbody>
          <tr><td>Northwind</td><td>${states[0] ? `<span class="state s-${states[0][0]}">${states[0][1]}</span>` : '\u2014'}</td><td class="n">128</td></tr>
          <tr><td>Atlas</td><td>${states[1] ? `<span class="state s-${states[1][0]}">${states[1][1]}</span>` : '\u2014'}</td><td class="n">1,284</td></tr>
          <tr><td>Beacon</td><td>\u2014</td><td class="n">6</td></tr>
        </tbody>
      </table></div>
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
    <div class="tblock"><table>
      <thead><tr><th>Item</th><th>Status</th><th class="n">Qty</th></tr></thead>
      <tbody>
        <tr><td>Northwind</td><td>${states[0] ? `<span class="state s-${states[0][0]}">${states[0][1]}</span>` : '—'}</td><td class="n">128</td></tr>
        <tr><td>Atlas</td><td>${states[1] ? `<span class="state s-${states[1][0]}">${states[1][1]}</span>` : '—'}</td><td class="n">1,284</td></tr>
        <tr><td>Beacon</td><td>—</td><td class="n">6</td></tr>
      </tbody>
    </table></div>
    <div class="row pager">
      <button class="pg" data-step>Prev</button><button class="pg on" aria-current="page">1</button>
      <button class="pg">2</button><button class="pg">3</button><button class="pg" data-step>Next</button>
    </div>
    <div class="prog"><i style="width:62%"></i></div>
    <label class="slider"><input type="range" min="0" max="100" value="44" aria-label="Threshold"></label>
    <div class="row">
      ${avatarStack(['SK', 'MR', 'AL', '+3'])}
      ${avatarStack(['SK', 'MR', 'AL', '+3'], { lap: true })}
    </div>
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
      <div><h5>Gauge</h5>${gauge(series[0])}</div>
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
  const density = densityFor(meta)
  const hasDark = /\[data-mode\s*=\s*["']?dark["']?\]/.test(block.code)
  const spacingFromDensity = !has(t, '--clp-gap') || !has(t, '--clp-pad')

  // The only per-system CSS: resolving the aliases this system declined.
  const tipStyle = tipTreatment(t)


  const shim = shimBlock(t, meta)

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
<link rel="icon" href="${FAVICON}">
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
  display:flex;flex-direction:column;gap:var(--_gap);min-width:0${
    has(t, '--clp-card-fill') ? ';background:var(--clp-card-fill)' : ''}}
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
.check span,.radio span{position:relative;width:15px;height:15px;box-sizing:border-box;
  flex:none;border:1px solid var(--clp-line);background:var(--clp-bg)}
.check span{border-radius:var(--clp-radius-box)}
.radio span{border-radius:var(--clp-radius-control)}
.check :checked + span{background:var(--clp-text);border-color:var(--clp-text)}
.radio :checked + span{border-color:var(--clp-text)}
.radio :checked + span::after{content:"";position:absolute;inset:3px;
  border-radius:var(--clp-radius-control);background:var(--clp-text)}
.check:has(:checked),.radio:has(:checked){color:var(--clp-text)}
.switch{position:relative;display:inline-flex;width:34px;height:19px;cursor:pointer}
.switch span{position:absolute;inset:0;border-radius:var(--clp-radius-control);background:var(--clp-line)}
.switch span::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;
  border-radius:var(--clp-radius-control);background:var(--clp-bg);transition:left .13s}
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
.stat{border:var(--_border);border-radius:var(--clp-radius-box);${
  has(t, '--clp-card-fill') ? 'background:var(--clp-card-fill);' : ''}
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
.slider{display:flex;max-width:280px;width:100%}
/* A real range input. The filled portion is a gradient stop moved by JS, so
   both halves stay declared colours and the percentage is only geometry. */
.slider input{appearance:none;-webkit-appearance:none;width:100%;height:16px;
  background:none;cursor:pointer;margin:0}
.slider input::-webkit-slider-runnable-track{height:5px;border-radius:var(--clp-radius-control);
  background:linear-gradient(90deg,var(--clp-text) var(--_pct,44%),var(--clp-line) var(--_pct,44%))}
.slider input::-moz-range-track{height:5px;border-radius:var(--clp-radius-control);
  background:linear-gradient(90deg,var(--clp-text) var(--_pct,44%),var(--clp-line) var(--_pct,44%))}
.slider input::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:15px;height:15px;
  margin-top:-5px;border-radius:var(--clp-radius-control);background:var(--clp-surface);
  border:2px solid var(--clp-text)}
.slider input::-moz-range-thumb{width:15px;height:15px;box-sizing:border-box;
  border-radius:var(--clp-radius-control);background:var(--clp-surface);border:2px solid var(--clp-text)}
.avstack{display:block;flex:none}
.avstack .av rect{rx:var(--clp-radius-control);fill:var(--clp-line)}
.avstack .av text{font:700 10px/1 var(--_data);fill:var(--clp-text-2);
  text-anchor:middle;dominant-baseline:central}
.avstack .more rect{fill:var(--clp-text)}
.avstack .more text{fill:var(--clp-bg)}
/* the cutter is the neighbour's shape grown by the seam width, so the gap
   follows the curve the system declared rather than cutting across it */
.av-cut{rx:calc(var(--clp-radius-control) + 2px)}
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
${borderless(t)
  ? `.tblock{background:var(--clp-surface);border-radius:var(--clp-radius-box);overflow:hidden}
.tblock th{padding-top:11px}
.tblock tr:last-child td{border-bottom:0}
.tblock th:first-child,.tblock td:first-child{padding-left:14px}
.tblock th:last-child,.tblock td:last-child{padding-right:14px}`
  : `th,td{border:1px solid var(--clp-line)}
table{border:1px solid var(--clp-line)}`}
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
${SPECIMEN_OPEN}
${stage(t, meta)}
${SPECIMEN_CLOSE}
<p class="nodark" hidden>Dark mode was not published for this system, so there is nothing to show.</p>
<script>
  // Set before paint. data-mode must live on the root element or the --clp-*
  // aliases keep their light values — see the note at the top of the generator.
  const q = new URLSearchParams(location.search)
  const root = document.documentElement
  if (q.get('chrome') === '0') root.dataset.nochrome = ''
  // The slider's filled portion is the one thing a native range cannot express
  // on its own, so the fill stop is set from the value. Both colours are still
  // the system's; only the position is computed.
  for (const r of document.querySelectorAll('.slider input')) {
    const set = () => r.style.setProperty('--_pct',
      ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + '%')
    r.addEventListener('input', set)
    set()
  }

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

/**
 * systems/<slug>/demo-<name>.html — the same file, composed as a whole page
 * instead of as a sheet of every component at once. One per demo, because a
 * single document carrying every demo's CSS would grow with the registry and
 * each demo is independently openable anyway.
 */
function renderDemo(sys, demo) {
  const meta = Object.fromEntries(Object.entries(sys.data)
    .map(([k, v]) => [k, Array.isArray(v) ? v : v.value]))
  const block = tokensBlock(sys.blocks)[0]
  if (!block) throw new Error(`${sys.slug}: no tokens block`)

  return demoDocument({ meta, block, t: declaredAliases(block.code), demo })
}

/**
 * An unclosed container is invisible in the source and obvious on screen: a
 * table wrapper that never closed swallowed the pagination, slider, avatars
 * and accordions into the table's own card. The generator emits HTML as
 * strings, so nothing was checking that the containers balance.
 */
const PAIRED = ['div', 'section', 'table', 'thead', 'tbody', 'tr', 'svg', 'details', 'label']

export function assertBalancedTags(html, slug) {
  const bad = PAIRED
    .map(tag => {
      const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length
      const close = (html.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
      return { tag, open, close }
    })
    .filter(x => x.open !== x.close)

  if (bad.length) {
    throw new Error(`${slug}: unbalanced container(s):\n  - ` +
      bad.map(x => `<${x.tag}> opened ${x.open}, closed ${x.close}`).join('\n  - '))
  }
  return html
}

/**
 * The template may not assert an appearance. Everything after the marker
 * renders the system, so a colour, a radius or a shadow there has to come from
 * a declaration — otherwise the preview is showing the template's taste in the
 * system's clothes, which is the one thing this whole format exists to stop.
 *
 * Line *widths* are out of scope and stay a template decision; see the list in
 * CLAUDE.md. This catches the class that actually went wrong four times.
 */
const MARKER = 'Everything below reads --clp-* only'
const SPECIMEN_OPEN = '<!-- specimen start -->'
const SPECIMEN_CLOSE = '<!-- specimen end -->'

// A paint the template is allowed to write. Anything else has to come from the
// system's own declaration.
const PAINT_OK = /^(?:var\(--clp-[a-z0-9-]+\)|none|transparent|currentColor|inherit)$/
const PAINT_ATTR = /\b(fill|stroke|stop-color|flood-color|lighting-color|color)="([^"]*)"/g
const PAINT_PROP = /^(?:background|background-color|color|fill|stroke|border-color|outline-color)$/

/** The three scanners, run over whichever region is being checked. */
function scanCss(region, where, bad) {
  for (const m of region.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/g)) {
    bad.push(`${where}: colour literal \`${m[0]}\``)
  }
  for (const m of region.matchAll(/border-radius\s*:\s*([^;}"]+)/g)) {
    if (!m[1].includes('var(')) bad.push(`${where}: radius not from a declaration: \`${m[1].trim()}\``)
  }
  for (const m of region.matchAll(/box-shadow\s*:\s*([^;}"]+)/g)) {
    const v = m[1].trim()
    if (v !== 'none' && !/^var\(--clp-[a-z-]+\)$/.test(v)) {
      bad.push(`${where}: shadow not from a declaration: \`${v}\``)
    }
  }
}

/**
 * The specimen's markup, held to the same rule as its stylesheet.
 *
 * SVG carries appearance in attributes, so scanning CSS alone left every `fill=`
 * in the charts and the avatars on discipline alone. The one thing markup may
 * say that CSS may not is a mask's `white` and `black`: those are its 1 and 0,
 * the alpha channel rather than an appearance. They are allowed only inside a
 * <mask>, only on `fill`, and only as those two words.
 */
function scanMarkup(region, bad) {
  // A fragment reference is not a colour — #av-seam must not read as a hex triple.
  scanCss(region.replace(/url\(#[^)]*\)/g, 'url()').replace(/\sid="[^"]*"/g, ''), 'markup', bad)

  const masks = [...region.matchAll(/<mask\b[\s\S]*?<\/mask>/g)]
    .map(m => [m.index, m.index + m[0].length])
  const inMask = i => masks.some(([a, b]) => i >= a && i < b)

  for (const m of region.matchAll(PAINT_ATTR)) {
    const [, attr, value] = m
    if (PAINT_OK.test(value)) continue
    if (attr === 'fill' && inMask(m.index) && (value === 'white' || value === 'black')) continue
    bad.push(`markup: \`${attr}="${value}"\` is not a declared paint`)
  }

  for (const m of region.matchAll(/\bstyle="([^"]*)"/g)) {
    for (const decl of m[1].split(';')) {
      const at = decl.indexOf(':')
      if (at === -1) continue
      const prop = decl.slice(0, at).trim(), value = decl.slice(at + 1).trim()
      if (PAINT_PROP.test(prop) && !PAINT_OK.test(value)) {
        bad.push(`markup: inline \`${prop}: ${value}\` is not a declared paint`)
      }
    }
  }
}

export function assertNoAppearanceLiterals(html, slug) {
  const at = html.indexOf(MARKER)
  if (at === -1) throw new Error(`${slug}: template marker missing; the check cannot scope itself`)
  const bad = []
  scanCss(html.slice(at, html.indexOf('</style>', at)), 'stylesheet', bad)

  const from = html.indexOf(SPECIMEN_OPEN), to = html.indexOf(SPECIMEN_CLOSE)
  if (from === -1 || to === -1) {
    throw new Error(`${slug}: specimen markers missing; the check cannot scope itself`)
  }
  scanMarkup(html.slice(from + SPECIMEN_OPEN.length, to), bad)

  if (bad.length) {
    throw new Error(`${slug}: the template asserts ${bad.length} appearance value(s) ` +
      `the system did not declare:\n  - ` + [...new Set(bad)].join('\n  - '))
  }
  return html
}

/**
 * A demo observes the per-screen limits the specimen sheet cannot. The strictest
 * of those in the library is Lozenge's — "Citron on more than one element per
 * screen" — and unlike the composition rules beside it, this one is countable,
 * so it is counted rather than left to discipline.
 *
 * **Counting alias references was not enough, twice.** A system may route one
 * colour through more than one alias: Lozenge points `--clp-accent` and
 * `--clp-button-bg` at citron, so an accent phrase beside a primary button is
 * citron on two elements while the reference count reads one. That shipped, and
 * a reader's eye caught it rather than this function. The demos guard it with
 * `accentSpentOnButton`, and now so does the build — a rule held only by
 * discipline is a rule that has already been broken once.
 *
 * The specimen is exempt by construction: it is a sheet, it shows the accent in
 * its swatch row and wherever else the system declares it, and CLAUDE.md already
 * says per-screen limits are not observed there.
 */
export function assertAccentBudget(html, slug, t) {
  const at = html.indexOf(MARKER)
  const from = html.indexOf(SPECIMEN_OPEN), to = html.indexOf(SPECIMEN_CLOSE)
  if (at === -1 || from === -1 || to === -1) {
    throw new Error(`${slug}: markers missing; the accent budget cannot scope itself`)
  }
  const regions = [
    html.slice(at, html.indexOf('</style>', at)),
    html.slice(from + SPECIMEN_OPEN.length, to),
  ].join('\n')

  const uses = (regions.match(/var\(--clp-accent\)/g) ?? []).length
  if (uses > 1) {
    throw new Error(`${slug}: the demo uses --clp-accent ${uses} times. ` +
      `A demo observes per-screen limits, and the strictest in the library allows one.`)
  }

  // The same colour reachable through a second alias the demo also paints with.
  // Aliases are `var()` references by contract, so equal declared values mean
  // the same token and therefore the same colour on screen.
  const accent = t?.get('--clp-accent')
  const button = t?.get('--clp-button-bg')
  if (uses && accent && accent === button && regions.includes('var(--clp-button-bg)')) {
    throw new Error(`${slug}: --clp-accent and --clp-button-bg are both \`${accent}\`, ` +
      `and this demo paints with both. That is one colour on two elements while the ` +
      `reference count reads one. Gate the payoff on accentSpentOnButton(t).`)
  }
  return html
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

  const block = tokensBlock(sys.blocks)[0]
  const files = [
    ['preview.html',
      assertBalancedTags(assertNoAppearanceLiterals(render(sys), slug), slug)],
  ]

  // A reference record gets no demo. Its tokens are approximations of someone
  // else's work, and a specimen sheet in approximated colours reads as the
  // reading it is, where a whole realised page in them would read as a claim
  // about work that is not ours. A reference is never installed either — it is
  // forked into an `origin: own` system first, and that fork gets the demos.
  if (scalar(sys.data.origin) === 'own') {
    const aliases = block ? declaredAliases(block.code) : new Map()
    for (const demo of DEMOS) {
      files.push([demoFile(demo.name),
        assertAccentBudget(
          assertBalancedTags(
            assertNoAppearanceLiterals(renderDemo(sys, demo), `${slug}/${demo.name}`),
            `${slug}/${demo.name}`), `${slug}/${demo.name}`, aliases)])
    }
  }
  if (block) {
    for (const mode of ['light', 'dark']) {
      const svg = thumbnail(block.code, mode)
      if (svg) files.push([`thumb-${mode}.svg`, svg])
    }
  }

  for (const [name, content] of files) {
    const out = join(ROOT, 'systems', slug, name)
    if (check) {
      const current = existsSync(out) ? readFileSync(out, 'utf8') : null
      if (current !== content) { console.log(`stale: systems/${slug}/${name}`); stale++ }
    } else {
      writeFileSync(out, content)
      console.log(`  wrote systems/${slug}/${name}`)
    }
  }
}

if (check && stale) process.exit(1)
if (check) console.log(`${slugs.length} preview(s) up to date`)
