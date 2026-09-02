#!/usr/bin/env node
// Local preview server. Rebuilds previews and the site whenever a source file
// changes, so the UI can be looked at while editing.
//
//   node scripts/serve.mjs [port]      default 4321

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import { join, extname, resolve, sep } from 'node:path'
import { execFileSync } from 'node:child_process'
import { ROOT } from './lib.mjs'

const PORT = Number(process.argv[2]) || 4321
const SITE = join(ROOT, 'site')
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml',
}

let timer = null
let building = false
function rebuild(reason) {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (building) return
    building = true
    try {
      execFileSync('node', ['scripts/build-previews.mjs'], { cwd: ROOT, stdio: 'ignore' })
      execFileSync('node', ['scripts/build-site.mjs'], { cwd: ROOT, stdio: 'ignore' })
      console.log(`  rebuilt — ${reason}`)
    } catch {
      console.error(`  build FAILED — ${reason}. Run \`npm run build\` to see why.`)
    } finally {
      building = false
    }
  }, 120)
}

for (const dir of ['systems', 'scripts', 'site/assets']) {
  watch(join(ROOT, dir), { recursive: true }, (_, file) => {
    if (file && !file.endsWith('preview.html')) rebuild(`${dir}/${file}`)
  })
}

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  let path = resolve(SITE, '.' + (url.endsWith('/') ? url + 'index.html' : url))

  // never serve outside site/
  if (path !== SITE && !path.startsWith(SITE + sep)) {
    res.writeHead(403).end('forbidden')
    return
  }
  try {
    const body = await readFile(path)
    res.writeHead(200, {
      'content-type': TYPES[extname(path)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end(`not found: ${url}`)
  }
}).listen(PORT, () => {
  rebuild('startup')
  console.log(`\n  colophon → http://localhost:${PORT}\n  watching systems/, scripts/, site/assets/\n`)
})
