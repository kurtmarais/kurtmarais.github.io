# Kurt Marais — Logo & Brand Mark

**The mark:** "Orbit + K-Arms." A central hub node with two arms reaching
to satellite nodes in the lower-right and upper-right — evoking the
diagonal strokes of a "K" without literally spelling out a letter — plus
a third node that sits on an orbiting arc looping around from below.
It's built in the same node-and-edge visual language as the network
research-focus icon already used elsewhere on the site, so it reads as
part of the same family rather than a separate, unrelated logo.

---

## Files in this pack

```
svg/
  logo-primary.svg          Full-color mark, brand green/mint. Recolor
                             this one for different occasions/themes —
                             see the comment at the top of the file for
                             exactly which four values to change.
  logo-mono-dark.svg        Single-color, forest green. For light
                             backgrounds, single-color print/stamp use.
  logo-mono-light.svg       Single-color, cream. For dark backgrounds.
  logo-solid-favicon.svg    Thicker strokes, larger nodes — the source
                             for the favicon exports below. Don't use
                             this one as the "real" logo; it's
                             deliberately heavier so it survives being
                             shrunk to 16px.
  logo-greyscale-favicon.svg  Same geometry as logo-solid-favicon.svg,
                             recolored to neutral greys (#2c2c2c hub,
                             #9a9a9a arms/nodes) for contexts where
                             brand color isn't wanted or available.
  logo-mono-favicon.svg       Same favicon-weight geometry again, single
                             cream color (#f7f6f1, matching
                             logo-mono-light.svg). Dark backgrounds
                             only — tested against both light and dark
                             tab chrome, and on light it's close to
                             invisible. Don't use this as a general
                             favicon; use logo-solid-favicon or
                             logo-greyscale-favicon for that.
  favicon-adaptive.svg      Switches color scheme automatically based on
                             the visitor's OS/browser theme (embedded
                             prefers-color-scheme media query — no
                             JavaScript). Light state matches
                             logo-solid-favicon; dark state matches
                             logo-mono-favicon. Supported in Chrome,
                             Firefox, Edge; Safari ignores the media
                             query and always shows the light state,
                             which is why favicon.ico must still ship
                             alongside it as a fallback. Also: this
                             responds to the visitor's SYSTEM theme, not
                             this site's own manual dark-mode toggle —
                             the two can disagree, and there's no
                             CSS-only fix for that.
  logo-animated.html        The animated version (orbiting node travels
                             the ring, 36s per cycle). For embedding on
                             pages later — not a favicon. See the
                             comment inside for how it works and why it
                             respects prefers-reduced-motion.

favicon/
  favicon.ico                Multi-resolution (16/32/48px in one file).
                              Drop this in your site root or reference
                              it directly from <head>.
  favicon-greyscale.ico       Same, greyscale version.
  favicon-mono.ico            Same, monochrome cream version — dark
                              backgrounds only, see note above.

png/
  favicon-16.png              PNG exports at each size, cut from the
  favicon-32.png               solid/favicon version — for browsers or
  favicon-48.png                contexts that want a PNG specifically
  favicon-180.png                 rather than an .ico (180 = Apple
  favicon-192.png                  touch icon size, 192 = Android/PWA).
  favicon-512.png
  favicon-greyscale-*.png     Same set again, greyscale version.
  favicon-mono-*.png          Same set again, monochrome cream version.
  logo-primary-512.png        Large PNG renders of each SVG variant,
  logo-mono-dark-512.png       for anywhere a raster file is needed
  logo-mono-light-512.png       instead of vector (social profiles,
  logo-solid-favicon-512.png     slide decks, etc).
```

---

## Color reference

| Role | Hex | Used for |
|---|---|---|
| Hub (anchor) | `#365b52` | The central node — always the darkest, densest element |
| Arms / nodes / orbit | `#6ea491` | The two K-arms, the three satellite nodes, the orbit ring |
| Mono (light bg) | `#365b52` | Single-color version for use on light backgrounds |
| Mono (dark bg) | `#f7f6f1` | Single-color version for use on dark backgrounds |

These match the site's existing palette exactly (`$linkColor` and its
mint accent) — nothing new was introduced.

---

## Clear space & minimum size

- Leave clear space around the mark equal to at least the hub's own
  radius on all sides — don't crowd it against text or a page edge.
- Below **24px**, use `logo-solid-favicon.svg` (or the pre-rendered
  favicon files), not the primary mark — the primary's thinner arc and
  arm strokes are tuned for larger use and thin out illegibly below
  that size, which is exactly why a separate favicon-weight version
  exists.

## Do / don't

- **Do** keep the hub visually darker/denser than the rest when
  recoloring — that contrast is what gives the mark a focal point.
- **Do** use the animated version sparingly — one instance per page,
  somewhere it can be a quiet detail, not a repeated distraction.
- **Don't** stretch or distort the mark non-uniformly; scale it
  proportionally only.
- **Don't** place the mint-on-mint or dark-on-dark combination (e.g.
  the primary mark's mint arms directly on a mint-colored background)
  — contrast between the hub and its background is what keeps the
  shape legible.
- **Don't** use the animated version as an actual browser-tab favicon
  — animated SVG favicons aren't reliably supported across browsers
  (Safari notably doesn't render them). The static `logo-solid-favicon`
  exports are what should ship as the real favicon.

---

## Implementing the favicon (once you're ready)

This pack (`brand/`) is reference material — `_config.yml` excludes it
from the build, so nothing here is live on the site yet. To actually
ship the new favicon, starting from a repo where only `brand/` has
been added and nothing else has changed:

1. **Copy the files that need to be served into `assets/img/`** —
   Jekyll only builds what's under `assets/`, not `brand/`:
   - `brand/svg/favicon-adaptive.svg` → `assets/img/favicon.svg`
   - `brand/favicon/favicon.ico` → `assets/img/favicon.ico`
   - `brand/png/favicon-180.png` → `assets/img/favicon-180.png`
   - `brand/png/logo-primary-512.png` → `assets/img/og-image.png`
     (for the `og:image` tag — see step 4)

2. **Update `_includes/head.html`** — replace the existing favicon
   `<link>` line(s) with, in this order (order matters; browsers use
   the first tag they support):
   ```html
   <link rel="icon" href="{{ '/assets/img/favicon.svg' | relative_url }}" type="image/svg+xml">
   <link rel="icon" href="{{ '/assets/img/favicon.ico' | relative_url }}" sizes="32x32 48x48" type="image/x-icon">
   <link rel="apple-touch-icon" href="{{ '/assets/img/favicon-180.png' | relative_url }}">
   ```

3. **Remove the old favicon files and their references** — delete
   `assets/img/network-github-1.ico`, `assets/img/network-github-1.png`,
   and the separate stale `assets/favicon.ico` at the repo root, and
   remove the old `rel="shortcut icon"` line in `head.html` that
   pointed to it.

4. **Repoint `og:image`** — it currently points at
   `network-github-1.png`, which step 3 just deleted. Update it to the
   copy made in step 1:
   ```html
   <meta property="og:image" content="{{ '/assets/img/og-image.png' | absolute_url }}">
   ```

5. **Deploy, then hard-refresh to actually see it** — browsers cache
   favicons aggressively in a separate long-lived cache from normal
   page assets. If the old icon is still showing after deploying, that's
   almost always just your own browser's cache, not a failed deploy —
   a hard refresh, or bumping to `favicon.ico?v=2` if it persists,
   clears it.
