// The `editorial` demo: a long-form report page.
//
// Newsprint's rules govern this one hardest, and they are unusually specific:
//
//   - **"Rules, not cards. Do not wrap content in filled containers to group
//     it."** So structure is carried by hairlines and by a shared column edge,
//     and nothing here is a panel. The kit fills a container only where
//     --clp-card-fill says so, and Newsprint declines it.
//   - **Column alignment is the layout.** Figures right-align in the data
//     family and hold one vertical spine down the page; labels left-align.
//   - **Uppercase only on mono labels and column heads.** The kicker and the
//     column heads are labels; nothing else is uppercase.
//   - **No second decorative detail.** The template adds no ornament at all.
//
// **This demo spends no accent.** An article has no payoff to put one on, and
// Newsprint aliases --clp-accent to its ink ramp, so an accented phrase would be
// the colour of the text beside it. Zero is under the ceiling.
//
// Every figure is computed from LINES and the chart's own array. Copy is
// invented and Latin only.

import { esc, has } from '../preview-shared.mjs'
import { barChart, legend, stacked, WEEK, DAYS } from '../preview-charts.mjs'

const SECTIONS = ['Transport', 'Housing', 'Energy', 'Method']

// Invented figures for an invented network. `on` is trains arriving inside the
// published window; `run` is trains scheduled.
const LINES = [
  { name: 'Coast', run: 1840, on: 1712, halts: 22 },
  { name: 'Vale',  run: 1290, on: 1104, halts: 17 },
  { name: 'Ridge', run: 960,  on: 903,  halts: 12 },
  { name: 'Kiln',  run: 640,  on: 471,  halts: 9 },
]

const NOTES = [
  ['Window', 'A service counts as on time if it arrives within four minutes of the published time at its final halt.'],
  ['Source', 'Operator returns for the twelve months to September, as filed with the regulator.'],
  ['Excluded', 'Services cancelled before departure, and the eleven days of engineering closure on Kiln.'],
]

const FURTHER = [
  'How four minutes became the number',
  'The halt that costs Vale its margin',
  'What a punctuality figure cannot tell you',
]

// ── derived ───────────────────────────────────────────────────────────────────
const TOTAL_RUN = LINES.reduce((n, l) => n + l.run, 0)
const TOTAL_ON = LINES.reduce((n, l) => n + l.on, 0)
const NETWORK_PCT = (TOTAL_ON / TOTAL_RUN) * 100
const pct = l => (l.on / l.run) * 100
const WORST = LINES.reduce((a, b) => (pct(a) <= pct(b) ? a : b))
const BEST = LINES.reduce((a, b) => (pct(a) >= pct(b) ? a : b))
const CHART_TOTAL = WEEK.reduce((n, v) => n + v, 0)

