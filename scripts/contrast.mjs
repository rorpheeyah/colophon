#!/usr/bin/env node
// WCAG contrast checking for a system's --ds-* text roles.
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

// ── colour ───────────────────────────────────────────────────────────────────

const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }

const luminance = hex => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h
  const [r, g, b] = full.match(/../g).map(x => parseInt(x, 16))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
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

// A state colour sits on its wash where one is declared, and on the page
// otherwise — Newsprint borders its status labels rather than filling them.
function pairs(env) {
  const out = []
  const on = (fg, bg) => out.push([fg, bg])

  for (const fg of ['--ds-text', '--ds-text-2', '--ds-text-3']) {
    on(fg, '--ds-bg')
    on(fg, '--ds-surface')
  }
  for (const state of ['--ds-success', '--ds-warn', '--ds-alarm']) {
    const wash = `${state}-wash`
    if (resolve(wash, env)) on(state, wash)
    else { on(state, '--ds-bg'); on(state, '--ds-surface') }
  }
  on('--ds-button-text', '--ds-button-bg')
  on('--ds-invert-text', '--ds-invert-bg')
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
  }

  console.log(`\n${failures} failure(s)`)
  process.exit(failures ? 1 : 0)
}
