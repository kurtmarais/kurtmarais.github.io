# Kurt Marais — Academic GitHub Pages site

Jekyll site for kurtmarais.github.io, adapted from the Academic Jekyll template.

## Publish

1. Push to a repository named `YOURUSERNAME.github.io`.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select `main` and `/ (root)`.
4. Save and wait for GitHub Pages to build.
5. `_config.yml`'s `url` should match the real Pages address
   (currently `https://kurtmarais.github.io`).

## Main sections

Nav order is set in `_data/settings.yml`'s `menu` list:

- About
- Teaching
- Supervision
- Engagements
- Publications
- CV

`Research` (`research.md`) exists and builds but is commented out of the
nav — only reachable by direct URL.

## Root-level page files

These `.md` files are the actual pages of the site. Each one is mostly just
Jekyll front matter (`layout`, `title`, `permalink`) — the layout named does
the heavy lifting, pulling structured content from `_data/` or the
`_publications/` collection where relevant.

- `index.md` → homepage (`/`). Free-text intro content directly in the file,
  plus the "In the Media" strip pulled automatically from
  `_data/engagements.yml` (entries with `type: media` and `featured: true`).
- `about.md` → `/about/`. Free-text content directly in the file.
- `teaching.md` → `/teaching/`. Content lives directly in the file, but as
  structured HTML blocks (`.course-item`), not markdown prose — copy an
  existing course block when adding one, same as you would with a YAML
  entry elsewhere. See the comments in the file.
- `research.md` → `/research/`. Free-text content directly in the file.
  **Not currently linked in the site navigation** (commented out in
  `_data/settings.yml`) — the page still exists and builds, it's just not
  reachable from the nav bar.
- `supervision.md` → `/supervision/`. No body content — everything comes
  from `_data/supervision.yml`.
- `engagements.md` → `/engagements/`. No body content — everything comes
  from `_data/engagements.yml`.
- `publications.md` → `/publications/`. No body content — everything comes
  from the `_publications/` collection (one `.md` file per publication; see
  `_publications/README.md`).
- `cv.md` → `/cv/`. No body content — everything comes from `_data/cv/`.
  There is no separate CV PDF; the page is rendered entirely from that data.

For About/Teaching/Research/Home, edit the content directly in the file
below the `---` front matter block. For Supervision/Engagements/CV, edit the
corresponding YAML in `_data/` instead. For Publications, add/edit files in
`_publications/`. Editing `supervision.md`, `engagements.md`, or
`publications.md` themselves won't change what's displayed.

## Images

The homepage hero photo is `assets/img/headshot.jpg`. See
`assets/img/README.md` for what else is (and isn't) in use.