export function css(t, meta) {
  return `
/* ── editorial ────────────────────────────────────────────────────────── */
/* A hairline and a shared column edge carry the structure. Nothing here is a
   filled container, because Newsprint forbids grouping content with one and
   declines --clp-card-fill to say so. */
.masthead{display:flex;align-items:baseline;gap:var(--_gap);flex-wrap:wrap;flex:none;
  padding:16px clamp(16px,4vw,44px) 12px;border-bottom:1px solid var(--clp-text)}
.title{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);
  font-size:clamp(24px,3.4vw,40px);letter-spacing:-.03em;line-height:1}
.issue{font:500 11px/1.6 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3)}
.sectionbar{display:flex;gap:clamp(14px,2vw,26px);flex-wrap:wrap;flex:none;
  padding:9px clamp(16px,4vw,44px);border-bottom:1px solid var(--clp-line)}
.sectionbar a{font:500 11px/1.6 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3);text-decoration:none}
.sectionbar a.on{color:var(--clp-text)}

.sheet{width:100%;max-width:1120px;margin-inline:auto;padding:0 clamp(16px,4vw,44px);
  display:flex;flex-direction:column}
.head{padding:clamp(26px,4vw,52px) 0 clamp(18px,2.4vw,26px);
  border-bottom:1px solid var(--clp-line);display:flex;flex-direction:column;gap:13px}
.kicker{font:500 11px/1.6 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-2)}
.head h1{font-size:clamp(29px,5vw,54px);line-height:1.06;letter-spacing:-.025em;max-width:26ch}
.deck{font-size:clamp(15px,1.6vw,19px);color:var(--clp-text-2);max-width:56ch;line-height:1.5}
.byline{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--clp-text-3)}
.byline b{color:var(--clp-text-2);font-weight:600}
.byline time{font-family:var(--_data)}

/* The column edge is the layout: body and margin share one vertical hairline. */
.cols{display:grid;grid-template-columns:minmax(0,1fr) 232px;gap:0;
  padding-bottom:clamp(30px,5vw,60px)}
.body{padding:clamp(22px,3vw,34px) clamp(22px,3vw,40px) 0 0;min-width:0}
.margin{padding:clamp(22px,3vw,34px) 0 0 clamp(22px,3vw,40px);
  border-left:1px solid var(--clp-line);min-width:0;
  display:flex;flex-direction:column;gap:clamp(18px,2.4vw,26px)}
.body > p{font-size:15px;line-height:1.62;max-width:62ch;margin:0 0 15px}
.body h2{font-size:clamp(17px,1.8vw,21px);margin:clamp(22px,3vw,32px) 0 11px;max-width:40ch}

/* Rules above and below, never a fill and never a quotation ornament — a second
   decorative detail is forbidden and the deckle is already the first. */
.pull{margin:clamp(22px,3vw,32px) 0;padding:17px 0;
  border-top:1px solid var(--clp-text);border-bottom:1px solid var(--clp-line);max-width:52ch}
.pull p{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);
  font-size:clamp(17px,2vw,23px);line-height:1.28;letter-spacing:-.015em}
.pull cite{display:block;margin-top:8px;font-style:normal;
  font:500 11px/1.6 var(--_data);letter-spacing:.07em;text-transform:uppercase;
  color:var(--clp-text-3)}

.figure{margin:clamp(24px,3vw,34px) 0;display:flex;flex-direction:column;gap:10px}
.figure figcaption{font-size:12.5px;color:var(--clp-text-3);max-width:56ch}
.figure figcaption b{color:var(--clp-text-2);font-weight:600}

/* Three figures, right-aligned into one spine, which is the whole reason a
   third family exists in this system. */
.standfirst{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  border-top:1px solid var(--clp-text);border-bottom:1px solid var(--clp-line)}
.sf{padding:14px 0;display:flex;flex-direction:column;gap:2px}
.sf + .sf{border-left:1px solid var(--clp-line);padding-left:16px}
.sf b{font:700 clamp(23px,3vw,30px)/1.05 var(--_data);letter-spacing:-.04em;
  font-variant-numeric:tabular-nums}
.sf span{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3)}

.margin h3{font-size:13px;margin-bottom:9px}
.marginlabel{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3);margin-bottom:7px}
.notes-l{display:flex;flex-direction:column;gap:11px}
.note{font-size:12.5px;color:var(--clp-text-2);line-height:1.5}
.note b{display:block;font:500 10px/1.6 var(--_data);letter-spacing:.08em;
  text-transform:uppercase;color:var(--clp-text-3)}
.further{display:flex;flex-direction:column}
.further a{font-size:13px;color:var(--clp-text);text-decoration:none;
  padding:9px 0;border-bottom:1px solid var(--clp-line);line-height:1.4}
.further a:first-child{border-top:1px solid var(--clp-line)}

.colophon{border-top:1px solid var(--clp-text);padding:16px 0 44px;
  display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--clp-text-3)}
.colophon b{color:var(--clp-text-2);font-weight:600}

@media(max-width:860px){
  .cols{grid-template-columns:minmax(0,1fr)}
  .body{padding-right:0}
  .margin{border-left:0;border-top:1px solid var(--clp-line);
    padding:clamp(22px,3vw,34px) 0 0}
}
@media(max-width:560px){
  .standfirst{grid-template-columns:minmax(0,1fr)}
  .sf + .sf{border-left:0;border-top:1px solid var(--clp-line);padding-left:0}
}
`
}

