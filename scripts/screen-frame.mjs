// The document shell for systems/<slug>/screen.html.
//
// The specimen sheet shows every component the system declares, side by side, so
// per-screen limits — "one accent per screen", "at most three summary cards" —
// are not observed there and cannot be. The screen is the other half: one
// composition, fluid and full-bleed, that does observe them.
//
// It renders the same tokens block, through the same shims, under the same
// assertions. The only thing that branches is *what is on the page*, chosen by
// the `register` field — see screens/index.mjs.
//
// Latin copy only. Two systems in the library declare a non-Latin script, and a
// screen needs real sentences where the specimen needs only letterforms. A
// generated sentence in a script the generator cannot read is exactly the
// mistranslation the specimen sheet was careful to avoid, so script reach stays
// the specimen's job and --clp-font-script is not exercised here.

import { FAVICON, list } from './lib.mjs'
import { esc, has, shimBlock, borderless, fontLink, tipTreatment } from './preview-shared.mjs'

export const MARKER = 'Everything below reads --clp-* only'
export const SPECIMEN_OPEN = '<!-- specimen start -->'
export const SPECIMEN_CLOSE = '<!-- specimen end -->'

/**
 * The kit every archetype composes from. Appearance only ever comes from a
 * declared alias or one of the shims; anything an archetype needs beyond this
 * belongs in its own css() so it stays visible as that archetype's decision.
 */
function baseCss(t, meta) {
  const tip = tipTreatment(t)
  return `
/* ${MARKER}, plus the shims that resolve aliases this system declined. */
.scr{${shimBlock(t, meta)}
  background:var(--clp-bg);color:var(--clp-text);font-family:var(--clp-font-body);
  min-height:100vh;display:flex;flex-direction:column;font-size:14px;line-height:1.55}
.scr *{box-sizing:border-box}
.scr p{margin:0}
.scr h1,.scr h2,.scr h3{margin:0;font-family:var(--clp-font-display);line-height:1.15}
.scr h1{font-size:clamp(21px,2.6vw,29px);font-weight:700;letter-spacing:-.01em}
.scr h2{font-size:clamp(17px,1.8vw,20px);font-weight:700}
.scr h3{font-size:15px;font-weight:700}
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
.chart{display:block;width:100%;height:auto}
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
function chrome(meta, archetype, notes) {
  return `<div class="chrome">
  <h1>${esc(meta.system)} <span style="font-weight:400;color:#71717a">${esc(meta.version)}</span></h1>
  <dl>
    <div><dt>screen</dt><dd>${esc(archetype.name)}${archetype.mapped ? '' : ' (default)'}</dd></div>
    <div><dt>register</dt><dd>${esc(meta.register)}</dd></div>
    <div><dt>density</dt><dd>${esc(meta.density)}</dd></div>
    <div><dt>status</dt><dd>${esc(meta.status)}</dd></div>
    <div><dt>origin</dt><dd>${esc(meta.origin)}</dd></div>
  </dl>
  ${meta.origin === 'reference' ? `<p class="prov"><strong>Reference record.</strong>
    A reading of someone else's public work, not an original system.
    ${esc(meta.credit ?? '')} <a href="${esc(meta['source-url'] ?? '')}">Source</a>.
    Tokens are approximations, not the author's values.</p>` : ''}
  ${notes.length ? `<ul class="notes">${notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
</div>`
}

export function screenDocument({ meta, block, t, archetype }) {
  const hasDark = /\[data-mode\s*=\s*["']?dark["']?\]/.test(block.code)
  const spacingFromDensity = !has(t, '--clp-gap') || !has(t, '--clp-pad')

  const notes = [
    `Composition chosen by <code>register: ${esc(meta.register)}</code>` +
      (archetype.mapped ? '.' : ` — no archetype is mapped to it, so this is the <code>${esc(archetype.name)}</code> default.`),
    hasDark ? '' : 'Dark mode was not published for this system, so none is shown.',
    spacingFromDensity ? `Spacing from <code>density: ${esc(meta.density)}</code> — this system declares no spacing step.` : '',
    list(meta.scripts).some(s => s !== 'latin')
      ? 'A screen needs sentences, so this one is set in Latin only. Script reach is shown on the specimen sheet.'
      : '',
  ].filter(Boolean)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.system)} — ${esc(archetype.name)} screen</title>
<link rel="icon" href="${FAVICON}">
${fontLink(block.code)}
<style>
/* Generated by scripts/build-previews.mjs. Do not edit.
   The block below is copied verbatim from the system file. */
${block.code}

/* ── shared shell ─────────────────────────────────────────────────────── */
*{box-sizing:border-box}
body{margin:0;background:#f4f4f5;color:#18181b;font:14px/1.5 system-ui,sans-serif}
.chrome{padding:16px 20px;border-bottom:1px solid #d4d4d8}
.chrome h1{margin:0 0 4px;font-size:17px}
.chrome dl{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0;font-size:12px;color:#52525b}
.chrome dt{font-weight:600}.chrome dd{margin:0 0 0 4px}
.chrome dt,.chrome dd{display:inline}
.prov{margin:10px 0 0;padding:8px 10px;background:#fff7ed;border:1px solid #fed7aa;
      border-radius:4px;font-size:12px;color:#7c2d12;max-width:72ch}
.notes{margin:8px 0 0;padding-left:18px;font-size:12px;color:#52525b}
.notes li{margin:2px 0}
[data-nochrome] .chrome{display:none}
.nodark{margin:0;padding:22px;color:#71717a;font-size:13px}
[data-nodark] .scr{display:none}
${baseCss(t, meta)}
${archetype.module.css(t, meta)}
</style>
</head>
<body>
${chrome(meta, archetype, notes)}
${SPECIMEN_OPEN}
${archetype.module.body(t, meta)}
${SPECIMEN_CLOSE}
<p class="nodark" hidden>Dark mode was not published for this system, so there is nothing to show.</p>
<script>
  // Set before paint. data-mode must live on the root element or the --clp-*
  // aliases keep their light values — see the note at the top of build-previews.mjs.
  const q = new URLSearchParams(location.search)
  const root = document.documentElement
  if (q.get('chrome') === '0') root.dataset.nochrome = ''
  if (q.get('mode') === 'dark') {
    if (${hasDark}) root.dataset.mode = 'dark'
    else { root.dataset.nodark = ''; document.querySelector('.nodark').hidden = false }
  }
</script>
</body>
</html>
`
}
