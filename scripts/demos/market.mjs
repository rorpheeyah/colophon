// The `market` demo: a prediction-market venue — a browse page over many
// markets, with the featured one traded in place.
//
// Informed by looking at a public prediction market and taking the structure
// rather than the execution, which is the discipline `pirate-design-system`
// sets out. What is taken is compositional and belongs to nobody: a featured
// market carrying a chart above a dense grid of market cards; a card that is a
// question followed by outcome rows, each row a label, a percentage and a
// paired Yes/No control; a ranked side rail of what is busy, with volume; a
// category strip over the grid. What is not taken: any palette, any typeface,
// any wordmark, and every market question — theirs name real people and real
// events, and these are invented propositions about an invented rail network.
//
// The hardest kind of screen to fake, because every number is a function of
// another one:
//
//   - **Yes and No sum to 100¢**, because No is derived rather than stored.
//   - Cost, payout, profit and the button label follow from size and price.
//   - Each position's P&L is size × (now − entry), and the portfolio figure is
//     the sum of the rows beneath it.
//   - The book's depth column is cumulative, so its last row is the sum of the
//     size column above it.
//   - The venue's volume figure is the sum of every market on the page.
//
// **A paired Yes/No control is not a primary button.** A grid of twelve cards
// carries twenty-four of them, and `--clp-button-bg` is Lozenge's citron, which
// it caps at one element per screen. So a pair takes its colour from its
// direction the way a delta does — the declared state colour on its wash where
// there is one, and neutral where the system declines state colour, which Ration
// does by rule. The one accent stays on the payoff in the ticket.
//
// Latin only.

import { esc, has, accentSpentOnButton, borderless, fixture, glassBar } from '../preview-shared.mjs'
import { lineChart } from '../preview-charts.mjs'

const FX = fixture('market')
const FEATURED = FX.featured
const HOT = FX.hot
const GRID = FX.grid
const BOOK = FX.book
const POSITIONS = FX.positions
const SIDES = FX.sides
const SIZES = FX.sizePresets
const CATEGORIES = FX.categories

// ── derived ───────────────────────────────────────────────────────────────────
const money = c => '$' + (c / 100).toFixed(2)
const vol = n => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n))
const NO = 100 - FEATURED.yes
const DEFAULT_SIZE = SIZES[1]
const COST = DEFAULT_SIZE * FEATURED.yes
const PAYOUT = DEFAULT_SIZE * 100
const PROFIT = PAYOUT - COST
const pnl = p => p.size * (p.now - p.entry)
const depthTotal = side => BOOK[side].reduce((n, [, sz]) => n + sz, 0)
const OPEN_PNL = POSITIONS.reduce((n, p) => n + pnl(p), 0)
const HOLDINGS = POSITIONS.reduce((n, p) => n + p.size * p.now, 0)
const GRID_VOL = GRID.reduce((n, m) => n + m.vol, 0)

