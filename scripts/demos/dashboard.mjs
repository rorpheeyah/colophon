// The `dashboard` demo: a service reliability console.
//
// Nothing in a system's file decides whether it gets this demo — every
// `origin: own` system gets every demo and the viewer picks. See demos/index.mjs.
//
// It is a whole page, so it observes the per-screen limits the sheet cannot:
//
//   - --clp-accent appears exactly once, marking where you currently are.
//     build-previews.mjs counts the references and fails the build on a second.
//   - three summary tiles, never four. Lozenge forbids more than three.
//   - one surface step. Containment comes from the system's own edge where it
//     draws one and from --clp-surface where it does not; nothing is doubled.
//   - no decorative element used twice.
//
// **Every figure on this page is computed from SERVICES below.** The tiles sum
// the table, the chart's caption sums the chart's own bars, the incident banner
// names the service that is actually failing, and the row count is the number of
// rows. Placeholder content reads as placeholder mostly because its numbers do
// not agree with each other; these do.
//
// Sample copy is invented and Latin only — see the note in demo-frame.mjs about
// why a demo does not exercise --clp-font-script.

import { esc, has } from '../preview-shared.mjs'
import { barChart, donut, gauge, legend, WEEK } from '../preview-charts.mjs'

/** requests are thousands over the trailing 7 days, and they sum to the chart. */
const SERVICES = [
  { name: 'api-gateway',   owner: 'Platform',  region: 'eu-west-1',  req: 152, avail: 99.98, p95: 128, state: 'ok',    deploy: '2h ago' },
  { name: 'auth-worker',   owner: 'Identity',  region: 'eu-west-1',  req: 96,  avail: 99.94, p95: 96,  state: 'ok',    deploy: '6h ago' },
  { name: 'media-encoder', owner: 'Media',     region: 'us-east-1',  req: 71,  avail: 99.21, p95: 412, state: 'warn',  deploy: '3d ago' },
  { name: 'search-index',  owner: 'Discovery', region: 'ap-south-1', req: 62,  avail: 99.87, p95: 204, state: 'ok',    deploy: '1d ago' },
  { name: 'webhook-relay', owner: 'Platform',  region: 'eu-west-1',  req: 16,  avail: 99.55, p95: 88,  state: 'ok',    deploy: '5d ago' },
  { name: 'billing-sync',  owner: 'Payments',  region: 'eu-west-1',  req: 12,  avail: 97.40, p95: 883, state: 'alarm', deploy: '9d ago' },
]

const DEPLOYS = [
  ['api-gateway', 'Platform', 'rate limits per key', '2h ago', 'ok'],
  ['auth-worker', 'Identity', 'rotate signing keys', '6h ago', 'ok'],
  ['search-index', 'Discovery', 'reindex on schema change', '1d ago', 'ok'],
  ['media-encoder', 'Media', 'retry on transcode timeout', '3d ago', 'warn'],
]

const NAV = [
  ['Monitor', ['Overview', 'Services', 'Incidents']],
  ['Deliver', ['Releases', 'Pipelines']],
]
const ENVIRONMENTS = ['Production', 'Staging']
const RANGES = ['24h', '7d', '30d']

// ── derived, so nothing on the page can disagree with anything else ──────────
const TOTAL_REQ = SERVICES.reduce((n, s) => n + s.req, 0)
const CHART_TOTAL = WEEK.reduce((n, v) => n + v, 0)
const AVAILABILITY = SERVICES.reduce((n, s) => n + s.avail * s.req, 0) / TOTAL_REQ
const UNHEALTHY = SERVICES.filter(s => s.state !== 'ok')
const WORST = SERVICES.find(s => s.state === 'alarm')
const STATE_LABEL = { ok: 'Healthy', warn: 'Degraded', alarm: 'Failing' }

