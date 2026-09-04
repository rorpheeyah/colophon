// The document shell for systems/<slug>/demo-<name>.html.
//
// The specimen sheet shows every component the system declares, side by side, so
// per-screen limits — "one accent per screen", "at most three summary cards" —
// are not observed there and cannot be. A demo is the other half: a whole page,
// fluid and full-bleed, that does observe them.
//
// Every demo renders the same tokens block through the same shims under the same
// assertions. Only the composition differs, and which composition you are
// looking at is the viewer's choice — nothing in the file gates it.
//
// Latin copy only. Two systems in the library declare a non-Latin script, and a
// page needs real sentences where a specimen needs only letterforms. A generated
// sentence in a script the generator cannot read is exactly the mistranslation
// the specimen sheet was careful to avoid, so script reach stays the specimen's
// job and --clp-font-script is not exercised here.

import { FAVICON, list } from './lib.mjs'
import { DEMOS, demoFile } from './demos/index.mjs'
import { esc, has, ref, shimBlock, borderless, fontLink, tipTreatment } from './preview-shared.mjs'

export const MARKER = 'Everything below reads --clp-* only'
export const SPECIMEN_OPEN = '<!-- specimen start -->'
export const SPECIMEN_CLOSE = '<!-- specimen end -->'

/**
 * The kit every demo composes from. Appearance only ever comes from a declared
 * alias or one of the shims; anything a demo needs beyond this belongs in its
 * own css() so it stays visible as that demo's decision.
 */