export function css(t, meta) {
  const enclose = borderless(t)
    ? 'background:var(--clp-surface)'
    : 'border:var(--_border);background:var(--clp-bg)'
  const dir = k => (has(t, `--clp-${k}`) ? `var(--clp-${k})` : 'var(--clp-text-2)')
  // A paired control takes direction colour only if the system declares *both*
  // directions. Lozenge declares alarm and declines success, and colouring one
  // half of a pair makes No look like a warning and Yes like nothing — a
  // judgment the file never made. Both halves or neither.
  const paired = has(t, '--clp-success') && has(t, '--clp-alarm')
  const pair = k => paired
    ? `color:var(--clp-${k});background:${has(t, `--clp-${k}-wash`)
        ? `var(--clp-${k}-wash)` : 'transparent'};border:1px solid var(--clp-${k})`
    : 'color:var(--clp-text-2);background:var(--clp-line);border:1px solid transparent'

  return `
/* ── market ───────────────────────────────────────────────────────────── */
.topbar{display:flex;align-items:center;gap:clamp(10px,1.6vw,18px);flex-wrap:wrap;
  padding:11px clamp(14px,2vw,26px);${glassBar(t)}}
.venue{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);font-size:15px;
  letter-spacing:-.01em;white-space:nowrap}
.search{flex:1;max-width:380px;border:var(--_border);border-radius:var(--clp-radius-control);
  padding:8px 13px;background:var(--clp-surface);color:var(--clp-text-3);font-size:12.5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.topbar-end{margin-left:auto;display:flex;align-items:center;gap:9px;flex:none}

.wrap{width:100%;max-width:1240px;margin-inline:auto;padding:0 clamp(14px,2vw,26px);
  display:flex;flex-direction:column;gap:calc(var(--_gap) * 1.5)}
.wrap > section{min-width:0}

/* featured market beside what is busy */
.top{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:var(--_gap);
  padding-top:clamp(14px,2vw,22px)}
.feature{${enclose};border-radius:var(--clp-radius-box);padding:var(--_pad);
  display:flex;flex-direction:column;gap:var(--_gap);min-width:0}
.feat-h{display:flex;align-items:flex-start;gap:var(--_gap);flex-wrap:wrap}
.feat-h > div{display:flex;flex-direction:column;gap:5px;min-width:0}
.crumb{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3)}
.feat-h h2{font-size:clamp(17px,2vw,23px);line-height:1.22;letter-spacing:-.015em;max-width:30ch}
.bigquote{margin-left:auto;text-align:right;flex:none}
.bigquote b{display:block;font:700 clamp(26px,3.2vw,36px)/1 var(--_data);letter-spacing:-.03em;
  font-variant-numeric:tabular-nums}
.bigquote span{font:600 12px/1.6 var(--_data)}
.up{color:${dir('success')}}
.down{color:${dir('alarm')}}
.feat-meta{display:flex;gap:15px;flex-wrap:wrap;font-size:12px;color:var(--clp-text-3)}

/* an outcome row: label, percentage, paired control */
.ocs{display:flex;flex-direction:column}
.oc{display:grid;grid-template-columns:1fr auto auto auto;gap:9px;align-items:center;
  padding:9px 0}
.ocs.bare .oc{grid-template-columns:1fr auto}
.oc + .oc{border-top:1px solid var(--clp-line)}
.oc b{font-weight:500;font-size:13.5px;min-width:0}
.oc .pct{font:700 13.5px/1.3 var(--_data);font-variant-numeric:tabular-nums;min-width:38px;
  text-align:right}
.yes,.no{border-radius:var(--clp-radius-control);padding:5px 13px;cursor:pointer;
  font:600 12px/1.5 var(--clp-font-body);min-width:52px}
.yes{${pair('success')}}
.no{${pair('alarm')}}
.yes:active,.no:active{transform:var(--_press)}

.hot{${enclose};border-radius:var(--clp-radius-box);padding:var(--_pad);
  display:flex;flex-direction:column;gap:9px;min-width:0}
.hot h3{font-size:14px}
.hotrow{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:baseline;
  font-size:13px}
.hotrow i{font-style:normal;font:600 11px/1.5 var(--_data);color:var(--clp-text-3);
  min-width:12px}
.hotrow b{font-weight:500;min-width:0}
.hotrow span{font:600 11.5px/1.5 var(--_data);font-variant-numeric:tabular-nums;
  color:var(--clp-text-2);white-space:nowrap}
.hotrow em{font-style:normal;margin-left:5px}

/* the terminal half: book and ticket for the featured market */
.desk{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:var(--_gap)}
.book{display:grid;grid-template-columns:1fr 1fr;gap:var(--_gap)}
.bookside{display:flex;flex-direction:column;gap:5px;min-width:0}
.booklabel{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3)}
.bookrow{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;
  font:500 12.5px/1.5 var(--_data);font-variant-numeric:tabular-nums}
.bookrow i{height:5px;border-radius:var(--clp-radius-control);background:var(--clp-line);
  display:block;min-width:2px}
.bookrow .px{min-width:34px}
.bookrow .dep{color:var(--clp-text-3);min-width:52px;text-align:right}
.bids .px{color:${dir('success')}}
.asks .px{color:${dir('alarm')}}

.ticket{${enclose};border-radius:var(--clp-radius-box);display:flex;flex-direction:column;
  align-self:start}
.ticket-h{padding:13px 15px;border-bottom:1px solid var(--clp-line);
  font-family:var(--clp-font-display);font-weight:var(--_wdisplay);font-size:14px}
.sides{display:flex;gap:2px;padding:2px;background:var(--clp-line);
  border-radius:var(--clp-radius-control);margin:13px 15px 0}
.sides button{flex:1;border:0;background:none;cursor:pointer;padding:9px 12px;
  border-radius:var(--clp-radius-control);font:500 13px/1.4 var(--clp-font-body);
  color:var(--clp-text-2)}
.sides button.on{background:var(--clp-bg);color:var(--clp-text);font-weight:600}
.sides button:active{transform:var(--_press)}
.field-l{display:flex;flex-direction:column;gap:6px;padding:14px 15px 0}
.field-l label{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-2)}
.sizes{display:flex;gap:6px}
.sizes button{flex:1;border:1px solid var(--clp-line);background:none;cursor:pointer;
  border-radius:var(--clp-radius-control);padding:8px 6px;
  font:500 12.5px/1.4 var(--_data);font-variant-numeric:tabular-nums;color:var(--clp-text-2)}
.sizes button.on{background:var(--clp-text);border-color:var(--clp-text);color:var(--clp-bg);
  font-weight:600}
.sizes button:active{transform:var(--_press)}
.calc{display:flex;flex-direction:column;gap:7px;padding:15px;margin-top:13px;
  border-top:1px solid var(--clp-line)}
.crow{display:flex;align-items:baseline;gap:10px;font-size:12.5px;color:var(--clp-text-2)}
.crow span{margin-left:auto;font-family:var(--_data);font-variant-numeric:tabular-nums}
.crow.win{padding-top:8px;border-top:1px solid var(--clp-line);color:var(--clp-text);
  font-size:14px;align-items:center}
.crow.win b{font-weight:600}
/* What a fill would win is the payoff, so it takes the one accent — unless the
   Buy button has already spent it. */
.crow.win span{font-size:clamp(19px,2.2vw,23px);font-weight:700;letter-spacing:-.02em${
  accentSpentOnButton(t) ? '' : ';color:var(--clp-accent)'}}
.place{padding:0 15px 15px}
.place .btn{width:100%;padding:13px 18px;font-size:14px}

/* the browse half */
.browse-h{display:flex;align-items:baseline;gap:var(--_gap);flex-wrap:wrap}
.browse-h h2{font-size:clamp(17px,1.9vw,21px)}
.browse-h span{margin-left:auto;font-size:12px;color:var(--clp-text-3);font-family:var(--_data)}
.cats{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0 var(--_gap)}
.cat{border:0;background:var(--clp-line);color:var(--clp-text-2);cursor:pointer;
  border-radius:var(--clp-radius-control);padding:6px 13px;
  font:500 12.5px/1.4 var(--clp-font-body)}
.cat.on{background:var(--clp-text);color:var(--clp-bg);font-weight:600}
.cat:active{transform:var(--_press)}
.mkts{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:var(--_gap)}
.card{${enclose};border-radius:var(--clp-radius-box);padding:14px;display:flex;
  flex-direction:column;gap:9px;min-width:0}
.card h3{font-size:14px;line-height:1.32;min-height:2.6em}
.card .ocs .oc{padding:7px 0}
.card-f{display:flex;gap:12px;align-items:baseline;margin-top:auto;padding-top:4px;
  border-top:1px solid var(--clp-line);font-size:11.5px;color:var(--clp-text-3);
  font-family:var(--_data)}

.ledger{display:flex;flex-direction:column;gap:var(--_gap);padding-bottom:40px}
.figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--_gap)}
.fig{display:flex;flex-direction:column;gap:2px;min-width:0}
.fig b{font:700 clamp(19px,2.2vw,25px)/1.1 var(--_data);letter-spacing:-.03em;
  font-variant-numeric:tabular-nums}
.fig span{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3)}

@media(max-width:1080px){
  .top,.desk{grid-template-columns:minmax(0,1fr)}
}
@media(max-width:620px){
  .book,.figs{grid-template-columns:minmax(0,1fr)}
  .search{display:none}
  .oc{grid-template-columns:1fr auto auto auto}
}
`
}

