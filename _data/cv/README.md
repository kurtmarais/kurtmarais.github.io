# _data/cv/

Feeds the CV page (`/cv/`, via `_layouts/cv.html`). Seven files, each a
flat list of `title` + `description` entries. The page renders in this fixed
order:

1. Qualifications — `education.yml`
2. Academic Experience — `academic-experience.yml`
3. Students Graduated — counted live from `_data/supervision.yml` (no file here)
4. Awards & Honours — `awards.yml`
5. Professional Associations — `professional-associations.yml`
6. Grants & Funding — `grants.yml`
7. Roles & Service — `service.yml`
8. Professional Development — `professional-development.yml`
9. Online Profiles — the `social` list in `_data/settings.yml` (no file here)

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
- `description` — country/region and membership years, using a `·`
  separator, e.g. `'South Africa · 2026–'`

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

All seven files just get looped and printed in order — there is no automatic
sorting, so put new entries wherever they belong chronologically in the file.

## Hiding a section entirely

Every section except Qualifications and Academic Experience has an on/off
flag in `_config.yml`. Current settings:

```yaml
show_cv_awards: false
show_cv_associations: true
show_cv_grants: false
show_cv_service: false
show_cv_professional_development: false
show_cv_graduated_students: true
show_cv_links: true
```

Set a flag to `false` (or comment the line out) to hide that section; the
data file can stay as it is. A new CV section should get its own
`show_cv_*` flag in the same way.

"Students Graduated" also hides itself when `supervision.yml` has no
current or completed students. Its rows (BDatSci, BComHons OR, BComHons QM,
MCom, PhD) are matched by `degree_level` or exact `programme` string — see
`_data/README.md`.