export function css(t, meta) {
  const railInverted = has(t, '--clp-invert-bg')
  return `
/* ── dashboard ────────────────────────────────────────────────────────── */
/* The top bar is the one element on this page that content scrolls beneath, so
   it is the one element glass may go on. Filament states the test as a question —
   "does page content scroll underneath this element?" — and answers it for cards,
   tables, sidebars and modals with a flat no. A demo that put glass on a panel
   would be misplacing a declared value, the same class of error as putting
   --clp-shadow on a container. Where a system declares no glass the bar stays
   opaque on the page ground, and it is still sticky: content scrolling under an
   opaque bar is ordinary. */
.topbar{display:flex;align-items:center;gap:var(--_gap);padding:11px clamp(16px,2.5vw,26px);
  flex:none;position:sticky;top:0;z-index:5;${has(t, '--clp-glass')
    ? `background:var(--clp-glass);border-bottom:1px solid ${
        has(t, '--clp-glass-edge') ? 'var(--clp-glass-edge)' : 'var(--clp-line)'}${
        has(t, '--clp-blur') ? `;backdrop-filter:blur(var(--clp-blur))` : ''}`
    : 'background:var(--clp-bg);border-bottom:1px solid var(--clp-line)'}}
.brand{display:flex;align-items:baseline;gap:8px;font-family:var(--clp-font-display);
  font-weight:700;font-size:15px;letter-spacing:-.01em;white-space:nowrap}
.brand i{font-style:normal;font-weight:500;font-size:12.5px;color:var(--clp-text-3)}
.topsearch{margin-left:clamp(10px,3vw,34px);flex:1;max-width:340px;
  border:var(--_border);border-radius:var(--clp-radius-control);padding:8px 12px;
  background:var(--clp-surface);color:var(--clp-text-3);font-size:12.5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.topbar-end{margin-left:auto;display:flex;align-items:center;gap:11px;flex:none}

.shell{display:grid;grid-template-columns:214px minmax(0,1fr);flex:1 0 auto;align-items:stretch}
.side{padding:clamp(14px,2vw,22px) 0 22px clamp(16px,2.5vw,26px);
  display:flex;flex-direction:column;gap:16px;border-right:1px solid var(--clp-line)}
.navgroup{display:flex;flex-direction:column;gap:5px}
.navgroup a{font-size:13.5px;text-decoration:none;padding:6px 10px;
  border-radius:var(--clp-radius-control);color:var(--clp-text-2)}
.navgroup a.on{color:var(--clp-text);font-weight:600;background:var(--clp-line)}
.envbox{display:flex;flex-direction:column;gap:5px;padding-right:clamp(16px,2.5vw,26px)}
.envlist{display:flex;flex-direction:column;${railInverted
  ? `background:var(--clp-invert-bg);color:var(--clp-invert-text);
  border-radius:var(--clp-radius-box);padding:7px;gap:2px`
  : 'gap:2px'}}
.env{display:flex;align-items:center;gap:9px;padding:7px 10px;font-size:13px;
  border-radius:var(--clp-radius-control);cursor:pointer;border:0;background:none;
  text-align:left;color:${railInverted ? 'inherit;opacity:.7' : 'var(--clp-text-2)'}}
.env.on{font-weight:600;${railInverted
  ? 'background:var(--clp-invert-accent);color:var(--clp-invert-bg);opacity:1'
  : 'color:var(--clp-text)'}}
.env:active{transform:var(--_press)}
/* The one accent on this page: which environment you are looking at. Every
   other current-state marker on the page is carried by weight or by a rule. */
.env-dot{width:7px;height:7px;flex:none;border-radius:var(--clp-radius-control);
  background:var(--clp-line)}
.env.on .env-dot{background:var(--clp-accent)}

.main{padding:clamp(14px,2vw,22px) clamp(16px,2.5vw,26px) 40px;
  display:flex;flex-direction:column;gap:calc(var(--_gap) * 1.5);min-width:0}
.banner{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;
  border-radius:var(--clp-radius-box);padding:11px 15px;font-size:13px}
.banner b{font-weight:700}
.banner s{margin-left:auto;text-decoration:none;font:600 12px/1.6 var(--_data)}

.page-h{display:flex;align-items:flex-start;gap:var(--_gap);flex-wrap:wrap}
.page-h > div:first-child{display:flex;flex-direction:column;gap:6px;min-width:0}
.page-act{margin-left:auto;display:flex;gap:9px;flex-wrap:wrap;align-items:flex-start}
.crumb{font-size:12.5px;color:var(--clp-text-3)}
.meta{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--clp-text-2)}
.meta b{font-family:var(--_data);font-weight:600;color:var(--clp-text)}

.toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.search{border:var(--_border);border-radius:var(--clp-radius-control);padding:8px 12px;
  background:var(--clp-surface);color:var(--clp-text-3);font-size:12.5px;min-width:180px}
.chips{display:flex;gap:7px;flex-wrap:wrap}
.filter{border:1px solid var(--clp-line);border-radius:var(--clp-radius-control);
  padding:5px 11px;font:500 12px/1.5 var(--clp-font-body);color:var(--clp-text-2);
  background:none;cursor:pointer}
.filter.on{background:var(--clp-text);color:var(--clp-bg);border-color:var(--clp-text);font-weight:600}
.filter:active{transform:var(--_press)}
.range{margin-left:auto;display:flex;gap:2px;padding:2px;background:var(--clp-line);
  border-radius:var(--clp-radius-control)}
.range button{border:0;background:none;cursor:pointer;padding:5px 12px;
  border-radius:var(--clp-radius-control);font:500 12px/1.5 var(--_data);color:var(--clp-text-2)}
.range button.on{background:var(--clp-bg);color:var(--clp-text);font-weight:700}

.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--_gap)}
.split{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);
  gap:var(--_gap);align-items:start}
.tfoot{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--clp-text-3);
  padding:10px 16px;border-top:1px solid var(--clp-line)}
.tfoot s{margin-left:auto;text-decoration:none}

.feed{display:flex;flex-direction:column}
.feed-row{display:flex;align-items:baseline;gap:11px;padding:10px 0;
  border-bottom:1px solid var(--clp-line);font-size:13px;flex-wrap:wrap}
.feed-row:last-child{border-bottom:0}
.feed-row b{font-weight:600;min-width:118px}
.feed-row span{color:var(--clp-text-2);flex:1;min-width:150px}
.feed-row time{font-family:var(--_data);font-size:11.5px;color:var(--clp-text-3);margin-left:auto}
.foot{padding:16px clamp(16px,2.5vw,26px);border-top:1px solid var(--clp-line);
  font-size:12px;color:var(--clp-text-3);display:flex;gap:16px;flex-wrap:wrap;flex:none}

@media(max-width:1000px){
  .shell{grid-template-columns:minmax(0,1fr)}
  .side{border-right:0;border-bottom:1px solid var(--clp-line);
    padding:14px clamp(16px,2.5vw,26px);flex-direction:row;flex-wrap:wrap;gap:20px}
  .navgroup{flex-direction:row;flex-wrap:wrap}
  .envbox{padding-right:0}
  .envlist{flex-direction:row}
  .split{grid-template-columns:minmax(0,1fr)}
}
@media(max-width:660px){
  .tiles{grid-template-columns:minmax(0,1fr)}
  .topsearch{display:none}
  .range{margin-left:0}
  .page-act{margin-left:0;width:100%}
}
`
}

