#!/usr/bin/env node
// WCAG contrast checking for a system's --clp-* text roles.
//
//   node scripts/contrast.mjs            every system that declares `contrast`
//   node scripts/contrast.mjs newsprint  one system, declared or not
//   node scripts/contrast.mjs --all      every system, whether declared or not
//
// Opt-in by design: a system is only held to a floor if its frontmatter says
// so. `contrast: AA` means 4.5:1, `AAA` means 7:1. A system that declares
// nothing is not checked, because a floor it never agreed to is not its rule.

import { ROOT, systemSlugs, readSystem, scalar, tokensBlock } from './lib.mjs'

export const THRESHOLDS = { AA: 4.5, AAA: 7 }

// Chart series thresholds, as OKLab Delta E x100. Two adjacent series must be
// tellable apart by a full-colour reader (NORMAL_FLOOR) and by a colour-blind
// one (CVD_*). Ported from the data-visualisation reference implementation;
// the CVD numbers are calibrated to the Machado-Oliveira-Fernandes simulation
// below, so the matrices and the thresholds move together or not at all.
export const NORMAL_FLOOR = 15
export const CVD_TARGET = 8
export const CVD_FLOOR = 6

const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216],
           [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413],
           [-0.011820, 0.042940, 0.968881]],
}

// ── colour ───────────────────────────────────────────────────────────────────

const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }

const luminance = hex => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h
  const [r, g, b] = full.match(/../g).map(x => parseInt(x, 16))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

const linear = hex => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h
  return full.match(/../g).map(x => lin(parseInt(x, 16)))
}

function oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s]
}

const simulate = (rgb, kind) => MACHADO[kind].map(row =>
  Math.max(0, Math.min(1, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])))

/** Euclidean distance in OKLab x100. Omit `kind` for unsimulated vision. */
export function deltaE(a, b, kind) {
  const x = oklab(kind ? simulate(linear(a), kind) : linear(a))
  const y = oklab(kind ? simulate(linear(b), kind) : linear(b))
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

/** WCAG 2.1 contrast ratio between two opaque hex colours. */
export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (hi + 0.05) / (lo + 0.05)
}

// ── resolving the alias layer ────────────────────────────────────────────────

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

// Two scopes: `:root`, and `:root` overlaid with the dark block. That mirrors
// how the browser resolves it — see the data-mode note in CLAUDE.md.
function scopes(code) {
  const darkAt = code.search(/\[data-mode\s*=\s*["']?dark["']?\]/)
  const decls = src => Object.fromEntries(
    [...src.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;}]+)/g)]
      .map(m => [m[1], m[2].trim().replace(/\s+/g, ' ')]))

  const root = decls(darkAt === -1 ? code : code.slice(0, darkAt))
  if (darkAt === -1) return { light: root, dark: null }
  return { light: root, dark: { ...root, ...decls(code.slice(darkAt)) } }
}

/** Follow var() references to an opaque hex, or null if it is not one. */
export function resolve(name, env, seen = new Set()) {
  if (seen.has(name)) return null
  seen.add(name)
  const value = env[name]
  if (!value || value === 'none') return null
  if (HEX.test(value)) return value
  const ref = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/.exec(value)
  return ref ? resolve(ref[1], env, seen) : null
}

// ── what gets checked ────────────────────────────────────────────────────────

// Which pair matters depends on how the system renders a state, and that is
// readable from the aliases: `--clp-state-text` means the colour is a fill and
// that token is the text on it; a wash means coloured text on the wash; neither
// means coloured text on the page, as Newsprint's bordered labels do.
function pairs(env) {
  const out = []
  const on = (fg, bg) => out.push([fg, bg])

  for (const fg of ['--clp-text', '--clp-text-2', '--clp-text-3']) {
    on(fg, '--clp-bg')
    on(fg, '--clp-surface')
  }
  const filled = resolve('--clp-state-text', env)
  for (const state of ['--clp-success', '--clp-warn', '--clp-alarm']) {
    const wash = `${state}-wash`
    if (filled) on('--clp-state-text', state)
    else if (resolve(wash, env)) on(state, wash)
    else { on(state, '--clp-bg'); on(state, '--clp-surface') }
  }
  on('--clp-button-text', '--clp-button-bg')
  on('--clp-invert-text', '--clp-invert-bg')
  return out
}

