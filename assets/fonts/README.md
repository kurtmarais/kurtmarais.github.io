# assets/fonts/

Self-hosted Gotham `.woff2` files (book 400, medium 500, bold 700), declared
with `@font-face` at the top of `_sass/main.scss`. The URLs there must match
these filenames exactly — GitHub Pages is case-sensitive.

The site's primary typefaces are **Inter** (body) and **Source Serif 4**,
loaded from Google Fonts in `_includes/head.html`. Gotham sits in
`$bodyFont` after Inter and the system UI fonts, so it is a fallback: it
only shows if those are unavailable. To make Gotham the body font, move
`"Gotham"` to the front of `$bodyFont` in `_sass/main.scss`.
