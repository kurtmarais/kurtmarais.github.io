# _layouts/

Page templates. Each page declares one in its front matter
(`layout: xxx`). Work here to change how a page *looks or is structured*;
content lives in `_data/`, the collections, or the root `.md` files.

- `default.html` — base template for everything: header, contact section,
  footer, back-to-top button, and the sitewide scripts (`back-to-top.js`,
  `footer-links.js`, `media-carousel.js`, `nav-wrap-detect.js`).
- `home.html` — homepage (`/`): hero with headshot and `index.md` intro,
  animated "Research focus" strip (inline SVG icons), the "Try it yourself"
  teaser card linking to `/reinforcement-demo/` (styles under DEMO TEASER in
  `_sass/main.scss`), "In the Media"
  carousel (`type: media` + `featured: true` engagements), "Find me online"
  social carousel (`social-carousel.js`), then "Selected publications"
  (`_includes/publications.html`).
- `page.html` — simple content pages (About, Teaching, Research,
  `research/*`).
- `supervision.html` — Supervision page: filters/sort/search, current and
  completed lists (`supervision-filters.js`).
- `engagements.html` — Engagements page: filters/sort/search, year groups,
  standard entries and media cards (`engagements-filters.js`). Type
  icon/label and date come from `_includes/engagement-type.html` and
  `_includes/engagement-date.html`.
- `publications.html` — Publications page: filters/sort/search, year
  groups, from the `_publications/` collection (`publications-filters.js`).
- `publication.html` — a single publication's page
  (`/publications/<slug>/`); pairs with the Scholar meta tags in
  `_includes/head.html`.
- `poster.html` — a single poster's page (`/posters/<slug>/`). Finds its
  data by matching `page.url` against `url` in `_data/engagements.yml`,
  then shows title, authors, overview (abstract), keywords and the
  embedded PDF (`#navpanes=0`, aspect ratio from `pdf_width`/`pdf_height`).
  See `_posters/README.md`.
- `cv.html` — CV page, sections gated by `show_cv_*` flags (see
  `_data/cv/README.md`).
- `contact.html` — wrapper around `_includes/contact.html`.