/**
 * Findings for one system. `skipped` holds pairs that could not be compared —
 * a declined alias, or a value that is not an opaque hex.
 */
export function check(code, threshold) {
  const { light, dark } = scopes(code)
  const findings = []
  const skipped = []

  for (const [mode, env] of [['light', light], ['dark', dark]]) {
    if (!env) continue
    for (const [fgName, bgName] of pairs(env)) {
      const fg = resolve(fgName, env)
      const bg = resolve(bgName, env)
      if (!fg || !bg) {
        skipped.push({ mode, fgName, bgName })
        continue
      }
      const r = ratio(fg, bg)
      findings.push({ mode, fgName, bgName, fg, bg, ratio: r, pass: r >= threshold })
    }
  }
  return { findings, skipped }
}

/**
 * Adjacent series in the declared order must be distinguishable. Colours are
 * assigned by entity and never cycled, so adjacent pairs are the ones a reader
 * actually has to separate.
 */
export function checkSeries(code) {
  const { light, dark } = scopes(code)
  const out = []
  for (const [mode, env] of [['light', light], ['dark', dark]]) {
    if (!env) continue
    const hexes = [1, 2, 3, 4, 5]
      .map(n => ({ n, hex: resolve(`--clp-chart-${n}`, env) }))
      .filter(x => x.hex)
    for (let i = 1; i < hexes.length; i++) {
      const a = hexes[i - 1], b = hexes[i]
      const normal = deltaE(a.hex, b.hex)
      const cvd = Math.min(deltaE(a.hex, b.hex, 'protan'), deltaE(a.hex, b.hex, 'deutan'))
      out.push({
        mode, pair: `--clp-chart-${a.n} / --clp-chart-${b.n}`, normal, cvd,
        level: normal < NORMAL_FLOOR || cvd < CVD_FLOOR ? 'fail'
             : cvd < CVD_TARGET ? 'warn' : 'ok',
      })
    }
  }
  return out
}

// ── cli ──────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const all = args.includes('--all')
  const only = args.filter(a => !a.startsWith('-'))
  let failures = 0

  for (const slug of only.length ? only : systemSlugs()) {
    const sys = readSystem(slug)
    if (!sys) { console.error(`no such system: ${slug}`); process.exit(2) }

    const declared = scalar(sys.data.contrast)
    if (!declared && !all && !only.length) continue

    const level = declared && THRESHOLDS[declared] ? declared : 'AA'
    const block = tokensBlock(sys.blocks)[0]
    if (!block) continue

    const { findings, skipped } = check(block.code, THRESHOLDS[level])
    const bad = findings.filter(f => !f.pass)
    failures += bad.length

    console.log(`\n${slug} — ${level} (${THRESHOLDS[level]}:1)${declared ? '' : ', not declared'}`)
    for (const f of findings) {
      console.log(`  ${f.pass ? 'ok  ' : 'FAIL'} ${f.ratio.toFixed(2).padStart(5)}  ` +
                  `${f.fgName} on ${f.bgName} (${f.mode})`)
    }
    if (skipped.length) console.log(`  ${skipped.length} pair(s) not comparable (declined or non-hex)`)

    for (const f of checkSeries(block.code)) {
      failures += f.level === 'fail' ? 1 : 0
      console.log(`  ${f.level === 'ok' ? 'ok  ' : f.level === 'warn' ? 'warn' : 'FAIL'} ` +
        `\u0394E ${f.normal.toFixed(1)} normal / ${f.cvd.toFixed(1)} cvd  ${f.pair} (${f.mode})`)
    }
  }

  console.log(`\n${failures} failure(s)`)
  process.exit(failures ? 1 : 0)
}
