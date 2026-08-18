# _data/

Structured content that Jekyll reads at build time and injects into the page
templates in `_layouts/`. Nothing in this folder is a full page on its own —
each file feeds one or more pages via Liquid (`site.data.xxx`).

Files here:

- `supervision.yml` — every supervision entry (current and completed). See
  `_data/README.md`'s sibling note below, or the dedicated notes in this
  folder's `supervision.yml` section for the field list.
- `engagements.yml` — talks, panels, guest lectures, seminars, and media
  coverage, shown on the Engagements page. Media entries with `featured: true`
  are also shown in the homepage "In the Media" strip.
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

# Adding a supervision entry

Copy an existing entry in `_data/supervision.yml` and adjust. Full field list:

```yaml
- name: Jane Smith                      # full name, used for A-Z sort
  surname: Smith                        # used as tiebreak in every sort mode
  programme: 'MCom (Operations Research)'   # displayed programme name
  degree_level: Masters                 # one of: PhD, Masters, BDatSci, BComHons
                                         # (controls sort seniority — PhD > Masters > other)
  degree_sort: 2                        # 1 = PhD, 2 = Masters, 3 = anything else
                                         # — must match degree_level or sorting breaks
  status: current                       # 'current' or 'completed' — controls which
                                         # section (and list) the entry renders in
  start_year: 2026                      # year supervision began
  end_year: null                        # year it ended, or `null` if still ongoing
                                         # (leave as `null`, not blank/omitted)
  title: 'Project title here'           # the research project's title
  keywords:                             # optional — list of strings, or `null`
  - keyword one
  - keyword two
  abstract: null                        # optional — free text, or `null`
```

Things that are easy to get wrong:
- `degree_sort` doesn't auto-derive from `degree_level` — you have to set
  both consistently yourself (1 for PhD, 2 for Masters, 3 for anything else).
- `end_year: null` (not omitted, not blank) is what marks a student as
  currently ongoing/current — this drives both the current/completed split
  and several of the sort behaviours on the Supervision page.
- `status` and `end_year` are two separate fields that usually agree with
  each other (`status: completed` + a real `end_year`, or `status: current`
  + `end_year: null`) but aren't automatically kept in sync — check both when
  a student's supervision wraps up.

# Adding an engagements entry

Copy an existing entry in `_data/engagements.yml` and adjust. Full field
list (all fields optional except `title`, `type`, and `year` — only include
the ones relevant to the entry):

```yaml
- title: 'Talk or article title'
  type: conference                # one of: conference, guest_lecture, panel,
                                   # seminar, media
  year: 2026                      # used for year-grouping
  start_date: '2026-08-11'         # optional — ISO date (YYYY-MM-DD)
  end_date: '2026-08-13'           # optional — ISO date; omit for a single-day entry
  venue: 'Conference or event name'   # shown for conference/panel/seminar/etc.
  location: 'City, Country'
  publication: 'Outlet name'      # used for media entries instead of venue
  featured: true                   # optional — featured media appears on homepage
  description: 'One paragraph, always visible if present.'
  abstract: 'Longer text — shown as a collapsible section if present.
             Independent of description; both can appear together.'
  keywords:                       # optional — always visible ("Keywords: ...") if present
  - keyword one
  - keyword two
  tags:                           # optional — NEVER shown on the page, search-only
  - internal search term
  image: 'https://...'            # only for media entries — hotlinked image URL
  media_format: article           # only for media entries — 'article' or 'video'
  url: 'https://...'              # link to the article/recording/page
```

Things worth knowing:
- `type: media` identifies media coverage and controls its media-card presentation.
  It does not automatically place an item on the homepage.
- `featured: true` is an independent flag for media entries. Featured media
  appears in the homepage "In the Media" strip and receives a "Featured"
  badge on the Engagements page.
- `start_date` and `end_date` use ISO format (`YYYY-MM-DD`) and support both
  single-day engagements and date ranges. If `end_date` is omitted, the entry
  is displayed as a single date.
- `media_format` (not `type`) is what triggers the compact media-card visual
  layout — so a recorded seminar, for example, could have `type: seminar` +
  `media_format: video` to stay correctly categorized for filtering while
  still getting the media-card look.
- `description`, `abstract`, and `keywords` can all appear together — none of
  them hide the others.
- `tags` is search-only and never rendered — use it for search terms you
  don't want cluttering the visible entry (e.g. software/tool names,
  alternate spellings).
- `sort_date` is optional and only matters if you have several entries in the
  same `year` and want to control their relative order precisely — without
  it, same-year entries keep their order-of-appearance in the file.

  # Adding a publications entry

The file has four top-level lists: `featured`, `published`, `datasets`,
`theses`. Add your entry to the correct list. Note `featured` and `published`
currently use identical field structures — `featured` is just a curated
subset for highlighting on the page, not a different format. Copy an
existing entry within the right list and adjust.

## `featured` / `published` — journal articles etc.

```yaml
- title: 'Article title'
  authors: 'Surname, I.'
  journal: 'Journal name'
  year: 2026
  volume: '16'
  issue: '2'
  pages: '153-178'
  doi: 'https://doi.org/...'
  publication_url: 'https://doi.org/...'
```

## `datasets`

```yaml
- title: 'Dataset title'
  authors: 'Surname, I'
  type: Dataset
  year: 2026
  description: 'What the dataset contains and how it can be used.'
  doi: 'https://doi.org/...'
  publication_url: 'https://doi.org/...'
```

## `theses`

```yaml
- title: 'Thesis title'
  authors: 'Surname, I.'
  degree: Dissertation        # or 'Thesis', etc.
  institution: 'University name'
  year: 2026
  publication_url: 'https://...'
```
