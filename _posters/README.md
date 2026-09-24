# _posters/

Jekyll collection for poster pages (`/posters/<slug>/`, registered in
`_config.yml` with `output: true`).

The `.md` files here are **intentionally near-empty stubs**:

```yaml
---
layout: poster
---
```

All content — title, authors, abstract, keywords, PDF path and size — lives
in the matching entry in `_data/engagements.yml`. `_layouts/poster.html`
finds that entry by matching the page's URL against the entry's `url`
field. There's no plugin available on GitHub Pages to generate these pages
from data, hence the stub.

## Adding a poster

1. **Fix the PDF's own Title metadata.** PowerPoint/Canva exports often set
   a placeholder (e.g. "PptxGenJS Presentation"), which becomes the browser
   tab title when the PDF is opened directly.
2. **Put the PDF in `assets/posters/`.**
3. **Make a thumbnail**: rasterise the top of the poster and crop tall
   enough to show real content below the title, not only the title band.
   Keep a consistent aspect ratio across posters (the cards crop with
   `object-fit: cover`). Save as `assets/img/engagements/<slug>-thumb.jpg`.
4. **Add the `engagements.yml` entry** with `type: poster`,
   `media_format: poster`, `url: "/posters/<slug>/"`, `image`, `authors`,
   `abstract`, `poster_pdf`, `pdf_width`, `pdf_height` (the PDF page size in
   points). Field reference in `_data/README.md` → Posters.
5. **Add the stub**: `_posters/<slug>.md` containing only the three lines
   above. The filename must match the slug in `url`.

If the poster page renders blank, the `url` in `engagements.yml` and the
stub's filename don't match.

Current posters:
- `from-social-media-to-mental-wellbeing.md` — EMS Research Impact Day 2026
- `module-interest-earns-returns.md` — PREDAC 2019
