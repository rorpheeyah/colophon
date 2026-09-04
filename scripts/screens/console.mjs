// The `console` archetype: an application shell for a system whose register is
// technical or utility — and the default for any register with no archetype
// mapped to it, because it is the composition closest to the specimen sheet.
//
// It is a screen, so it observes the per-screen limits the sheet cannot:
//
//   - --clp-accent appears exactly once, on the marker for the environment you
//     are currently in. build-previews.mjs counts the references and fails the
//     build on a second one.
//   - three summary tiles, never four. Lozenge forbids more than three.
//   - one surface step. Containment comes from the system's own edge where it
//     draws one and from --clp-surface where it does not; nothing is doubled.
//   - no decorative element used twice.
//
// Sample copy is invented placeholder text and is Latin only — see the note in
// screen-frame.mjs about why a screen does not exercise --clp-font-script.

import { esc, has } from '../preview-shared.mjs'
import { barChart, lineChart, donut, gauge, legend, ranked } from '../preview-charts.mjs'

const ENVIRONMENTS = ['Production', 'Staging', 'Preview']
const SECTIONS = ['Overview', 'Services', 'Activity']

const ROWS = [
  ['api-gateway', 'eu-west-1', '4', '99.98%', '128ms', 'success', 'Healthy'],
  ['auth-worker', 'eu-west-1', '2', '99.94%', '96ms', 'success', 'Healthy'],
  ['media-encoder', 'us-east-1', '6', '99.21%', '412ms', 'warn', 'Degraded'],
  ['billing-sync', 'eu-west-1', '1', '97.40%', '883ms', 'alarm', 'Failing'],
  ['search-index', 'ap-south-1', '3', '99.87%', '204ms', 'success', 'Healthy'],
]

// Sign and sentiment agree on all three, because a delta takes its colour from
// its *direction* — the same reading the specimen uses, so the two artifacts
// cannot disagree about the same file.
const TILES = [
  ['Requests, 24h', '1.84M', '+6.2%'],
  ['Uptime, 30d', '99.94%', '+0.03pt'],
  ['Failing checks', '3', '+2'],
]

export function css(t, meta) {
  const railInverted = has(t, '--clp-invert-bg')
  return `
/* ── console ──────────────────────────────────────────────────────────── */
.topbar{display:flex;align-items:center;gap:var(--_gap);padding:12px clamp(16px,3vw,28px);
  border-bottom:1px solid var(--clp-line);flex-wrap:wrap;flex:none}
.brand{font-family:var(--clp-font-display);font-weight:700;font-size:15px;letter-spacing:-.01em}
.topbar-nav{display:flex;gap:clamp(12px,2vw,22px);margin-left:clamp(8px,3vw,30px);flex-wrap:wrap}
.topbar-nav a{font-size:13px;color:var(--clp-text-3);text-decoration:none;padding:4px 0}
.topbar-nav a.on{color:var(--clp-text);font-weight:600}
.topbar-end{margin-left:auto;display:flex;align-items:center;gap:10px}

.shell{display:grid;grid-template-columns:216px minmax(0,1fr);flex:1 0 auto;align-items:start}
.side{padding:clamp(16px,2.4vw,26px) 0 26px clamp(16px,3vw,28px);
  display:flex;flex-direction:column;gap:10px;position:sticky;top:0}
.side-nav{display:flex;flex-direction:column;${railInverted
  ? `background:var(--clp-invert-bg);color:var(--clp-invert-text);
  border-radius:var(--clp-radius-box);padding:8px;gap:3px`
  : 'gap:1px'}}
.env{display:flex;align-items:center;gap:9px;padding:8px 11px;font-size:13px;
  border-radius:var(--clp-radius-control);cursor:pointer;border:0;background:none;
  text-align:left;color:${railInverted ? 'inherit;opacity:.72' : 'var(--clp-text-2)'}}
.env.on{font-weight:600;${railInverted
  ? 'background:var(--clp-invert-accent);color:var(--clp-invert-bg);opacity:1'
  : 'color:var(--clp-text)'}}
.env:active{transform:var(--_press)}
/* The one accent on this screen: which environment you are looking at. */
.env-dot{width:7px;height:7px;flex:none;border-radius:var(--clp-radius-control);
  background:var(--clp-line)}
.env.on .env-dot{background:var(--clp-accent)}

.main{padding:clamp(16px,2.4vw,26px) clamp(16px,3vw,28px) 44px;
  display:flex;flex-direction:column;gap:calc(var(--_gap) * 1.6);min-width:0}
.page-h{display:flex;align-items:flex-start;gap:var(--_gap);flex-wrap:wrap}
.page-h > div:first-child{display:flex;flex-direction:column;gap:5px;min-width:0}
.page-act{margin-left:auto;display:flex;gap:10px;flex-wrap:wrap}
.crumb{font-size:12.5px;color:var(--clp-text-3)}

.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--_gap)}
.split{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);
  gap:var(--_gap);align-items:start}

@media(max-width:940px){
  .shell{grid-template-columns:minmax(0,1fr)}
  .side{position:static;padding:14px clamp(16px,3vw,28px) 0;border-bottom:1px solid var(--clp-line)}
  .side-nav{flex-direction:row;flex-wrap:wrap;${railInverted ? '' : 'gap:6px'}}
  .split{grid-template-columns:minmax(0,1fr)}
}
@media(max-width:620px){
  .tiles{grid-template-columns:minmax(0,1fr)}
  .topbar-nav{width:100%;margin-left:0;order:3}
  .page-act{margin-left:0;width:100%}
}
`
}

