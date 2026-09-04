// The `pos` demo: a point-of-sale till.
//
// Lozenge's `best-for` names "retail and POS interfaces" outright, and its rules
// shape this page more than any other system's would:
//
//   - **No border anywhere.** "Separation comes from surface steps... if you
//     reach for a border, you have missed a surface step." So the product grid
//     and the ticket take the same enclosure ladder the table already uses: an
//     edge where the system draws one, a surface step where it does not.
//   - **No shadow, including subtle ones.**
//   - **At most three summary figures.**
//   - **No monospace family**, so figures wear the body family and are aligned
//     by `tabular-nums` rather than by a third typeface.
//   - **Citron on one element per screen.** Lozenge aliases its accent and its
//     button fill to the same token, so the Charge button spends it and the
//     amount due takes none. Where a system keeps them apart, the amount due is
//     the payoff and takes the accent.
//
// **Money is held in cents and every total is computed.** A till whose subtotal
// does not equal its lines is not a rounding error, it is a different product.
// The quantity steppers recompute the whole ticket at runtime for the same
// reason the build derives it: a figure that is typed goes stale the moment
// anything moves.
//
// Product names, prices and the tax rate are invented. Latin only.

import { esc, has, accentSpentOnButton, borderless } from '../preview-shared.mjs'

const TAX_BP = 825                       // basis points, so 8.25% is exact in integers
const CATEGORIES = ['All', 'Coffee', 'Bakery', 'Retail']

const PRODUCTS = [
  { name: 'Filter, 12oz',    cents: 320, cat: 'Coffee' },
  { name: 'Flat white',      cents: 395, cat: 'Coffee' },
  { name: 'Cold brew',       cents: 450, cat: 'Coffee' },
  { name: 'Cortado',         cents: 350, cat: 'Coffee' },
  { name: 'Almond croissant', cents: 480, cat: 'Bakery' },
  { name: 'Sourdough slice', cents: 260, cat: 'Bakery' },
  { name: 'Banana bread',    cents: 340, cat: 'Bakery' },
  { name: 'Beans, 250g',     cents: 1450, cat: 'Retail' },
  { name: 'Enamel mug',      cents: 1800, cat: 'Retail' },
]

const TICKET = [
  { name: 'Flat white',       cents: 395,  qty: 2 },
  { name: 'Almond croissant', cents: 480,  qty: 1 },
  { name: 'Beans, 250g',      cents: 1450, qty: 1 },
  { name: 'Filter, 12oz',     cents: 320,  qty: 3 },
]

const TENDERS = [{ key: 'card', label: 'Card' }, { key: 'cash', label: 'Cash' }]

// ── derived, in integers ──────────────────────────────────────────────────────
const money = cents => '$' + (cents / 100).toFixed(2)
const SUBTOTAL = TICKET.reduce((n, l) => n + l.cents * l.qty, 0)
const TAX = Math.round((SUBTOTAL * TAX_BP) / 10000)
const TOTAL = SUBTOTAL + TAX
const ITEMS = TICKET.reduce((n, l) => n + l.qty, 0)

