# assets/img/

In use:

- `headshot.jpg` — homepage hero photo (`.hero-photo` in `_layouts/home.html`).
- `favicon.svg`, `favicon.ico` — favicons (`_includes/head.html`).
- `apple-touch-icon.png` — iPhone/iPad home-screen icon (180x180, opaque
  forest green; iOS fills a transparent icon with black). Source:
  `brand/svg/apple-touch-icon.svg`. Sources and other variants are in `brand/`.
- `favicon-180.png` — no longer linked (it was the touch icon, but it is
  transparent); kept so any outside link to it still works.
- `blogpost-usdp.jpg`, `bluesky_yohan-marion_unsplash.jpg`,
  `reddit_appshunter.io_unsplash.jpg` — thumbnails for blog-post entries in
  `_data/engagements.yml`.
- `engagements/` — poster thumbnails (`poster-thumb.jpg`,
  `predac-thumb.jpg`). New poster thumbnails go here as `<slug>-thumb.jpg`.

Not referenced by any template (kept on purpose):

- `og-image.png` — `og:image` is deliberately omitted in `head.html` so link
  previews stay a compact title/description card.

Engagement `image:` fields can be a local path (`/assets/img/...`) or a
full `https://` URL. Several media entries hotlink the outlet's own image,
which will break if the outlet moves or deletes it — copy an image here
and switch to a local path if that matters for a particular entry.
