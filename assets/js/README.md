# assets/js/

Site JavaScript. No build step — plain files, loaded directly via `<script>`
tags in `_layouts/default.html`.

- `back-to-top.js` — powers the floating "Back to top" button.
- `dark-mode.js` — light/dark mode toggle. Also handles the mobile
  hamburger menu's open/close click behaviour (the `/* MOBILE MENU */`
  block near the bottom of the file) — a slightly non-obvious pairing,
  since nothing about the filename suggests it also owns the menu.
- `nav-wrap-detect.js` — watches the header nav and switches it into
  hamburger mode whenever the links would actually wrap onto a second
  line, rather than at a fixed screen width. Works alongside (not
  instead of) the `max-width: 767px` rule in `main.scss`, which still
  applies as a zero-JS fallback if this script fails to load. Toggles
  a `.nav-collapsed` class on `.site-header`; all the actual show/hide
  styling for that lives in `main.scss`, not here.
- `supervision-filters.js` — all filter/sort/search logic for the
  Supervision page.
- `engagements-filters.js` — all filter/sort/search logic for the
  Engagements page.
- `footer-links.js` — makes footer quick-links smooth-scroll to top when
  you're already on that page, instead of reloading.
- `media-carousel.js` — the homepage "In the Media" carousel.

If you're editing filter/sort behaviour, `supervision-filters.js` and
`engagements-filters.js` are the two files that matter — everything else is
independent of the content data.