export function body(t, meta) {
  const series = [1, 2, 3, 4, 5].filter(n => has(t, `--clp-chart-${n}`))
  const states = new Set(['success', 'warn', 'alarm'].filter(k => has(t, `--clp-${k}`)))

  const tiles = TILES.map(([label, value, delta]) => {
    // A delta takes its colour from its direction, and shows unstated where that
    // direction has no declared colour.
    const key = delta.startsWith('+') ? 'success' : 'alarm'
    const coloured = states.has(key)
    return `<div class="tile">
      <span>${esc(label)}</span>
      <b>${esc(value)}</b>
      <span class="delta"${coloured ? ` style="color:var(--clp-${key})"` : ''}>${esc(delta)}</span>
    </div>`
  }).join('')

  const rows = ROWS.map(([name, region, inst, uptime, p95, state, label]) => `<tr>
      <td>${esc(name)}</td>
      <td class="muted">${esc(region)}</td>
      <td class="n">${esc(inst)}</td>
      <td class="n">${esc(uptime)}</td>
      <td class="n">${esc(p95)}</td>
      <td>${states.has(state)
        ? `<span class="state s-${state}">${esc(label)}</span>`
        : `<span class="muted">${esc(label)}</span>`}</td>
    </tr>`).join('')

  // Charts take the declared series in order and are omitted entirely where the
  // system declares none — there is no generated colour and no fallback to the
  // accent.
  const panel = !series.length
    ? ''
    : `<div class="panel">
        <div class="panel-h"><h3>Request volume</h3><span>Last 7 days</span></div>
        ${barChart(series[0])}
      </div>`

  const aside = !series.length
    ? ''
    : series.length >= 3
      ? `<div class="panel">
          <div class="panel-h"><h3>Traffic source</h3></div>
          ${donut(series)}${legend(series)}
        </div>`
      : `<div class="panel">
          <div class="panel-h"><h3>Capacity</h3></div>
          ${gauge(series[0])}
        </div>`

  return `<div class="scr">
  <header class="topbar">
    <div class="brand">Northsel</div>
    <nav class="topbar-nav">${SECTIONS.map((s, i) =>
      `<a href="#" ${i === 0 ? 'class="on" aria-current="page"' : ''}>${esc(s)}</a>`).join('')}</nav>
    <div class="topbar-end">
      ${has(t, '--clp-button2-bg') ? '<button class="btn b2">Invite</button>' : ''}
      <span class="avatar">RM</span>
    </div>
  </header>

  <div class="shell">
    <aside class="side">
      <p class="eyebrow">Environment</p>
      <nav class="side-nav">${ENVIRONMENTS.map((e, i) =>
        `<button class="env${i === 0 ? ' on' : ''}"${i === 0 ? ' aria-current="true"' : ''}>` +
        `<i class="env-dot"></i>${esc(e)}</button>`).join('')}</nav>
    </aside>

    <main class="main">
      <div class="page-h">
        <div>
          <p class="crumb">Services / api-gateway</p>
          <h1>api-gateway</h1>
          <p class="sub">Routes and authenticates every public request before it reaches an
            internal service.</p>
        </div>
        <div class="page-act">
          <button class="btn b3">View logs</button>
          <button class="btn">Deploy</button>
        </div>
      </div>

      <section class="tiles">${tiles}</section>

      ${panel || aside ? `<section class="split">${panel}${aside}</section>` : ''}

      <section class="tblock">
        <div class="tscroll">
          <table>
            <thead><tr>
              <th>Service</th><th>Region</th><th class="n">Instances</th>
              <th class="n">Uptime</th><th class="n">p95</th><th>State</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</div>`
}
