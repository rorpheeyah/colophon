// The `landing` demo: a product and pricing page.
//
// It is the demo with a payoff, so it is the one that spends the accent — on the
// hero's promise phrase and nowhere else. Where a system declares a gradient,
// that phrase is where it goes; Ration's rule is "never anywhere but the hero's
// promise phrase", and this page has exactly one.
//
// The strictest constraints in the library all land on a page like this, so:
//
//   - **One ground, no bands.** Ration forbids separating sections with
//     alternating backgrounds; rhythm does the work instead.
//   - **Pricing is a table, not a row of cards.** "Never feature a card by
//     enlarging, tinting or elevating it. A recommendation belongs in a table
//     row" — and at most one row is marked, because tinting two is forbidden.
//   - **The primary button is never the accent.** It is the invitation, not the
//     payoff, so it wears --clp-button-bg like every other button.
//   - **Uppercase only on the eyebrow.**
//   - Three summary figures, never four.
//
// **Every figure is computed from PLANS.** The hero's "from" price is the
// cheapest plan, the seat claim is the largest, the plan count is the length,
// and an annual price is ten months of a monthly one — which is what "two months
// free" means, rather than a second number to keep in step by hand.

import { esc, has, accentSpentOnButton, fixture, glassBar } from '../preview-shared.mjs'

const FX = fixture('landing')
const PLANS = FX.plans
const FEATURES = FX.features
const FAQ = FX.faq
const NAV = FX.nav
const BILLING = FX.billing

// ── derived, so nothing on the page can disagree with anything else ───────────
const FROM = Math.min(...PLANS.map(p => p.monthly))
const MAX_SEATS = Math.max(...PLANS.map(p => p.seats))
const MONTHS_FREE = FX.monthsFree
const annual = monthly => monthly * (12 - MONTHS_FREE)