export function css(t, meta) {
  // The same ladder the table uses: an edge where the system draws one, a
  // surface step where it does not. A product tile and a ticket are the work
  // itself rather than a summary card, which is why they are enclosed at all.
  const enclose = borderless(t)
    ? 'background:var(--clp-surface)'
    : 'border:var(--_border);background:var(--clp-bg)'

  return `
/* ── pos ──────────────────────────────────────────────────────────────── */
.tillbar{display:flex;align-items:center;gap:var(--_gap);flex-wrap:wrap;flex:none;
  padding:11px clamp(14px,2vw,22px);border-bottom:1px solid var(--clp-line)}
.till{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);font-size:15px;
  letter-spacing:-.01em;white-space:nowrap}
.tillmeta{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--clp-text-3)}
.tillmeta b{color:var(--clp-text-2);font-weight:600;font-family:var(--_data)}
.tillbar-end{margin-left:auto;display:flex;align-items:center;gap:9px;flex:none}

.floor{display:grid;grid-template-columns:minmax(0,1fr) 340px;flex:1 0 auto;
  align-items:start;min-height:0}
.catalogue{padding:clamp(14px,2vw,20px) clamp(14px,2vw,22px) 32px;
  display:flex;flex-direction:column;gap:var(--_gap);min-width:0}
.cats{display:flex;gap:7px;flex-wrap:wrap}
.cat{border:0;background:var(--clp-line);color:var(--clp-text-2);cursor:pointer;
  border-radius:var(--clp-radius-control);padding:7px 14px;
  font:500 13px/1.4 var(--clp-font-body)}
.cat.on{background:var(--clp-text);color:var(--clp-bg);font-weight:600}
.cat:active{transform:var(--_press)}

.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(146px,1fr));gap:var(--_gap)}
.prod{${enclose};border-radius:var(--clp-radius-box);padding:14px;cursor:pointer;
  display:flex;flex-direction:column;gap:6px;align-items:flex-start;text-align:left;
  min-width:0;color:var(--clp-text);font:inherit}
.prod:active{transform:var(--_press)}
.prod b{font-weight:600;font-size:13.5px;line-height:1.3}
.prod span{font-family:var(--_data);font-variant-numeric:tabular-nums;font-size:13px;
  color:var(--clp-text-2)}

/* The ticket is the work, so it is enclosed the way the table is. */
.ticket{${enclose};border-radius:var(--clp-radius-box);margin:clamp(14px,2vw,20px)
  clamp(14px,2vw,22px) 32px clamp(14px,2vw,4px);
  display:flex;flex-direction:column;position:sticky;top:clamp(14px,2vw,20px)}
.ticket-h{display:flex;align-items:baseline;gap:9px;padding:14px 16px;
  border-bottom:1px solid var(--clp-line)}
.ticket-h b{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);font-size:14px}
.ticket-h span{margin-left:auto;font-size:11.5px;color:var(--clp-text-3)}
.lines{display:flex;flex-direction:column;padding:4px 0}
.line{display:grid;grid-template-columns:1fr auto auto;gap:2px 10px;align-items:center;
  padding:10px 16px}
.line + .line{border-top:1px solid var(--clp-line)}
.line b{font-weight:500;font-size:13.5px;min-width:0}
.line .unit{grid-column:1;font-size:11.5px;color:var(--clp-text-3);
  font-family:var(--_data);font-variant-numeric:tabular-nums}
.line .amt{font-family:var(--_data);font-variant-numeric:tabular-nums;font-size:13.5px;
  font-weight:600;text-align:right;min-width:64px}
.step{display:flex;align-items:center;gap:2px;background:var(--clp-line);
  border-radius:var(--clp-radius-control);padding:2px}
.step button{border:0;background:none;cursor:pointer;width:22px;height:22px;
  border-radius:var(--clp-radius-control);color:var(--clp-text-2);
  font:600 14px/1 var(--clp-font-body)}
.step button:active{transform:var(--_press)}
.step .qty{min-width:20px;text-align:center;font:600 12.5px/1 var(--_data);
  font-variant-numeric:tabular-nums;color:var(--clp-text)}

.totals{display:flex;flex-direction:column;gap:7px;padding:14px 16px;
  border-top:1px solid var(--clp-line)}
.trow{display:flex;align-items:baseline;gap:10px;font-size:13px;color:var(--clp-text-2)}
.trow span{margin-left:auto;font-family:var(--_data);font-variant-numeric:tabular-nums}
.trow.due{padding-top:8px;border-top:1px solid var(--clp-line);color:var(--clp-text);
  font-size:15px;align-items:center}
.trow.due b{font-weight:600}
/* The amount due is the payoff. It takes the accent only where the Charge button
   has not already spent it — see accentSpentOnButton. */
.trow.due span{font-size:clamp(21px,2.4vw,26px);font-weight:700;letter-spacing:-.02em${
  accentSpentOnButton(t) ? '' : ';color:var(--clp-accent)'}}

.tender{display:flex;gap:2px;padding:2px;background:var(--clp-line);
  border-radius:var(--clp-radius-control);margin:0 16px}
.tender button{flex:1;border:0;background:none;cursor:pointer;padding:8px 12px;
  border-radius:var(--clp-radius-control);font:500 13px/1.4 var(--clp-font-body);
  color:var(--clp-text-2)}
.tender button.on{background:var(--clp-bg);color:var(--clp-text);font-weight:600}
.tender button:active{transform:var(--_press)}
.charge{margin:12px 16px 16px}
.charge .btn{width:100%;padding:14px 18px;font-size:14.5px}

@media(max-width:1000px){
  .floor{grid-template-columns:minmax(0,1fr)}
  .ticket{position:static;margin:0 clamp(14px,2vw,22px) 32px}
}
@media(max-width:560px){
  .grid{grid-template-columns:repeat(auto-fill,minmax(128px,1fr))}
  .tillmeta{width:100%}
}
`
}

