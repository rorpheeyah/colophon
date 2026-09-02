// Reads the system files into the shape every page uses. index.json stays the
// append-only ledger; everything mutable comes from frontmatter on each build.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, systemSlugs, readSystem, scalar, list, tokensBlock, declaredAliases } from '../lib.mjs'

// The first real prose paragraph of the body, used when a system declares no
// `summary` field — so adding that optional field never requires migrating a
// file that predates it. Fenced blocks are removed first, or the install
// snippet inside one gets mistaken for the description.
function derivedSummary(body) {
  const prose = body.replace(/```[\s\S]*?```/g, '')
  for (const raw of prose.split(/\n{2,}/)) {
    const b = raw.trim()
    if (!b || b.length < 60) continue                       // headings, labels, one-liners
    if (/^[#>|\-*\d]/.test(b)) continue                     // heading, quote, table, list
    if (/^\*\*[^*]+\*\*[.:]?$/.test(b)) continue            // a fully bold line
    return b.replace(/\*\*|[*`]/g, '').replace(/\s+/g, ' ')
  }
  return ''
}

export function load() {
  const ledger = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8'))
  const added = Object.fromEntries(ledger.map(e => [e.slug, e.added]))

  return systemSlugs().map(slug => {
    const sys = readSystem(slug)
    const f = sys.data
    const block = tokensBlock(sys.blocks)[0]
    const body = sys.body.replace(/^\s*#\s+.*\n/, '') // the page renders its own h1

    return {
      slug,
      system: scalar(f.system), version: scalar(f.version), status: scalar(f.status),
      origin: scalar(f.origin), register: scalar(f.register), density: scalar(f.density),
      scripts: list(f.scripts), bestFor: list(f['best-for']), avoidFor: list(f['avoid-for']),
      credit: scalar(f.credit), sourceUrl: scalar(f['source-url']),
      added: added[slug] ?? null,
      summary: scalar(f.summary) ?? derivedSummary(body),
      aliases: block ? [...declaredAliases(block.code)] : [],
      hasDark: block ? /\[data-mode\s*=\s*["']?dark["']?\]/.test(block.code) : false,
      sections: sys.headings.filter(h => h.depth === 2).map(h => h.title),
      body,
    }
  })
}
