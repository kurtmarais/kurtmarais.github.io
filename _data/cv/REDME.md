# _data/cv/

Feeds the CV page (`/cv/`, via `_layouts/cv.html`). Two files, each a simple
flat list — no nested fields, no optional fields.

## education.yml

One entry per qualification, most recent first.

Fields:
- `title` — the qualification, e.g. `'PhD (Operations Research)'`
- `description` — institution and year, using a `·` separator, e.g.
  `'Stellenbosch University · 2026'`

Example entry to copy:
```yaml
- title: 'MSc (Data Science)'
  description: 'Stellenbosch University · 2027'
```

## academic-experience.yml

One entry per role, most recent first.

Fields:
- `title` — the role/position, e.g. `'Lecturer'`
- `description` — institution, department, and date range, using `·`
  separators, e.g. `'Stellenbosch University · Department of Logistics ·
  2019–present'`

Example entry to copy:
```yaml
- title: 'Senior Lecturer'
  description: 'Stellenbosch University · Department of Logistics · 2027–present'
```

Both files just get looped and printed in order — there is no automatic
sorting, so put new entries wherever they belong chronologically in the file.
