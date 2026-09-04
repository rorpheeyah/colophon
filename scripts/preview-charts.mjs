// SVG chart marks for the preview template.
//
// Every fill is a `--clp-chart-N` the system declared, taken in that fixed order
// and never cycled — a system that declares three series gets three, not a
// generated fourth. All text wears `--clp-text-*`, never a series colour, so
// identity is carried by the mark beside the label rather than by the label.
// Grid and axis lines are `--clp-line` and stay recessive.
//
// Nothing here invents a colour. A chart that needs more series than the
// system declared is not drawn at all.

const SERIES = 'var(--clp-chart-%N)'
const c = n => SERIES.replace('%N', n)

/** Sample data, fixed so a preview is byte-identical between builds. */
export const WEEK = [42, 58, 35, 71, 49, 66, 88]
export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
export const TREND = [22, 31, 27, 44, 39, 58, 52, 71, 65, 84]
export const SPLIT = [38, 26, 18, 12, 6]

// A bar anchored to the baseline with only its data-end rounded.
function bar(x, y, w, h, r = 3) {
  const rr = Math.min(r, h)
  return `M${x} ${y + h} V${y + rr} a${rr} ${rr} 0 0 1 ${rr} ${-rr} h${w - rr * 2} ` +
         `a${rr} ${rr} 0 0 1 ${rr} ${rr} V${y + h} Z`
}

const axisText = (x, y, s, anchor = 'middle') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" class="ax">${s}</text>`

/** Magnitude over a short ordered span. Labels name values the chart reaches. */
export function barChart(n = 1) {
  const max = Math.max(...WEEK)
  const W = 320, H = 150, top = 10, base = 116, gap = 8
  const bw = (W - gap * (WEEK.length - 1)) / WEEK.length
  const bars = WEEK.map((v, i) => {
    const h = Math.round((v / max) * (base - top))
    return `<path d="${bar(i * (bw + gap), base - h, bw, h)}" fill="${c(n)}"
      data-tip="${DAYS[i]} \u00b7 ${v}"/>`
  }).join('')
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Sessions by day">
    <line x1="0" y1="${base}" x2="${W}" y2="${base}" class="gridline"/>
    <line x1="0" y1="${top}" x2="${W}" y2="${top}" class="gridline"/>
    ${bars}
    ${axisText(0, top - 2, String(max), 'start')}
    ${DAYS.map((d, i) => axisText(i * (bw + gap) + bw / 2, H - 4, d)).join('')}
  </svg>`
}

/** Change over time. One series needs no legend — the card title names it. */
export function lineChart(n = 1, { area = false } = {}) {
  const max = Math.max(...TREND), W = 320, H = 150, top = 10, base = 116
  const step = W / (TREND.length - 1)
  const pt = (v, i) => [i * step, base - (v / max) * (base - top)]
  const pts = TREND.map(pt)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Sessions over time">
    <line x1="0" y1="${base}" x2="${W}" y2="${base}" class="gridline"/>
    <line x1="0" y1="${(top + base) / 2}" x2="${W}" y2="${(top + base) / 2}" class="gridline"/>
    ${area ? `<path d="${d} L${W} ${base} L0 ${base} Z" fill="${c(n)}" fill-opacity=".14"/>` : ''}
    <path d="${d}" fill="none" stroke="${c(n)}" stroke-width="2"
          stroke-linejoin="round" stroke-linecap="round"/>
    <line class="cross" x1="0" y1="${top}" x2="0" y2="${base}" hidden/>
    <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4" fill="${c(n)}"
            stroke="var(--clp-surface)" stroke-width="2"/>
    ${pts.map(([x], i) => `<rect x="${(x - step / 2).toFixed(1)}" y="0" width="${step.toFixed(1)}"
      height="${base}" fill="transparent" data-x="${x.toFixed(1)}"
      data-tip="Point ${i + 1} \u00b7 ${TREND[i]}"/>`).join('')}
    ${axisText(0, top - 2, String(max), 'start')}
    ${axisText(0, H - 4, 'Jan', 'start')}
    ${axisText(W, H - 4, 'Oct', 'end')}
  </svg>`
}

/** No axes, no labels — a shape beside a number, not a chart in its own right. */
export function sparkline(n = 1) {
  const max = Math.max(...TREND), W = 110, H = 32
  const step = W / (TREND.length - 1)
  const d = TREND.map((v, i) =>
    `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(H - 3 - (v / max) * (H - 8)).toFixed(1)}`).join(' ')
  return `<svg viewBox="0 0 ${W} ${H}" class="spark" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${c(n)}" stroke-width="2" stroke-linecap="round"/></svg>`
}

/**
 * A single proportion. One series and a track, so every system that charts at
 * all gets a circle — the donut below needs three and most systems have one.
 */
export function gauge(n = 1, pct = 72) {
  const R = 52, SW = 16, C = 2 * Math.PI * R
  return `<svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Completion, ${pct} percent">
    <circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--clp-line)" stroke-width="${SW}"/>
    <circle cx="70" cy="70" r="${R}" fill="none" stroke="${c(n)}" stroke-width="${SW}"
      stroke-linecap="butt" stroke-dasharray="${((pct / 100) * C).toFixed(1)} ${C}"
      transform="rotate(-90 70 70)" data-tip="Completed \u00b7 ${pct}%"/>
    <text x="70" y="68" text-anchor="middle" class="donut-n">${pct}%</text>
    <text x="70" y="86" text-anchor="middle" class="ax">complete</text></svg>`
}

/**
 * Composition of a whole. Needs at least three declared series — with two it is
 * a proportion, which the stacked bar already says more clearly.
 */
