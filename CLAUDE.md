# Kurt Marais — Academic Site (Jekyll, GitHub Pages)

Static site, GitHub Pages standard build. **No custom Jekyll plugins beyond the
safe-mode allowlist** — this is *why* the posters architecture below looks the
way it does (no generator plugin available to auto-create pages from data).

## Critical gotcha: Font Awesome icons are JS-rendered, not CSS

Icons load via `assets/libs/fontawesome/all.min.js` (currently **Font Awesome
Free 6.7.2**). This script scans the page after load and **replaces every
`<i class="fas fa-x">` with an inline `<svg>`**. By the time the page finishes
rendering, the `<i>` tag no longer exists in the DOM.

**Any CSS rule sizing or coloring an icon must target both:**
```scss
.foo i,
.foo svg {
  /* size, color, margin — whatever you're setting */
}
```
Targeting only `i` compiles fine and silently does nothing. This has broken
things twice already. There is no separate `all.min.css` in use — the JS
bundle injects its own base styles.

**When verifying whether an icon name exists**, check the actual bundled file,
not assumption or a fresh `npm install` without force-removing any existing
`node_modules/@fortawesome` first — a stale cached version will silently
satisfy an unpinned install and give a false read.

## Root font-size is scaled

`html { font-size: 85%; }` — 1rem ≈ 13.6px, not 16px. Relevant any time a rem
value seems visually smaller than expected.

## No sideways scrolling on phones/tablets

Pages wrap content in `.col-lg-10 p-3` (13.6px side padding) and use
`.row.g-5`, whose 3rem gutter pulls rows out 20.4px each side, 6.8px past the
screen below 992px. `main.scss` sets `--bs-gutter-x: 2rem` on `.row.g-5`
below 992px so the pull-out equals the padding. Any new wrapper or row type
must be checked for `scrollWidth > clientWidth` at phone and tablet widths.

## Engagement type → icon/label system

Lives in **one place**: `_includes/engagement-type.html` (sets `type_icon`
and `type_label`), with the date part of the meta line in
`_includes/engagement-date.html`. Both `engagements.html` and `home.html`'s
"In the Media" strip call them with `{% include ... item=item %}` — edit the
include, not the layouts.

Icon and label are assigned **together in one `case` statement**, never two
separate lookups — keeps them from drifting out of sync:
```liquid
{% case item.type %}
  {% when "blog_post" %}{% assign type_icon = "fa-pen-nib" %}{% assign type_label = "Blog post" %}
  {% when "conference" %}{% assign type_icon = "fa-chalkboard-user" %}{% assign type_label = "Conference" %}
  {% when "newspaper" %}{% assign type_icon = "fa-newspaper" %}{% assign type_label = "Newspaper article" %}
  {% when "interview" %}{% assign type_icon = "fa-microphone-lines" %}{% assign type_label = "Interview" %}
  {% when "video" %}{% assign type_icon = "fa-film" %}{% assign type_label = "Video" %}
  {% when "radio" %}{% assign type_icon = "fa-radio" %}{% assign type_label = "Radio" %}
  {% when "podcast" %}{% assign type_icon = "fa-podcast" %}{% assign type_label = "Podcast" %}
  {% when "poster" %}{% assign type_icon = "fa-panorama" %}{% assign type_label = "Poster" %}
  {% when "panel" %}{% assign type_icon = "fa-users-rectangle" %}{% assign type_label = "Panel discussion" %}
  {% when "seminar" %}{% assign type_icon = "fa-walkie-talkie" %}{% assign type_label = "Seminar" %}
{% endcase %}
```
**Fall back to `media_format`** when `type` doesn't match — many entries use
the generic `type: media` with the real distinction living in
`media_format` (`video`/`poster`/`newspaper`/`article`) instead.

Icon renders inside `.engagement-type-pill` (icon-only colored pill), with
the type name as **plain text beside it, not inside the pill** — deliberate,
so it doesn't visually collide with keyword badges, which do have text
inside their pill.

Meta line format: `[pill+icon] Type · Venue/Publication · Date`.
`engagement-date.html` emits the `·` only if a date exists
(`item.start_date` or `item.date`), so there's no dangling separator.

## Posters: single source of truth is `engagements.yml`, not the `.md` stub

