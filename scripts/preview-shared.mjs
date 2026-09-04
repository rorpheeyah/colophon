import { readFileSync } from 'node:fs'
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

/**
 * A demo's record data, read from scripts/demos/fixtures/<name>.json.
 *
 * **The fixture holds records, not pages.** Which records a demo shows is data;
 * how it composes them is not. Markup, derivations and any sentence with a
 * computed figure in the middle of it stay in the module, because moving those
 * to JSON means inventing a template language to put them back together, and
 * JSON is a poor one. See CLAUDE.md, *Fixtures*.
 */
export function fixture(name) {
  return JSON.parse(readFileSync(new URL(`./demos/fixtures/${name}.json`, import.meta.url), 'utf8'))
}

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

/**
 * True where the system points --clp-accent and --clp-button-bg at the same
 * token, so a primary button already spends the accent and a payoff must not
 * spend it again. Lozenge aliases both to citron and caps citron at one element
 * per screen, which a count of alias references reads as satisfied while the
 * reader sees two.
 *
 * Aliases are `var()` references by contract, so comparing the declared values
 * is enough — the ramp underneath does not need resolving.
 */
export const accentSpentOnButton = t =>
  has(t, '--clp-accent') && t.get('--clp-accent') === t.get('--clp-button-bg')

/**
 * The ground for a bar the page scrolls beneath: sticky, and glass where the
 * system declares glass. Two demos had their own copy of this ladder, which is
 * two places for it to drift — and glass placement is the one rule the template
 * is least allowed to get wrong, because a system may permit it on chrome and
 * forbid it on everything else.
 *
 * A demo supplies its own padding and layout; this is only the ground.
 */
export const glassBar = t =>
  'flex:none;position:sticky;top:0;z-index:5;' + (has(t, '--clp-glass')
    ? `background:var(--clp-glass);border-bottom:1px solid ${
        has(t, '--clp-glass-edge') ? 'var(--clp-glass-edge)' : 'var(--clp-line)'}${
        has(t, '--clp-blur') ? ';backdrop-filter:blur(var(--clp-blur))' : ''}`
    : 'background:var(--clp-bg);border-bottom:1px solid var(--clp-line)')

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
