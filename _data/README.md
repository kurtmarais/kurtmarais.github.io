# _data/

Structured content that Jekyll reads at build time and injects into the page
templates in `_layouts/`. Nothing in this folder is a full page on its own —
each file feeds one or more pages via Liquid (`site.data.xxx`).

Publications are **not** here — they're a Jekyll collection in
`_publications/` (one `.md` file per publication), not a data file. See
`_publications/README.md`.

Files here:

- `supervision.yml` — every supervision entry (current and completed).
  Schema below.
- `engagements.yml` — talks, panels, seminars, blog posts, posters and media
  coverage, shown on the Engagements page. `type: media` entries with
  `featured: true` also appear in the homepage "In the Media" strip. Poster
  entries also power their own `/posters/<slug>/` page. Schema below.
- `settings.yml` — the top nav (`menu`) and social links (`social`). Each
  social entry is `{name, icon, link}`; the list feeds the footer icons, the
  homepage "Find me online" carousel, and the CV's "Online Profiles"
  section (when `show_cv_links` is on). `icon` is a Font Awesome 6 class
  (e.g. `fab fa-orcid`) — check it exists in
  `assets/libs/fontawesome/all.min.js` (Font Awesome Free 6.7.2).
- `cv/` — subfolder, see `_data/cv/README.md`.

**When adding a new entry to `supervision.yml` or `engagements.yml`**, copy
an existing entry as your template and change the values — don't write one
from scratch, since it's easy to miss a field the template relies on (e.g.
`degree_sort` in supervision, which controls sort order and isn't visually
obvious from the entry itself).

# Adding a supervision entry

Copy an existing entry in `_data/supervision.yml` and adjust. Full field list:

```yaml
- name: Jane Smith                      # full name, used for A-Z sort
  surname: Smith                        # used as tiebreak in every sort mode
  programme: 'MCom (Operations Research)'   # displayed programme name
  degree_level: Masters                 # one of: PhD, Masters, BDatSci, BComHons
                                         # (also drives the CV's student counts)
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
- The CV's "Students Graduated" section counts entries live from this file
  by `status`, `degree_level` and (for Honours) the exact `programme`
  string — `'BComHons (Operations Research)'` or
  `'BComHons (Quantitative Management)'`. A typo in those strings drops the
  student from the count.
- `status` and `end_year` are two separate fields that usually agree with
  each other (`status: completed` + a real `end_year`, or `status: current`
  + `end_year: null`) but aren't automatically kept in sync — check both when
  a student's supervision wraps up.

# Adding an engagements entry

Copy an existing entry of the same kind in `_data/engagements.yml` and
adjust. Only `title`, `type` and `year` are required — include only the
fields relevant to the entry:

```yaml
- title: 'Talk or article title'
  type: conference                # see "Types" below — also becomes a filter option
  year: 2026                      # year grouping on the page
  start_date: '2026-08-11'        # optional — ISO date (YYYY-MM-DD)
  end_date: '2026-08-13'          # optional — omit (or repeat start_date) for a single day
  venue: 'Conference or event name'
  location: 'City, Country'       # shown after venue
  publication: 'Outlet name'      # shown instead of venue/location if present
  featured: true                  # optional — "Featured" badge; homepage strip if type: media
  description: 'One paragraph, always visible.'
  abstract: 'Longer text — collapsible "Abstract" toggle (not shown for posters).'
  keywords:                       # optional — visible badges, and searchable
  - keyword one
  tags:                           # optional — never shown, search-only
  - internal search term
  media_format: article           # optional — switches to the media-card layout (see below)
  image: '/assets/img/file.jpg'   # media-card thumbnail — local path or full https:// URL
  url: 'https://...'              # where the thumbnail and "Read/Watch/View" link go
```

## Types

`type` picks the icon and label shown in the meta line
(`[icon] Type · Venue · Date`):

| `type` | Label | Icon |
|---|---|---|
| `blog_post` | Blog post | pen nib |
| `conference` | Conference | chalkboard |
| `newspaper` | Newspaper article | newspaper |
| `interview` | Interview | microphone |
| `video` | Video | film |
| `radio` | Radio | radio |
| `podcast` | Podcast | podcast |
| `poster` | Poster | panorama |
| `panel` | Panel discussion | users |
| `seminar` | Seminar | walkie-talkie |
| `media` | from `media_format` | from `media_format` |

`type: media` has no icon of its own — the icon/label come from
`media_format` instead (`video`, `poster`, `newspaper`, `article`). Any other
unknown `type` renders with no icon. The mapping lives in one place,
`_includes/engagement-type.html`, used by both the Engagements page and the
homepage.

## media_format

Setting `media_format` switches an entry to the media-card layout
(thumbnail + link), independent of its `type`:

- `article` / `newspaper` → "Read article →"
- `video` → play-icon overlay, "Watch video →"
- `poster` → wide thumbnail crop, "View poster →", links to the poster page

So a recorded seminar can be `type: seminar` + `media_format: video` — it
filters as a seminar but gets the video card.

## Dates

- `start_date`/`end_date` in ISO format. Displayed as "11 August 2026" or
  "11 August 2026–13 August 2026" for a range.
- No date → the meta line simply ends after the venue (no trailing `·`).
- Sort order ("Newest first" is applied on page load) uses `start_date`,
  falling back to the optional `sort_date`, then order in the file.

## Posters

Poster entries hold everything the poster page shows. Extra fields:

```yaml
  type: "poster"
  media_format: poster
  url: "/posters/your-slug/"            # must match the _posters/ stub's URL
  image: "/assets/img/engagements/your-slug-thumb.jpg"
  authors:
    - "Kurt Marais"
  poster_pdf: "/assets/posters/Your_Poster.pdf"
  pdf_width: 2383.92                    # PDF page size in points — sets the
  pdf_height: 3370.32                   # embed's aspect ratio
  abstract: |                           # Markdown; shown as "Overview"
    ...
```

Full checklist in `_posters/README.md`.