export function body(t, meta) {
  const series = [1, 2, 3, 4, 5].filter(n => has(t, `--clp-chart-${n}`))

  const figures = [
    [NETWORK_PCT.toFixed(1) + '%', 'network on time'],
    [TOTAL_RUN.toLocaleString('en-GB'), 'services scheduled'],
    [String(LINES.length), 'lines in the return'],
  ].map(([v, l]) => `<div class="sf"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')

  const rows = LINES.map(l => `<tr>
      <td>${esc(l.name)}</td>
      <td class="n">${l.run.toLocaleString('en-GB')}</td>
      <td class="n">${l.on.toLocaleString('en-GB')}</td>
      <td class="n">${l.halts}</td>
      <td class="n">${pct(l).toFixed(1)}%</td>
    </tr>`).join('')

  const chart = series.length
    ? `<figure class="figure">
        <div class="marginlabel">Services by day, latest week</div>
        ${series.length >= 2 ? stacked(series) + legend(series, ['On time', 'Late'])
          : barChart(series[0])}
        <figcaption><b>${CHART_TOTAL}</b> services in the sample week, distributed across
          ${DAYS.length} days. The week is illustrative; the table carries the year.</figcaption>
      </figure>`
    : ''

  const notes = NOTES.map(([k, v]) =>
    `<p class="note"><b>${esc(k)}</b>${esc(v)}</p>`).join('')

  const further = FURTHER.map(f => `<a href="#">${esc(f)}</a>`).join('')

  return `<div class="scr">
  <header class="masthead">
    <div class="title">The Sounding</div>
    <div class="issue">Issue 114 &middot; 17 September</div>
  </header>
  <nav class="sectionbar" data-group="section">${SECTIONS.map((x, i) =>
    `<a href="#"${i === 0 ? ' class="on" aria-current="page"' : ''}>${esc(x)}</a>`).join('')}</nav>

  <div class="sheet">
    <div class="head">
      <p class="kicker">Transport &middot; Punctuality</p>
      <h1>Four minutes is doing a great deal of work</h1>
      <p class="deck">The network reports ${NETWORK_PCT.toFixed(1)}% of services on time. Change
        the window by ninety seconds and two of its four lines change places.</p>
      <p class="byline"><b>By the transport desk</b>
        <time>17 September</time>
        <span>${TOTAL_RUN.toLocaleString('en-GB')} services examined</span></p>
    </div>

    <div class="cols">
      <div class="body">
        <p>A punctuality figure is a threshold wearing the clothes of a measurement. The network
          publishes one number for the year, and the number is true; what it does not carry is
          how much of its own weight rests on where the threshold was drawn.</p>

        <div class="standfirst">${figures}</div>

        <p>Across ${LINES.length} lines and ${TOTAL_RUN.toLocaleString('en-GB')} scheduled
          services, ${TOTAL_ON.toLocaleString('en-GB')} arrived inside the published window.
          That is the headline. Beneath it, ${esc(BEST.name)} returns
          ${pct(BEST).toFixed(1)}% and ${esc(WORST.name)} returns ${pct(WORST).toFixed(1)}%, a
          spread of ${(pct(BEST) - pct(WORST)).toFixed(1)} points between the best and worst
          performing line on the same network in the same year.</p>

        <h2>The threshold is the argument</h2>
        <p>Every line concentrates its late arrivals in a narrow band on either side of the
          window rather than spreading them evenly, which is what you would expect from a
          timetable written to be met rather than to be accurate. Move the boundary and you do
          not shave a little off each line; you reclassify a cluster.</p>

        <div class="pull">
          <p>A timetable written to be met is not the same document as a timetable written to be
            accurate, and only one of them can be audited.</p>
          <cite>From the method note</cite>
        </div>

        <p>${esc(WORST.name)} is the clearest case. It runs the fewest services of the four and
          carries ${WORST.halts} halts, and its margin is spent before the last two. The line
          does not fail at a point; it fails gradually and then reports the failure at the end.</p>

        ${chart}

        <h2>What the return does not say</h2>
        <p>The figures below are the filed return, unadjusted. They are what the regulator holds
          and what the operator stands behind, and they are the reason the spread above can be
          stated at all — a published threshold is at least a threshold anyone can move.</p>

        <figure class="figure">
          <div class="tblock">
            <div class="tscroll">
              <table>
                <thead><tr>
                  <th>Line</th><th class="n">Scheduled</th><th class="n">On time</th>
                  <th class="n">Halts</th><th class="n">Share</th>
                </tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
          <figcaption>Filed operator return, twelve months to September. Share is on-time
            arrivals over scheduled services, at the published
            <b>four-minute</b> window.</figcaption>
        </figure>
      </div>

      <aside class="margin">
        <div>
          <p class="marginlabel">Method</p>
          <div class="notes-l">${notes}</div>
        </div>
        <div>
          <p class="marginlabel">Further reading</p>
          <div class="further">${further}</div>
        </div>
      </aside>
    </div>

    <footer class="colophon">
      <span><b>The Sounding</b></span>
      <span>Issue 114</span>
      <span>Set in three families</span>
      <span>Printed and online</span>
    </footer>
  </div>
</div>`
}
