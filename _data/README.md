# _data/

Structured content that Jekyll reads at build time and injects into the page
templates in `_layouts/`. Nothing in this folder is a full page on its own —
each file feeds one or more pages via Liquid (`site.data.xxx`).

Files here:

- `supervision.yml` — every supervision entry (current and completed). See
  `_data/README.md`'s sibling note below, or the dedicated notes in this
  folder's `supervision.yml` section for the field list.
- `engagements.yml` — talks, panels, guest lectures, seminars, and media
  coverage, shown on the Engagements page and (for `type: media` entries)
  the homepage strip.
- `publications.yml` — four categories of publications (featured, published,
  datasets, theses), shown on the Publications page.
- `settings.yml` — site-wide navigation menu and social media icon links.
  Not something you'd update often — only touch this if you're adding/
  removing a page from the top nav or a social link.
- `cv/` — subfolder, see `_data/cv/README.md`.

**When adding a new entry to `supervision.yml`, `engagements.yml`, or
`publications.yml`**, copy an existing entry as your template and change the
values — don't write one from scratch, since it's easy to miss a field the
template relies on (e.g. `degree_sort` in supervision, which controls sort
order and isn't visually obvious from the entry itself).
