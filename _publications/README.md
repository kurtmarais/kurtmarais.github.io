# _publications/

Jekyll collection (configured in `_config.yml`) — one `.md` file per
publication, dataset, thesis, or dissertation. This is the single source of
truth for the Publications page; there is no `_data/publications.yml`.

Each file feeds three places:
- `_layouts/publications.html` — the full `/publications/` list, grouped by
  year, with filter/sort/search.
- `_layouts/publication.html` — the individual page for that item
  (`permalink: /publications/:slug/`, from `_config.yml`), including the
  Google Scholar Highwire meta tags (`citation_*`) in `_includes/head.html`.
- `_includes/publications.html` — the homepage's "Selected publications"
  section, filtered to items with `featured: true`.

To add one, copy the closest existing file in this folder and adjust. Full
field list:

```yaml
---
layout: publication
title: "Article or item title"
type: journal-article          # journal-article | dataset | thesis | dissertation
featured: false                 # true = also shown on the homepage
authors:
  - "Surname, I."
year: 2026
journal: "Journal name"         # journal-article only
volume: "16"                    # journal-article only
issue: "2"                      # journal-article only
pages: "153-178"                # journal-article only
institution: "Stellenbosch University"   # thesis / dissertation only
doi: "https://doi.org/..."
publication_url: "https://doi.org/..."
keywords:                       # optional — list of strings
abstract: "Full abstract text." # journal-article / thesis / dissertation
description: "What this contains and how it's used." # dataset only, in place of abstract
tags:                           # optional — search-only, never rendered
permalink: /publications/thematic-analysis-r-depression-subreddit/
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
  missing abstract — fill those in with the paper's real text (plain text,
  not reformatted) when available.
- On the list page, the abstract renders as a collapsible `<details>`
  dropdown (same pattern/CSS as the Supervision and Engagements pages) —
  this is just a display convenience and doesn't affect indexing, since
  `<details>` content is plain HTML in the page source either way.
- `keywords` are always visible on the page ("Keywords: ..."); `tags` are
  never rendered and exist purely for the search box on the Publications
  page.
- The file's slug (its filename, minus `.md`) becomes the URL —
  `_publications/thematic-analysis-r-depression-subreddit.md` →
  `/publications/thematic-analysis-r-depression-subreddit/`. Keep slugs
  short and stable once published, since Scholar and any external links
  will point at that exact URL.
