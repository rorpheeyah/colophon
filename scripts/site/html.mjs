// Auto-escaping tagged template. Every interpolation is escaped unless it is
// already Html (from a nested html`` or from raw()), so forgetting to escape is
// no longer possible — the unsafe path is the one you have to ask for by name.

class Html {
  constructor(s) { this.s = s }
  toString() { return this.s }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escape = s => String(s).replace(/[&<>"']/g, c => ESCAPES[c])

// null, undefined and false render as nothing, so `cond && html`...`` works.
function flatten(v) {
  if (v === null || v === undefined || v === false || v === true) return ''
  if (v instanceof Html) return v.s
  if (Array.isArray(v)) return v.map(flatten).join('')
  return escape(v)
}

export const html = (strings, ...values) =>
  new Html(strings.reduce((out, s, i) =>
    out + s + (i < values.length ? flatten(values[i]) : ''), ''))

/** Trusted HTML — only for output of a renderer we control, e.g. marked. */
export const raw = s => new Html(String(s))

/** JSON for embedding in a <script>; `<` is escaped so it cannot close the tag. */
export const json = v => new Html(JSON.stringify(v).replace(/</g, '\\u003c'))
