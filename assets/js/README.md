# assets/js/

Plain JavaScript, no build step.

Loaded on every page (`_includes/head.html` / `_layouts/default.html`):

- `dark-mode.js` — light/dark toggle. **Also** owns the mobile hamburger
  menu open/close (the `/* MOBILE MENU */` block near the bottom).
- `nav-wrap-detect.js` — switches the header into hamburger mode when the
  nav links would wrap, rather than at a fixed width. Toggles
  `.nav-collapsed` on `.site-header`; the `max-width: 767px` CSS rule
  remains a no-JS fallback.
- `back-to-top.js` — floating "Back to top" button.
- `footer-links.js` — footer links smooth-scroll to top when already on
  that page.
- `media-carousel.js` — homepage "In the Media" carousel (no-op on other
  pages).

Loaded only by the page that needs it:

- `social-carousel.js` — homepage "Find me online". Desktop: static row.
  Mobile: infinite loop using 2 cloned cards at each end with a silent
  snap-back. Any `setPointerCapture()` must stay mobile-only — on desktop
  it breaks the links' click-through while hover still looks fine.
- `engagements-filters.js` — Engagements filters/sort/search. Topic search
  reads the visible `.engagement-keywords-row` badges plus hidden `tags`.
  Sorts "Newest first" on page load.
- `publications-filters.js` — Publications filters/sort/search.
- `supervision-filters.js` — Supervision filters/sort/search.
- `conference-map.js` — Engagements page conference map: MAP toggle,
  Equal Earth projection of each `map:` entry's lat/lon, one dot per
  region, docked details card (hover on desktop, tap on touch screens,
  focus/Enter/Escape on keyboard).
- `research-network.js` — the animated OR ↔ Computational Social Science
  network on the About page (loaded from `about.md`).
