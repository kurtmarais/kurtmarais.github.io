# Changelog

Notable changes to kurtmarais.github.io. Earlier history was uploaded file-by-file
through the GitHub web UI and is not itemised; the site as of 2026-09-24
is the baseline. Add new entries at the top.

## 2026-09-24 (4)

### Added
- schema.org JSON-LD on every publication page (`ScholarlyArticle`,
  `Dataset`, `Thesis`), generated from the same front matter as the Google
  Scholar tags.
- `llms.txt`: current and future research directions, collaboration
  interests, self-funded PhD/Master's supervision, professional
  memberships, and a preferred citation for the DPR lexicon.

## 2026-09-24 (3)

### Added
- `/llms.txt` and `/llms-full.txt`: plain-text research summary for language
  models and AI search tools, generated from site data via
  `_includes/llms.txt`. Not in the nav or sitemap.

## 2026-09-24 (2)

### Fixed
- Gotham `@font-face` URLs now match the actual filenames in
  `assets/fonts/` (they pointed to `Gotham-Book.woff2` etc., which 404'd).

### Removed
- Unused templates `_layouts/courses.html`, `_layouts/people.html`,
  `_layouts/post.html` and `_includes/publications-list.html`. No page
  used them; the built site is unchanged.

## 2026-09-24

### Changed
- Engagement type icon/label and date formatting moved into shared includes
  (`_includes/engagement-type.html`, `_includes/engagement-date.html`), used
  by both the Engagements page and the homepage "In the Media" strip.
  Rendered output is unchanged.
- README files updated to describe the current site.

### Removed
- README files and `CHANGELOG.md` are no longer published as pages on the
  live site or listed in `sitemap.xml`.
- Dead `shortcut icon` link to a non-existent `/assets/favicon.ico`.
