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

## Engagement type → icon/label system

Used in **both** `engagements.html` and `home.html`'s "In the Media" strip —
these are two separate templates pulling the same `site.data.engagements`,
and both need this logic (a fix in one does not propagate to the other).

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

Meta line format: `[pill+icon] Type · Venue/Publication · Date`. Only emit
the `·` before the date if a date actually exists (`item.start_date` or
`item.date`) — a bare `{{ date }}` field with nothing there leaves a
dangling separator.

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
