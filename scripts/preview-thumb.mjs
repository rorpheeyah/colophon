// A card thumbnail, as a static SVG with every var() already resolved to hex.
//
// It replaces a live iframe, which cost a full document and its webfonts per
// visible card. That was fine at three systems and would not be at thirty.
//
// It carries no text. An <img> cannot load the system's typeface, so any text
// here would render in whatever font the viewer happens to have and would
// misrepresent the one thing a specimen is most careful about. Type identity
// belongs on the system page, at a size where it is actually legible. What a
// thumbnail can carry honestly is colour, radius, density, surface treatment
// and whether the system charts at all — and all of that comes from the
// declarations, same as everything else.

import { scopes, resolve } from './contrast.mjs'

const W = 400, H = 240

/** `999px` and `14px` both arrive as strings; SVG wants a number. */
const num = (v, fallback = 0) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

/** A radius can never exceed half the shorter side, whatever the token says. */
const rad = (v, w, h) => Math.min(num(v, 0), Math.min(w, h) / 2)

export function thumbnail(code, mode = 'light') {
  const scope = scopes(code)
  const env = mode === 'dark' ? scope.dark : scope.light
  if (!env) return null

  const v = name => resolve(name, env)
  const bg = v('--clp-bg') ?? '#ffffff'
  const surface = v('--clp-surface') ?? bg
  const line = v('--clp-line') ?? surface
  const text = v('--clp-text') ?? '#000000'
  const text3 = v('--clp-text-3') ?? line
  const btn = v('--clp-button-bg') ?? text
  const chart = v('--clp-chart-1')
  const invert = v('--clp-invert-bg')
  const warn = v('--clp-warn')
  const alarm = v('--clp-alarm')
  const border = v('--clp-border-color')
  // Filled only where the system says a state pill is filled. Newsprint borders
  // its status labels and forbids filled pills outright.
  const stateText = v('--clp-state-text')
  const bw = num(env['--clp-border-width'], 0)

  const rBox = rad(env['--clp-radius-box'], 100, 60)
  const rCtl = rad(env['--clp-radius-control'], 60, 14)

  const parts = []
  const rect = (x, y, w, h, fill, r = 0, stroke) =>
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(r, Math.min(w, h) / 2)}"` +
      ` fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${bw}"` : ''}/>`)

  rect(0, 0, W, H, bg)

  // header: a title bar and a primary action
  rect(20, 20, 96, 10, text, rad(env['--clp-radius-control'], 96, 10))
  rect(20, 36, 60, 7, text3, rad(env['--clp-radius-control'], 60, 7))
  rect(W - 96, 20, 76, 22, btn, rCtl)

  // four stat tiles, the last inverted where the system has one
  const tw = (W - 40 - 3 * 10) / 4
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * (tw + 10)
    const filled = i === 3 && invert
    rect(x, 58, tw, 46, filled ? invert : surface, rBox, bw ? border : undefined)
    rect(x + 10, 68, tw * 0.5, 6, text3, 3)
    rect(x + 10, 80, tw * 0.62, 12, filled ? bg : text, 3)
  }

  // the chart panel, or the meter a system without a palette falls back to
  rect(20, 116, 232, 100, surface, rBox, bw ? border : undefined)
  if (chart) {
    const heights = [34, 48, 28, 60, 40, 54, 70]
    heights.forEach((h, i) => rect(34 + i * 30, 196 - h, 20, h, chart, Math.min(3, rCtl)))
  } else {
    for (let i = 0; i < 7; i++) rect(34 + i * 30, 176, 20, 12, i < 5 ? text3 : line, rCtl)
  }

  // a short table with a status pill, so state treatment shows at a glance
  rect(264, 116, W - 284, 100, surface, rBox, bw ? border : undefined)
  const pills = [warn, alarm, null]
  for (let i = 0; i < 3; i++) {
    const y = 132 + i * 28
    rect(276, y, 48, 7, text3, 3)
    if (pills[i]) {
      if (stateText) rect(276, y + 13, 40, 11, pills[i], rCtl)
      else parts.push(`<rect x="276.5" y="${y + 13.5}" width="39" height="10"` +
        ` rx="${Math.min(rCtl, 5)}" fill="none" stroke="${pills[i]}" stroke-width="1"/>`)
    }
    if (i < 2) rect(276, y + 32, W - 308, 1, line)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"` +
    ` role="img" aria-label="Preview">\n  ${parts.join('\n  ')}\n</svg>\n`
}
