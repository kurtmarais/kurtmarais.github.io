# _includes/

Reusable HTML/Liquid fragments pulled into layouts with
`{% include name.html %}`. Edit these when changing sitewide structure or
shared rendering logic — not for adding content.

Sitewide (every page, via `_layouts/default.html`):

- `head.html` — the `<head>`: title, meta/Open Graph tags, favicons,
  Bootstrap, Font Awesome, `main.css`, `dark-mode.js`, Google Fonts,
  JSON-LD, Google Scholar `citation_*` tags and schema.org structured data
  (`ScholarlyArticle` / `Dataset` / `Thesis`) on publication pages, and
  Google Analytics (only if `google_analytics_id` is set in `_config.yml`).
- `header.html` — top nav, links from `_data/settings.yml`'s `menu`.
- `contact.html` — the "Contact" section above the footer.
- `footer.html` — brand/description, quick links, social icons (from
  `_data/settings.yml`'s `social`).

Shared engagement logic (used by `_layouts/engagements.html` **and** the
homepage "In the Media" strip in `_layouts/home.html` — change it here once
and both pages follow):

- `engagement-type.html` — sets `type_icon` and `type_label` for an entry
  from its `type`, falling back to `media_format`. Call with
  `{% include engagement-type.html item=item %}`, then use the two
  variables. To add a new type, add one `when` line here (icon and label
  together) and document it in `_data/README.md`.
- `engagement-date.html` — prints ` · 11 August 2026` (or a date range) for
  an entry, or nothing if it has no date. Call with
  `{% include engagement-date.html item=item %}`.

Engagements page:

- `conference-map.html` — the conference map panel: pre-rendered Equal
  Earth coastlines (static SVG, no map library) plus the dot data as JSON,
  built from `_data/engagements.yml` entries with a `map:` block. Behaviour
  in `assets/js/conference-map.js`.

Homepage:

- `publications.html` — the homepage "Selected publications" section
  (`_publications/` items with `featured: true`). Not the `/publications/`
  page itself — that's `_layouts/publications.html`.

AI summary:

- `llms.txt` — the body of `/llms.txt` and `/llms-full.txt` (root files of
  the same names just include it; `full=true` adds abstracts). Loops over
  `_publications/`, `_data/engagements.yml`, `_data/supervision.yml` and
  `_data/settings.yml`; the research areas, key findings and search terms
  are hand-written in this file, as are the future research directions,
  collaboration and prospective-student text.