`_posters/*.md` files are **intentionally near-empty** — just:
```yaml
---
layout: poster
---
```
All real content (title, authors, abstract, keywords, `poster_pdf` path,
`pdf_width`/`pdf_height`) lives in the matching `engagements.yml` entry.
`poster.html` looks itself up by URL:
```liquid
{% assign poster_data = site.data.engagements | where: "url", page.url | first %}
```
This was a deliberate refactor — the two-file version (data duplicated in
both the stub and engagements.yml) was rejected as redundant maintenance.

**New poster checklist:**
1. Check/fix the PDF's own metadata Title (PowerPoint/Canva exports often
   leave a generic placeholder like "PptxGenJS Presentation" — this becomes
   the browser tab title when the PDF is opened, independent of anything in
   the HTML).
2. Rasterize and crop a thumbnail from the top of the poster — crop tall
   enough to show real content below the title, not just a tight title-only
   band (thumbnails should have visual **parity** with each other across
   different posters — use a fixed target aspect ratio and let
   `object-fit: cover` handle each source image, rather than a bespoke ratio
   per poster).
3. One full `engagements.yml` entry (`media_format: poster`, `type: poster`,
   plus `poster_pdf`, `pdf_width`, `pdf_height`, `authors`, `abstract`).
4. One two-line stub `.md` file in `_posters/`, filename = desired URL slug.
5. `_config.yml` already has the `posters` collection registered
   (`output: true`, `permalink: /posters/:slug/`).

`poster.html` embeds the PDF with `#navpanes=0` (hides the sidebar, keeps the
toolbar/zoom) sized to that poster's own aspect ratio via inline
`style="aspect-ratio: {{ poster_data.pdf_width }} / {{ poster_data.pdf_height }};"`.

## Homepage card text width (`fit-to-title.js`)

The hero intro is capped at the rendered width of the title's longest
wrapped line (measured with a Range over the
title's text, re-run on `document.fonts.ready` and title resize), so text
never runs past the title's right edge. CSS `max-width: 48ch` is only the
no-JS fallback; the script sets an inline `max-width`,
which also overrides the mobile `max-width: none`. Add new title/text pairs
to `PAIRS` in the script. The demo card's description is deliberately not
capped: it runs to the card's right padding (equal to the left).

## Social links carousel (`social-carousel.js`, homepage)

Desktop: static row, all cards shown via `flex`. `.social-carousel-viewport`
needs `overflow: visible` on desktop specifically, or the hover-scale effect
gets clipped by the mask/overflow rules mobile needs for its peek effect.

Mobile: infinite-loop carousel via card cloning (2 clones each end), with a
silent (`transition: none`) snap-back on `transitionend` once the real
animated transition crosses into cloned territory.

**Any `pointerdown` → `setPointerCapture()` call must be scoped to mobile
only** (`window.matchMedia("(max-width: 767px)").matches`). Left unscoped,
it silently breaks nested `<a>` links' native click-to-navigate on desktop —
`:hover` still works fine (separate, CSS-only mechanism), which is what
makes this bug confusing to diagnose. Confirmed root cause, not a guess.

`.social-card-clone` must be `display: none` on desktop, or the cloned cards
show up as stray extra entries in the row.

Desktop/tablet layout (768px+): the strip has a fixed side padding
(`--social-pad`, 2.5rem ≈ 34px) and a fixed gap between cards
(`--social-gap`, 16px); cards are `flex: 1 1 0` and share the rest equally.
The old invisible end-spacer cards are hidden (they made the side space
scale with card width). Names are `nowrap` and centred; below 1200px card
padding drops to 0.5rem so "Research profile" / "Google Scholar" fit.
768–991px: 3×2 grid with the same padding and gap.

## Liquid gotchas worth remembering

- Avoid parenthetical grouping in `{% if %}` (`and (x or y)`) — unreliable
  across Liquid implementations. Pre-compute with `assign` instead
  (e.g. sum two `.size` values and check `> 0`).
- `where_exp` (e.g. `site.data.supervision | where_exp: "s", "s.status == 'completed'"`)
  is genuine, standard Jekyll (since 3.2.0) — used for CV's live student-count
  sections (`show_cv_graduated_students`), which count directly from
  `supervision.yml` rather than storing a separate, redundant count anywhere.

## Established color palette

- Background: `#f7f6f1` light / `#202421` dark
- Link/accent: `#365b52` light / `#9ab8aa` dark (mint)
- Hero card: `#1f352f` light bg / `#f5f1e7` dark bg (deliberately distinct
  from the general link color — sampled from the actual hero CSS, not a
  guess)
- Badge background (keywords, featured, type-pill): `rgba(54,91,82,0.15)`
  light / `rgba(154,184,170,0.15)` dark

## CV toggle flags (`_config.yml`)

`show_cv_awards`, `show_cv_associations`, `show_cv_grants`, `show_cv_service`,
`show_cv_professional_development`, `show_cv_graduated_students`,
`show_cv_links` — each gates one optional CV section. New sections should
follow the same pattern.

## Engagements search (`engagements-filters.js`)

Keyword badges are visible for **every** entry type now (plain and media
alike) via `.engagement-keywords-row` — the topic search selector list reads
that class, not the old hidden `.engagement-keywords` span (removed). Sort
now runs once automatically on page load (`applySort()` called at the end of
the IIFE), so "Newest first" is genuinely true on first render, not only
after the dropdown is touched.

## Reinforcement demo (`reinforcement-demo.html`, `/reinforcement-demo/`)

Self-contained page: all CSS/JS inline, every class and CSS variable
prefixed `rfd-`, variables declared on `.rfd-wrap` (not `:root`) so nothing
leaks into other pages. Consequences worth remembering:

- JS reads colours with `getComputedStyle(.rfd-wrap)` — reading off `<html>`
  returns empty strings. Dark mode overrides the variables under
  `body.dark-mode .rfd-wrap`; a `MutationObserver` on `body`'s class redraws
  the SVGs, because `dark-mode.js` applies the saved preference *after* the
  inline script has drawn.
- SVG node labels are appended to the `<svg>`, not inside `.rfd-node`, so
  label styles target `svg.rfd-network text` / `svg.rfd-rel text`.
- Outlined (not-diagnosed) nodes are `fill:none`; they need
  `pointer-events:all` or only the 2.5px outline is clickable.
- Site-wide `h1`–`h4` are uppercase, and that applies here too.
- Page title (`.rfd-intro h1`): Source Serif 4 at weight 500, the same as
  the homepage hero heading (`.hero-heading`), no rule under it, then a
  normal paragraph gap (1rem) before the intro. The front-matter `title`
  sets the browser tab; keep it the same as the h1.
- `CONNECTION_BOOST = 0.08` represents emotional reinforcement, an observed
  outcome of the dissertation's full simulation (not a parameter estimated
  from the transition table), and is not a placeholder. Keep it at 0.08:
  larger values (tried 0.15) leave tied agents stuck in one state for too
  long given the real posting odds (`POSTING` = dissertation Table 6.5, one
  tick = 24 hours).
