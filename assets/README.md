# assets/

Static files served as-is (plus `css/main.scss`, which Jekyll compiles).

- `css/` — stylesheet entry point (real styles are in `_sass/main.scss`).
- `fonts/` — self-hosted Gotham webfonts.
- `img/` — site images, favicons, engagement thumbnails.
- `js/` — site scripts, no build step.
- `libs/` — vendored Bootstrap and Font Awesome.
- `posters/` — poster PDFs embedded on `/posters/<slug>/` pages (see
  `_posters/README.md`).
- `references/` — BibTeX file, not used by the build.
- `apple-icon-152x152.png` — not referenced by any template (the live
  Apple touch icon is `img/favicon-180.png`). Safe to delete.