export function body(t, meta) {
  const cats = CATEGORIES.map((c, i) =>
    `<button class="cat${i === 0 ? ' on' : ''}" data-cat="${esc(c)}"${
      i === 0 ? ' aria-current="true"' : ''}>${esc(c)}</button>`).join('')

  const products = PRODUCTS.map(p => `<button class="prod" data-pcat="${esc(p.cat)}">
      <b>${esc(p.name)}</b><span>${money(p.cents)}</span>
    </button>`).join('')

  const lines = TICKET.map((l, i) => `<div class="line" data-line="${i}" data-cents="${l.cents}">
      <b>${esc(l.name)}</b>
      <div class="step" data-group="qty" data-line="${i}">
        <button data-step="-1" aria-label="One fewer ${esc(l.name)}">&minus;</button>
        <span class="qty" data-qty>${l.qty}</span>
        <button data-step="1" aria-label="One more ${esc(l.name)}">+</button>
      </div>
      <span class="amt" data-amt>${money(l.cents * l.qty)}</span>
      <span class="unit">${money(l.cents)} each</span>
    </div>`).join('')

  return `<div class="scr">
  <header class="tillbar">
    <div class="till">Northsel &middot; Till 2</div>
    <div class="tillmeta">
      <span>Cashier <b>RM</b></span>
      <span>Shift <b>14:00</b></span>
      <span>Tickets <b>38</b></span>
    </div>
    <div class="tillbar-end">
      ${has(t, '--clp-button2-bg') ? '<button class="btn b2">Hold</button>' : ''}
      <button class="btn b3">No sale</button>
    </div>
  </header>

  <div class="floor">
    <section class="catalogue">
      <div class="cats" data-group="cat">${cats}</div>
      <div class="grid">${products}</div>
    </section>

    <section class="ticket">
      <div class="ticket-h">
        <b>Ticket 1184</b>
        <span id="itemcount">${ITEMS} items</span>
      </div>
      <div class="lines">${lines}</div>
      <div class="totals">
        <p class="trow">Subtotal <span id="subtotal">${money(SUBTOTAL)}</span></p>
        <p class="trow">Tax, ${(TAX_BP / 100).toFixed(2)}% <span id="tax">${money(TAX)}</span></p>
        <p class="trow due"><b>Amount due</b> <span id="total">${money(TOTAL)}</span></p>
      </div>
      <div class="tender" data-group="tender">${TENDERS.map((x, i) =>
        `<button class="${i === 0 ? 'on' : ''}" data-tender="${esc(x.key)}"${
          i === 0 ? ' aria-current="true"' : ''}>${esc(x.label)}</button>`).join('')}</div>
      <div class="charge">
        <button class="btn" id="charge">Charge ${money(TOTAL)}</button>
      </div>
    </section>
  </div>
</div>`
}

/**
 * Every figure on the ticket recomputes from the lines. Money stays in integer
 * cents throughout, so a subtotal is the sum of what is on screen rather than
 * something close to it.
 */
export function script(t, meta) {
  return `
  const TAX_BP = ${TAX_BP}
  const money = c => '$' + (c / 100).toFixed(2)

  function recompute() {
    let subtotal = 0, items = 0
    for (const line of document.querySelectorAll('.line[data-cents]')) {
      const cents = Number(line.dataset.cents) || 0
      const qty = Number(line.querySelector('[data-qty]').textContent) || 0
      subtotal += cents * qty
      items += qty
      line.querySelector('[data-amt]').textContent = money(cents * qty)
      line.hidden = qty === 0
    }
    const tax = Math.round((subtotal * TAX_BP) / 10000)
    const total = subtotal + tax
    const set = (id, text) => {
      const el = document.getElementById(id)
      if (el) el.textContent = text
    }
    set('subtotal', money(subtotal))
    set('tax', money(tax))
    set('total', money(total))
    set('itemcount', items + (items === 1 ? ' item' : ' items'))
    const charge = document.getElementById('charge')
    if (charge) charge.textContent = charge.dataset.verb + ' ' + money(total)
  }

  const charge = document.getElementById('charge')
  if (charge) charge.dataset.verb = 'Charge'

  // The steppers are not a two-state group, so they are wired directly rather
  // than through the frame's active-state handler.
  for (const step of document.querySelectorAll('.step[data-line]')) {
    step.addEventListener('click', e => {
      const hit = e.target.closest('button[data-step]')
      if (!hit) return
      const out = step.querySelector('[data-qty]')
      const next = Math.max(0, (Number(out.textContent) || 0) + Number(hit.dataset.step))
      out.textContent = next
      recompute()
    })
  }

  addEventListener('demo:select', e => {
    if (e.detail.name === 'cat') {
      const want = e.detail.hit.dataset.cat
      for (const p of document.querySelectorAll('.prod[data-pcat]')) {
        p.hidden = want !== 'All' && p.dataset.pcat !== want
      }
    }
    if (e.detail.name === 'tender') {
      const charge = document.getElementById('charge')
      if (charge) {
        charge.dataset.verb = e.detail.hit.dataset.tender === 'cash' ? 'Tender' : 'Charge'
        recompute()
      }
    }
  })
`
}
