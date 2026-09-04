// Which composition a system's screen gets, chosen by its `register` field.
//
// This is the one place the screen template branches, and it branches on
// composition only — never on appearance. Every archetype is scanned by the same
// assertions as the specimen, so none of them can introduce a paint, a radius or
// a shadow the system did not declare. What an archetype decides is *what is on
// the page*, which is the same kind of decision `density` already makes about
// spacing: a value read out of the file rather than one invented beside it.
//
// `register` is deliberately open — CLAUDE.md gives it as "one word, e.g.
// utility, editorial" and does not enumerate it. So an unmapped register must
// never fail the build. It falls back to `console`, the composition closest to
// the specimen, and validate.mjs warns so the author can see they took the
// default rather than chose it.

import * as console_ from './console.mjs'

export const DEFAULT_ARCHETYPE = 'console'

/** register -> archetype name. Additions here are compositions, not appearances. */
export const REGISTER_ARCHETYPE = {
  technical: 'console',
  utility: 'console',
}

export const ARCHETYPES = {
  console: console_,
}

/** The archetype for a system, and whether it was chosen or defaulted. */
export function archetypeFor(meta) {
  const name = REGISTER_ARCHETYPE[meta.register]
  return {
    name: name ?? DEFAULT_ARCHETYPE,
    mapped: name !== undefined,
    module: ARCHETYPES[name ?? DEFAULT_ARCHETYPE],
  }
}
