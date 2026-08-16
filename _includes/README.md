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
- `publications.html` and `publications-list.html` — render the Publications
  page's four sections (featured/published/datasets/theses) from
  `_data/publications.yml`.
