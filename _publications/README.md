# _publications/

Jekyll collection (configured in `_config.yml`) — one `.md` file per
publication, dataset, thesis, or dissertation. This is the single source of
truth for the Publications page; there is no `_data/publications.yml`.

Each file feeds three places:
- `_layouts/publications.html` — the full `/publications/` list, grouped by
  year, with filter/sort/search.
- `_layouts/publication.html` — the individual page for that item
  (`permalink: /publications/:slug/`, from `_config.yml`), including the
  Google Scholar Highwire meta tags (`citation_*`) and schema.org JSON-LD
  (`ScholarlyArticle` for journal articles, `Dataset`, `Thesis` for
  theses/dissertations) in `_includes/head.html`.
- `/llms.txt` and `/llms-full.txt` (via `_includes/llms.txt`).
- `_includes/publications.html` — the homepage's "Selected publications"
  section, filtered to items with `featured: true`.

To add one, copy the closest existing file in this folder and adjust. Full
field list:

```yaml
---
layout: publication
title: "Article or item title"
type: journal-article          # journal-article | conference-paper | book-chapter | dataset | thesis | dissertation
status:                         # optional: under-review | revise-resubmit | accepted (leave out once published)
featured: false                 # true = also shown on the homepage
authors:
  - "Surname, I."
year: 2026
journal: "Journal name"         # journal-article only
volume: "16"                    # journal-article only
issue: "2"                      # journal-article only
pages: "153-178"                # journal-article only
institution: "Stellenbosch University"   # thesis / dissertation only
publisher: "Stellenbosch University"     # dataset (shown in the venue line) / book-chapter
venue: "Conference name"        # conference-paper (or use `journal`)
book: "Book title"              # book-chapter
impact_factor: "2.4"            # optional: shows "Impact factor 2.4" instead of the live OpenAlex badge
impact_factor_year: "2025"      # optional, shown with impact_factor
doi: "https://doi.org/..."
publication_url: "https://doi.org/..."
keywords:                       # optional — list of strings
abstract: "Full abstract text." # journal-article / thesis / dissertation
description: "What this contains and how it's used." # dataset only, in place of abstract
tags:                           # optional — search-only, never rendered
---
```

Things worth knowing:
- `type` controls both the byline formatting (journal citation vs. "Dataset."
  vs. "Master's/Doctoral thesis, {institution}.") and the filter options on
  the Publications page — it has to be one of the four values above.
- Datasets use `description` instead of `abstract`; everything else uses
  `abstract`. The individual publication page falls back to whichever one
  is present.
- **Abstracts matter for Google Scholar indexing.** If `abstract` (or
  `description`) is left blank, the individual publication page shows a
  "view at publisher" link instead of an abstract, which is weaker for
  Scholar's crawler — it reads the visible abstract text on that page (via
  the `citation_abstract_html_url` tag), not the collapsed version on the
  list page. Several files here still have a `# TODO` comment marking a
  missing abstract — none currently do, but use the same marker if you
  add an item before its abstract is available.
- On the list page, the abstract renders as a collapsible `<details>`
  dropdown (same pattern/CSS as the Supervision and Engagements pages) —
  this is just a display convenience and doesn't affect indexing, since
  `<details>` content is plain HTML in the page source either way.
- `keywords` are always visible on the page ("Keywords: ..."); `tags` are
  never rendered and exist purely for the search box on the Publications
  page.
- No `permalink` is needed in the file: the collection's
  `permalink: /publications/:slug/` in `_config.yml` sets it, and the
  file's slug (its filename, minus `.md`) becomes the URL —
  `_publications/thematic-analysis-r-depression-subreddit.md` →
  `/publications/thematic-analysis-r-depression-subreddit/`. Keep slugs
  short and stable once published, since Scholar and any external links
  will point at that exact URL.

## Publications list layout

- Sections, in this order: Journal articles, Conference papers, Book
  chapters, Under review, Datasets, Theses (thesis + dissertation), newest
  first. A section only appears if it has entries. No numbering or tiles.
- `status: under-review` or `revise-resubmit` moves an item into "Under
  review" (filter type "Under review"). On the list it shows only the
  title, authors and the status badge: no journal name, abstract, Cite or
  links. Its own page shows "Under review" and "Manuscript under review"
  with no journal, abstract or Google Scholar / schema.org tags, and
  llms.txt lists it without venue or abstract. `journal` and `abstract` can
  stay in the file ready for publication; they're just not shown. `status: accepted` keeps the item in its
  type's section with an "Accepted" badge. Remove `status` once published.
- Authors containing `publication_author` from `_config.yml` ("Marais, K")
  are bold.
- Journal impact badge: for journal articles / conference papers with a DOI,
  the visitor's browser asks OpenAlex for the journal's 2-year mean
  citedness (an impact-factor equivalent; cached a week). Hidden if OpenAlex
  has no journal for the DOI. Set `impact_factor` to show a fixed figure
  instead. Citation counts are deliberately not shown.
- Keywords: shown as a plain text line under the venue (not for papers
  under review). Clicking one filters the list to publications with exactly
  that keyword (it fills the search box); clicking it again clears. Items
  with no `keywords` show no line, so add keywords to every item.
- Cite: APA 7, Harvard, MLA 9, Chicago (author-date), IEEE, BibTeX and RIS,
  built in the browser from the front matter (`assets/js/publications-cite.js`),
  with copy and (BibTeX/RIS) download.
