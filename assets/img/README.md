# assets/img/

In use:

- `headshot.jpg` — homepage hero photo (`.hero-photo` in `_layouts/home.html`).
- `favicon.svg`, `favicon.ico`, `favicon-180.png` — favicons / Apple touch
  icon (`_includes/head.html`). Sources and other variants are in `brand/`.
- `blogpost-usdp.jpg`, `bluesky_yohan-marion_unsplash.jpg`,
  `reddit_appshunter.io_unsplash.jpg` — thumbnails for blog-post entries in
  `_data/engagements.yml`.
- `engagements/` — poster thumbnails (`poster-thumb.jpg`,
  `predac-thumb.jpg`). New poster thumbnails go here as `<slug>-thumb.jpg`.

Not referenced by any template (safe to delete):

- `network-github-1.ico`, `network-github-1.png` — older favicon.
- `og-image.png` — `og:image` is deliberately omitted in `head.html` so link
  previews stay a compact title/description card.

Engagement `image:` fields can be a local path (`/assets/img/...`) or a
full `https://` URL. Several media entries hotlink the outlet's own image,
which will break if the outlet moves or deletes it — copy an image here
and switch to a local path if that matters for a particular entry.
