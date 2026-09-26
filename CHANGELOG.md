# Changelog

Notable changes to kurtmarais.github.io. Earlier history was uploaded file-by-file
through the GitHub web UI and is not itemised; the site as of 2026-09-24
is the baseline. Add new entries at the top.

## 2026-09-26 (11)

### Changed
- Reinforcement demo: the one-off move to the Relationship panel now stops
  with the panel's top just below the site header on phones (the header
  stays pinned there and was covering the heading), and just below the top
  of the screen on tablets and desktops. The move takes one second and the
  run starts once it has settled, instead of ticking while the page scrolls.

## 2026-09-26 (10)

### Added
- Reinforcement demo: the first time "Run simulation" is pressed with two
  agents selected, the page moves down to the Relationship panel so the
  interaction is in view. It happens once per visit; after that the page
  stays where the visitor puts it until it is refreshed or reopened.

## 2026-09-26 (9)

### Changed
- Engagements list and homepage "In the Media" strip: the type icon now
  works like a bullet (hanging indent). When the meta line wraps on
  smaller screens, the following lines line up with the first line's text
  instead of running back under the icon, and the icon is centred on the
  first line.

### Added
- Homepage "In the Media" card: swipe left or right with a finger (or pen)
  to move to the next or previous item, as on the social links carousel on
  phones. Vertical swipes still scroll the page, a swipe that starts on a
  link doesn't open it, and a swipe restarts the autoplay timer. Mouse
  drags do nothing; the arrow buttons are unchanged.

## 2026-09-26 (8)

### Removed
- Unused files: `assets/apple-icon-152x152.png`,
  `assets/img/network-github-1.png` / `.ico` (old icons) and
  `assets/libs/bootstrap/bootstrap.min.css.map` (developer source map; its
  pointer at the end of `bootstrap.min.css` is removed too).
- Stale "placeholder monogram" comment above the homepage headshot.

## 2026-09-26 (7)

### Changed
- Reinforcement demo stat cards: clearer headings ("Duration of current
  state", "Reinforcing agent(s) at this tick", "Breakdown of states
  experienced thus far"); the "this run" tag is removed.

## 2026-09-26 (6)

### Changed
- Homepage "Find me online" cards (tablet and desktop): a fixed side
  padding on the strip and slightly wider, equal gaps between cards; the
  cards share the remaining width, so spacing stays the same at every
  screen size.

## 2026-09-26 (5)

### Changed
- Homepage demo card: the description runs to the card's right edge,
  with the same gap on the right as on the left.

## 2026-09-26 (4)

### Changed
- Homepage hero card and demo card: the text under each title now runs
  as wide as the title's longest line (instead of a fixed, narrower
  width), never past it.

## 2026-09-26 (3)

### Changed
- Reinforcement demo title: same weight as the homepage hero heading, with
  a normal paragraph gap before the intro text.
- Homepage demo card icon: simpler outline hand (index finger, three
  curled fingers, straight thumb) tapping the target, at 50px.

## 2026-09-26 (2)

### Changed
- Reinforcement demo: title is bold, with no line under it (same space).
- Homepage demo card icon: a hand tapping a target instead of a network.
  The hand presses and changes colour, then the target's centre, middle
  and outer rings light up in turn. Mint in dark mode.

## 2026-09-26

### Changed
- Reinforcement demo: browser tab now reads "Simulating reinforced
  sentiment", matching the page heading. The heading uses Source Serif 4
  and has the same line and spacing below it as the other pages' titles.

## 2026-09-25 (12)

### Fixed
- Phones and tablets: pages no longer slide sideways. Every page was 7px
  wider than the screen because the layout rows stuck out past the page
  padding; below 992px the rows now fit exactly, with text in the same
  place as before.

## 2026-09-25 (11)

### Fixed
- Homepage "Find me online" cards on tablets and small laptops: names no
  longer wrap or sit left-aligned. Tablets (768–991px) show three cards per
  row in two rows; 992–1199px uses the full width for one row; all cards
  are the same width and names are centred.

## 2026-09-25 (10)

### Fixed
- Reinforcement demo, Relationship panel: more space between the two agent
  rows and the tie description. Each agent is now its own row with a fixed
  gap, so the pills can't touch, even when they wrap on small screens.

## 2026-09-25 (9)

### Changed
- Reinforcement demo key: moved into the "A network of agents" panel as a
  box floating beside the network, level with its middle (below it on
  smaller screens), grouped into Agents, Sentiment and Ties; the
  colourblind toggle sits just above the panel on the right. Turning colourblind mode on only changes the swatches
  (symbols and patterns appear inside them), so nothing shifts.

## 2026-09-25 (8)

### Fixed
- Reinforcement demo: the network didn't render after the wording update.
  Two messages had a straight apostrophe inside a quoted string
  (`agent's`), which broke the page script; replaced with ’.

## 2026-09-25 (7)

### Changed
- Homepage demo card trace: the first trace now runs 30 seconds after the
  homepage opens (or as soon as the card is in view after that), then
  every minute.

## 2026-09-25 (6)

### Added
- Homepage demo card: every minute a thin line in the card's left-border
  green traces the border from the bottom-left corner, anticlockwise,
  fading out as it nears the start again. Off for visitors who prefer reduced motion.

## 2026-09-25 (5)

### Changed
- Engagements map: all presented talks with a known location are mapped.
  The 2026 EMS Research Impact Day poster and the Stellenbosch talks
  (2021 to 2025, plus the online 2022 SoTL conference hosted by
  Stellenbosch University) now sit on a Stellenbosch dot for the Western
  Cape. A card's "Earlier in this region" list shows at most three
  entries, newest first.

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
