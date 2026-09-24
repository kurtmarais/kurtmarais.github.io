# assets/libs/

Vendored third-party libraries — don't hand-edit; to upgrade, replace the
whole subfolder with the new release.

- `bootstrap/` — Bootstrap CSS (grid/utilities only; no Bootstrap JS).
- `fontawesome/all.min.js` — **Font Awesome Free 6.7.2**, JS/SVG build. There
  is no Font Awesome CSS file: the script replaces each `<i class="fa…">`
  with an inline `<svg>` after load, so CSS must target `svg` as well as `i`
  (see `_sass/README.md`).

To check whether an icon name exists in this version, search this file
(e.g. `grep -c '"users-rectangle"' fontawesome/all.min.js`) rather than the
Font Awesome website, which lists newer and Pro-only icons.
