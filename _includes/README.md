# _includes/

Reusable HTML/Liquid snippets included by one or more files in `_layouts/`.
These aren't full pages — they're fragments (nav bar, footer, etc.) shared
across multiple layouts so the same markup doesn't need to be duplicated.
You generally won't touch these unless you're changing sitewide structure
(e.g. adding a new footer link, changing the nav bar) — not for adding
content.

Files here:

- `header.html` — top navigation bar, pulls its links from
  `_data/settings.yml`'s `menu` list.
- `footer.html` — site footer: brand/description, the "Pages" quick-links
  row, and social icons (pulled from `_data/settings.yml`'s `social` list).
- `contact.html` — the "Contact" section that appears at the bottom of every
  page (above the footer).
- `head.html` — the HTML `<head>`: page title, meta tags, favicon, font/CSS
  imports.
- `publications.html` — renders the homepage's "Selected publications"
  section (items from the `_publications/` collection with `featured: true`).
  This is **not** the `/publications/` page itself — that page is rendered
  directly by `_layouts/publications.html`, with no include in between.
- `publications-list.html` — not currently included anywhere in the site.
  Leftover from an earlier `_data`-driven approach to publications, before
  they moved to the `_publications/` collection. Safe to ignore or delete;
  see `_publications/README.md` for how publications actually work now.
