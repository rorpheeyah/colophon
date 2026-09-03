#!/usr/bin/env node
// Enforces the system file format contract described in CLAUDE.md.
// No dependencies. Node 22+.
//
//   node scripts/validate.mjs            validate every system
//   node scripts/validate.mjs lozenge    validate one

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  ROOT, ARRAY_FIELDS, SECTIONS, TOKENS_SECTION,
  parseFrontmatter, scanBody, scalar, tokensBlock, declaredAliases, systemSlugs,
} from './lib.mjs'
import { THRESHOLDS, check as checkContrast, checkSeries } from './contrast.mjs'

// ── format contract ──────────────────────────────────────────────────────────

const REQUIRED_FRONTMATTER = [
  'system', 'version', 'status', 'origin',
  'register', 'density', 'scripts', 'best-for', 'avoid-for',
]
const REFERENCE_FRONTMATTER = ['source-url', 'credit']
const ENUMS = {
  contrast: ['AA', 'AAA'],
  status: ['active', 'draft', 'archived'],
  origin: ['own', 'reference'],
  density: ['compact', 'comfortable', 'spacious'],
}

const CLP_ALIASES = [
  'bg', 'surface', 'text', 'text-2', 'text-3', 'line', 'accent',
  'radius-box', 'radius-control', 'border-width', 'border-color', 'shadow',
  'button-bg', 'button-text', 'font-display', 'font-body', 'font-data',
  'gap', 'pad',
  'success', 'success-wash', 'warn', 'warn-wash', 'alarm', 'alarm-wash',
  'invert-bg', 'invert-text', 'invert-accent', 'hatch',
  'font-script', 'scrim', 'shadow-surface', 'button2-bg', 'state-text',
  'press', 'focus', 'card-fill',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
].map(n => `--clp-${n}`)

// Aliases a system may decline. The rest carry structure, so `none` in one of them
// is an error rather than an escape hatch.
const CLP_NONE_PERMITTED = new Set([
  'shadow', 'font-data', 'hatch', 'border-color', 'gap', 'pad',
  'success', 'success-wash', 'warn', 'warn-wash', 'alarm', 'alarm-wash',
  'invert-bg', 'invert-text', 'invert-accent',
  'font-script', 'scrim', 'shadow-surface', 'button2-bg', 'state-text',
  'press', 'focus', 'card-fill',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
].map(n => `--clp-${n}`))

// A wash needs a colour to pair with. The reverse does not hold: a system may mark
// states with a border or with type colour alone and never fill anything.
const CLP_PAIRS = [['success', 'success-wash'], ['warn', 'warn-wash'], ['alarm', 'alarm-wash']]
  .map(([a, b]) => [`--clp-${a}`, `--clp-${b}`])

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/
const MIN_NEVER_ENTRIES = 5

// ── checks ───────────────────────────────────────────────────────────────────