export function css(t, meta) {
  return `
/* ── landing ──────────────────────────────────────────────────────────── */
.topbar{display:flex;align-items:center;gap:var(--_gap);padding:13px clamp(16px,4vw,40px);${glassBar(t)}}
.brand{font-family:var(--clp-font-display);font-weight:var(--_wdisplay);font-size:16px;
  letter-spacing:-.01em;white-space:nowrap}
.topnav{display:flex;gap:clamp(14px,2vw,26px);margin-left:clamp(12px,4vw,44px);flex-wrap:wrap}
.topnav a{font-size:13.5px;color:var(--clp-text-2);text-decoration:none;padding:4px 0}
.topnav a.on{color:var(--clp-text);font-weight:600}
.topbar-end{margin-left:auto;display:flex;align-items:center;gap:10px;flex:none}

/* One ground for the whole page. Sections are separated by rhythm, never by an
   alternating band — Ration forbids the band by name. */
.wrap{width:100%;max-width:1080px;margin-inline:auto;padding:0 clamp(16px,4vw,40px)}
.sec{padding:clamp(40px,7vw,84px) 0}
.sec + .sec{border-top:1px solid var(--clp-line)}
.sec-h{display:flex;flex-direction:column;gap:9px;margin-bottom:clamp(22px,3vw,34px);max-width:60ch}

.hero{padding:clamp(48px,9vw,104px) 0 clamp(36px,5vw,60px);
  display:flex;flex-direction:column;gap:clamp(16px,2vw,22px);align-items:flex-start}
.hero h1{font-size:clamp(34px,6.4vw,72px);line-height:1.04;letter-spacing:-.03em;max-width:20ch}
/* The one payoff colour on this page, on the one phrase the reader is here for.
   A declared gradient goes here and may go nowhere else.

   Where there is no gradient the flat accent stands in — **unless the system
   routes its accent through --clp-button-bg as well.** Lozenge aliases both to
   citron, so an accent phrase plus a citron button is citron twice, and its rule
   is one citron element per screen. Counting alias references read that as one;
   the reader sees two. Where the invitation has already spent the accent, the
   phrase takes none. */
.promise{font-style:normal;${has(t, '--clp-gradient')
  ? `background:var(--clp-gradient);-webkit-background-clip:text;background-clip:text;
  color:transparent`
  : accentSpentOnButton(t) ? 'color:var(--clp-text)' : 'color:var(--clp-accent)'}}
.hero .sub{font-size:clamp(15px,1.7vw,19px);max-width:52ch}
.hero-act{display:flex;gap:11px;flex-wrap:wrap;align-items:center;margin-top:4px}
.fine{font-size:12.5px;color:var(--clp-text-3)}

.feats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--_gap)}
.feat{display:flex;flex-direction:column;gap:7px;min-width:0}
.feat h3{font-size:16px}
.feat p{font-size:13.5px;color:var(--clp-text-2)}

.figs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--_gap)}
.fig{display:flex;flex-direction:column;gap:3px;min-width:0}
.fig b{font:var(--_wdisplay) clamp(30px,4.4vw,46px)/1.05 var(--_data);letter-spacing:-.03em;
  font-variant-numeric:tabular-nums}
.fig span{font-size:12.5px;color:var(--clp-text-3)}

.priceh{display:flex;align-items:flex-end;gap:var(--_gap);flex-wrap:wrap;
  margin-bottom:clamp(18px,2.5vw,26px)}
.billing{margin-left:auto;display:flex;gap:2px;padding:2px;background:var(--clp-line);
  border-radius:var(--clp-radius-control)}
.billing button{border:0;background:none;cursor:pointer;padding:6px 14px;
  border-radius:var(--clp-radius-control);font:500 12.5px/1.5 var(--clp-font-body);
  color:var(--clp-text-2)}
.billing button.on{background:var(--clp-bg);color:var(--clp-text);font-weight:600}
.billing button:active{transform:var(--_press)}
.amount{font-family:var(--_data);font-variant-numeric:tabular-nums;font-weight:600}
.per{font-size:11.5px;color:var(--clp-text-3)}
.pill{border:1px solid var(--clp-line);border-radius:var(--clp-radius-control);
  padding:2px 9px;font-size:11px;color:var(--clp-text-2);white-space:nowrap}
/* One recommended row, tinted only where the system fills things at all. Two
   tinted rows are forbidden and a card that is enlarged, tinted or elevated to
   feature it is forbidden too, so the recommendation lives in the table. */
${has(t, '--clp-card-fill') ? '.pick td{background:var(--clp-card-fill)}' : ''}
.pick td:first-child{font-weight:600}

.faq{display:flex;flex-direction:column;max-width:74ch}
.qa{border-bottom:1px solid var(--clp-line)}
.qa summary{cursor:pointer;padding:15px 0;font-size:15px;font-weight:600;list-style:none}
.qa summary::-webkit-details-marker{display:none}
.qa p{padding:0 0 16px;font-size:13.5px;color:var(--clp-text-2);max-width:62ch}

.foot{border-top:1px solid var(--clp-line);padding:26px 0 40px;display:flex;gap:18px;
  flex-wrap:wrap;font-size:12.5px;color:var(--clp-text-3)}
.foot b{color:var(--clp-text-2);font-weight:600}

@media(max-width:820px){
  .feats,.figs{grid-template-columns:minmax(0,1fr)}
}
@media(max-width:600px){
  .topnav{width:100%;margin-left:0;order:3}
  .billing{margin-left:0}
}
`
}

