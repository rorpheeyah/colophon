// The demos: whole pages built in a system, one composition each.
//
// **Nothing here reads the system's frontmatter to decide what it may be shown
// as.** An earlier version mapped `register` to one composition, so Ration was
// shown a dashboard because a table said so — the generator making an editorial
// judgment about the file. A design system can be used for whatever its owner
// wants, so every system gets every demo and the viewer picks.
//
// `best-for` and `avoid-for` stay in the file and stay on the site: they are the
// author telling you something true about the system, which is content in the
// product. They are simply no longer a gate on rendering.
//
// A demo branches on composition only. Appearance is scanned by the same
// assertions as the specimen, so a demo cannot introduce a paint, a radius or a
// shadow the system did not declare.

import * as dashboard from './dashboard.mjs'
import * as landing from './landing.mjs'
import * as editorial from './editorial.mjs'

/**
 * In order. The first is the default — what `In use` opens when a viewer has no
 * remembered choice.
 */
export const DEMOS = [
  { name: 'dashboard', title: 'Dashboard', module: dashboard,
    blurb: 'A service reliability console: dense figures, a data table, live state.' },
  { name: 'landing', title: 'Landing', module: landing,
    blurb: 'A product and pricing page: one hero, one payoff, plans in a table.' },
  { name: 'editorial', title: 'Editorial', module: editorial,
    blurb: 'A long-form report: one measure, a ruled table, figures on one spine.' },
]

export const DEFAULT_DEMO = DEMOS[0].name
export const demoFile = name => `demo-${name}.html`
export const findDemo = name => DEMOS.find(d => d.name === name)
