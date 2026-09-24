# Kurt Marais — Academic site

Source for [kurtmarais.github.io](https://kurtmarais.github.io): a Jekyll site
built by GitHub Pages' standard build (Jekyll 3.10, safe-mode plugins only —
no custom plugins). Originally based on the LeNPaul "academic" theme, now
heavily customised.

## How changes go live

GitHub Pages builds from **`main`**, `/ (root)`. Any commit that lands on
`main` is live about 1–2 minutes later (progress shows under the repo's
**Actions** tab).

Preferred workflow: make changes on a branch → open a pull request → review
the diff → merge. Uploading files through the GitHub web UI straight to
`main` works, but leaves no reviewable diff and makes it easy to overwrite a
newer file with an older copy.

Local preview (optional):

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000
```

If Sass fails with `Invalid US-ASCII character`, run with a UTF-8 locale
(`LANG=C.UTF-8 LC_ALL=C.UTF-8 bundle exec jekyll serve`).

## Where content lives

| Page | URL | Edit this |
|---|---|---|
| Home | `/` | `index.md` (intro text); hero/research strip in `_layouts/home.html` |
| About | `/about/` | `about.md` |
| Teaching | `/teaching/` | `teaching.md` (structured `.course-item` HTML blocks — copy an existing one) |
| Supervision | `/supervision/` | `_data/supervision.yml` |
| Engagements | `/engagements/` | `_data/engagements.yml` |
| Posters | `/posters/<slug>/` | `_data/engagements.yml` + a stub in `_posters/` |
| Publications | `/publications/` | one file per item in `_publications/` |
| CV | `/cv/` | `_data/cv/*.yml`, section toggles in `_config.yml` |
| Research | `/research/` | `research.md`, `research/*.md` (not linked in the nav) |

Pages driven by data (Supervision, Engagements, Publications, CV) have no
body content in their root `.md` file — editing that file won't change what
is displayed. Edit the data instead.

The homepage pulls three things automatically:
- **In the Media** — `engagements.yml` entries with `type: media` **and**
  `featured: true` (hidden entirely if `show_media` is false in `_config.yml`).
- **Find me online** — the `social` list in `_data/settings.yml`.
- **Selected publications** — `_publications/` items with `featured: true`.

## Site-wide settings

- `_config.yml` — site URL/title/description, collections (`publications`,
  `posters`), Google Analytics ID, `show_media`, and the `show_cv_*` flags.
- `_data/settings.yml` — nav menu order and social links.

## Folder guide

Each folder has its own README with field-by-field details:

- `_data/` — Supervision, Engagements, settings; `_data/cv/` for the CV.
- `_publications/`, `_posters/` — Jekyll collections.
- `_layouts/`, `_includes/` — page templates and shared fragments.
- `_sass/` — all styling (`main.scss`).
- `assets/` — images, fonts, JS, vendored libraries, poster PDFs.
- `research/` — research-project detail pages.
- `brand/` — logo/favicon source files and `BRAND-GUIDELINES.md`. Not
  published (excluded in `_config.yml`); the live favicons are copies in
  `assets/img/`.

`CLAUDE.md` holds implementation notes and gotchas (icon rendering, Liquid
quirks, carousel behaviour). It is excluded from the build, as are all
README files and `CHANGELOG.md`.
