// Shared parsing for validate.mjs and build-previews.mjs, so the two cannot
// drift in how they read a system file. No dependencies.

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const ARRAY_FIELDS = ['scripts', 'best-for', 'avoid-for']

// Matched against the heading with any leading number stripped, so inserting an
// optional section never forces a renumber elsewhere in the file.
export const SECTIONS = [
  { slot: 'How to apply this file', test: /^how to apply\b/ },
  { slot: 'The primitive / core idea', test: /^(the\s+)?(primitive|core\s+idea)\b/ },
  { slot: 'Tokens', test: /^tokens\b/ },
  { slot: 'Type', test: /^type\b/ },
  { slot: 'Structure', test: /^structure\b/ },
  { slot: 'Components', test: /^components\b/ },
  { slot: 'Motion', test: /^motion\b/ },
  { slot: 'Never', test: /^never\b/ },
]
export const TOKENS_SECTION = SECTIONS.find(s => s.slot === 'Tokens')

// Restricted YAML subset: `key: value`, `key: "quoted"`, `key: [a, b, c]`.
// Deliberately hand-rolled — see CLAUDE.md. Do not swap in a YAML library.
export function parseFrontmatter(text, err = () => {}) {
  if (!text.startsWith('---\n')) {
    err('file does not open with a `---` frontmatter block')
    return { data: {}, body: text, endLine: 0 }
  }
  const close = text.indexOf('\n---\n', 3)
  if (close === -1) {
    err('frontmatter block is never closed with `---`')
    return { data: {}, body: text, endLine: 0 }
  }
  const raw = text.slice(4, close)
  const data = {}

  raw.split('\n').forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith('#')) return
    const m = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line)
    if (!m) return err(`frontmatter line ${i + 2} is not \`key: value\`: ${line.trim()}`)

    const [, key, rawValue] = m
    const v = rawValue.trim()
    if (key in data) err(`frontmatter key \`${key}\` appears more than once`)

    if (v.startsWith('[') && v.endsWith(']')) {
      const inner = v.slice(1, -1).trim()
      data[key] = inner ? inner.split(',').map(x => unquote(x.trim())) : []
    } else if (v.startsWith('"') && v.endsWith('"') && v.length > 1) {
      data[key] = { value: v.slice(1, -1), quoted: true }
    } else {
      data[key] = { value: v, quoted: false }
    }
  })

  return { data, body: text.slice(close + 5), endLine: raw.split('\n').length + 2 }
}

const unquote = s =>
  (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
    ? s.slice(1, -1) : s

export const scalar = f => (f && !Array.isArray(f) ? f.value : undefined)
export const list = f => (Array.isArray(f) ? f : [])

export const normalizeHeading = h =>
  h.replace(/^#+\s*/, '')
    .replace(/^\d+(?:\.\d+)*[.)]?\s+/, '')
    .trim().toLowerCase().replace(/\s+/g, ' ')

// Walks the body once, returning headings, fenced blocks, and prose lines.
// `offset` is the frontmatter length so reported line numbers match the file.
export function scanBody(body, offset = 0) {
  const lines = body.split('\n')
  const headings = []
  const blocks = []
  const prose = []
  let fence = null
  let buf = []
  let section = null

  lines.forEach((text, i) => {
    const lineNo = i + 1 + offset
    const fenceMatch = /^\s*(```+|~~~+)\s*(.*)$/.exec(text)

    if (fenceMatch) {
      if (!fence) {
        fence = { lang: fenceMatch[2].trim().split(/\s+/)[0].toLowerCase(), line: lineNo, section }
        buf = []
      } else {
        blocks.push({ ...fence, code: buf.join('\n') })
        fence = null
      }
      return
    }
    if (fence) return void buf.push(text)

    const h = /^(#{1,6})\s+(.+)$/.exec(text)
    if (h) {
      const norm = normalizeHeading(h[2])
      headings.push({ title: h[2].trim(), norm, line: lineNo, depth: h[1].length })
      if (h[1].length <= 2) section = norm
      return
    }
    prose.push({ text, line: lineNo, section })
  })

  if (fence) blocks.push({ ...fence, code: buf.join('\n'), unterminated: true })
  return { headings, blocks, prose }
}

// The one css block in the Tokens section. Every value the system defines lives here.
export const tokensBlock = blocks =>
  blocks.filter(b => b.lang === 'css' && b.section && TOKENS_SECTION.test.test(b.section))

// Declared --clp-* aliases as a Map of name -> value, whitespace collapsed.
export const declaredAliases = code =>
  new Map([...code.matchAll(/(--clp-[a-z0-9-]+)\s*:\s*([^;}]*)/g)]
    .map(m => [m[1], m[2].trim().replace(/\s+/g, ' ')]))

export function systemSlugs() {
  const dir = join(ROOT, 'systems')
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name).sort()
}

export function readSystem(slug) {
  const path = `systems/${slug}/${slug}.md`
  const abs = join(ROOT, path)
  if (!existsSync(abs)) return null
  const text = readFileSync(abs, 'utf8')
  const { data, body, endLine } = parseFrontmatter(text)
  return { slug, path, abs, text, data, body, endLine, ...scanBody(body, endLine) }
}