export function body(t, meta) {
  const features = FEATURES.map(([h, p]) => `<div class="feat">
      <h3>${esc(h)}</h3><p>${esc(p)}</p>
    </div>`).join('')

  const figures = [
    [`$${FROM}`, 'per month, smallest plan'],
    [String(MAX_SEATS), 'seats on the largest'],
    [String(PLANS.length), 'plans, no add-ons'],
  ].map(([v, l]) => `<div class="fig"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')

  const rows = PLANS.map(p => `<tr${p.pick ? ' class="pick"' : ''} data-monthly="${p.monthly}">
      <td>${esc(p.name)}${p.pick ? ' <span class="pill">Recommended</span>' : ''}</td>
      <td class="n">${p.seats}</td>
      <td>${esc(p.storage)}</td>
      <td>${esc(p.support)}</td>
      <td class="n"><span class="amount" data-amount>$${p.monthly}</span>
        <span class="per" data-per>/ month</span></td>
    </tr>`).join('')

  const faq = FAQ.map(([q, a]) => `<details class="qa">
      <summary>${esc(q)}</summary><p>${esc(a)}</p>
    </details>`).join('')

  return `<div class="scr">
  <header class="topbar">
    <div class="brand">Northsel</div>
    <nav class="topnav" data-group="nav">${NAV.map((n, i) =>
      `<a href="#"${i === 1 ? ' class="on" aria-current="page"' : ''}>${esc(n)}</a>`).join('')}</nav>
    <div class="topbar-end">
      <button class="btn b3">Sign in</button>
      <button class="btn b3">Start free</button>
    </div>
  </header>

  <div class="wrap">
    <section class="hero">
      <p class="eyebrow">Billing, for teams that close the month</p>
      <h1>Stop reconciling. <em class="promise">Start closing.</em></h1>
      <p class="sub">One ledger for invoices, expenses and payouts, with approval rules written
        in sentences instead of conditions.</p>
      <div class="hero-act">
        <button class="btn">Start free</button>
        <button class="btn b3">Book a walkthrough</button>
      </div>
      <p class="fine">Free for ${MONTHS_FREE} weeks. No card, no call, cancel from the
        dashboard.</p>
    </section>

    <section class="sec">
      <div class="sec-h">
        <h2>Three things it does properly</h2>
        <p class="sub">Not a feature list — the three decisions the rest of the product follows
          from.</p>
      </div>
      <div class="feats">${features}</div>
    </section>

    <section class="sec">
      <div class="figs">${figures}</div>
    </section>

    <section class="sec">
      <div class="priceh">
        <div class="sec-h" style="margin-bottom:0">
          <h2>Pricing</h2>
          <p class="sub">Every plan includes every feature. The difference is scale.</p>
        </div>
        <div class="billing" data-group="billing">${BILLING.map((b, i) =>
          `<button class="${i === 0 ? 'on' : ''}" data-billing="${esc(b.key)}"${
            i === 0 ? ' aria-current="true"' : ''}>${esc(b.label)}</button>`).join('')}</div>
      </div>
      <div class="tblock">
        <div class="tscroll">
          <table>
            <thead><tr>
              <th>Plan</th><th class="n">Seats</th><th>Storage</th><th>Support</th>
              <th class="n">Price</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="tfoot">
          <span id="billnote">Billed monthly. Switch to annual for
            ${MONTHS_FREE} months free.</span>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><h2>Questions people actually ask</h2></div>
      <div class="faq">${faq}</div>
    </section>

    <footer class="foot">
      <span><b>Northsel</b></span>
      <span>From $${FROM} / month</span>
      <span>${PLANS.length} plans</span>
      <span>Up to ${MAX_SEATS} seats</span>
    </footer>
  </div>
</div>`
}

/** Billing switches the figure, and the note under the table switches with it. */
export function script(t, meta) {
  return `
  const MONTHS_FREE = ${MONTHS_FREE}
  function applyBilling(key) {
    const annual = key === 'annual'
    for (const row of document.querySelectorAll('tbody tr[data-monthly]')) {
      const m = Number(row.dataset.monthly) || 0
      const amount = row.querySelector('[data-amount]')
      const per = row.querySelector('[data-per]')
      if (amount) amount.textContent = '$' + (annual ? m * (12 - MONTHS_FREE) : m)
      if (per) per.textContent = annual ? '/ year' : '/ month'
    }
    const note = document.getElementById('billnote')
    if (note) {
      note.textContent = annual
        ? 'Billed annually — ' + MONTHS_FREE + ' months free against the monthly price.'
        : 'Billed monthly. Switch to annual for ' + MONTHS_FREE + ' months free.'
    }
  }

  addEventListener('demo:select', e => {
    if (e.detail.name === 'billing') applyBilling(e.detail.hit.dataset.billing)
  })
`
}
