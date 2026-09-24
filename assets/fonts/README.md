# assets/fonts/

Self-hosted Gotham `.woff2` files (book, medium, bold).

The site's actual typefaces are **Inter** (body) and **Source Serif 4**,
loaded from Google Fonts in `_includes/head.html`. Gotham is only a
fallback in `$bodyFont` in `_sass/main.scss`, after Inter and the system
fonts, so in practice it is never shown.

Note: the `@font-face` rules in `_sass/main.scss` point to
`/assets/fonts/Gotham-Book.woff2` (etc.), but the files here are named
`gotham-book-webfont.woff2`. GitHub Pages is case-sensitive, so those
rules 404. If Gotham is ever wanted, rename the files or fix the URLs;
otherwise the folder and the three `@font-face` blocks can be removed.
