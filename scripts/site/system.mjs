import { marked } from 'marked'
import { html, raw, json } from './html.mjs'
import { shell, tags, crumbs } from './layout.mjs'

const slug = s => s.replace(/<[^>]+>/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// marked no longer emits heading ids, and the section nav needs anchors.
const withAnchors = md => marked.parse(md)
  .replace(/<h([23])>(.*?)<\/h\1>/g, (_, lvl, text) => `<h${lvl} id="${slug(text)}">${text}</h${lvl}>`)

const installBlock = s => html`
<section class="install" id="install">
  <h2>Install</h2>
  <ol>
    <li>Save <code>${s.slug}.md</code> as <code>.claude/design-system.md</code>.</li>
    <li>Add to the project's <code>CLAUDE.md</code>:</li>
  </ol>
  <pre id="snippet">## Design system

This project follows ${s.system}. The rules in @.claude/design-system.md are
binding for all UI work. Where a rule and your instinct disagree, the rule wins.</pre>
  <div class="actions">
    <button class="btn" id="copysnip">Copy snippet</button>
    <a class="btn" href="${s.slug}.md" download>Download .md</a>
  </div>
  <details class="alt">
    <summary>Install as a skill instead</summary>
    <p>Save as <code>.claude/skills/design-system/SKILL.md</code> with a frontmatter
    <code>name</code> and <code>description</code>. Costs less context, but is not guaranteed to
    load on a given edit — which is how a system quietly stops being followed.</p>
  </details>
</section>`

export const systemPage = (s, all) => shell({
  base: '../../', current: null, systems: all,
  title: `${s.system} — colophon`,
  body: html`
<div class="wrap">
  ${crumbs('../../', [s.system])}
  <div class="head">
    <div>
      <h1>${s.system} <em>${s.version}</em></h1>
      ${tags(s)}
      ${s.summary && html`<p class="lede">${s.summary}</p>`}
    </div>
    <div class="actions">
      <button class="btn primary" id="copy">Copy file</button>
      <a class="btn" href="${s.slug}.md" download>Download .md</a>
    </div>
  </div>

  ${s.origin === 'reference' && html`<p class="prov">
    <strong>Reference record</strong> — someone else's public work, read and annotated, not a
    claim of authorship. Tokens are approximated by eye. ${s.credit}
    ${s.sourceUrl && html`<a href="${s.sourceUrl}">Source</a>.`}</p>`}

  <div class="frame">
    <b>Generated preview
      ${s.hasDark ? html`<span class="modes">
        <button class="chip" data-pmode="both" aria-pressed="true">Both</button>
        <button class="chip" data-pmode="light" aria-pressed="false">Light</button>
        <button class="chip" data-pmode="dark" aria-pressed="false">Dark</button>
      </span>` : html`<span class="fine">Dark mode was not published for this system</span>`}
      ${s.demos.length && html`<a class="inuse" id="inuse" href="${s.defaultDemo}"
         target="_blank" rel="noreferrer"
         title="A whole page built in this system, at full size">In use &#8599;</a>`}
    </b>
    <div class="pvpair" id="pvpair">
      <div class="pv-light">${s.hasDark ? html`<b>Light</b>` : ''}
        <iframe src="preview.html?chrome=0" title="${s.system} preview, light"></iframe></div>
      ${s.hasDark && html`<div class="pv-dark"><b>Dark</b>
        <iframe src="preview.html?chrome=0&amp;mode=dark" title="${s.system} preview, dark"></iframe></div>`}
    </div>

    ${s.demos.length && html`<p class="fnote">This is the <b>specimen</b> — every component the
      system declares, at once, which is why per-screen limits are not observed here.
      <b>In use</b> opens whole pages built in this system, which do observe them, and lets you
      pick which one.</p>`}
  </div>

  ${s.origin === 'own' ? installBlock(s) : html`
  <section class="install">
    <h2>Not for direct use</h2>
    <p>Fork it into an <code>origin: own</code> system first, and fix what its problem sections
    list.</p>
  </section>`}

  <div class="cols">
    <nav class="toc" aria-label="Sections">
      ${s.sections.map(t => html`<a href="#${slug(t)}">${t}</a>`)}
      <a href="#tokens-table">Declared aliases</a>
    </nav>

    <div class="doc">
      ${raw(withAnchors(s.body))}

      <h2 id="tokens-table">Declared aliases</h2>
      <p><code>none</code> is a refusal the author wrote down. The preview renders nothing for it.</p>
      <table class="aliases">
        <thead><tr><th>Alias</th><th>Value</th></tr></thead>
        <tbody>${s.aliases.map(([name, value]) => html`<tr${value === 'none' ? html` class="declined"` : ''}>
          <td><code>${name}</code></td><td><code>${value}</code></td></tr>`)}</tbody>
      </table>
    </div>
  </div>

  <nav class="pager">
    ${s.prev ? html`<a href="../${s.prev.slug}/index.html">\u2190 ${s.prev.system}</a>` : html`<span></span>`}
    ${s.next ? html`<a href="../${s.next.slug}/index.html">${s.next.system} \u2192</a>` : html`<span></span>`}
  </nav>
</div>
<script id="src" type="application/json">${json(s.body)}</script>
<script>
  const copyTo = async (btn, text, label) => {
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
    catch { btn.textContent = 'Copy failed'; }
    setTimeout(() => { btn.textContent = label; }, 2200);
  };
  const raw = JSON.parse(document.getElementById('src').textContent);
  const copy = document.getElementById('copy');
  copy.addEventListener('click', () => copyTo(copy, raw, 'Copy file'));

  const snip = document.getElementById('copysnip');
  if (snip) snip.addEventListener('click', () =>
    copyTo(snip, document.getElementById('snippet').textContent, 'Copy snippet'));

  // Both iframes stay loaded; the switch only changes which is visible, so
  // there is no reload flicker when flipping between modes.
  const pair = document.getElementById('pvpair');
  for (const btn of document.querySelectorAll('[data-pmode]')) {
    btn.addEventListener('click', () => {
      const m = btn.dataset.pmode;
      pair.dataset.show = m;
      document.querySelectorAll('[data-pmode]').forEach(x =>
        x.setAttribute('aria-pressed', x.dataset.pmode === m));
    });
  }
  pair.dataset.show = ${json(s.hasDark ? 'both' : 'light')};

  // The demo picker remembers what you last looked at, so "In use" opens the
  // same composition on the next system rather than resetting to the default.
  // Rewriting the href beats redirecting on arrival, which would fight the
  // back button.
  const inuse = document.getElementById('inuse');
  if (inuse) {
    const available = ${json(s.demos)};
    let last = null;
    try { last = localStorage.getItem('colophon:demo'); } catch {}
    if (last && available.includes(last)) inuse.href = last;
  }

  // Fit each frame to the preview inside it: no dead space, nothing clipped,
  // whatever a given system's content adds up to. Measured from the parent
  // because both documents are same-origin — messaging from the frame would
  // race the parent's listener and usually lose.
  function fit(f) {
    const doc = f.contentDocument;
    if (!doc) return;
    const set = () => {
      const h = Math.ceil(doc.body.getBoundingClientRect().height) + 2;
      if (Math.abs(h - parseFloat(f.style.height || 0)) > 1) f.style.height = h + 'px';
    };
    set();
    if (doc.fonts) doc.fonts.ready.then(set);
    new ResizeObserver(set).observe(doc.body);
  }
  function fitAll(frames) {
    for (const f of frames) {
      f.addEventListener('load', () => fit(f));
      if (f.contentDocument && f.contentDocument.readyState === 'complete') fit(f);
    }
  }
  fitAll(pair.querySelectorAll('iframe'));
</script>`,
})