const sign = n => (n >= 0 ? '+' : '−')
const absn = n => Math.abs(n)

/**
 * label · percentage · optional Yes/No pair. The pair is a control, not a status
 * pill. A binary market omits it: a row labelled "Yes" carrying its own Yes
 * button reads as a question about the answer, and the ticket beside it is where
 * that market is actually traded.
 */
function outcomes(list, { pair = true } = {}) {
  return `<div class="ocs${pair ? '' : ' bare'}">${list.map(o => `<div class="oc">
      <b>${esc(o.label)}</b>
      <span class="pct">${o.pct}%</span>
      ${pair ? '<button class="yes">Yes</button><button class="no">No</button>' : ''}
    </div>`).join('')}</div>`
}

export function body(t, meta) {
  const series = [1, 2, 3, 4, 5].filter(n => has(t, `--clp-chart-${n}`))

  // The volume is not going up or down; the price is. Colouring the volume by
  // the price's direction says something untrue, so the change carries its own
  // figure and the volume stays neutral.
  const hot = HOT.map((h, i) => `<div class="hotrow">
      <i>${i + 1}</i><b>${esc(h.name)}</b>
      <span>${vol(h.vol)} <em class="${h.chg >= 0 ? 'up' : 'down'}">${
        sign(h.chg)}${absn(h.chg)}&cent;</em></span>
    </div>`).join('')

  const side = which => {
    let run = 0
    const max = depthTotal(which)
    return BOOK[which].map(([px, sz]) => {
      run += sz
      return `<div class="bookrow">
        <span class="px">${px}&cent;</span>
        <i style="width:${((run / max) * 100).toFixed(1)}%"></i>
        <span class="dep">${run.toLocaleString('en-GB')}</span>
      </div>`
    }).join('')
  }

  const cards = GRID.map(m => `<article class="card" data-cat="${esc(m.cat)}" data-vol="${m.vol}">
      <h3>${esc(m.q)}</h3>
      ${outcomes(m.outcomes)}
      <div class="card-f"><span>${vol(m.vol)} volume</span><span>${esc(m.cat)}</span></div>
    </article>`).join('')

  const cats = CATEGORIES.map((c, i) =>
    `<button class="cat${i === 0 ? ' on' : ''}" data-cat="${esc(c)}"${
      i === 0 ? ' aria-current="true"' : ''}>${esc(c)}</button>`).join('')

  const rows = POSITIONS.map(p => {
    const g = pnl(p)
    const key = g >= 0 ? 'success' : 'alarm'
    const styled = has(t, `--clp-${key}`)
    return `<tr>
      <td>${esc(p.market)}</td>
      <td>${esc(p.side)}</td>
      <td class="n">${p.size}</td>
      <td class="n">${p.entry}&cent;</td>
      <td class="n">${p.now}&cent;</td>
      <td class="n"${styled ? ` style="color:var(--clp-${key})"` : ''}>${
        sign(g)}${money(absn(g))}</td>
    </tr>`
  }).join('')

  const figures = [
    [money(HOLDINGS), 'holdings at market'],
    [sign(OPEN_PNL) + money(absn(OPEN_PNL)), 'open profit and loss'],
    [String(POSITIONS.length), 'markets held'],
  ].map(([v, l]) => `<div class="fig"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')

  return `<div class="scr">
  <header class="topbar">
    <div class="venue">Northsel Markets</div>
    <div class="search">Search markets, outcomes and categories</div>
    <div class="topbar-end">
      ${has(t, '--clp-button2-bg') ? '<button class="btn b2">Portfolio</button>' : ''}
      <button class="btn b3">How it works</button>
    </div>
  </header>

  <div class="wrap">
    <section class="top">
      <div class="feature">
        <div class="feat-h">
          <div>
            <p class="crumb">${esc(FEATURED.cat)} &middot; Featured</p>
            <h2>${esc(FEATURED.q)}</h2>
          </div>
          <div class="bigquote">
            <b>${FEATURED.yes}&cent;</b>
            <span class="${FEATURED.chg >= 0 ? 'up' : 'down'}">${
              sign(FEATURED.chg)}${absn(FEATURED.chg)}&cent;</span>
          </div>
        </div>
        ${outcomes([{ label: 'Yes', pct: FEATURED.yes }, { label: 'No', pct: NO }],
          { pair: false })}
        ${series.length ? lineChart(series[0], { area: true }) : ''}
        <div class="feat-meta">
          <span>${esc(FEATURED.series)} &middot; daily mid</span>
          <span>${vol(FEATURED.vol)} volume</span>
          <span>Resolves ${esc(FX.resolution)}</span>
        </div>
      </div>

      <aside class="hot">
        <h3>Busiest today</h3>
        ${hot}
      </aside>
    </section>

    <section class="desk">
      <div class="panel">
        <div class="panel-h"><h3>Order book</h3></div>
        <div class="book">
          <div class="bookside bids">
            <p class="booklabel">Bids</p>${side('bids')}
          </div>
          <div class="bookside asks">
            <p class="booklabel">Asks</p>${side('asks')}
          </div>
        </div>
      </div>

      <div class="ticket">
        <div class="ticket-h">Place an order</div>
        <div class="sides" data-group="side">${SIDES.map((x, i) =>
          `<button class="${i === 0 ? 'on' : ''}" data-side="${esc(x.key)}"${
            i === 0 ? ' aria-current="true"' : ''}>${esc(x.label)} <span data-sidepx>${
            i === 0 ? FEATURED.yes : NO}&cent;</span></button>`).join('')}</div>
        <div class="field-l">
          <label>Shares</label>
          <div class="sizes" data-group="size">${SIZES.map(n =>
            `<button class="${n === DEFAULT_SIZE ? 'on' : ''}" data-size="${n}"${
              n === DEFAULT_SIZE ? ' aria-current="true"' : ''}>${n}</button>`).join('')}</div>
        </div>
        <div class="calc">
          <p class="crow">Price <span id="price">${FEATURED.yes}&cent;</span></p>
          <p class="crow">Cost <span id="cost">${money(COST)}</span></p>
          <p class="crow">Payout if correct <span id="payout">${money(PAYOUT)}</span></p>
          <p class="crow win"><b>To win</b> <span id="win">${money(PROFIT)}</span></p>
        </div>
        <div class="place">
          <button class="btn" id="place">Buy ${esc(SIDES[0].label)} &middot; ${money(COST)}</button>
        </div>
      </div>
    </section>

    <section>
      <div class="browse-h">
        <h2>All markets</h2>
        <span id="tally">${GRID.length} markets &middot; ${vol(GRID_VOL)} volume</span>
      </div>
      <div class="cats" data-group="cat">${cats}</div>
      <div class="mkts">${cards}</div>
    </section>

    <section class="ledger">
      <div class="figs">${figures}</div>
      <div class="tblock">
        <div class="tscroll">
          <table>
            <thead><tr>
              <th>Market</th><th>Side</th><th class="n">Shares</th><th class="n">Entry</th>
              <th class="n">Now</th><th class="n">P&amp;L</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</div>`
}

export function script(t, meta) {
  return `
  const money = c => '$' + (c / 100).toFixed(2)
  const vol = n => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n))
  const state = { yes: ${FEATURED.yes}, side: '${SIDES[0].key}', size: ${DEFAULT_SIZE},
                  label: ${JSON.stringify(SIDES[0].label)} }

  function recompute() {
    const price = state.side === 'yes' ? state.yes : 100 - state.yes
    const cost = state.size * price
    const payout = state.size * 100
    const set = (id, text) => {
      const el = document.getElementById(id)
      if (el) el.textContent = text
    }
    set('price', price + '\\u00a2')
    set('cost', money(cost))
    set('payout', money(payout))
    set('win', money(payout - cost))
    const place = document.getElementById('place')
    if (place) place.textContent = 'Buy ' + state.label + ' \\u00b7 ' + money(cost)
    const px = document.querySelectorAll('[data-side] [data-sidepx]')
    if (px[0]) px[0].textContent = state.yes + '\\u00a2'
    if (px[1]) px[1].textContent = (100 - state.yes) + '\\u00a2'
  }

  // Filtering the grid recomputes the tally from the cards still on screen, so
  // the count and the volume can never describe a grid that is not there.
  function applyCategory(want) {
    const cards = [...document.querySelectorAll('.card[data-cat]')]
    if (!cards.length) return
    let n = 0, sum = 0
    for (const c of cards) {
      const on = !want || want === 'All' || c.dataset.cat === want
      c.hidden = !on
      if (on) { n++; sum += Number(c.dataset.vol) || 0 }
    }
    const tally = document.getElementById('tally')
    if (tally) {
      tally.textContent = n + (n === 1 ? ' market \\u00b7 ' : ' markets \\u00b7 ') +
        vol(sum) + ' volume'
    }
  }

  addEventListener('demo:select', e => {
    const { name, hit } = e.detail
    if (name === 'side') {
      state.side = hit.dataset.side
      state.label = hit.textContent.trim().split(' ')[0]
      recompute()
    }
    if (name === 'size') { state.size = Number(hit.dataset.size) || state.size; recompute() }
    if (name === 'cat') applyCategory(hit.dataset.cat)
  })
`
}