export function body(t, meta) {
  const series = [1, 2, 3, 4, 5].filter(n => has(t, `--clp-chart-${n}`))
  const states = new Set(['success', 'warn', 'alarm'].filter(k => has(t, `--clp-${k}`)))
  const stateCell = s => states.has(s.state === 'ok' ? 'success' : s.state)
    ? `<span class="state s-${s.state === 'ok' ? 'success' : s.state}">${STATE_LABEL[s.state]}</span>`
    : `<span class="muted">${STATE_LABEL[s.state]}</span>`

  // Three tiles, each summed or counted from the table below it.
  const tiles = [
    ['Requests, 7d', `${CHART_TOTAL}k`, `+6.2%`, 'success'],
    ['Availability', `${AVAILABILITY.toFixed(2)}%`, 'target 99.90%', null],
    ['Degraded services', String(UNHEALTHY.length), UNHEALTHY.map(s => s.name).join(', '),
      UNHEALTHY.length ? 'alarm' : 'success'],
  ].map(([label, value, note, key]) => `<div class="tile">
      <span>${esc(label)}</span>
      <b>${esc(value)}</b>
      <span class="delta"${key && states.has(key) ? ` style="color:var(--clp-${key})"` : ''}>${esc(note)}</span>
    </div>`).join('')

  const rows = SERVICES.map(s => `<tr>
      <td>${esc(s.name)}</td>
      <td class="muted">${esc(s.owner)}</td>
      <td class="muted">${esc(s.region)}</td>
      <td class="n">${s.req}k</td>
      <td class="n">${s.avail.toFixed(2)}%</td>
      <td class="n">${s.p95}ms</td>
      <td>${stateCell(s)}</td>
    </tr>`).join('')

  // The banner names the service that is actually failing, and appears only
  // where the system declared a colour to say so with.
  const banner = WORST && states.has('alarm')
    ? `<div class="banner a-alarm" role="status">
        <b>${esc(STATE_LABEL.alarm)}:</b>
        <span>${esc(WORST.name)} is at ${WORST.avail.toFixed(2)}% availability with p95 at
          ${WORST.p95}ms. Last deployed ${esc(WORST.deploy)}.</span>
        <s>Open incident</s>
      </div>`
    : ''

  // Charts take the declared series in order and are omitted entirely where the
  // system declares none — no generated colour, no fallback to the accent.
  const panel = series.length
    ? `<div class="panel">
        <div class="panel-h"><h3>Request volume</h3><span>7 days &middot; ${CHART_TOTAL}k total</span></div>
        ${barChart(series[0])}
      </div>`
    : ''

  const aside = series.length
    ? series.length >= 3
      ? `<div class="panel">
          <div class="panel-h"><h3>By region</h3></div>
          ${donut(series)}${legend(series, ['eu-west-1', 'us-east-1', 'ap-south-1', 'Other', 'Unassigned'])}
        </div>`
      : `<div class="panel">
          <div class="panel-h"><h3>Error budget</h3></div>
          ${gauge(series[0])}
        </div>`
    : ''

  const nav = NAV.map(([group, items]) => `<div class="navgroup">
      <p class="eyebrow">${esc(group)}</p>
      ${items.map((it, i) => `<a href="#"${i === 1 && group === 'Monitor'
        ? ' class="on" aria-current="page"' : ''}>${esc(it)}</a>`).join('')}
    </div>`).join('')

  const deploys = DEPLOYS.map(([svc, team, change, when, state]) => `<div class="feed-row">
      <b>${esc(svc)}</b>
      <span>${esc(change)} &middot; ${esc(team)}</span>
      ${states.has(state === 'ok' ? 'success' : state)
        ? `<span class="state s-${state === 'ok' ? 'success' : state}">${
            state === 'ok' ? 'Shipped' : 'Rolled back'}</span>`
        : `<span class="muted">${state === 'ok' ? 'Shipped' : 'Rolled back'}</span>`}
      <time>${esc(when)}</time>
    </div>`).join('')

  return `<div class="scr">
  <header class="topbar">
    <div class="brand">Northsel <i>/ Reliability</i></div>
    <div class="topsearch">Search services, deploys and incidents</div>
    <div class="topbar-end">
      ${has(t, '--clp-button2-bg') ? '<button class="btn b2">Invite</button>' : ''}
      <span class="avatar">RM</span>
    </div>
  </header>

  <div class="shell">
    <aside class="side">
      ${nav}
      <div class="envbox">
        <p class="eyebrow">Environment</p>
        <nav class="envlist">${ENVIRONMENTS.map((e, i) =>
          `<button class="env${i === 0 ? ' on' : ''}"${i === 0 ? ' aria-current="true"' : ''}>` +
          `<i class="env-dot"></i>${esc(e)}</button>`).join('')}</nav>
      </div>
    </aside>

    <main class="main">
      ${banner}

      <div class="page-h">
        <div>
          <p class="crumb">Production / Services</p>
          <h1>Services</h1>
          <div class="meta">
            <span>Owned by <b>${SERVICES.length}</b> teams</span>
            <span>Window <b>7d</b></span>
            <span>Last deploy <b>${esc(SERVICES[0].deploy)}</b></span>
          </div>
        </div>
        <div class="page-act">
          <button class="btn b3">Export</button>
          <button class="btn">New deploy</button>
        </div>
      </div>

      <div class="toolbar">
        <div class="search">Filter by name or owner</div>
        <div class="chips">
          <button class="filter on">All</button>
          <button class="filter">Degraded</button>
          <button class="filter">Platform</button>
        </div>
        <div class="range">${RANGES.map((r, i) =>
          `<button class="${i === 1 ? 'on' : ''}">${esc(r)}</button>`).join('')}</div>
      </div>

      <section class="tiles">${tiles}</section>

      ${panel || aside ? `<section class="split">${panel}${aside}</section>` : ''}

      <section class="tblock">
        <div class="tscroll">
          <table>
            <thead><tr>
              <th>Service</th><th>Owner</th><th>Region</th><th class="n">Requests</th>
              <th class="n">Availability</th><th class="n">p95</th><th>State</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="tfoot">
          <span>${SERVICES.length} services &middot; ${TOTAL_REQ}k requests</span>
          <s>Grouped by owner</s>
        </div>
      </section>

      <section class="panel">
        <div class="panel-h"><h3>Recent deploys</h3><span>Across all environments</span></div>
        <div class="feed">${deploys}</div>
      </section>
    </main>
  </div>

  <footer class="foot">
    <span>Northsel Reliability</span>
    <span>Region eu-west-1</span>
    <span>Data through 17 Sep</span>
  </footer>
</div>`
}
