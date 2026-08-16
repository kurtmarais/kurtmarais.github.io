# assets/js/

Site JavaScript. No build step — plain files, loaded directly via `<script>`
tags in `_layouts/default.html`.

- `back-to-top.js` — powers the floating "Back to top" button.
- `dark-mode.js` — light/dark mode toggle.
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
