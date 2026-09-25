# Changelog

Notable changes to kurtmarais.github.io. Earlier history was uploaded file-by-file
through the GitHub web UI and is not itemised; the site as of 2026-09-24
is the baseline. Add new entries at the top.

## 2026-09-25 (4)

### Fixed
- Engagements map: hovering dots in the enlarged map no longer makes the
  map jump or the card flicker (overlay anchored to the top; the card
  stays on the last dot instead of hiding on mouse-out).
- Map dots are now a fixed 10px on screen at every size (they were about
  3px on the small map), with no white ring, and the nearest dot within
  22px of the pointer responds, so small and close-together dots are
  easier to hit.

## 2026-09-25 (3)

### Added
- Engagements page conference map: MAP control in the filter row opens an
  Equal Earth world map with one dot per region where a conference talk or
  poster was presented in person, with a details card. Sticky right-hand
  column on desktop, above the list on smaller screens. Dots come from new
  `map:` blocks in `_data/engagements.yml`. Online events (Malmö 2024)
  show as an outlined gold dot; events with a future `start_date` show as
  "Upcoming" until their date. Zoom buttons and drag-to-pan in the map, an
  enlarge button (tablet and desktop) that opens a large overlay with
  mouse-wheel zoom, and earlier events listed newest first. Zoom animates
  smoothly (instant for visitors who prefer reduced motion).
  Any engagement type can be mapped (Bath 2023 seminar added); cards show
  the engagement type; heading renamed "Where I've presented".
- Reinforcement demo: speed button next to Run (x0.5, x1 default, x1.5,
  x2, x2.5). "All agents at tick N" below the timelines shows every
  agent's state and who reinforces it, with totals, throughout the run;
  agents that just changed state are highlighted with what they changed
  from. Click any tick in the timelines, at any point, to jump to it. The
  panel minimises with a chevron. Stepping back keeps the rest of the
  timeline visible.

## 2026-09-25 (2)

### Fixed
- Reinforcement demo links (dissertation link on the demo page, "Open the
  demo" on the homepage card) no longer turn Bootstrap blue on hover in
  light mode; they keep the site's link colour.

## 2026-09-25

### Added
- `/reinforcement-demo/`: interactive, seeded illustration of emotional
  reinforcement built on the dissertation model's transition and posting
  probabilities. Supports site dark mode and reduced-motion preferences.
- Homepage "Try it yourself" teaser card linking to the demo (styles in
  `_sass/main.scss` under DEMO TEASER); same width as the hero and "In the
  Media" cards, opens in a new tab.
- Demo: reinforcement shown as a highlighted tie in the network and a
  highlight around the pair in the Relationship panel; run button
  pauses/resumes; slower ticks (900ms); selecting agents no longer resets
  colours; state pills solid (diagnosed) vs outlined (not diagnosed);
  larger labels and network; colourblind-friendly toggle; full dissertation
  title; no em dashes. Demo rule: an unreinforced agent can't hold one
  state for more than 4 ticks (reinforced agents can); reinforcement
  includes shared neutral states. Reinforcement follows tie direction; each
  agent's timeline shows when and by whom it is reinforced; the pair view
  adds "from others" rows for reinforcement from outside the pair. Highlights only appear once a run starts. Page text grouped in marked EDITABLE TEXT blocks.

## 2026-09-24 (7)

### Changed
- Publications page: publication titles open their page in a new tab; DOI
  links, and the "View publication" / "view at publisher" links on each
  publication's page, now open in the same tab.

## 2026-09-24 (6)

### Changed
- "Research collaboration" moved from the Supervision page to the bottom of
  the Publications page.
- Collaboration and prospective-student paragraphs point to the contact
  details below them instead of repeating the email address.

## 2026-09-24 (5)

### Added
- Supervision page: "Research collaboration" section (co-authored research)
  above "Prospective students", which now invites self-funded PhD and
  Masters candidates and lists current areas of interest.

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
