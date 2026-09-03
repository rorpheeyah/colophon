// A card thumbnail, as a static SVG with every var() already resolved to hex.
//
// It replaces a live iframe, which cost a full document and its webfonts per
// visible card. That was fine at three systems and would not be at thirty.
//
// Its text is set in the generic family each declared stack ends with —
// sans-serif, serif or monospace. An <img> cannot load a webfont, so naming
// the specific face would be a promise the file cannot keep; the generic is a
// declared fact that renders identically everywhere. At this size the category
// is the only part of a typeface that reads anyway, and the specific face is
// on the system page where it is legible.

import { scopes, resolve, resolveRaw } from './contrast.mjs'

const W = 400, H = 240

/** `999px` and `14px` both arrive as strings; SVG wants a number. */
const num = (v, fallback = 0) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : fallback
}

/** The generic a declared stack ends with — the part an <img> can honour. */
function generic(stack) {
  const last = String(stack ?? '').split(',').pop()?.trim().replace(/["']/g, '').toLowerCase()
  if (last === 'serif' || last === 'ui-serif') return 'serif'
  if (last === 'monospace' || last === 'ui-monospace') return 'monospace'
  return 'sans-serif'
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
  const bw = num(resolveRaw('--clp-border-width', env), 0)

  const fDisplay = generic(resolveRaw('--clp-font-display', env))
  const fBody = generic(resolveRaw('--clp-font-body', env))
  const fData = generic(resolveRaw('--clp-font-data', env) ?? resolveRaw('--clp-font-body', env))

  const rawBox = resolveRaw('--clp-radius-box', env)
  const rawCtl = resolveRaw('--clp-radius-control', env)
  const rBox = rad(rawBox, 100, 60)
  const rCtl = rad(rawCtl, 60, 14)

  const parts = []
  const label = (x, y, str, fill, size, family, weight = 400, anchor = 'start') =>
    parts.push(`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-family="${family}"` +
      ` font-weight="${weight}" text-anchor="${anchor}">${str}</text>`)
  const rect = (x, y, w, h, fill, r = 0, stroke) =>
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(r, Math.min(w, h) / 2)}"` +
      ` fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${bw}"` : ''}/>`)

  rect(0, 0, W, H, bg)

  // header: a title, a caption and a primary action
  label(20, 32, 'Analytics', text, 17, fDisplay, 700)
  label(20, 46, '21 Aug \u2013 17 Sep', text3, 9, fBody)
  rect(W - 96, 20, 76, 24, btn, rad(rawCtl, 76, 24))
  label(W - 58, 36, 'New', v('--clp-button-text') ?? bg, 10, fBody, 600, 'middle')

  // four stat tiles, the last inverted where the system has one
  const tw = (W - 40 - 3 * 10) / 4
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * (tw + 10)
    const filled = i === 3 && invert
    rect(x, 58, tw, 48, filled ? invert : surface, rad(rawBox, tw, 48), bw ? border : undefined)
    const ink = filled ? (v('--clp-invert-text') ?? bg) : text
    label(x + 10, 76, ['Users', 'Sessions', 'Rate', 'Open'][i], filled ? ink : text3, 8, fBody)
    label(x + 10, 95, ['3,450', '1,342', '2.8%', '26'][i], ink, 15, fData, 700)
  }

  // the chart panel, or the meter a system without a palette falls back to
  rect(20, 116, 232, 100, surface, rad(rawBox, 232, 100), bw ? border : undefined)
  if (chart) {
    const heights = [34, 48, 28, 60, 40, 54, 70]
    heights.forEach((h, i) => rect(34 + i * 30, 196 - h, 20, h, chart, Math.min(3, rCtl)))
  } else {
    for (let i = 0; i < 7; i++) rect(34 + i * 30, 176, 20, 12, i < 5 ? text3 : line, rad(rawCtl, 20, 12))
  }

  // a short table with a status pill, so state treatment shows at a glance
  rect(264, 116, W - 284, 100, surface, rad(rawBox, W - 284, 100), bw ? border : undefined)
  const pills = [warn, alarm, null]
  for (let i = 0; i < 3; i++) {
    const y = 132 + i * 28
    label(276, y + 7, ['Northwind', 'Atlas', 'Beacon'][i], text, 9, fBody)
    label(W - 24, y + 7, ['128', '1,284', '6'][i], text, 9, fData, 600, 'end')
    if (pills[i]) {
      if (stateText) rect(276, y + 13, 40, 11, pills[i], rad(rawCtl, 40, 11))
      else parts.push(`<rect x="276.5" y="${y + 13.5}" width="39" height="10"` +
        ` rx="${Math.min(rCtl, 5)}" fill="none" stroke="${pills[i]}" stroke-width="1"/>`)
    }
    if (i < 2) rect(276, y + 32, W - 308, 1, line)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"` +
    ` role="img" aria-label="Preview">\n  ${parts.join('\n  ')}\n</svg>\n`
}
