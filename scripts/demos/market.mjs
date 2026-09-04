// The `market` demo: a prediction-market trading terminal.
//
// The hardest kind of screen to fake, because a market is nothing but figures
// that have to agree. So:
//
//   - **Yes and No sum to 100¢**, always, because No is derived from Yes rather
//     than stored beside it.
//   - **The chart claims nothing about the quote.** It was captioned "last 84¢"
//     to match the series endpoint and the opening quote, which held until the
//     market rail became selectable: pick another market and the quote moves
//     while a build-time SVG cannot. A caption that disagrees with its own mark
//     is the bug this file is most careful about, so the caption now describes
//     the shape and the price lives in the header where it can change.
//   - **Cost, payout, profit and return all follow from size and price**, and
//     recompute together when either moves.
//   - **Every position's P&L is size × (now − entry)**, and the portfolio figure
//     is the sum of the rows beneath it.
//   - **The book's depth column is cumulative**, so the last row equals the sum
//     of the size column above it.
//
// A direction takes its colour from the declared state colours, so a system that
// declines them — Ration declines all three by rule — gets a monochrome book and
// unstated deltas rather than a borrowed hue.
//
// The payoff here is what a fill would win, so that is where the one accent goes,
// unless the system routes its accent through the button fill as well.
//
// Markets are invented operational propositions. Latin only.

import { esc, has, accentSpentOnButton, borderless, fixture, glassBar } from '../preview-shared.mjs'
import { lineChart } from '../preview-charts.mjs'

const FX = fixture('market')
const MARKETS = FX.markets
const BOOK = FX.book
const POSITIONS = FX.positions
const SIDES = FX.sides
const SIZES = FX.sizePresets

// ── derived ───────────────────────────────────────────────────────────────────
const ACTIVE = MARKETS.find(m => m.active) ?? MARKETS[0]
const no = m => 100 - m.yes
const money = c => '$' + (c / 100).toFixed(2)
const cents = (size, price) => size * price
const DEFAULT_SIZE = SIZES[1]
const COST = cents(DEFAULT_SIZE, ACTIVE.yes)
const PAYOUT = DEFAULT_SIZE * 100
const PROFIT = PAYOUT - COST
const pnl = p => p.size * (p.now - p.entry)
const BOOK_TOTAL = side => BOOK[side].reduce((n, [, sz]) => n + sz, 0)
const OPEN_PNL = POSITIONS.reduce((n, p) => n + pnl(p), 0)
const HOLDINGS = POSITIONS.reduce((n, p) => n + p.size * p.now, 0)