export function donut(series) {
  if (series.length < 3) return ''
  const vals = SPLIT.slice(0, series.length)
  const total = vals.reduce((a, b) => a + b, 0)
  const R = 52, SW = 18, C = 2 * Math.PI * R, GAP = 3
  let offset = 0
  const rings = vals.map((v, i) => {
    const len = (v / total) * C
    const seg = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="${c(series[i])}"
      stroke-width="${SW}" stroke-dasharray="${Math.max(0, len - GAP)} ${C - Math.max(0, len - GAP)}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 70 70)"
      data-tip="Series ${i + 1} \u00b7 ${v}"/>`
    offset += len
    return seg
  }).join('')
  return `<svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Share by source">
    ${rings}
    <text x="70" y="66" text-anchor="middle" class="donut-n">${total}</text>
    <text x="70" y="84" text-anchor="middle" class="ax">total</text></svg>`
}

/** Parts of one bar. Two series is enough for this to say something. */
export function stacked(series) {
  if (series.length < 2) return ''
  const vals = SPLIT.slice(0, series.length)
  const total = vals.reduce((a, b) => a + b, 0)
  return `<div class="stack">${vals.map((v, i) =>
    `<i style="width:${((v / total) * 100).toFixed(1)}%;background:${c(series[i])}"
       data-tip="Series ${i + 1} \u00b7 ${v}"></i>`).join('')}</div>`
}

/** Identity is never colour alone: every series gets a swatch and a name. */
export function legend(series, names = ['Direct', 'Organic', 'Referral', 'Social', 'Other']) {
  if (series.length < 2) return ''
  return `<div class="legend">${series.map((n, i) =>
    `<span><i style="background:${c(n)}"></i>${names[i]}</span>`).join('')}</div>`
}

/** A ranked list with proportion bars — what a donut degrades to at one series. */
export function ranked(n = 1) {
  const rows = [['Direct', 432, 100], ['Organic', 216, 50], ['Referral', 168, 39], ['Social', 96, 22]]
  return `<div class="ranked">${rows.map(([name, v, pct]) =>
    `<div class="rank" data-tip="${name} \u00b7 ${v}"><span>${name}</span><b>${v}</b>
      <i class="rbar"><s style="width:${pct}%;background:${c(n)}"></s></i></div>`).join('')}</div>`
}

/**
 * A price chart with axes, for a market that quotes a percentage.
 *
 * Bigger than the panel charts above on purpose: axis text is sized in viewBox
 * units, so a 320-wide box rendered across a full-bleed page magnifies its own
 * labels. At 720 it renders near 1:1 and the type comes out the size it says.
 *
 * `data` is [label, yes] pairs. **The second line is never stored** — it is
 * 100 minus the first at every point, so the two are exact mirrors and cannot
 * drift. A system declaring one series gets one line; there is no generated
 * second hue, and the legend appears only when there are two.
 */
export function priceChart(series, data) {
  const W = 720, H = 300, R = 656, TOP = 16, BASE = 250
  const y = v => BASE - (v / 100) * (BASE - TOP)
  const x = i => (i / (data.length - 1)) * R
  const path = pick => data
    .map(([, v], i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(pick(v)).toFixed(1)}`)
    .join(' ')

  const yes = path(v => v)
  const inverse = path(v => 100 - v)
  const last = data[data.length - 1][1]
  const two = series.length >= 2

  const grid = [0, 25, 50, 75, 100].map(v =>
    `<line x1="0" y1="${y(v)}" x2="${R}" y2="${y(v)}" class="gridline"/>` +
    `<text x="${W}" y="${y(v) + 4}" text-anchor="end" class="ax">${v}%</text>`).join('')

  // The first and last ticks sit on the plot's edges, so a centred anchor puts
  // half the label outside the viewBox — which clipped "Jan" to "an".
  const ticks = data.map(([label], i) => {
    if (!label) return ''
    const anchor = i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'
    return `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${anchor}" class="ax">${
      label}</text>`
  }).join('')

  // One hover target per point, carrying both readings — the tooltip and the
  // crosshair are the frame's, and this only supplies what they display.
  const hits = data.map(([label], i) => {
    const step = R / (data.length - 1)
    return `<rect x="${(x(i) - step / 2).toFixed(1)}" y="${TOP}" width="${step.toFixed(1)}"
      height="${BASE - TOP}" fill="transparent" data-x="${x(i).toFixed(1)}"
      data-tip="${label || 'Mid'} · Yes ${data[i][1]}% · No ${100 - data[i][1]}%"/>`
  }).join('')

  return `<svg viewBox="0 0 ${W} ${H}" class="pchart" role="img"
    aria-label="Price history, currently ${last} percent">
    ${grid}
    <path d="${yes} L${R} ${BASE} L0 ${BASE} Z" fill="${c(series[0])}" fill-opacity=".12"/>
    ${two ? `<path d="${inverse}" fill="none" stroke="${c(series[1])}" stroke-width="2"
      stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="5 4"/>` : ''}
    <path d="${yes}" fill="none" stroke="${c(series[0])}" stroke-width="2"
      stroke-linejoin="round" stroke-linecap="round"/>
    <line class="cross" x1="0" y1="${TOP}" x2="0" y2="${BASE}" hidden/>
    <circle cx="${R}" cy="${y(last)}" r="4.5" fill="${c(series[0])}"
      stroke="var(--clp-bg)" stroke-width="2"/>
    ${two ? `<circle cx="${R}" cy="${y(100 - last)}" r="4.5" fill="${c(series[1])}"
      stroke="var(--clp-bg)" stroke-width="2"/>` : ''}
    ${ticks}
    ${hits}
  </svg>`
}