function baseCss(t, meta) {
  const tip = tipTreatment(t)
  return `
/* ${MARKER}, plus the shims that resolve aliases this system declined. */
.scr{${shimBlock(t, meta)}
  /* A fifth shim, and it belongs to the demos rather than to preview-shared:
     the specimen is a static sheet and renders one frame per mode, so it has no
     business transitioning. Declining a duration gives 0s — no motion at all,
     which is the conservative reading rather than a guessed default. */
  --_dur: ${ref(t, '--clp-duration', '0s')};
  /* Heading weight was the template's own, undeclared and unaliased, and it was
     set to 700 — which Ration forbids by name: "no headline heavier than 500 in
     this system". Declining it keeps the 700 that was already there, so nothing
     changes for a system that never legislated it. */
  --_wdisplay: ${ref(t, '--clp-weight-display', '700')};
  background:var(--clp-bg);color:var(--clp-text);font-family:var(--clp-font-body);
  min-height:100vh;display:flex;flex-direction:column;font-size:14px;line-height:1.55}

/* Motion is opt-in twice over: the system has to declare a duration, and the
   reader has to not have asked for less of it. Two systems in the library
   require this wrapper by name, and none of them loses meaning without motion. */
@media (prefers-reduced-motion: no-preference){
  .btn,.filter,.env,.navgroup a,.range button,.feed-row{
    transition:background-color var(--_dur),color var(--_dur),
      border-color var(--_dur),opacity var(--_dur)}
}
.scr *{box-sizing:border-box}
.scr p{margin:0}
.scr h1,.scr h2,.scr h3{margin:0;font-family:var(--clp-font-display);line-height:1.15}
.scr h1{font-size:clamp(21px,2.6vw,29px);font-weight:var(--_wdisplay);letter-spacing:-.01em}
.scr h2{font-size:clamp(17px,1.8vw,20px);font-weight:var(--_wdisplay)}
.scr h3{font-size:15px;font-weight:var(--_wdisplay)}
.sub{color:var(--clp-text-2);max-width:62ch}
.eyebrow{font:600 10px/1.4 var(--_data);letter-spacing:.12em;text-transform:uppercase;
  color:var(--clp-text-3)}
.muted{color:var(--clp-text-3);font-size:12.5px}
.n{text-align:right;font-family:var(--_data);font-variant-numeric:tabular-nums}

/* Press and focus come from the system. A control that moves has to land
   somewhere, so a system declaring both a press transform and a shadow has the
   shadow flattened while pressed. Declining --clp-focus leaves the platform's
   own ring in place rather than removing the indicator. */
.scr button,.scr select,.scr input{font-family:inherit}
.btn{background:var(--clp-button-bg);color:var(--clp-button-text);border:var(--_border);
  border-radius:var(--clp-radius-control);box-shadow:var(--clp-shadow);
  font:600 13px/1 var(--clp-font-body);padding:11px 17px;cursor:pointer;white-space:nowrap}
.btn.b2{background:var(--clp-button2-bg);color:var(--clp-text)}
.btn.b3{background:transparent;color:var(--clp-text-2);border:0;box-shadow:none}
.btn:active{transform:var(--_press)}
${has(t, '--clp-press') && has(t, '--clp-shadow') ? '.btn:active{box-shadow:none}' : ''}
${has(t, '--clp-focus') ? ':focus-visible{outline:2px solid var(--clp-focus);outline-offset:2px}' : ''}

/* Containment the way the system encloses things: an edge where one is declared,
   a surface step where none is. */
.panel{border:var(--_border);border-radius:var(--clp-radius-box);padding:var(--_pad);
  display:flex;flex-direction:column;gap:var(--_gap);min-width:0${
    has(t, '--clp-card-fill') ? ';background:var(--clp-card-fill)' : ''}}
.panel-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.panel-h span{margin-left:auto;font-size:11.5px;color:var(--clp-text-3)}

.tile{border:var(--_border);border-radius:var(--clp-radius-box);padding:var(--_pad);
  display:flex;flex-direction:column;gap:4px;min-width:0${
    has(t, '--clp-card-fill') ? ';background:var(--clp-card-fill)' : ''}}
.tile span{font-size:11.5px;color:var(--clp-text-3)}
.tile b{font:800 clamp(23px,2.6vw,30px)/1.1 var(--_data);letter-spacing:-.03em;
  font-variant-numeric:tabular-nums}
.delta{font:600 11px/1.6 var(--_data);color:var(--clp-text-2)}

/* table */
.scr table{width:100%;border-collapse:collapse;font-size:13px}
.scr th{text-align:left;font:700 10px/1.6 var(--_data);letter-spacing:.07em;text-transform:uppercase;
  color:var(--clp-text-2);padding:8px 10px;border-bottom:1px solid var(--clp-line);white-space:nowrap}
.scr td{padding:11px 10px;border-bottom:1px solid var(--clp-line);color:var(--clp-text)}
${borderless(t)
  ? `.tblock{background:var(--clp-surface);border-radius:var(--clp-radius-box);overflow:hidden}
.tblock th{padding-top:13px}
.tblock tr:last-child td{border-bottom:0}
.tblock th:first-child,.tblock td:first-child{padding-left:16px}
.tblock th:last-child,.tblock td:last-child{padding-right:16px}`
  : `.tblock{border:var(--_border);border-radius:var(--clp-radius-box);overflow:hidden}
.tblock tr:last-child td{border-bottom:0}
.tblock th:first-child,.tblock td:first-child{padding-left:16px}
.tblock th:last-child,.tblock td:last-child{padding-right:16px}`}
.tscroll{overflow-x:auto}

/* States, by the declared ladder: a fill with --clp-state-text, else coloured
   text on a wash, else coloured text with a border of the same colour. */
.state{border-radius:var(--clp-radius-control);padding:3px 10px;white-space:nowrap;
  font:600 11px/1.6 var(--_data);letter-spacing:.04em;display:inline-block}
${['success', 'warn', 'alarm'].filter(k => has(t, `--clp-${k}`)).map(k => {
  const wash = has(t, `--clp-${k}-wash`)
  // A pill and a banner can differ: a system may fill the small one and tint the
  // large one, which is what --clp-state-text plus a wash means.
  const pill = has(t, '--clp-state-text')
    ? `.s-${k}{background:var(--clp-${k});color:var(--clp-state-text)}`
    : wash
      ? `.s-${k}{color:var(--clp-${k});background:var(--clp-${k}-wash)}`
      : `.s-${k}{color:var(--clp-${k});border:1px solid var(--clp-${k})}`
  const banner = wash
    ? `.a-${k}{background:var(--clp-${k}-wash);color:${
        has(t, '--clp-state-text') ? 'var(--clp-text)' : `var(--clp-${k})`}}`
    : `.a-${k}{color:var(--clp-${k});border:1px solid var(--clp-${k})}`
  return `${pill}\n${banner}`
}).join('\n')}

/* charts — marks take the declared series colours, text never does */
/* A chart's axis text is sized in viewBox units, so it scales with the box. The
   charts are drawn for the specimen's narrow panels; in a full-bleed page the
   same SVG would render at two or three times that and the labels with it. Cap
   the height and the whole mark scales back to something readable. */
.chart{display:block;width:100%;height:auto;max-height:230px;margin-inline:auto}
.ax{font:500 9px var(--_data);fill:var(--clp-text-3);letter-spacing:.04em}
.gridline{stroke:var(--clp-line);stroke-width:1}
.donut{display:block;width:100%;max-width:150px;margin:0 auto;height:auto}
.donut-n{font:800 22px var(--_data);fill:var(--clp-text)}
.spark{display:block;width:110px;height:32px}
.legend{display:flex;gap:var(--_gap);flex-wrap:wrap;font-size:11px;color:var(--clp-text-3)}
.legend span{display:flex;align-items:center;gap:5px}
.legend i{width:9px;height:9px;border-radius:var(--clp-radius-control)}
.ranked{display:flex;flex-direction:column;gap:8px}
.rank{display:grid;grid-template-columns:1fr auto;gap:3px 8px;font-size:12.5px}
.rank b{font-family:var(--_data);font-variant-numeric:tabular-nums}
.rbar{grid-column:1/-1;display:block;height:5px;border-radius:var(--clp-radius-control);
  background:var(--clp-line);overflow:hidden}
.rbar s{display:block;height:100%;text-decoration:none}
.avatar{display:grid;place-items:center;width:28px;height:28px;flex:none;
  border-radius:var(--clp-radius-control);background:var(--clp-line);
  color:var(--clp-text-2);font:700 10px/1 var(--_data)}
${tip ? `.tip{position:fixed;z-index:9;pointer-events:none;${tip};
  border-radius:var(--clp-radius-box);padding:6px 10px;font:500 11.5px/1.5 var(--_data);
  transform:translate(-50%,-140%);white-space:nowrap}` : ''}
`
}

