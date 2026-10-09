# Video pages

Same pattern as `_posters/`: each `.md` here is a near-empty stub
(`layout: video`), and the filename is the URL slug
(`/videos/<slug>/`). All content lives in the matching
`_data/engagements.yml` entry, found by `url`:

- `title`, `publication`, `start_date`, `keywords` (header)
- `abstract` (Markdown, shown above the video; falls back to `description`)
- `embed_url` (the `src` of the platform's embed iframe, e.g. LinkedIn's
  "Embed this post" code). The frame is 16:9; optional `embed_width` /
  `embed_height` set a different ratio (e.g. 9 and 16 for a vertical video)
- `source_url` (the original post, for the "Open on ..." link) and
  `source_name` (e.g. "LinkedIn")

The engagements entry itself uses `media_format: video` and
`url: "/videos/<slug>/"`, so its card gets the play overlay and
"Watch video →" and links to this page.