- Demo-only rule `MAX_UNREINFORCED_TICKS = 4`: an agent that is NOT
  reinforced can't hold one state for more than 4 ticks; on the 5th it moves
  to one of its other two states, weighted by its own transition odds.
  Reinforced agents (an agent that *influences* it held the same state
  last tick, neutral included) can stay longer. Ties are directional:
  `[a, b, false]` means a influences b only; use `influencersOf()`, never
  an undirected neighbour list (that bug let Users 3/4 look reinforced by
  agents they only influence). That contrast is the point of the demo:
  isolated agents are more volatile than reinforced ones (500 seeds:
  33.9% vs 22.5% state changes per tick). "How this works" describes the
  rule; keep them in sync.
- Every stay past 4 ticks must be visibly explained on screen. Single-agent
  view: a "Reinforced" row. Two-agent view: the pair's "Shared" row plus
  one lighter "from others" row per agent (reinforced by influencers other
  than the selected partner). Both views have a "Reinforcing agent(s) at
  this tick" card. Stat-card headings live in `TEXT` (`streakTitle`,
  `reinforcedBy`, `propTitle`) and are written as plain phrases, not
  clipped labels.
- Starting states: User 03 neutral and User 08 positive, so every directed
  reinforcement combination this network allows (influencer attribute ->
  influenced attribute x shared state x tie type, 18 in total) occurs in ticks 1-24 of the deployed
  run. Re-check coverage if the network, starting states, seeds or rules
  change.
- Sizes: network `max-width: 700px`; agents `NODE_R = 13.5`, isolates
  `ISOLATE_R = 11.5` (drawing units in a 760-wide viewBox). Keep network
  agents smaller than the Relationship panel's (34px).
