# Kurt Marais — Academic GitHub Pages site

This site is adapted from the supplied Academic Jekyll template and prepared for a personal GitHub Pages repository.

## Publish

1. Create or use the repository named `YOURUSERNAME.github.io`.
2. Upload the contents of this folder to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save and wait for GitHub Pages to build the site.
6. Replace `YOURUSERNAME` in `_config.yml` with your actual GitHub username.

## Main sections

- About
- Research
- Teaching
- Supervision
- Speaking
- Publications
- CV

## Replace placeholders

The supplied template has been stripped of its sample physics/astrophysics content. Replace the placeholder biography, academic position, courses, supervision entries, speaking engagements and publications with your own information.

The homepage currently retains the template's visual image area. Replace `assets/img/home.jpg` with a professional profile/research image if desired.

Add your CV PDF at `assets/documents/Kurt-Marais-CV.pdf` and link it from the CV page when ready.

## Important

Set the `url` in `_config.yml` to your real GitHub Pages address, for example `https://kurtmarais.github.io`. The site uses relative URL filters so it works correctly from the repository root.


# Root-level page files

These `.md` files are the actual pages of the site. Each one is mostly just
Jekyll front matter (`layout`, `title`, `permalink`) — the layout named does
the heavy lifting, pulling structured content from `_data/` where relevant.

- `index.md` → homepage (`/`). Has free-text intro content directly in the
  file, plus the "In the Media" strip pulled automatically from
  `_data/engagements.yml`.
- `about.md` → `/about/`. Free-text content directly in the file.
- `teaching.md` → `/teaching/`. Free-text content directly in the file.
- `research.md` → `/research/`. Free-text content directly in the file.
  **Not currently linked in the site navigation** (commented out in
  `_data/settings.yml`) — the page still exists and builds, it's just not
  reachable from the nav bar.
- `supervision.md` → `/supervision/`. No body content — everything comes
  from `_data/supervision.yml`.
- `engagements.md` → `/engagements/`. No body content — everything comes
  from `_data/engagements.yml`.
- `publications.md` → `/publications/`. No body content — everything comes
  from `_data/publications.yml`.
- `cv.md` → `/cv/`. No body content — everything comes from `_data/cv/`.

For About/Teaching/Research/Home, just edit the Markdown text directly in the
file below the `---` front matter block. For Supervision/Engagements/
Publications/CV, edit the corresponding YAML file in `_data/` instead —
editing these `.md` files won't change what's displayed.