export function css(t, meta) {
  const enclose = borderless(t)
    ? 'background:var(--clp-surface)'
    : 'border:var(--_border);background:var(--clp-bg)'
  const dir = k => (has(t, `--clp-${k}`) ? `var(--clp-${k})` : 'var(--clp-text-2)')

  return `
/* ── market ───────────────────────────────────────────────────────────── */
.topbar{display:flex;align-items:center;gap:clamp(12px,2vw,22px);flex-wrap:wrap;
  padding:11px clamp(14px,2vw,22px);${glassBar(t)}}
.venue{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);font-size:15px;
  letter-spacing:-.01em;white-space:nowrap}
.quotebar{display:flex;align-items:baseline;gap:12px;margin-left:auto;flex:none}
.quotebar b{font:700 clamp(20px,2.4vw,26px)/1 var(--_data);letter-spacing:-.03em;
  font-variant-numeric:tabular-nums}
.quotebar .chg{font:600 12.5px/1.6 var(--_data)}
.up{color:${dir('success')}}
.down{color:${dir('alarm')}}
.quotebar span{font-size:11.5px;color:var(--clp-text-3)}

.floor{display:grid;grid-template-columns:268px minmax(0,1fr) 296px;flex:1 0 auto;
  align-items:start}
.rail{padding:clamp(12px,1.6vw,18px) 0 24px;display:flex;flex-direction:column;gap:2px;
  border-right:1px solid var(--clp-line)}
.raillabel{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3);padding:0 clamp(14px,2vw,20px) 8px}
.mkt{display:grid;grid-template-columns:1fr auto;gap:3px 10px;align-items:baseline;
  padding:10px clamp(14px,2vw,20px);border:0;background:none;cursor:pointer;text-align:left;
  color:var(--clp-text);font:inherit}
.mkt.on{background:var(--clp-line);font-weight:600}
.mkt:active{transform:var(--_press)}
.mkt q{quotes:none;font-size:13px;line-height:1.35;min-width:0}
.mkt .px{font:600 13px/1.3 var(--_data);font-variant-numeric:tabular-nums}
.mkt .vol{grid-column:1;font-size:11px;color:var(--clp-text-3);font-family:var(--_data)}

.mid{padding:clamp(12px,1.6vw,18px) clamp(14px,2vw,20px) 24px;display:flex;
  flex-direction:column;gap:var(--_gap);min-width:0}
.question{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);
  font-size:clamp(17px,2vw,22px);line-height:1.25;letter-spacing:-.015em;max-width:36ch}
.resolves{font-size:12px;color:var(--clp-text-3)}
.panel-h span.small{font-size:11.5px;color:var(--clp-text-3);margin-left:auto}

.book{display:grid;grid-template-columns:1fr 1fr;gap:var(--_gap)}
.bookside{display:flex;flex-direction:column;gap:5px;min-width:0}
.bookrow{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;
  font:500 12.5px/1.5 var(--_data);font-variant-numeric:tabular-nums}
.bookrow i{height:5px;border-radius:var(--clp-radius-control);background:var(--clp-line);
  display:block;min-width:2px}
.bookrow .px{min-width:34px}
.bookrow .dep{color:var(--clp-text-3);min-width:52px;text-align:right}
.bids .px{color:${dir('success')}}
.asks .px{color:${dir('alarm')}}

/* The ticket is the work, enclosed the way the table is. */
.ticket{${enclose};border-radius:var(--clp-radius-box);
  margin:clamp(12px,1.6vw,18px) clamp(14px,2vw,20px) 24px 0;
  display:flex;flex-direction:column;position:sticky;top:clamp(12px,1.6vw,18px)}
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

.ledger{grid-column:1/-1;border-top:1px solid var(--clp-line);
  padding:clamp(14px,2vw,20px) clamp(14px,2vw,22px) 36px;
  display:flex;flex-direction:column;gap:var(--_gap);min-width:0}
.figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--_gap)}
.fig{display:flex;flex-direction:column;gap:2px;min-width:0}
.fig b{font:700 clamp(19px,2.2vw,25px)/1.1 var(--_data);letter-spacing:-.03em;
  font-variant-numeric:tabular-nums}
.fig span{font:500 10px/1.5 var(--_data);letter-spacing:.08em;text-transform:uppercase;
  color:var(--clp-text-3)}

@media(max-width:1180px){
  .floor{grid-template-columns:minmax(0,1fr) 296px}
  .rail{grid-column:1/-1;border-right:0;border-bottom:1px solid var(--clp-line);
    flex-direction:row;flex-wrap:wrap;gap:0}
  .raillabel{width:100%}
  .ticket{margin-left:0}
}
@media(max-width:820px){
  .floor{grid-template-columns:minmax(0,1fr)}
  .ticket{position:static;margin:0 clamp(14px,2vw,20px) 24px}
  .book{grid-template-columns:minmax(0,1fr)}
  .figs{grid-template-columns:minmax(0,1fr)}
}
`
}