- Network agents are keyboard-accessible (`tabindex`, `role="button"`,
  Enter/Space) and have an invisible `.rfd-hit` circle (r=30) so the small
  phone-size agents are still easy to tap (about 25px target at 390px).
- Colourblind mode is off for first-time visitors and remembers the last
  choice (`localStorage` key `rfdColourblind`).
- Highlights (network ties, Relationship capsule) only appear once a run
  has started (`runStarted`).
- Reinforcement is shown on the network only as a recoloured tie (same
  stroke width, so arrowheads don't grow), and in the Relationship panel as
  a capsule behind the pair. No highlights on individual network nodes.
- Colourblind-friendly toggle (`.rfd-cb` on `.rfd-wrap`): Okabe-Ito colours,
  + / − / 0 symbols on nodes, striped/dotted timeline cells. Saved in
  localStorage (`rfdColourblind`).
- Key (`aside.rfd-key`, inside the network panel, `.rfd-net-panel`): three
  groups, Agents / Sentiment / Ties. From 900px the panel is a grid: the key
  (210px) is centred both ways in a `minmax(230px, 280px)` second column, in
  the network's row only (row 3), and the SVG is `align-self:center` too, so
  the two are level. Never let the key span the hint/actions rows: that
  stretched them and left a big empty gap at the bottom of the panel before
  an agent was selected. Narrower, the key sits below the Run/Clear row and
  its groups use `auto-fit, minmax(180px, 1fr)`. The colourblind toggle is
  outside the panel, right-aligned just above it (`.rfd-toolbar`). Colourblind
  mode must never add or remove key text: the symbols and patterns show
  inside the sentiment chips (`.rfd-chip-sym` is `visibility:hidden` when
  off, so the chip size doesn't change). The old flex row wrapped and pushed
  the panels down when an extra colourblind line appeared.
- Editable wording: HTML between `EDITABLE TEXT` comments, plus the `TEXT`
  object at the top of the page's `<script>`. No em dashes in page copy.
  `TEXT` messages are single-quoted JS strings: apostrophes inside them must
  be the curly `’`. A straight `'` (e.g. `agent's`) is a syntax error that
  kills the whole script, so the network never renders. Check with
  `node --check` on the extracted script after editing.
- Selecting agents must never reset the network: colours stay at the
  current tick. The run button toggles run / pause / resume. `TICK_MS`
  is the x1 speed; the speed button cycles `SPEEDS` (x0.5, x1, x1.5, x2, x2.5)
  and divides `TICK_MS` by it, restarting the timer if playing.
- Tick inspector: `#rfd-snapshot` ("All agents at tick N", below the
  timelines) shows from the start of every run and follows `currentTick`.
  Agents whose state differs from the previous tick get `.is-changed` and a
  "Changed from X" line (the line's space is always reserved so cards don't
  jump), plus a one-off `.is-flash` only when playback steps onto the tick.
  Every timeline cell in `#rfd-resultsBody` is clickable at any time
  (playing, paused, finished): a click pauses and jumps to that tick. The
  chevron (or a header click) minimises the panel. `revealedTo` (furthest tick reached this run) sets
  how much of each timeline is drawn, so stepping back doesn't hide later
  ticks; stat cards still use `currentTick`. New run / Clear reset it.

Homepage teaser card: markup in `home.html` (after `.research-strip`), styles
under `DEMO TEASER` in `main.scss`; the whole card is clickable via the
link's stretched `::after`. Icon (50px box, between the 44px Research focus
icons and the old 52px): an outline hand (1.6 stroke, filled with the page
background so it hides the rings behind it) tapping a three-ring target.
Index finger up, three curled fingers as bumps, straight thumb angled
down-left; fingertip just below the centre dot so the dot stays visible.
6s loop: hand presses and its outline turns mint (`teaserTap`), then the dot
and rings light up outwards (`teaserDot`, `teaserRing`, 0.25s steps).
Colours come from `--tap-rest` / `--tap-hot` on `.demo-teaser-icon`,
swapped to mint in dark mode. Border trace: `assets/js/demo-teaser-trace.js`
appends an SVG path (rebuilt on resize, corners match the 10px radius) that
starts mid bottom-left corner and runs anticlockwise; `.is-tracing` animates
`stroke-dashoffset` 100 -> 0 on `pathLength="100"` over 2.6s, while a second
animation fades opacity 0.8 -> 0 from 60% onward, so it dissolves before it
closes the loop. Never retraces or erases along the path. Stroke is
`$linkColor` (the card's left-border green) in both themes, 1.5px, faint
2px halo only. First trace 30s after the page opens
(`FIRST_MS`; if the card is off screen then, it waits until the card is in
view), then every 60s (`EVERY_MS`).
Skipped for reduced motion and while the tab is hidden. The SVG is offset
`left: -3px` because the card's left border is 3px (others 1px);
`pointer-events: none` keeps the stretched link clickable.

## Conference map (Engagements page)

Toggle `#ecm-toggle` sits in `.filters-wrapper`, left of the filters; panel
in `_includes/conference-map.html`; behaviour in `assets/js/conference-map.js`;
styles under `CONFERENCE MAP` in `main.scss`. Everything prefixed `ecm-`.

- Data: entries in `engagements.yml` with a `map:` block (`city`, `region`,
  `lat`, `lon`). One dot per region, on the most recent engagement's city;
  older ones listed in the card.
- Projection: coastlines are pre-rendered static SVG (d3-geo
  `geoEqualEarth().scale(155).translate([450,230])`, viewBox `0 0 900 460`).
  The JS `project()` is the same Equal Earth formula at the same scale and
  was checked against d3's output (within 0.01 units), so new dots only
  need lat/lon. Never hand-place pixel coordinates.
- The details card is docked below the map, never floating over it (a
  floating card collided with dots in the mockup's testing).
- Desktop (>= 992px): map is a 380px sticky right column. Narrower: above
  the list. Phones (< 768px): the toggle is an icon-only 1.5rem bubble
  styled like `.engagement-type-pill`.
- Touch: a tap focuses a dot *before* its click fires, so focus from a
  pointer is ignored (otherwise tap shows then immediately hides the card).
  Blur/mouseleave only hide the card if that dot owns it.
- `map.online: true` → outlined gold dot (`.is-online`), "Online" in the
  card. Upcoming = `start_date` after the visitor's today (runtime check in
  JS, so it flips without a rebuild) → dashed ring (`.is-upcoming`), card
  says "Upcoming, <date>". Legend items for online/upcoming only show when
  a dot uses them.
- Dot sizes are screen pixels (`CORE_PX` 5, `HALO_PX` 10), converted to map
  units from the SVG's rendered width and the view (`unitsPerPx()`), resized
  by a `ResizeObserver`. Sizing in map units made dots ~1.4px on the 380px
  column. No white ring on the core (it made dots look smaller); the halo
  only shows on the active dot (halos merged into a blob over Europe).
- Pointer picking: `nearestDot()` picks the closest dot within `PICK_PX`
  (22px) of the pointer, for mouse hover and taps, so close dots
  (Trondheim/Malmö are ~18 map units apart) split the space instead of one
  blocking the other. The card stays on the last dot picked; there's no
  hide on mouse-out (that caused flicker). Keyboard focus still works per
  dot.
- Zoom animates (`animateTo`, ~260ms ease-out, size changes geometrically
  around the fixed point so the zoom anchor stays put). Rapid clicks/wheel
  steps build on `goal()` (the target view), so they accumulate; dragging
  calls `stopAnim()`; `prefers-reduced-motion` zooms instantly.
- Zoom: +/−/reset buttons (bottom-left row), drag to pan when zoomed,
  mouse wheel only in the enlarged view (never hijacks page scroll). Zoom
  changes the SVG viewBox; strokes use `vector-effect: non-scaling-stroke`.
  Never set a halo/core size in CSS (`r:` in CSS overrides the JS radius);
  hover uses `transform: scale()`.
- Enlarge (768px and up): the panel and backdrop move to `<body>` while
  enlarged (the sticky column is its own stacking context) and move back on
  close; Escape/backdrop click closes. The overlay is anchored to the top
  (`top: 4vh`), never vertically centred: centred, a card height change
  re-centred the panel, slid the dot out from under the cursor and made the
  card flicker.
- `.ecm-stage > svg` targets the map only: a plain `.ecm-stage svg` rule
  also hit the Font Awesome zoom icons and blew them up to full width.
- Card: "Earlier in this region" is a newest-first list, one per line,
  capped at `MAX_EARLIER` (3) entries.
- Any engagement type can be mapped (Bath 2023 is a seminar); cards show the
  type via `TYPE_LABELS` in the JS. Heading: "Where I've presented".