/**
 * The neutral chrome around the screen. Same palette as the specimen's — it is
 * the preview page's own furniture and deliberately not the system's.
 */
/**
 * The neutral chrome: which system this is, which demo you are looking at, and a
 * way to change either. Deliberately not in the system's own palette — it is the
 * page's furniture, and a demo that dressed its own controls in the system would
 * make it impossible to tell the specimen from the frame around it.
 */
function chrome(meta, demo, notes) {
  const picker = DEMOS.length > 1
    ? `<label class="pick">Demo
        <select id="demo">${DEMOS.map(d =>
          `<option value="${esc(demoFile(d.name))}"${d.name === demo.name ? ' selected' : ''}>${
            esc(d.title)}</option>`).join('')}</select>
      </label>`
    : `<span class="pick"><b>Demo</b> ${esc(demo.title)}</span>`

  return `<div class="chrome">
  <div class="crow">
    <h1>${esc(meta.system)} <span class="ver">${esc(meta.version)}</span></h1>
    ${picker}
    <span class="modes" id="modes" hidden>
      <button data-mode="light">Light</button><button data-mode="dark">Dark</button>
    </span>
  </div>
  <p class="blurb">${esc(demo.blurb)}</p>
  ${meta.origin === 'reference' ? `<p class="prov"><strong>Reference record.</strong>
    A reading of someone else's public work, not an original system.
    ${esc(meta.credit ?? '')} <a href="${esc(meta['source-url'] ?? '')}">Source</a>.
    Tokens are approximations, not the author's values.</p>` : ''}
  ${notes.length ? `<ul class="notes">${notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
</div>`
}

export function demoDocument({ meta, block, t, demo }) {
  const hasDark = /\[data-mode\s*=\s*["']?dark["']?\]/.test(block.code)
  const spacingFromDensity = !has(t, '--clp-gap') || !has(t, '--clp-pad')

  // No note about which composition was chosen, because nothing chose it — the
  // viewer did. What is worth saying is what this system declined, since that is
  // why parts of the page look the way they do.
  const notes = [
    hasDark ? '' : 'Dark mode was not published for this system, so none is shown.',
    spacingFromDensity ? `Spacing from <code>density: ${esc(meta.density)}</code> — this system declares no spacing step.` : '',
    list(meta.scripts).some(x => x !== 'latin')
      ? 'A page needs sentences, so this one is set in Latin only. Script reach is shown on the specimen sheet.'
      : '',
  ].filter(Boolean)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.system)} — ${esc(demo.title)}</title>
<link rel="icon" href="${FAVICON}">
${fontLink(block.code)}
<style>
/* Generated by scripts/build-previews.mjs. Do not edit.
   The block below is copied verbatim from the system file. */
${block.code}

/* ── neutral chrome ───────────────────────────────────────────────────── */
*{box-sizing:border-box}
/* Hiding is done with the hidden attribute, and a demo's own display rule beats
   the UA stylesheet's [hidden]{display:none}. Without this the DOM says a row is
   hidden, every derived figure agrees with the DOM, and the reader sees the row
   anyway — which is how a filtered product grid and a zeroed ticket line both
   stayed on screen. */
[hidden]{display:none!important}
body{margin:0;background:#f4f4f5;color:#18181b;font:14px/1.5 system-ui,sans-serif}
.chrome{padding:14px 20px;border-bottom:1px solid #d4d4d8;background:#fafafa}
.crow{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.chrome h1{margin:0;font-size:16px}
.chrome .ver{font-weight:400;color:#71717a}
.pick{font-size:12px;color:#52525b;display:flex;align-items:center;gap:7px}
.pick b{font-weight:600}
.pick select{font:12px system-ui,sans-serif;padding:4px 7px;border:1px solid #d4d4d8;
  border-radius:4px;background:#fff;color:#18181b}
.modes{margin-left:auto;display:flex;gap:3px}
.modes button{font:12px system-ui,sans-serif;padding:4px 10px;cursor:pointer;
  border:1px solid #d4d4d8;border-radius:4px;background:#fff;color:#52525b}
.modes button[aria-pressed="true"]{background:#18181b;border-color:#18181b;color:#fff}
.blurb{margin:7px 0 0;font-size:12.5px;color:#52525b;max-width:78ch}
.prov{margin:9px 0 0;padding:8px 10px;background:#fff7ed;border:1px solid #fed7aa;
      border-radius:4px;font-size:12px;color:#7c2d12;max-width:72ch}
.notes{margin:8px 0 0;padding-left:18px;font-size:12px;color:#52525b}
.notes li{margin:2px 0}
[data-nochrome] .chrome{display:none}
.nodark{margin:0;padding:22px;color:#71717a;font-size:13px}
[data-nodark] .scr{display:none}
${baseCss(t, meta)}
${demo.module.css(t, meta)}
</style>
</head>
<body>
${chrome(meta, demo, notes)}
${SPECIMEN_OPEN}
${demo.module.body(t, meta)}${tipTreatment(t) ? '\n<div class="tip" hidden></div>' : ''}
${SPECIMEN_CLOSE}
<p class="nodark" hidden>Dark mode was not published for this system, so there is nothing to show.</p>
<script>
  // data-mode must live on the root element or the --clp-* aliases keep their
  // light values — see the note at the top of build-previews.mjs.
  const q = new URLSearchParams(location.search)
  const root = document.documentElement
  const hasDark = ${hasDark}
  if (q.get('chrome') === '0') root.dataset.nochrome = ''

  const KEY = 'colophon:demo'
  const pick = document.getElementById('demo')
  // Remembering the choice is what makes the picker useful across systems: pick
  // a demo on one system and the next system's "In use" link opens the same one.
  if (pick) pick.addEventListener('change', () => {
    try { localStorage.setItem(KEY, pick.value) } catch {}
    location.href = pick.value + location.search
  })

  // Hover readout. The surface it wears is whichever separation the system
  // declared — elevation, an edge, or a contrasting fill. A system declaring
  // none of the three gets no tooltip rather than one drawn from nothing.
  const tip = document.querySelector('.tip')
  if (tip) {
    const cross = c => document.querySelectorAll('.cross').forEach(l => {
      if (c === null) return l.setAttribute('hidden', '')
      l.removeAttribute('hidden'); l.setAttribute('x1', c); l.setAttribute('x2', c)
    })
    addEventListener('pointerover', e => {
      const m = e.target.closest('[data-tip]')
      if (!m) return
      tip.textContent = m.dataset.tip
      tip.hidden = false
      cross(m.dataset.x ?? null)
    })
    addEventListener('pointermove', e => {
      if (tip.hidden) return
      tip.style.left = e.clientX + 'px'
      tip.style.top = e.clientY + 'px'
    })
    addEventListener('pointerout', e => {
      if (!e.target.closest('[data-tip]')) return
      tip.hidden = true
      cross(null)
    })
  }

  // Any container a demo marks with data-group moves between two states the
  // system has already declared — active and inactive. Nothing here invents a
  // treatment; it only changes which element wears the one that exists.
  //
  // The selector is a data attribute rather than a list of class names, because
  // a list means every new demo has to register its groups in this shared file,
  // and the first demo that forgot shipped an inert nav and an inert pricing
  // toggle. A demo opts in where its markup is.
  for (const group of document.querySelectorAll('[data-group]')) {
    group.addEventListener('click', e => {
      const hit = e.target.closest('button, a')
      if (!hit || !group.contains(hit)) return
      if (hit.tagName === 'A') e.preventDefault()
      for (const b of group.querySelectorAll('button, a')) {
        const on = b === hit
        b.classList.toggle('on', on)
        if (on) b.setAttribute('aria-current', b.tagName === 'A' ? 'page' : 'true')
        else b.removeAttribute('aria-current')
      }
      group.dispatchEvent(new CustomEvent('demo:select', {
        detail: { group, hit, name: group.dataset.group }, bubbles: true,
      }))
    })
  }


  const MKEY = 'colophon:demo-mode'
  function setMode(m) {
    if (m === 'dark' && !hasDark) {
      root.dataset.nodark = ''
      document.querySelector('.nodark').hidden = false
      return
    }
    delete root.dataset.nodark
    document.querySelector('.nodark').hidden = true
    if (m === 'dark') root.dataset.mode = 'dark'
    else delete root.dataset.mode
    for (const b of document.querySelectorAll('#modes button')) {
      b.setAttribute('aria-pressed', b.dataset.mode === m)
    }
    try { localStorage.setItem(MKEY, m) } catch {}
  }

  let mode = q.get('mode')
  if (!mode) { try { mode = localStorage.getItem(MKEY) } catch {} }
  if (hasDark) {
    document.getElementById('modes').hidden = false
    for (const b of document.querySelectorAll('#modes button')) {
      b.addEventListener('click', () => setMode(b.dataset.mode))
    }
    setMode(mode === 'dark' ? 'dark' : 'light')
  } else if (mode === 'dark') {
    setMode('dark')
  }
</script>
${demo.module.script ? `<script>
${demo.module.script(t, meta)}
</script>` : ''}
</body>
</html>
`
}
