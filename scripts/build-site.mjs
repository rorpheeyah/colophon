#!/usr/bin/env node
// Builds the static browse UI into site/ from the system files.
//
//   node scripts/build-site.mjs           write the site
//   node scripts/build-site.mjs --check   exit 1 if anything is stale
//
// site/assets/style.css is hand-written source. Everything else under site/ is
// generated and committed, so the site can be served from any static host with
// no build step. index.json stays the append-only ledger; site/data.json is
// derived from frontmatter on every build and can never go stale.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './lib.mjs'
import { load } from './site/data.mjs'
import { libraryPage } from './site/library.mjs'
import { systemPage } from './site/system.mjs'
import { comparePage } from './site/compare.mjs'
import { aboutPage } from './site/about.mjs'
import { colophonPage } from './site/colophon.mjs'

// The site emits JavaScript as strings, and html`` escapes interpolations —
// so a bare quoted string interpolated into a <script> silently becomes
// &#39;...&#39;. Parse every inline script at build time rather than finding
// out from a console error.
function assertScriptsParse(html, label) {
  const re = /<script(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g
  for (const [, code] of html.matchAll(re)) {
    try {
      new Function(code)
    } catch (e) {
      throw new Error(`${label}: inline script does not parse — ${e.message}`)
    }
  }
  const jsonRe = /<script[^>]*application\/json[^>]*>([\s\S]*?)<\/script>/g
  for (const [, payload] of html.matchAll(jsonRe)) {
    try {
      JSON.parse(payload)
    } catch (e) {
      throw new Error(`${label}: embedded JSON payload is invalid — ${e.message}`)
    }
  }
  return html
}

const all = load()
const files = new Map()

files.set('index.html', assertScriptsParse(String(libraryPage(all)), 'index.html'))
files.set('compare.html', assertScriptsParse(String(comparePage(all)), 'compare.html'))
files.set('about.html', assertScriptsParse(String(aboutPage(all)), 'about.html'))
files.set('colophon.html', assertScriptsParse(String(colophonPage(all)), 'colophon.html'))
files.set('assets/mark.svg', readFileSync(join(ROOT, 'site', 'assets', 'mark.svg'), 'utf8'))
files.set('data.json', JSON.stringify(
  all.map(({ body, aliases, sections, prev, next, ...rest }) => rest), null, 2) + '\n')

const link = n => n ? { slug: n.slug, system: n.system } : null
all.forEach((s, i) => {
  s.prev = link(all[i - 1])
  s.next = link(all[i + 1])
})

for (const s of all) {
  const dir = join(ROOT, 'systems', s.slug)
  files.set(`s/${s.slug}/index.html`, assertScriptsParse(String(systemPage(s, all)), `s/${s.slug}/index.html`))
  files.set(`s/${s.slug}/${s.slug}.md`, readFileSync(join(dir, `${s.slug}.md`), 'utf8'))
  files.set(`s/${s.slug}/preview.html`, readFileSync(join(dir, 'preview.html'), 'utf8'))
  const screen = join(dir, 'screen.html')
  if (existsSync(screen)) files.set(`s/${s.slug}/screen.html`, readFileSync(screen, 'utf8'))
  for (const mode of ['light', 'dark']) {
    const thumb = join(dir, `thumb-${mode}.svg`)
    if (existsSync(thumb)) files.set(`s/${s.slug}/thumb-${mode}.svg`, readFileSync(thumb, 'utf8'))
  }
}

const builtSlugs = () => existsSync(join(ROOT, 'site', 's')) ? readdirSync(join(ROOT, 'site', 's')) : []
const orphans = () => builtSlugs().filter(slug => !all.some(s => s.slug === slug))

if (process.argv.includes('--check')) {
  const stale = [...files]
    .filter(([rel, content]) => {
      const abs = join(ROOT, 'site', rel)
      return !existsSync(abs) || readFileSync(abs, 'utf8') !== content
    })
    .map(([rel]) => rel)
    .concat(orphans().map(s => `s/${s} (system no longer in the repo)`))

  for (const f of stale) console.log(`stale: site/${f}`)
  process.exit(stale.length ? 1 : 0)
}

for (const slug of orphans()) rmSync(join(ROOT, 'site', 's', slug), { recursive: true })
for (const [rel, content] of files) {
  const abs = join(ROOT, 'site', rel)
  mkdirSync(join(abs, '..'), { recursive: true })
  writeFileSync(abs, content)
}
console.log(`  wrote site/ — ${files.size} files, ${all.length} system(s)`)