export function body(t, meta) {
  const series = [1, 2, 3, 4, 5].filter(n => has(t, `--clp-chart-${n}`))
  const sign = n => (n >= 0 ? '+' : '−')
  const abs = n => Math.abs(n)

  const markets = MARKETS.map(m => `<button class="mkt${m === ACTIVE ? ' on' : ''}"
      data-mkt="${esc(m.id)}" data-yes="${m.yes}"${m === ACTIVE ? ' aria-current="true"' : ''}>
      <q>${esc(m.q)}</q>
      <span class="px">${m.yes}&cent;</span>
      <span class="vol">${(m.vol / 1000).toFixed(1)}k volume</span>
    </button>`).join('')

  // Depth is cumulative, so the last row is the sum of the size column above it.
  const side = (which, cls) => {
    let run = 0
    const max = BOOK_TOTAL(which)
    return BOOK[which].map(([px, sz]) => {
      run += sz
      return `<div class="bookrow">
        <span class="px">${px}&cent;</span>
        <i style="width:${((run / max) * 100).toFixed(1)}%"></i>
        <span class="dep">${run.toLocaleString('en-GB')}</span>
      </div>`
    }).join('')
  }

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
        sign(g)}${money(abs(g))}</td>
    </tr>`
  }).join('')

  const chart = series.length
    ? `<div class="panel">
        <div class="panel-h"><h3>Price history</h3>
          <span class="small">Jan &ndash; Oct &middot; daily mid</span></div>
        ${lineChart(series[0], { area: true })}
      </div>`
    : ''

  const figures = [
    [money(HOLDINGS), 'holdings at market'],
    [sign(OPEN_PNL) + money(abs(OPEN_PNL)), 'open profit and loss'],
    [String(POSITIONS.length), 'markets held'],
  ].map(([v, l]) => `<div class="fig"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')

  return `<div class="scr">
  <header class="topbar">
    <div class="venue">Northsel Markets</div>
    <div class="quotebar">
      <b id="quote">${ACTIVE.yes}&cent;</b>
      <span class="chg ${ACTIVE.chg >= 0 ? 'up' : 'down'}">${sign(ACTIVE.chg)}${abs(ACTIVE.chg)}&cent;</span>
      <span>${(ACTIVE.vol / 1000).toFixed(1)}k volume</span>
      <span>Resolves ${esc(FX.resolution)}</span>
    </div>
  </header>

  <div class="floor">
    <aside class="rail" data-group="mkt">
      <p class="raillabel">Markets</p>
      ${markets}
    </aside>

    <section class="mid">
      <div>
        <p class="question" id="question">${esc(ACTIVE.q)}</p>
        <p class="resolves">Resolves ${esc(FX.resolution)} &middot; settles at 100&cent; or
          0&cent;</p>
      </div>
      ${chart}
      <div class="panel">
        <div class="panel-h"><h3>Order book</h3>
          <span class="small">Depth cumulative</span></div>
        <div class="book">
          <div class="bookside bids">
            <p class="raillabel" style="padding:0">Bids</p>${side('bids')}
          </div>
          <div class="bookside asks">
            <p class="raillabel" style="padding:0">Asks</p>${side('asks')}
          </div>
        </div>
      </div>
    </section>

    <section class="ticket">
      <div class="ticket-h">Place an order</div>
      <div class="sides" data-group="side">${SIDES.map((x, i) =>
        `<button class="${i === 0 ? 'on' : ''}" data-side="${esc(x.key)}"${
          i === 0 ? ' aria-current="true"' : ''}>${esc(x.label)} <span data-sidepx>${
          i === 0 ? ACTIVE.yes : no(ACTIVE)}&cent;</span></button>`).join('')}</div>
      <div class="field-l">
        <label>Shares</label>
        <div class="sizes" data-group="size">${SIZES.map((n, i) =>
          `<button class="${n === DEFAULT_SIZE ? 'on' : ''}" data-size="${n}"${
            n === DEFAULT_SIZE ? ' aria-current="true"' : ''}>${n}</button>`).join('')}</div>
      </div>
      <div class="calc">
        <p class="crow">Price <span id="price">${ACTIVE.yes}&cent;</span></p>
        <p class="crow">Cost <span id="cost">${money(COST)}</span></p>
        <p class="crow">Payout if correct <span id="payout">${money(PAYOUT)}</span></p>
        <p class="crow win"><b>To win</b> <span id="win">${money(PROFIT)}</span></p>
      </div>
      <div class="place">
        <button class="btn" id="place">Buy ${esc(SIDES[0].label)} &middot; ${money(COST)}</button>
      </div>
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

/**
 * Side, size and market all feed the same four figures, so they are computed in
 * one place from whatever is currently selected. No is 100 minus Yes, never a
 * second stored number.
 */
export function script(t, meta) {
  return `
  const money = c => '$' + (c / 100).toFixed(2)
  const state = { yes: ${ACTIVE.yes}, side: '${SIDES[0].key}', size: ${DEFAULT_SIZE},
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
    // Both side buttons show what that side costs right now.
    const px = document.querySelectorAll('[data-side] [data-sidepx]')
    if (px[0]) px[0].textContent = state.yes + '\\u00a2'
    if (px[1]) px[1].textContent = (100 - state.yes) + '\\u00a2'
  }

  addEventListener('demo:select', e => {
    const { name, hit } = e.detail
    if (name === 'side') { state.side = hit.dataset.side; state.label = hit.textContent.trim().split(' ')[0] }
    if (name === 'size') state.size = Number(hit.dataset.size) || state.size
    if (name === 'mkt') {
      state.yes = Number(hit.dataset.yes) || state.yes
      const q = hit.querySelector('q')
      const target = document.getElementById('question')
      if (q && target) target.textContent = q.textContent
      const quote = document.getElementById('quote')
      if (quote) quote.textContent = state.yes + '\\u00a2'
    }
    if (name === 'side' || name === 'size' || name === 'mkt') recompute()
  })
`
}
