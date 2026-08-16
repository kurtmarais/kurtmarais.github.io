# research/

Individual research-project detail pages, linked from `/research/`
(`research.md`). Each file is a full page (`layout: page`) with its own
`permalink`.

Note: the `/research/` page itself is currently NOT linked in the site
navigation (see `_data/settings.yml`), so pages in this folder are only
reachable by direct URL or from within `research.md`'s content.

Example entry to copy when adding a new research-project page — save as
`research/your-project-slug.md`:

```markdown
---
layout: page
title: "Your Project Title"
permalink: /research/your-project-slug/
---

## Research question

One or two sentences framing what the project investigates.

## Approach

A paragraph on methodology / theoretical approach.

## Methods

**Network:** ...
**States:** ...
**Methods:** ...
```

Then link to it from `research.md` with:
`[View research project →]({{ '/research/your-project-slug/' | relative_url }})`
