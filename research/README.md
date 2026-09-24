# research/

Research-project detail pages. Each file is a full page (`layout: page`)
with its own `permalink`.

Current state: the `/research/` overview page (`research.md`) is **not in
the nav** (commented out in `_data/settings.yml`), and its link to
`sentiment-diffusion.md` is commented out too. So
`/research/sentiment-diffusion/` builds and is listed in `sitemap.xml`, but
nothing on the site links to it.

To publish the section: uncomment the `research` line in
`_data/settings.yml`'s `menu`, and uncomment the "View research project"
link in `research.md`.

Template for a new project page — save as `research/your-project-slug.md`:

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

Link it from `research.md` with:
`[View research project →]({{ '/research/your-project-slug/' | relative_url }})`