function validateSystem(slug) {
  const path = `systems/${slug}/${slug}.md`
  const abs = join(ROOT, path)
  const errors = []
  const warnings = []
  const err = m => errors.push(m)
  const warn = m => warnings.push(m)

  if (!existsSync(abs)) {
    err(`missing ${path} — a folder exists under systems/ with no system file in it`)
    return { slug, errors, warnings }
  }

  const text = readFileSync(abs, 'utf8')
  const { data, body, endLine } = parseFrontmatter(text, err)

  // frontmatter --------------------------------------------------------------
  const origin = scalar(data.origin)
  const required = origin === 'reference'
    ? [...REQUIRED_FRONTMATTER, ...REFERENCE_FRONTMATTER]
    : REQUIRED_FRONTMATTER

  for (const key of required) {
    if (!(key in data)) { err(`frontmatter is missing required field \`${key}\``); continue }
    const isArray = Array.isArray(data[key])
    if (ARRAY_FIELDS.includes(key) && !isArray) err(`\`${key}\` must be an inline array, e.g. [a, b]`)
    if (!ARRAY_FIELDS.includes(key) && isArray) err(`\`${key}\` must be a single value, not an array`)
    if (isArray && data[key].length === 0) err(`\`${key}\` is empty`)
    if (!isArray && data[key].value === '') err(`\`${key}\` is empty`)
  }

  for (const [key, allowed] of Object.entries(ENUMS)) {
    const v = scalar(data[key])
    if (v !== undefined && !allowed.includes(v)) {
      err(`\`${key}: ${v}\` is not one of ${allowed.join(' | ')}`)
    }
  }

  if (data.version && !Array.isArray(data.version)) {
    if (!data.version.quoted) {
      err(`\`version\` must be quoted — \`version: "${data.version.value}"\`. ` +
          `Unquoted, YAML reads it as a number and 1.10 becomes 1.1`)
    } else if (!/^\d+\.\d+$/.test(data.version.value)) {
      warn(`\`version: "${data.version.value}"\` is not the usual MAJOR.MINOR shape`)
    }
  }

  const nameField = scalar(data.system)
  if (nameField && nameField.toLowerCase().replace(/[^a-z0-9]+/g, '-') !== slug) {
    warn(`\`system: ${nameField}\` does not obviously correspond to folder \`${slug}\``)
  }
  if (origin === 'own' && (data['source-url'] || data.credit)) {
    warn(`\`origin: own\` but the file carries source-url/credit — should this be a reference?`)
  }

  // sections -----------------------------------------------------------------
  const { headings, blocks, prose } = scanBody(body, endLine)
  const found = []

  for (const spec of SECTIONS) {
    const hits = headings.filter(h => spec.test.test(h.norm))
    if (hits.length === 0) { err(`missing required section: ${spec.slot}`); continue }
    if (hits.length > 1) {
      err(`section ${spec.slot} appears ${hits.length} times ` +
          `(lines ${hits.map(h => h.line).join(', ')})`)
    }
    found.push({ spec, heading: hits[0] })
  }

  if (found.length === SECTIONS.length) {
    for (let i = 1; i < found.length; i++) {
      if (found[i].heading.line < found[i - 1].heading.line) {
        err(`section order: "${found[i].heading.title}" (line ${found[i].heading.line}) ` +
            `must come after "${found[i - 1].heading.title}" (line ${found[i - 1].heading.line})`)
      }
    }
  }

  // tokens block -------------------------------------------------------------
  const tokenBlocks = tokensBlock(blocks)
  const canonical = tokenBlocks[0]

  if (!canonical) {
    err('the Tokens section contains no fenced `css` block')
  } else if (tokenBlocks.length > 1) {
    err(`the Tokens section contains ${tokenBlocks.length} css blocks — there must be exactly one, ` +
        `so there is one source of truth for values`)
  }

  if (canonical) {
    if (!/:root\s*\{/.test(canonical.code)) err('the tokens block declares no `:root` rule')
    const declared = declaredAliases(canonical.code)

    const missing = CLP_ALIASES.filter(t => !declared.has(t))
    if (missing.length) {
      err(`tokens block is missing ${missing.length} required --clp-* alias(es): ${missing.join(', ')}. ` +
          `Declare \`none\` to refuse a concept the system does not have`)
    }
    const unknown = [...declared.keys()].filter(t => !CLP_ALIASES.includes(t))
    if (unknown.length) {
      err(`unrecognised --clp-* alias(es): ${unknown.join(', ')}. ` +
          `The preview template reads a fixed set — see CLAUDE.md`)
    }

    for (const [token, value] of declared) {
      if (!CLP_ALIASES.includes(token)) continue
      if (value === '') { err(`\`${token}\` is declared with no value`); continue }
      if (value === 'none' && !CLP_NONE_PERMITTED.has(token)) {
        err(`\`${token}: none\` — this alias carries structure and must hold a value. ` +
            `Only ${[...CLP_NONE_PERMITTED].join(', ')} may be declined`)
      }
    }

    for (const [colour, wash] of CLP_PAIRS) {
      const a = declared.get(colour)
      const b = declared.get(wash)
      if (a === undefined || b === undefined) continue
      if (a === 'none' && b !== 'none') {
        err(`\`${wash}\` is declared but \`${colour}\` is \`none\` — a wash with no colour ` +
            `to pair with`)
      }
    }

    const series = [1, 2, 3, 4, 5].map(n => declared.get(`--clp-chart-${n}`))
    const firstNone = series.findIndex(v => v === 'none')
    if (firstNone !== -1) {
      const laterDeclared = series.findIndex((v, i) => i > firstNone && v !== undefined && v !== 'none')
      if (laterDeclared !== -1) {
        err(`\`--clp-chart-${laterDeclared + 1}\` is declared but \`--clp-chart-${firstNone + 1}\` ` +
            `is \`none\` — a series palette must be declared in order, with no gaps`)
      }
    }

    const stateText = declared.get('--clp-state-text')
    const anyState = ['success', 'warn', 'alarm'].some(k => {
      const v = declared.get(`--clp-${k}`)
      return v !== undefined && v !== 'none'
    })
    if (stateText !== undefined && stateText !== 'none' && !anyState) {
      err('`--clp-state-text` is declared but the system has no state colour to fill with')
    }

    const borderWidth = declared.get('--clp-border-width')
    const borderColor = declared.get('--clp-border-color')
    if (borderColor === 'none' && borderWidth !== undefined && !/^0[a-z]*$/.test(borderWidth)) {
      err(`\`--clp-border-color: none\` but \`--clp-border-width\` is \`${borderWidth}\` — ` +
          `a border with no colour. Decline the colour only where the width is 0`)
    }

    // Aliases must resolve through the dark block, so they are declared once only.
    const darkStart = canonical.code.search(/\[data-mode\s*=\s*["']?dark["']?\]/)
    if (darkStart === -1) {
      warn('no `[data-mode="dark"]` block — the preview will render "no dark mode published"')
    } else {
      const redeclared = [...canonical.code.slice(darkStart).matchAll(/(--clp-[a-z0-9-]+)\s*:/g)]
      if (redeclared.length) {
        err(`--clp-* alias(es) re-declared inside the dark block: ` +
            `${[...new Set(redeclared.map(m => m[1]))].join(', ')}. ` +
            `Aliases point at tokens; redefine the underlying token instead`)
      }
    }
  }

  // contrast, only where the system declares a floor -------------------------
  const declaredContrast = scalar(data.contrast)
  if (canonical && declaredContrast && THRESHOLDS[declaredContrast]) {
    const threshold = THRESHOLDS[declaredContrast]
    const { findings, skipped } = checkContrast(canonical.code, threshold)
    for (const f of findings.filter(x => !x.pass)) {
      err(`\`contrast: ${declaredContrast}\` but ${f.fgName} on ${f.bgName} (${f.mode}) is ` +
          `${f.ratio.toFixed(2)}:1, under ${threshold}:1`)
    }
    if (!findings.length) {
      warn(`\`contrast: ${declaredContrast}\` is declared but nothing was comparable — ` +
           `every text pair resolved to a declined alias or a non-hex value`)
    } else if (skipped.length) {
      warn(`${skipped.length} text pair(s) not checked: a declined alias, or a value that is ` +
           `not an opaque hex`)
    }
  }

  // adjacent chart series must be tellable apart ------------------------------
  if (canonical) {
    for (const f of checkSeries(canonical.code)) {
      if (f.level === 'ok') continue
      const detail = `${f.pair} (${f.mode}) differ by \u0394E ${f.normal.toFixed(1)} to a ` +
        `full-colour reader and ${f.cvd.toFixed(1)} under simulated colour blindness`
      // A system that declared a contrast floor asked to be held to one.
      if (f.level === 'fail' && declaredContrast) err(`adjacent series: ${detail}`)
      else warn(`adjacent series: ${detail}`)
    }
  }

  // no colour literal outside the tokens block --------------------------------
  for (const line of prose) {
    if (COLOR_LITERAL.test(line.text)) {
      err(`line ${line.line}: colour literal outside the tokens block — ` +
          `${line.text.trim().slice(0, 72)}`)
    }
  }
  for (const block of blocks) {
    if (block === canonical) continue
    block.code.split('\n').forEach((text, i) => {
      if (COLOR_LITERAL.test(text)) {
        err(`line ${block.line + 1 + i}: colour literal in a non-token code block — ` +
            `use var(--token): ${text.trim().slice(0, 72)}`)
      }
    })
    const stray = [...new Set([...block.code.matchAll(/^\s*(--[A-Za-z0-9-]+)\s*:/gm)].map(m => m[1]))]
    if (stray.length) {
      err(`line ${block.line + 1}: custom propert(ies) declared outside the tokens block — ` +
          `${stray.join(', ')}. The tokens block holds every property the system defines`)
    }
    if (block.unterminated) err(`unterminated code fence opened at line ${block.line}`)
  }

  // the Never section --------------------------------------------------------
  const neverSpec = SECTIONS.find(x => x.slot === 'Never')
  const neverHeading = headings.find(h => neverSpec.test.test(h.norm))
  if (neverHeading) {
    const after = headings.filter(h => h.line > neverHeading.line && h.depth <= neverHeading.depth)
    const end = after.length ? after[0].line : Infinity
    const bullets = prose.filter(l =>
      l.line > neverHeading.line && l.line < end && /^\s*[-*+]\s+\S/.test(l.text))
    if (bullets.length < MIN_NEVER_ENTRIES) {
      err(`the Never section lists ${bullets.length} prohibition(s); at least ` +
          `${MIN_NEVER_ENTRIES} are required. This is the section that stops a system decaying`)
    }
  }

  return { slug, errors, warnings }
}

// ── index.json ───────────────────────────────────────────────────────────────

function validateIndex(slugs) {
  const errors = []
  const warnings = []
  const path = join(ROOT, 'index.json')

  if (!existsSync(path)) return { slug: 'index.json', errors: ['index.json is missing — ask, do not recreate it'], warnings }

  let index
  try {
    index = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    return { slug: 'index.json', errors: [`index.json is not valid JSON: ${e.message}`], warnings }
  }
  if (!Array.isArray(index)) return { slug: 'index.json', errors: ['index.json must be an array'], warnings }

  const seen = new Set()
  index.forEach((entry, i) => {
    const at = `index.json[${i}]`
    for (const key of ['slug', 'path', 'origin', 'added']) {
      if (!(key in entry)) errors.push(`${at} is missing \`${key}\``)
    }
    if (entry.slug) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) errors.push(`${at} slug \`${entry.slug}\` is not kebab-case`)
      if (seen.has(entry.slug)) errors.push(`${at} duplicate slug \`${entry.slug}\``)
      seen.add(entry.slug)
      const expected = `systems/${entry.slug}/${entry.slug}.md`
      if (entry.path !== expected) errors.push(`${at} path should be \`${expected}\`, found \`${entry.path}\``)
      if (!existsSync(join(ROOT, expected))) errors.push(`${at} points at ${expected}, which does not exist`)
    }
    if (entry.origin && !ENUMS.origin.includes(entry.origin)) {
      errors.push(`${at} origin \`${entry.origin}\` is not one of ${ENUMS.origin.join(' | ')}`)
    }
    if (entry.added && !/^\d{4}-\d{2}-\d{2}$/.test(entry.added)) {
      errors.push(`${at} added \`${entry.added}\` is not YYYY-MM-DD`)
    }
  })

  for (const slug of slugs) {
    if (!seen.has(slug)) errors.push(`systems/${slug}/ has no entry in index.json`)
  }

  // append-only, checked against the last commit
  const previous = gitShow('index.json')
  if (previous !== null) {
    let before
    try { before = JSON.parse(previous) } catch { before = null }
    if (Array.isArray(before)) {
      if (index.length < before.length) {
        errors.push(`index.json lost ${before.length - index.length} entr(ies) since the last commit — it is append-only`)
      } else {
        before.forEach((entry, i) => {
          if (JSON.stringify(entry) !== JSON.stringify(index[i])) {
            errors.push(`index.json[${i}] (\`${entry.slug}\`) was modified or reordered since the last ` +
                        `commit — entries are append-only and immutable`)
          }
        })
      }
    }
  }

  return { slug: 'index.json', errors, warnings }
}

function gitShow(file) {
  try {
    return execFileSync('git', ['show', `HEAD:${file}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null // no commit yet, or the file is new
  }
}

// ── preview freshness ────────────────────────────────────────────────────────

function checkGenerated(name, script, hint) {
  const builder = join(ROOT, 'scripts', script)
  if (!existsSync(builder)) {
    return { slug: name, errors: [], warnings: [`scripts/${script} does not exist yet — skipping freshness check`] }
  }
  try {
    execFileSync('node', [builder, '--check'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { slug: name, errors: [], warnings: [] }
  } catch (e) {
    const detail = ((e.stdout || '') + (e.stderr || '')).trim()
    return { slug: name, errors: [`out of date — run \`${hint}\`\n${detail}`], warnings: [] }
  }
}

// ── run ──────────────────────────────────────────────────────────────────────

const only = process.argv.slice(2).filter(a => !a.startsWith('-'))
const all = systemSlugs()
const targets = only.length ? only : all

for (const slug of only) {
  if (!all.includes(slug)) {
    console.error(`no such system: ${slug}`)
    process.exit(2)
  }
}

const results = [
  ...targets.map(validateSystem),
  ...(only.length ? [] : [
    validateIndex(all),
    checkGenerated('previews', 'build-previews.mjs', 'node scripts/build-previews.mjs'),
    checkGenerated('site', 'build-site.mjs', 'node scripts/build-site.mjs'),
  ]),
]

let errors = 0
let warnings = 0

for (const r of results) {
  errors += r.errors.length
  warnings += r.warnings.length
  if (!r.errors.length && !r.warnings.length) {
    console.log(`  ok    ${r.slug}`)
    continue
  }
  console.log(`${r.errors.length ? 'FAIL' : '  --'}  ${r.slug}`)
  for (const m of r.errors) console.log(`        error: ${m}`)
  for (const m of r.warnings) console.log(`        warn:  ${m}`)
}

if (!targets.length && !only.length) console.log('  ok    no systems yet')

console.log()
console.log(`${targets.length} system(s), ${errors} error(s), ${warnings} warning(s)`)
process.exit(errors ? 1 : 0)
