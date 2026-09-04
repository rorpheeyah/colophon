// The parts of the preview template that `preview.html` and `screen.html` must
// resolve identically.
//
// Both artifacts render the same file. If the specimen and the screen resolved a
// declined alias differently — one falling back to the body family, the other to
// a generic — they would contradict each other about what the system says, and
// the file is supposed to be the single source of truth. So the shim layer, the
// density presets and the tooltip ladder live here and are imported by both,
// for the same reason lib.mjs holds the parsing: two renderers cannot drift if
// there is only one of each rule.

export const esc = s =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export const has = (t, name) => { const v = t.get(name); return v !== undefined && v !== 'none' }
export const ref = (t, name, fallback) => (has(t, name) ? `var(${name})` : fallback)

// Spacing for a system that declines --clp-gap/--clp-pad. Chosen by the `density`
// field, which every system declares, so this is still the file speaking.
export const DENSITY = {
  compact:     { gap: '8px',  pad: '12px 14px' },
  comfortable: { gap: '14px', pad: '18px 20px' },
  spacious:    { gap: '18px', pad: '22px 24px' },
}

export const densityFor = meta => DENSITY[meta.density] ?? DENSITY.comfortable

/**
 * The four shims named in CLAUDE.md, plus the border composite. Each one exists
 * solely to resolve an alias the system declined; none of them invents a value
 * the file does not imply.
 */
export function shimBlock(t, meta) {
  const d = densityFor(meta)
  return [
    `--_gap: ${ref(t, '--clp-gap', d.gap)};`,
    `--_pad: ${ref(t, '--clp-pad', d.pad)};`,
    `--_data: ${ref(t, '--clp-font-data', 'var(--clp-font-body)')};`,
    `--_script: ${ref(t, '--clp-font-script', 'var(--clp-font-body)')};`,
    `--_press: ${ref(t, '--clp-press', 'none')};`,
    `--_border: ${has(t, '--clp-border-color') ? 'var(--clp-border-width) solid var(--clp-border-color)' : '0'};`,
  ].join(' ')
}

/** True where the system draws no container edge, so containment is a surface step. */
export const borderless = t => /^0[a-z]*$/.test(t.get('--clp-border-width') ?? '0')

// Every quoted family named in the tokens block, so both artifacts set in the
// system's own type rather than in a fallback that flattens every system alike.
export function fontLink(css) {
  const families = [...new Set([...css.matchAll(/"([A-Z][A-Za-z0-9 ]+)"/g)].map(m => m[1]))]
    .filter(f => !/^(system-ui|ui-monospace|sans-serif|serif|monospace)$/i.test(f))
  if (!families.length) return ''
  const q = families.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`).join('&')
  return `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n` +
         `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${q}&display=swap">`
}

// A floating surface has to separate from whatever sits behind it. The three ways
// are elevation, an edge, or a contrasting fill — and the system says which of
// those it owns. A system declaring none of the three gets no floating surface
// rather than one composed from nothing.
export function tipTreatment(t) {
  const bw = t.get('--clp-border-width') ?? '0'
  if (has(t, '--clp-shadow-surface')) {
    return `background:var(--clp-surface);color:var(--clp-text);` +
      `box-shadow:var(--clp-shadow-surface);border:0`
  }
  if (has(t, '--clp-border-color') && !/^0[a-z]*$/.test(bw)) {
    return `background:var(--clp-surface);color:var(--clp-text);` +
      `border:var(--clp-border-width) solid var(--clp-border-color)`
  }
  if (has(t, '--clp-invert-bg')) {
    return `background:var(--clp-invert-bg);color:var(--clp-invert-text);border:0`
  }
  return null
}
