# _layouts/

Page templates. Each `.md` file in the repo root declares one of these in its
front matter (`layout: xxx`), and Jekyll wraps the page's content in that
template. You won't add new files here often — this is where you'd work if
you want to change how a page *looks or is structured*, as opposed to
changing its *content* (which lives in `_data/` or the `.md` files
themselves).

Files here:

- `default.html` — the base template everything else builds on. Wraps every
  page in the header, footer, and back-to-top button.
- `home.html` — the homepage (`/`), including the "In the Media" strip
  (sourced from `_data/engagements.yml` entries where `type: media`).
- `page.html` — generic template for simple content pages (About, Teaching,
  Research).
- `supervision.html` — the Supervision page: filter/sort UI, current and
  completed student lists.
- `engagements.html` — the Engagements page: filter/sort UI, year-grouped
  entries, and the compact media-card variant.
- `publications.html` — the Publications page: filter/sort UI, year-grouped
  entries, sourced from the `_publications/` collection (not a data file —
  see `_publications/README.md`).
- `publication.html` — the individual page for a single publication (e.g.
  `/publications/thematic-analysis-r-depression-subreddit/`), used by every
  file in `_publications/`. Includes the Google Scholar Highwire meta tags
  (via `_includes/head.html`) and shows the full abstract/description.
- `cv.html` — the CV page.
- `contact.html` — layout wrapper used specifically for the contact section
  (paired with `_includes/contact.html`).
- `courses.html`, `people.html`, `post.html` — not currently used by any page
  in the repo. Leftover from the starting theme; safe to ignore unless you
  plan to build a courses or team-members page.
