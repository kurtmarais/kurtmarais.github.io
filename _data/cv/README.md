# _data/cv/

Feeds the CV page (`/cv/`, via `_layouts/cv.html`). Six files, each a simple
flat list — no nested fields, no optional fields. Rendered in this fixed
order: Qualifications, Academic Experience, Awards & Honours, Grants &
Funding, Roles & Service, Professional Development.

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

## awards.yml

One entry per award or honour, most recent first.

Fields:
- `title` — the award name, e.g. `'Faculty Excellence in Teaching Award'`
- `description` — awarding body and year, using a `·` separator, e.g.
  `'Stellenbosch University · 2026'`

Example entry to copy:
```yaml
- title: 'Faculty Excellence in Teaching Award'
  description: 'Stellenbosch University · 2026'
```

## professional-associations.yml

One entry per society, most recent first.

Fields:
- `title` — the society name
- `description` — provider and year, using a `·` separator, e.g.
  `'Coursera · 2026'`

Example entry to copy:
```yaml
- title: 'ORSSA'
  description: 'South Africa · 2026–'
```

## grants.yml

One entry per grant or funding award, most recent first.

Fields:
- `title` — the grant/project title
- `description` — funding body, amount (optional), and year, using `·`
  separators, e.g. `'National Research Foundation · R150,000 · 2026'`

Example entry to copy:
```yaml
- title: 'Sentiment diffusion in online mental health communities'
  description: 'National Research Foundation · R150,000 · 2026'
```

## service.yml

One entry per committee role or service position, most recent first.

Fields:
- `title` — the role/committee name, e.g. `'Postgraduate Coordinator'`
- `description` — institution/organisation and year(s), using a `·`
  separator, e.g. `'Department of Logistics · 2025–present'`

Example entry to copy:
```yaml
- title: 'Postgraduate Coordinator'
  description: 'Department of Logistics · 2025–present'
```

## professional-development.yml

One entry per course, workshop, or certification, most recent first.

Fields:
- `title` — the course/workshop/certification name
- `description` — provider and year, using a `·` separator, e.g.
  `'Coursera · 2026'`

Example entry to copy:
```yaml
- title: 'Advanced Data Visualisation'
  description: 'Coursera · 2026'
```

All six files just get looped and printed in order — there is no automatic
sorting, so put new entries wherever they belong chronologically in the file.

## Hiding a section entirely

The last four sections (Awards, Grants, Service, Professional Development)
can each be switched off without touching this folder or `cv.html` at all —
just comment out the matching line in `_config.yml`:

```yaml
show_cv_awards: true
show_cv_grants: true
show_cv_service: true
show_cv_professional_development: true
```

Comment out (or delete) any one of those lines and that section stops
rendering on the CV page. The data file can stay exactly as it is either
way — commenting the flag is the only thing that matters. Qualifications
and Academic Experience have no such flag and always render.
