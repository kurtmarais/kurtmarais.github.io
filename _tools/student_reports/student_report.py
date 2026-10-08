#!/usr/bin/env python3
"""
Student report builder: BDatSci final-year eligibility, Honours ranking,
and Masters / PhD applicant lists, from SU export spreadsheets.

Reads any number of the three export types (detected from their headers,
so file names don't matter):
  - Student Module Enrollment Report  (registration)
  - Grade Roster Report               (grades)
  - PG Applicant Report               (postgraduate applications)

Usage:
  python student_report.py INPUT [INPUT ...] [-o OUTPUT.xlsx] [--year 2026]

INPUT can be .xlsx files or folders (every .xlsx inside is read).
Writes one workbook with tabs: Overview, BDatSci, Honours, Masters, PhD,
Modules, Notes. Marks typed into the yellow Mark cells on the Modules tab
update every status, average and count (all formulas).

Requires: pandas, openpyxl  (pip install pandas openpyxl)
"""

import argparse
import re
import sys
from datetime import date
from pathlib import Path

import pandas as pd

# ---------------------------------------------------------------------------
# SETTINGS (edit here)
# ---------------------------------------------------------------------------

PASS_MARK = 50.0

# BDatSci final-year eligibility
BDATSCI_PROGRAMME_KEYWORD = "BDatSci"          # matched in "Program Code/Name"
BDATSCI_REQUIRED_MODULES = {                    # must be passed (any year) or
    "55336-314": "Operations Research 314",     # enrolled now with mark outstanding
    "55336-344": "Operations Research 344",
    "55336-352": "Operations Research 352",
}
# Only list BDatSci students with at least one required module in their
# records (enrolled or graded). False = list every BDatSci student registered
# in the current year, including first/second years.
BDATSCI_ONLY_CANDIDATES = True

# Honours
OR3_PREFIX = "55336-3"
OR2_PREFIX = "55336-2"
HONOURS_THRESHOLD = 60.0                        # unweighted mean of OR3 modules
# OR modules always shown as columns on the Honours tab (any other OR2/OR3
# module found in an applicant's records gets a column too)
HONOURS_OR_MODULES = ["55336-314", "55336-322", "55336-344", "55336-352", "55336-244"]
# Which attempt of a repeated module counts towards averages: "latest" or "best"
REPEAT_ATTEMPT = "latest"

# Programme classification of the PG Applicant "Program Name" (case-insensitive
# regex, checked in this order: first match wins)
PROGRAMME_PATTERNS = [
    ("PhD", r"\bph\.?\s?d\b|doctor|\bdphil\b"),
    ("Masters", r"\bm\.?\s?(com|sc|phil|eng|a)\b|master"),
    ("Honours", r"hons|honours"),
]

# Module enrolments with these words in "Module Status" are ignored
DROPPED_STATUS_WORDS = ("unenrol", "withdraw", "cancel", "drop", "deregist")

# ---------------------------------------------------------------------------
# Reading
# ---------------------------------------------------------------------------

ENROL_KEY = "Module Enrollment Date"
GRADE_KEY = "Obtained Marks/Grade"
APPLICANT_KEY = "Application Code"

APPLICANT_BASE_COLS = 22      # columns before the "Tertiary 1..6" blocks
TERTIARY_BLOCK = 16           # columns per Tertiary block


def clean(v):
    """Strip strings; turn NaN/None/blank into None."""
    if v is None:
        return None
    if isinstance(v, float) and pd.isna(v):
        return None
    if isinstance(v, str):
        v = v.strip()
        return v or None
    return v


def su_number(v):
    v = clean(v)
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    s = str(v).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s or None


def module_code(v):
    """'20710-214 - Lecture / Applied Mathematics 214 - Lecture' -> '20710-214'."""
    v = clean(v)
    if v is None:
        return None
    m = re.match(r"\s*(\d{3,6}-\d{3})", str(v))
    if m:
        return m.group(1)
    return str(v).split(" - ")[0].split("/")[0].strip()


def module_name(v):
    """'20710-214 - Lecture / Applied Mathematics 214 - Lecture' -> 'Applied Mathematics 214'."""
    v = clean(v)
    if v is None:
        return None
    s = str(v)
    if "/" in s:
        s = s.split("/", 1)[1]
    s = re.sub(r"\s*-\s*(Lecture|Tutorial|Practical|Seminar)\s*$", "", s.strip(), flags=re.I)
    return s.strip()


def year_of(v):
    v = clean(v)
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return int(v) if 1900 < v < 2200 else None
    if hasattr(v, "year"):
        return v.year
    m = re.search(r"(19|20)\d{2}", str(v))
    return int(m.group(0)) if m else None


def to_number(v):
    v = clean(v)
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    m = re.search(r"-?\d+(\.\d+)?", str(v).replace(",", "."))
    return float(m.group(0)) if m else None


def find_header_row(raw, key):
    for i in range(min(len(raw), 15)):
        row = [str(x).strip() for x in raw.iloc[i].tolist() if clean(x) is not None]
        if key in row:
            return i
    return None


# Columns describing the student/applicant (not the module or application).
# A row with a blank SU Number / Application Code is a continuation of the
# row above (merged or blanked cells in the export) and inherits these.
ENROL_PERSON_COLS = ["Faculty Campus", "Academic Term", "Admission Code", "Admission Status",
                     "Student Status", "SU Number", "Student Code", "Full Name", "Surname",
                     "Student Name", "Population Group", "Student Email ID",
                     "Student Alternate Email ID", "Primary Citizenship", "Program Code/Name",
                     "Program Group", "Intake", "Seat Type"]
GRADE_PERSON_COLS = ["Brand Campuses", "SU Number", "Student ID", "Student Status", "Admission ID",
                     "Admission Status", "Student Name", "Program Code / Name", "Program Group",
                     "Intake", "Seat Type", "Registration Type", "Mode of Delivery", "Period"]
APPLICANT_PERSON_COLS = 9     # Application Code .. Nationality


def load_sheets(path):
    """Read every sheet; a merged block gets its value copied into every cell."""
    from openpyxl import load_workbook
    wb = load_workbook(path, data_only=True)
    out = {}
    for ws in wb.worksheets:
        for rng in list(ws.merged_cells.ranges):
            v = ws.cell(rng.min_row, rng.min_col).value
            ws.unmerge_cells(str(rng))
            for r in range(rng.min_row, rng.max_row + 1):
                for c in range(rng.min_col, rng.max_col + 1):
                    ws.cell(r, c).value = v
        out[ws.title] = pd.DataFrame(list(ws.values), dtype=object)
    return out


def fill_continuations(df, key, cols):
    """Rows with a blank `key` inherit blank `cols` from the row above."""
    cols = [c for c in cols if c in df.columns]
    if key not in df.columns:
        return df
    prev = None
    recs = df.to_dict("records")
    for rec in recs:
        if clean(rec.get(key)) is None and prev is not None:
            for c in cols:
                if clean(rec.get(c)) is None:
                    rec[c] = prev.get(c)
        prev = rec
    return pd.DataFrame(recs, columns=df.columns)


def read_inputs(paths):
    files = []
    for p in paths:
        p = Path(p)
        if p.is_dir():
            files += sorted(x for x in p.glob("*.xlsx") if not x.name.startswith("~$"))
        elif p.suffix.lower() == ".xlsx":
            files.append(p)
    enrol, grades, applicants, log = [], [], [], []
    for f in files:
        try:
            sheets = load_sheets(f)
        except Exception as e:  # noqa: BLE001
            log.append((f.name, "", "Could not read: %s" % e))
            continue
        for sname, raw in sheets.items():
            kind = None
            for key, k in ((APPLICANT_KEY, "applicant"), (GRADE_KEY, "grades"), (ENROL_KEY, "enrolment")):
                h = find_header_row(raw, key)
                if h is not None:
                    kind = k
                    break
            if kind is None:
                log.append((f.name, sname, "Skipped: not a recognised report"))
                continue
            body = raw.iloc[h + 1:].reset_index(drop=True)
            body = body[body.apply(lambda r: any(clean(x) is not None for x in r), axis=1)]
            if kind == "applicant":
                applicants.append(parse_applicants(raw.iloc[h].tolist(), body, f.name))
            else:
                df = body.copy()
                df.columns = [str(c).strip() if clean(c) is not None else "col%d" % i
                              for i, c in enumerate(raw.iloc[h].tolist())]
                df = df.loc[:, ~df.columns.duplicated()]
                df = fill_continuations(df, "SU Number",
                                        GRADE_PERSON_COLS if kind == "grades" else ENROL_PERSON_COLS)
                df["_source"] = f.name
                (grades if kind == "grades" else enrol).append(df)
            log.append((f.name, sname, "%s report, %d rows" % (kind.capitalize(), len(body))))
    cat = lambda xs: pd.concat(xs, ignore_index=True) if xs else pd.DataFrame()
    return cat(enrol), cat(grades), cat(applicants), log


def parse_applicants(header, body, source):
    """Flatten base columns; keep Tertiary blocks as a list per row."""
    header = [str(c).strip() if clean(c) is not None else "" for c in header]
    base = header[:APPLICANT_BASE_COLS]
    rows = []
    prev = None
    for _, r in body.iterrows():
        vals = [clean(v) for v in r.tolist()]
        # Continuation row (merged/blank Application Code): inherit the applicant's
        # details; if Program Name is blank too it is the same application, so
        # inherit all application columns as well.
        if vals[0] is None and prev is not None:
            upto = APPLICANT_PERSON_COLS if vals[base.index("Program Name")] is not None else len(base)
            for i in range(min(upto, len(vals))):
                if vals[i] is None:
                    vals[i] = prev[i]
        prev = vals
        rec = {base[i]: vals[i] for i in range(min(len(base), len(vals))) if base[i]}
        tert = []
        start = APPLICANT_BASE_COLS
        while start + TERTIARY_BLOCK <= len(header):
            blk = {header[start + j]: clean(vals[start + j]) for j in range(TERTIARY_BLOCK)
                   if start + j < len(vals)}
            if any(v is not None for v in blk.values()):
                tert.append(blk)
            start += TERTIARY_BLOCK
        rec["_tertiary"] = tert
        rec["_source"] = source
        rows.append(rec)
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Grades
# ---------------------------------------------------------------------------

def normalise_grades(g):
    if g.empty:
        return pd.DataFrame(columns=["su", "code", "name", "year", "mark", "order", "programme"])
    out = pd.DataFrame({
        "su": g.get("SU Number").map(su_number),
        "student_id": g.get("Student ID"),
        "student_name": g.get("Student Name").map(clean),
        "programme": g.get("Program Code / Name").map(clean),
        "code": g.get("Module Code / Name").map(module_code),
        "name": g.get("Module Code / Name").map(module_name),
        "year": g.get("Period").map(year_of),
        "period": g.get("Period").map(clean),
        "obtained": g.get("Obtained Marks/Grade").map(to_number),
        "out_of": g.get("Out of Marks/Grade").map(to_number),
        "exam_result": g.get("Exam Result").map(clean),
    })
    out["order"] = range(len(out))

    def pct(r):
        if r.obtained is None or pd.isna(r.obtained):
            return None
        if r.out_of and not pd.isna(r.out_of) and r.out_of > 0 and r.out_of != 100:
            return round(r.obtained / r.out_of * 100, 2)
        return r.obtained
    out["mark"] = out.apply(pct, axis=1)
    out = out[out.su.notna() & out.code.notna()]
    return out


def attempts_by_student(gr):
    """{su: {code: [ {year, mark, period, order}, ... ]}} graded and ungraded rows."""
    res = {}
    for r in gr.itertuples(index=False):
        atts = res.setdefault(r.su, {}).setdefault(r.code, [])
        mark = None if r.mark is None or pd.isna(r.mark) else r.mark
        if any(a["year"] == r.year and a["period"] == r.period and a["mark"] == mark for a in atts):
            continue        # same grade listed twice (e.g. one row per section)
        if mark is not None:   # a graded row replaces an ungraded placeholder for that period
            atts[:] = [a for a in atts if not (a["mark"] is None and a["period"] == r.period)]
        elif any(a["period"] == r.period for a in atts):
            continue
        atts.append({"year": r.year, "mark": mark, "period": r.period, "order": r.order, "name": r.name})
    return res


def graded(attempts):
    return [a for a in attempts if a["mark"] is not None and not pd.isna(a["mark"])]


def counting_mark(attempts):
    g = graded(attempts)
    if not g:
        return None
    if REPEAT_ATTEMPT == "best":
        return max(a["mark"] for a in g)
    return sorted(g, key=lambda a: (a["year"] or 0, a["order"]))[-1]["mark"]


def repeated_codes(mods):
    """Modules with graded attempts in more than one year, or more than one graded attempt."""
    out = []
    for code, atts in mods.items():
        g = graded(atts)
        years = {a["year"] for a in g}
        if len(g) > 1 and (len(years) > 1 or any(a["mark"] < PASS_MARK for a in g)):
            out.append(code)
    return sorted(out)


def avg_for_prefix(mods, prefix):
    marks, pending = [], []
    for code, atts in sorted(mods.items()):
        if not code.startswith(prefix):
            continue
        m = counting_mark(atts)
        if m is None:
            pending.append(code)
        else:
            marks.append(m)
    avg = round(sum(marks) / len(marks), 2) if marks else None
    return avg, len(marks), pending


def is_dropped(row):
    status = str(clean(row.get("Module Status")) or "").lower()
    if any(w in status for w in DROPPED_STATUS_WORDS):
        return True
    return clean(row.get("Unenrolled Date")) is not None


def enrolments_by_student(enrol):
    """{su: {code: {"name", "years"}}} from non-dropped enrolments."""
    res = {}
    if enrol.empty:
        return res
    for _, r in enrol.iterrows():
        if is_dropped(r):
            continue
        su, code = su_number(r.get("SU Number")), module_code(r.get("Module Code/Name"))
        if not su or not code:
            continue
        d = res.setdefault(su, {}).setdefault(code, {"name": module_name(r.get("Module Code/Name")),
                                                     "years": set()})
        y = year_of(r.get("Academic Term"))
        if y:
            d["years"].add(y)
    return res


def classify(programme):
    p = str(programme or "")
    for label, pat in PROGRAMME_PATTERNS:
        if re.search(pat, p, flags=re.I):
            return label
    return "Other"


def tertiary_summary(tert):
    """Most recent qualification first (by 'Period To')."""
    def key(b):
        return year_of(b.get("Period To")) or year_of(b.get("Period From")) or 0
    tert = sorted(tert, key=key, reverse=True)
    lines = []
    for b in tert:
        parts = [b.get("Name of Qualification"), b.get("Institution"),
                 ("avg %s" % b.get("Overall Average Achieved")) if b.get("Overall Average Achieved") is not None else None,
                 ("to %s" % year_of(b.get("Period To"))) if year_of(b.get("Period To")) else None,
                 "completed" if str(b.get("Completed") or "").lower() in ("yes", "y", "true", "1") else None]
        lines.append(", ".join(str(x) for x in parts if x))
    latest = tert[0] if tert else {}
    return {
        "Latest qualification": latest.get("Name of Qualification"),
        "Latest institution": latest.get("Institution"),
        "Latest NQF level": latest.get("RSA NQF Comparability Level"),
        "Latest overall average": latest.get("Overall Average Achieved"),
        "Latest research module grade": latest.get("Research Module Grade"),
        "All tertiary studies": " | ".join(lines) or None,
    }


def prepare_applicants(app):
    if app.empty:
        return app
    a = app.copy()
    # object dtype keeps None (pandas would otherwise store missing as NaN, which is truthy)
    a["su"] = pd.Series([su_number(x) for x in a.get("SU Number")], index=a.index, dtype=object)
    a["person"] = [su or clean(code) or clean(mail) or "%s|%s" % (sn, fn) for su, code, mail, sn, fn in
                   zip(a.su, a.get("Application Code"), a.get("Email ID"), a.get("Surname"), a.get("First Name"))]
    # One record per person + programme: rows split over several lines are merged
    # (first non-blank value per column, tertiary studies combined).
    recs = []
    for _, grp in a.groupby(["person", a.get("Program Name").fillna("")], sort=False):
        rec = {}
        for col in grp.columns:
            if col == "_tertiary":
                continue
            rec[col] = next((v for v in grp[col] if clean(v) is not None), None)
        rec["_tertiary"] = merge_tertiary(grp["_tertiary"])
        recs.append(rec)
    # Tertiary studies belong to the person, not one application: share them
    by_person = {}
    for rec in recs:
        by_person.setdefault(rec["person"], []).append(rec["_tertiary"])
    for rec in recs:
        rec["_tertiary"] = merge_tertiary(by_person[rec["person"]])
    a = pd.DataFrame(recs)
    a["su"] = pd.Series([su_number(x) for x in a["su"]], index=a.index, dtype=object)
    a["level"] = a.get("Program Name").map(classify)
    return a


def merge_tertiary(lists):
    seen, out = set(), []
    for tert in lists:
        for b in tert or []:
            key = tuple(sorted((k, str(v)) for k, v in b.items() if v is not None))
            if key not in seen:
                seen.add(key)
                out.append(b)
    return out


APPLICATION_FIELDS = {"Programme applied for": "Program Name",
                      "Application Status": "Program Application Status",
                      "Offer Status": "Program Offer STATUS",
                      "Stage Status": "Program Stage Status",
                      "Eligibility Status": "Program Eligibility Status"}


def person_record(app_rows):
    """Combine one person's applications (same level) into one row."""
    r = app_rows[-1]
    row = applicant_base(r)
    if len(app_rows) > 1:
        progs = [clean(x.get("Program Name")) for x in app_rows]
        for out_col, src in APPLICATION_FIELDS.items():
            if out_col == "Programme applied for":
                row[out_col] = "; ".join(str(p) for p in progs)
            else:
                vals = [clean(x.get(src)) for x in app_rows]
                row[out_col] = "; ".join("%s: %s" % (p, v) for p, v in zip(progs, vals) if v is not None) or None
    row["Applications"] = len(app_rows)
    row.update(tertiary_summary(merge_tertiary(x["_tertiary"] for x in app_rows)))
    return row


def applicant_base(r):
    base = {
        "Internal / External": "Internal" if r.su else "External",
        "SU Number": r.su,
        "Surname": clean(r.get("Surname")),
        "First Name": clean(r.get("First Name")),
        "Email": clean(r.get("Email ID")),
        "Mobile": clean(r.get("Mobile No")),
        "Nationality": clean(r.get("Nationality")),
        "Programme applied for": clean(r.get("Program Name")),
        "Application Code": clean(r.get("Application Code")),
        "Intake Year": clean(r.get("IntakeYear")),
        "Application Status": clean(r.get("Program Application Status")),
        "Offer Status": clean(r.get("Program Offer STATUS")),
        "Stage Status": clean(r.get("Program Stage Status")),
        "Eligibility Status": clean(r.get("Program Eligibility Status")),
        "Submit Date": clean(r.get("Submit Date")),
    }
    return base


def build_pg(apps, level, attempts):
    sub = apps[apps.level == level] if not apps.empty else apps
    people = {}
    for _, r in sub.iterrows():
        people.setdefault(r.su or "EXT:" + str(r.person), []).append(r)
    rows = []
    for app_rows in people.values():
        row = person_record(app_rows)
        su = app_rows[-1].su
        mods = attempts.get(su, {}) if su else {}
        row["SU grade records"] = "Yes" if mods else ("No" if su else None)
        rows.append(row)
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df["_i"] = df["Internal / External"].map({"Internal": 0, "External": 1})
    df = df.sort_values(["_i", "Surname", "First Name"],
                        key=lambda s: s if s.name == "_i" else s.fillna("").str.lower()).drop(columns="_i")
    return df


def fmt_mark(m):
    return ("%g" % m) if m is not None else "-"


# ---------------------------------------------------------------------------
# Module rows (the editable "Modules" tab every status is calculated from)
# ---------------------------------------------------------------------------

RESULT_ORDER = {"Failed": 0, "Not taken (required)": 1, "Outstanding": 2, "No grade recorded": 3,
                "Outstanding (year-end)": 4, "Not taken": 5, "Passed": 6}


def is_year_end(code):
    """Second-last digit 4-9 (e.g. 55336-344): the mark is only due at year end."""
    m = re.search(r"-\d(\d)\d$", code or "")
    return bool(m) and int(m.group(1)) >= 4


def is_or(code):
    return code.startswith(OR2_PREFIX) or code.startswith(OR3_PREFIX)


def result_of(mark, no_mark):
    if mark is None:
        return no_mark
    return "Passed" if mark >= PASS_MARK else "Failed"


def module_rows(mods, enrolled, current_year, bdatsci, honours):
    """One row per module for a student. `mark` is the starting value of the
    editable Mark cell; `no_mark` is the result shown while it is blank."""
    req = set(BDATSCI_REQUIRED_MODULES) if bdatsci else set()
    codes = set()
    if bdatsci:
        codes |= set(mods) | set(enrolled) | req
    if honours:
        codes |= {c for c in set(mods) | set(enrolled) if is_or(c)} | set(HONOURS_OR_MODULES)
    rows = []
    for code in codes:
        atts = sorted(mods.get(code, []), key=lambda a: (a["year"] or 0, a["order"]))
        enr_years = enrolled.get(code, {}).get("years", set())
        current = current_year is not None and (
            current_year in enr_years or any(a["year"] == current_year for a in atts))
        if current:
            # Taken this year: only this year's mark counts (an old fail stays in Attempts)
            mark = counting_mark([a for a in atts if a["year"] == current_year])
            no_mark = "Outstanding (year-end)" if is_year_end(code) else "Outstanding"
        else:
            mark = counting_mark(atts)
            if atts or enr_years:
                no_mark = "No grade recorded"
            else:
                no_mark = "Not taken (required)" if code in req else "Not taken"
        g = graded(atts)
        name = (enrolled.get(code, {}).get("name") or next((a["name"] for a in atts if a["name"]), None)
                or BDATSCI_REQUIRED_MODULES.get(code)
                or ("Operations Research " + code.split("-", 1)[1] if code.startswith("55336-") else None))
        years = sorted({a["year"] for a in atts if a["year"]} | {y for y in enr_years if y})
        rows.append({
            "code": code, "name": name, "mark": mark, "no_mark": no_mark,
            "result": result_of(mark, no_mark),
            "year_end": "Yes" if is_year_end(code) else None,
            "bdatsci": ("Required" if code in req else ("Yes" if current else None)) if bdatsci else None,
            "attempts": "; ".join("%s: %s" % (a["year"] or "?", fmt_mark(a["mark"]) if a["mark"] is not None
                                               else "outstanding") for a in atts) or None,
            "years": ", ".join(str(y) for y in years) or None,
            "repeated": "Yes" if len(g) > 1 and (len({a["year"] for a in g}) > 1
                                                 or any(a["mark"] < PASS_MARK for a in g)) else None,
        })
    rows.sort(key=lambda r: (RESULT_ORDER[r["result"]], r["code"]))
    return rows


# Python versions of the sheet formulas, used only for the initial sort order

def bdatsci_status(rows):
    c = lambda res: sum(1 for r in rows if r["bdatsci"] and r["result"] == res)
    if c("Failed") + c("Not taken (required)"):
        return "Not eligible"
    if c("Outstanding") + c("No grade recorded"):
        return "Provisionally eligible (grades outstanding)"
    if c("Outstanding (year-end)"):
        return "Provisionally eligible (year-end grades)"
    return "Eligible"


def honours_stats(rows):
    or3 = [r for r in rows if r["code"].startswith(OR3_PREFIX)]
    marks = [r["mark"] for r in or3 if r["mark"] is not None]
    ye = sum(1 for r in or3 if r["result"] == "Outstanding (year-end)")
    other = sum(1 for r in or3 if r["result"] in ("Outstanding", "No grade recorded"))
    avg = sum(marks) / len(marks) if marks else None
    if avg is None:
        status = "Grades outstanding" if ye + other else "No SU grade records"
    else:
        status = ("Qualifies" if avg >= HONOURS_THRESHOLD else "Below %g%%" % HONOURS_THRESHOLD) + \
            (" (provisional: grades outstanding)" if other else " (provisional: year-end grades)" if ye else "")
    return avg, status


# ---------------------------------------------------------------------------
# Selecting students
# ---------------------------------------------------------------------------

def bdatsci_students(enrol, attempts, current_year):
    """[(su, info dict)] for current-year BDatSci students (final-year candidates)."""
    if enrol.empty:
        return [], current_year
    e = enrol.copy()
    e["su"] = e["SU Number"].map(su_number)
    e["year"] = e["Academic Term"].map(year_of)
    e["code"] = e["Module Code/Name"].map(module_code)
    e["prog"] = e["Program Code/Name"].map(clean).fillna("")
    e = e[e.su.notna() & e.code.notna()]
    e = e[~e.apply(is_dropped, axis=1)]
    bd = e[e.prog.str.contains(BDATSCI_PROGRAMME_KEYWORD, case=False, regex=False)]
    if current_year is None:
        current_year = int(bd.year.max()) if bd.year.notna().any() else None
    out = []
    req = set(BDATSCI_REQUIRED_MODULES)
    for su, grp in bd[bd.year == current_year].groupby("su"):
        if BDATSCI_ONLY_CANDIDATES and not (req & (set(e[e.su == su].code) | set(attempts.get(su, {})))):
            continue
        f = grp.iloc[0]
        out.append((su, {"Surname": clean(f.get("Surname")),
                         "Name": clean(f.get("Student Name")) or clean(f.get("Full Name")),
                         "Email": clean(f.get("Student Email ID")),
                         "Programme": clean(f.get("Program Code/Name")),
                         "Student Status": clean(f.get("Student Status"))}))
    return out, current_year


def honours_applicants(apps):
    """{key: [application rows]}; key is the SU Number, or EXT:<person> for externals."""
    out = {}
    if apps.empty:
        return out
    for _, r in apps[apps.level == "Honours"].iterrows():
        out.setdefault(r.su or "EXT:" + str(r.person), []).append(r)
    return out


# ---------------------------------------------------------------------------
# Workbook (formulas, so marks typed into the Modules tab update everything)
# ---------------------------------------------------------------------------

MOD = "Modules"
MOD_COLS = ["SU Number", "Student", "Summary", "Module code", "Module", "Mark", "Result",
            "Year-end module", "Counts for BDatSci", "Attempts", "Year(s)", "Repeated",
            "Changed by hand", "Key", "If no mark", "Original mark", "Failed modules", "_failed"]
# Modules column letters
M_SU, M_CODE, M_MARK, M_RES, M_BD, M_HAND, M_KEY, M_FAILED = "A", "D", "F", "G", "I", "M", "N", "Q"

GREEN, YELLOW, RED, GREY, BLUE = "C6EFCE", "FFEB9C", "FFC7CE", "EDEDED", "DDEBF7"
# First match wins (case-insensitive "contains")
COLOUR_RULES = [("not eligible", RED), ("failed", RED), ("not taken (required)", RED), ("below", RED),
                ("provisional", YELLOW), ("outstanding", YELLOW), ("no grade recorded", YELLOW),
                ("no su grade", GREY), ("not taken", GREY), ("external", BLUE),
                ("eligible", GREEN), ("qualifies", GREEN), ("passed", GREEN)]


def su_cell(su):
    return int(su) if isinstance(su, str) and su.isdigit() else su


def mref(col):
    return "%s!$%s:$%s" % (MOD, col, col)


def lookup(key_expr, col):
    return "INDEX(%s,MATCH(%s,%s,0))" % (mref(col), key_expr, mref(M_KEY))


def cnt(su_ref, *crit):
    parts = [mref(M_SU), su_ref]
    for col, val in crit:
        parts += [mref(col), '"%s"' % val]
    return "COUNTIFS(%s)" % ",".join(parts)


class Sheet:
    def __init__(self, wb, title, headers):
        from openpyxl.styles import Alignment, Font, PatternFill
        self.ws = wb.create_sheet(title)
        self.headers = list(headers)
        self.ws.append(self.headers)
        for c in self.ws[1]:
            c.font = Font(bold=True, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor="365B52")
            c.alignment = Alignment(wrap_text=True, vertical="top")
        self.ws.freeze_panes = "A2"

    def col(self, header):
        from openpyxl.utils import get_column_letter
        return get_column_letter(self.headers.index(header) + 1)

    @property
    def next_row(self):
        return self.ws.max_row + 1

    def add(self, values):
        self.ws.append([values.get(h) for h in self.headers] if isinstance(values, dict) else values)

    def finish(self, colour_cols=(), hide=(), widths=None, filter_=True, table=None):
        from openpyxl.formatting.rule import FormulaRule
        from openpyxl.styles import PatternFill
        from openpyxl.utils import get_column_letter
        ws = self.ws
        last = max(ws.max_row, 2)
        for i, h in enumerate(self.headers, start=1):
            letter = get_column_letter(i)
            vals = [len(str(c.value)) for c in ws[letter][1:400]
                    if c.value is not None and not str(c.value).startswith("=")]
            w = (widths or {}).get(h) or min(max([len(h)] + vals) + 2, 45)
            ws.column_dimensions[letter].width = max(w, 9)
            if h in hide:
                ws.column_dimensions[letter].hidden = True
        for h in colour_cols:
            letter = self.col(h)
            rng = "%s2:%s%d" % (letter, letter, last)
            for text, colour in COLOUR_RULES:
                ws.conditional_formatting.add(rng, FormulaRule(
                    formula=['ISNUMBER(SEARCH("%s",%s2))' % (text, letter)], stopIfTrue=True,
                    fill=PatternFill("solid", fgColor=colour, bgColor=colour)))
            ws.conditional_formatting.add(rng, FormulaRule(
                formula=["AND(ISNUMBER(%s2),%s2<%g)" % (letter, letter, PASS_MARK)], stopIfTrue=True,
                fill=PatternFill("solid", fgColor=RED, bgColor=RED)))
        ref = "A1:%s%d" % (get_column_letter(len(self.headers)), last)
        if table and ws.max_row >= 2:
            # An Excel table: filter arrows on every column, and Table Design > Insert Slicer works
            from openpyxl.worksheet.table import Table, TableStyleInfo
            t = Table(displayName=table, ref=ref)
            t.tableStyleInfo = TableStyleInfo(name="TableStyleLight1", showRowStripes=False)
            ws.add_table(t)
        elif filter_:
            ws.auto_filter.ref = ref


def write_modules(wb, students):
    """students: [(su, name, lists text, rows)]. Returns nothing; formulas elsewhere use it."""
    from openpyxl.styles import Font, PatternFill
    from openpyxl.worksheet.datavalidation import DataValidation
    sh = Sheet(wb, MOD, MOD_COLS)
    ws = sh.ws
    ws.sheet_properties.outlinePr.summaryBelow = False
    input_fill = PatternFill("solid", fgColor="FFF8DC")
    head_fill = PatternFill("solid", fgColor="E7EEEC")
    dv = DataValidation(type="decimal", operator="between", formula1="0", formula2="100", allow_blank=True,
                        showErrorMessage=True, errorTitle="Mark",
                        error="Enter a percentage from 0 to 100, or leave blank.")
    ws.add_data_validation(dv)
    for su, name, lists, rows in students:
        r = sh.next_row
        a = "$A%d" % r
        # Failed modules (any year) joined from the hidden _failed pieces below this line
        joined = "&".join("R%d" % i for i in range(r + 1, r + 1 + len(rows))) or '""'
        sh.add({"SU Number": su_cell(su), "Student": name, "Module": lists, "Key": "%s|" % su,
                "Failed modules": '=IF(LEN({j})>0,LEFT({j},LEN({j})-2),"")'.format(j="(" + joined + ")"),
                "Summary": '="Passed "&%s&", failed "&%s&", outstanding "&%s' % (
                    cnt(a, (M_RES, "Passed")), cnt(a, (M_RES, "Failed")), cnt(a, (M_RES, "Outstanding*")))})
        for c in ws[r]:
            c.font = Font(bold=True)
            c.fill = head_fill
        for m in rows:
            r = sh.next_row
            sh.add({"SU Number": su_cell(su), "Student": name, "Module code": m["code"], "Module": m["name"],
                    "Mark": m["mark"],
                    "Result": '=IF(ISNUMBER(F{r}),IF(F{r}>={p},"Passed","Failed"),O{r})'.format(r=r, p=PASS_MARK),
                    "Year-end module": m["year_end"], "Counts for BDatSci": m["bdatsci"],
                    "Attempts": m["attempts"], "Year(s)": m["years"], "Repeated": m["repeated"],
                    "Changed by hand": '=IF(F{r}&""=P{r}&"","","Yes")'.format(r=r),
                    "Key": "%s|%s" % (su, m["code"]), "If no mark": m["no_mark"], "Original mark": m["mark"],
                    "_failed": '=IF(G{r}="Failed",E{r}&" ("&F{r}&"), ","")'.format(r=r)})
            ws.row_dimensions[r].outline_level = 1
            ws["F%d" % r].fill = input_fill
            dv.add("F%d" % r)
    sh.finish(colour_cols=["Result"], hide=["Key", "If no mark", "Original mark", "_failed"],
              widths={"Summary": 34, "Module": 30, "Failed modules": 45})


def write_bdatsci(wb, students, rows_by_su):
    req = list(BDATSCI_REQUIRED_MODULES.items())
    headers = (["Status", "SU Number", "Surname", "Name", "Email", "Programme", "Student Status"]
               + [label for _, label in req]
               + ["Failed modules (below %g)" % PASS_MARK, "Failed", "Required not taken",
                  "Outstanding (year-end)", "Outstanding (other)", "Marks changed by hand", "Repeated modules"])
    sh = Sheet(wb, "BDatSci", headers)
    order = {"Eligible": 0, "Provisionally eligible (year-end grades)": 1,
             "Provisionally eligible (grades outstanding)": 2, "Not eligible": 3}
    students = sorted(students, key=lambda s: (order[bdatsci_status(rows_by_su[s[0]])],
                                               (s[1]["Surname"] or "").lower(), (s[1]["Name"] or "").lower()))
    L = {h: sh.col(h) for h in headers}
    for su, info in students:
        r = sh.next_row
        su_ref = "$B%d" % r
        row = dict(info, **{"SU Number": su_cell(su)})
        for code, label in req:
            k = '%s&"|%s"' % (su_ref, code)
            row[label] = '=IFERROR(%s&IF(ISNUMBER(%s)," ("&%s&")",""),"Not taken")' % (
                lookup(k, M_RES), lookup(k, M_MARK), lookup(k, M_MARK))
        row["Failed modules (below %g)" % PASS_MARK] = '=IFERROR(%s,"")' % lookup('%s&"|"' % su_ref, M_FAILED)
        row["Failed"] = "=" + cnt(su_ref, (M_BD, "<>"), (M_RES, "Failed"))
        row["Required not taken"] = "=" + cnt(su_ref, (M_RES, "Not taken (required)"))
        row["Outstanding (year-end)"] = "=" + cnt(su_ref, (M_BD, "<>"), (M_RES, "Outstanding (year-end)"))
        row["Outstanding (other)"] = "=%s+%s" % (cnt(su_ref, (M_BD, "<>"), (M_RES, "Outstanding")),
                                                 cnt(su_ref, (M_BD, "<>"), (M_RES, "No grade recorded")))
        row["Marks changed by hand"] = "=" + cnt(su_ref, (M_HAND, "Yes"))
        rep = [m["code"] for m in rows_by_su[su] if m["repeated"]]
        row["Repeated modules"] = ", ".join(rep) or None
        row["Status"] = ('=IF({f}{r}+{n}{r}>0,"Not eligible",IF({o}{r}>0,"Provisionally eligible (grades '
                         'outstanding)",IF({y}{r}>0,"Provisionally eligible (year-end grades)","Eligible")))'
                         ).format(f=L["Failed"], n=L["Required not taken"], o=L["Outstanding (other)"],
                                  y=L["Outstanding (year-end)"], r=r)
        sh.add(row)
    sh.finish(colour_cols=["Status"] + [label for _, label in req],
              widths={"Status": 40, "Programme": 30, "Failed modules (below %g)" % PASS_MARK: 45},
              table="BDatSciTable")
    return sh


def write_honours(wb, applied, rows_by_su, current_prog):
    from openpyxl.utils import get_column_letter
    codes = set(HONOURS_OR_MODULES)
    for key in applied:
        codes |= {m["code"] for m in rows_by_su.get(key, []) if is_or(m["code"])}
    or3 = sorted(c for c in codes if c.startswith(OR3_PREFIX))
    or2 = sorted(c for c in codes if c.startswith(OR2_PREFIX))
    label = lambda c: "OR %s (%s)" % (c.split("-", 1)[1], c)
    built = []
    for key, app_rows in applied.items():
        su = None if str(key).startswith("EXT:") else key
        info = person_record(app_rows)
        info.pop("Applications", None)
        if su:
            avg, status = honours_stats(rows_by_su[su])
        else:
            avg, status = None, "External applicant"
        built.append((su, info, avg, status))
    group = lambda s: (0 if s.startswith("Qualifies") else 1 if s.startswith("Below") else
                       2 if s == "Grades outstanding" else 3 if s.startswith("No SU") else 4)
    built.sort(key=lambda b: (group(b[3]), -(b[2] or 0), (b[1].get("Surname") or "").lower()))

    info_cols = [c for c in (built[0][1].keys() if built else []) if c not in
                 ("Internal / External", "SU Number", "Surname", "First Name")]
    headers = (["Rank", "Status", "Internal / External", "SU Number", "Surname", "First Name", "OR3 average"]
               + [label(c) for c in or3] + ["OR2 average"] + [label(c) for c in or2]
               + ["OR2 + OR3 average", "Repeated OR modules"] + info_cols + ["Current programme"]
               + ["_or3_graded", "_or3_yearend", "_or3_other"])
    sh = Sheet(wb, "Honours", headers)
    L = {h: sh.col(h) for h in headers}
    for su, info, _, status in built:
        r = sh.next_row
        row = dict(info, **{"SU Number": su_cell(su), "Current programme": current_prog.get(su) if su else None})
        if su:
            s = "$D%d" % r
            for c in or3 + or2:
                k = '%s&"|%s"' % (s, c)
                row[label(c)] = '=IFERROR(IF(ISNUMBER(%s),%s,%s),"")' % (
                    lookup(k, M_MARK), lookup(k, M_MARK), lookup(k, M_RES))
            avg = lambda p: 'IFERROR(AVERAGEIFS(%s,%s,%s,%s,"%s*"),"")' % (
                mref(M_MARK), mref(M_SU), s, mref(M_CODE), p)
            sm = lambda p: 'SUMIFS(%s,%s,%s,%s,"%s*")' % (mref(M_MARK), mref(M_SU), s, mref(M_CODE), p)
            n = lambda p: cnt(s, (M_CODE, p + "*"), (M_MARK, ">=0"))
            row["OR3 average"] = "=" + avg(OR3_PREFIX)
            row["OR2 average"] = "=" + avg(OR2_PREFIX)
            row["OR2 + OR3 average"] = '=IFERROR((%s+%s)/(%s+%s),"")' % (
                sm(OR2_PREFIX), sm(OR3_PREFIX), n(OR2_PREFIX), n(OR3_PREFIX))
            row["_or3_graded"] = "=" + n(OR3_PREFIX)
            row["_or3_yearend"] = "=" + cnt(s, (M_CODE, OR3_PREFIX + "*"), (M_RES, "Outstanding (year-end)"))
            row["_or3_other"] = "=%s+%s" % (cnt(s, (M_CODE, OR3_PREFIX + "*"), (M_RES, "Outstanding")),
                                            cnt(s, (M_CODE, OR3_PREFIX + "*"), (M_RES, "No grade recorded")))
            g, ye, ot, av = (L["_or3_graded"] + str(r), L["_or3_yearend"] + str(r),
                             L["_or3_other"] + str(r), L["OR3 average"] + str(r))
            row["Status"] = ('=IF({g}=0,IF({ye}+{ot}>0,"Grades outstanding","No SU grade records"),'
                             'IF({av}>={t},"Qualifies","Below {t:g}%")&IF({ot}>0," (provisional: grades '
                             'outstanding)",IF({ye}>0," (provisional: year-end grades)","")))'
                             ).format(g=g, ye=ye, ot=ot, av=av, t=HONOURS_THRESHOLD)
            row["Rank"] = '=IF(ISNUMBER({a}),COUNTIF(${c}:${c},">"&{a})+1,"")'.format(
                a=av, c=L["OR3 average"])
            rep = [m["code"] for m in rows_by_su[su] if m["repeated"] and is_or(m["code"])]
            row["Repeated OR modules"] = ", ".join(rep) or None
        else:
            row["Status"] = status
        sh.add(row)
    for h in headers:
        if h.endswith("average"):
            for cell in sh.ws[L[h]][1:]:
                cell.number_format = "0.00"
    sh.finish(colour_cols=["Status"] + [label(c) for c in or3 + or2],
              hide=["_or3_graded", "_or3_yearend", "_or3_other"], widths={"Status": 44},
              table="HonoursTable")
    return sh


def current_programmes(enrol, grades_df):
    """{su: programme} from the latest enrolment (Academic Term), else the latest grade."""
    best = {}
    if not enrol.empty:
        for _, r in enrol.iterrows():
            su, prog, y = su_number(r.get("SU Number")), clean(r.get("Program Code/Name")), \
                year_of(r.get("Academic Term")) or 0
            if su and prog and (su not in best or y >= best[su][0]):
                best[su] = (y, prog)
    if not grades_df.empty:
        for g in grades_df.itertuples(index=False):
            y = g.year if g.year and not pd.isna(g.year) else 0
            if g.programme and (g.su not in best or (best[g.su][0] < y)):
                best[g.su] = (y, g.programme)
    return {su: p for su, (_, p) in best.items()}


def write_frame(wb, title, df):
    if df is None or df.empty:
        df = pd.DataFrame({"Info": ["No records found for this tab."]})
    sh = Sheet(wb, title, list(df.columns))
    for rec in df.to_dict("records"):
        sh.add({k: (su_cell(v) if k == "SU Number" else (None if v is None or (isinstance(v, float)
                                                                                and pd.isna(v)) else v))
                for k, v in rec.items()})
    sh.finish(table=re.sub(r"\W", "", title) + "Table")
    return sh


def write_overview(wb, year, sections_src):
    """sections_src: {key: (Sheet, programme column header, list of programmes)}."""
    from openpyxl.styles import Font, PatternFill
    ws = wb.create_sheet("Overview", 0)
    ws.column_dimensions["A"].width = 52
    ws.column_dimensions["B"].width = 12
    ws.append(["Student report overview", None])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append(["Academic year %s. Counts update when marks are entered on the Modules tab. "
               "Pick a programme in a yellow cell to count only that programme." % year])
    ws["A2"].font = Font(italic=True, color="666666")
    ws.column_dimensions["B"].width = 48

    # Hidden sheet holding each section's programme list for the dropdowns
    lists = wb.create_sheet("Lists")
    lists.sheet_state = "hidden"
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.datavalidation import DataValidation

    def section(title, key, items):
        """items: (label, criteria, indent); criteria is a list of (column, value) on
        the section's sheet, or None for a sub-heading."""
        ws.append([])
        ws.append([title, "Count"])
        for c in ws[ws.max_row]:
            c.font = Font(bold=True, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor="365B52")
        sh, prog_header, progs = sections_src[key]
        ws.append(["Programme", "All"])
        sel = "$B$%d" % ws.max_row
        ws.cell(ws.max_row, 2).fill = PatternFill("solid", fgColor="FFF8DC")
        ws.cell(ws.max_row, 1).font = Font(italic=True)
        n = section.lists_used = getattr(section, "lists_used", 0) + 1
        lc = get_column_letter(n)
        for i, p in enumerate(["All"] + progs, start=1):
            lists.cell(i, n, p)
        dv = DataValidation(type="list", formula1="=Lists!$%s$1:$%s$%d" % (lc, lc, len(progs) + 1),
                            allow_blank=False)
        ws.add_data_validation(dv)
        dv.add(sel)
        t = sh.ws.title
        pc = sh.col(prog_header) if sh and prog_header in sh.headers else None
        rng = lambda col: "%s!$%s:$%s" % (t, col, col)
        for label, crit, indent in items:
            if crit is None:
                f = None
            else:
                parts = ",".join("%s,\"%s\"" % (rng(c), v) for c, v in crit)
                if pc:
                    f = '=IF(%s="All",COUNTIFS(%s),COUNTIFS(%s,%s,"*"&%s&"*"))' % (sel, parts, parts, rng(pc), sel)
                else:
                    f = "=COUNTIFS(%s)" % parts
            ws.append([("    " if indent else "") + label, f])
            if not indent:
                ws.cell(ws.max_row, 1).font = Font(bold=True)

    if "BDatSci" in sections_src:
        a = sections_src["BDatSci"][0].col("Status")
        section("BDatSci: continuing to final year", "BDatSci", [
            ("Eligible", [(a, "Eligible")], False),
            ("Provisionally eligible", [(a, "Provisionally*")], False),
            ("year-end grades outstanding only", [(a, "Provisionally eligible (year-end grades)")], True),
            ("other grades outstanding", [(a, "Provisionally eligible (grades outstanding)")], True),
            ("Not eligible", [(a, "Not eligible")], False),
            ("Total listed", [(a, "?*"), (a, "<>Status")], False)])
    if "Honours" in sections_src:
        b = sections_src["Honours"][0].col("Status")
        section("Honours applicants (OR3 average >= %g%%)" % HONOURS_THRESHOLD, "Honours", [
            ("Qualify", [(b, "Qualifies*")], False),
            ("confirmed", [(b, "Qualifies")], True),
            ("provisional: year-end grades outstanding", [(b, "Qualifies (provisional: year-end grades)")], True),
            ("provisional: other grades outstanding", [(b, "Qualifies (provisional: grades outstanding)")], True),
            ("Below %g%%" % HONOURS_THRESHOLD, [(b, "Below*")], False),
            ("of which provisional", [(b, "Below*provisional*")], True),
            ("All OR3 grades outstanding", [(b, "Grades outstanding")], False),
            ("Internal, no SU grade records", [(b, "No SU grade records")], False),
            ("External applicants", [(b, "External applicant")], False),
            ("Total applicants", [(b, "?*"), (b, "<>Status")], False)])
    for key in ("Masters", "PhD", "Other"):
        if key not in sections_src:
            continue
        sh, _, _ = sections_src[key]
        title = ("Other" if key == "Other" else key) + " applicants"
        if "Internal / External" not in sh.headers:
            section(title, key, [("No applicants", None, False)])
            continue
        io = sh.col("Internal / External")
        items = [("Total applicants", [(io, "?*"), (io, "<>Internal / External")], False),
                 ("Internal (SU number)", [(io, "Internal")], True),
                 ("External", [(io, "External")], True)]
        if "Eligibility Status" in sh.headers:
            ec = sh.col("Eligibility Status")
            vals = sorted({str(c.value) for c in sh.ws[ec][1:] if clean(c.value) is not None})
            if vals:
                items.append(("By Program Eligibility Status", None, False))
                items += [(v, [(ec, v)], True) for v in vals]
            else:
                items.append(("No Program Eligibility Status in the report", None, False))
        section(title, key, items)
    ws["A1"].font = Font(bold=True, size=14)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+", help=".xlsx files and/or folders")
    ap.add_argument("-o", "--output", default="Student_Report_%s.xlsx" % date.today().isoformat())
    ap.add_argument("--year", type=int, help="current academic year (default: latest BDatSci Academic Term)")
    args = ap.parse_args()

    enrol, grades_raw, apps_raw, log = read_inputs(args.inputs)
    if enrol.empty and grades_raw.empty and apps_raw.empty:
        sys.exit("No recognised reports found in: %s" % ", ".join(args.inputs))

    grades = normalise_grades(grades_raw)
    attempts = attempts_by_student(grades)
    enrolled_by = enrolments_by_student(enrol)
    bd_students, year = bdatsci_students(enrol, attempts, args.year)
    if year is None and not grades.empty and grades.year.notna().any():
        year = int(grades.year.max())
    apps = prepare_applicants(apps_raw)
    applied = honours_applicants(apps)

    # Every student on the BDatSci or Honours tab gets one block on the Modules tab
    bd_set = {su for su, _ in bd_students}
    hons_set = {k for k in applied if not str(k).startswith("EXT:")}
    names = {su: " ".join(x for x in (i["Name"], i["Surname"]) if x) for su, i in bd_students}
    for su in hons_set:
        r = applied[su][-1]
        names.setdefault(su, " ".join(str(x) for x in (clean(r.get("First Name")), clean(r.get("Surname"))) if x))
    rows_by_su = {su: module_rows(attempts.get(su, {}), enrolled_by.get(su, {}), year,
                                  su in bd_set, su in hons_set) for su in bd_set | hons_set}

    from openpyxl import Workbook
    wb = Workbook()
    wb.remove(wb.active)
    progs_of = lambda sh, h: sorted({str(c.value) for c in sh.ws[sh.col(h)][1:] if clean(c.value)}) \
        if h in sh.headers else []
    src, pg = {}, {}
    sh = write_bdatsci(wb, bd_students, rows_by_su)
    src["BDatSci"] = (sh, "Programme", progs_of(sh, "Programme"))
    sh = write_honours(wb, applied, rows_by_su, current_programmes(enrol, grades))
    # Applicants with several Honours programmes: offer each programme on its own
    hp = sorted({p.strip() for v in progs_of(sh, "Programme applied for") for p in v.split(";")})
    src["Honours"] = (sh, "Programme applied for", hp)
    for level in ("Masters", "PhD"):
        df = build_pg(apps, level, attempts)
        sh = write_frame(wb, level, df)
        pg[level] = df
        src[level] = (sh, "Programme applied for", sorted({p.strip() for v in progs_of(sh, "Programme applied for")
                                                          for p in v.split(";")}))
    other = apps[apps.level == "Other"] if not apps.empty else apps
    if not other.empty:
        df = build_pg(other, "Other", attempts)
        sh = write_frame(wb, "Other applications", df)
        src["Other"] = (sh, "Programme applied for", progs_of(sh, "Programme applied for"))
    order = sorted(rows_by_su, key=lambda s: (s not in bd_set, names.get(s, "").lower()))
    write_modules(wb, [(su, names.get(su), "On: " + ", ".join(
        x for x, on in (("BDatSci", su in bd_set), ("Honours", su in hons_set)) if on), rows_by_su[su])
        for su in order])
    write_overview(wb, year, src)

    notes = [("Generated", date.today().isoformat()),
             ("Current academic year", year),
             ("Entering marks", "Type a mark (0-100) in the yellow Mark cells on the Modules tab. Results, "
                                "statuses, averages and the Overview update automatically. 'Changed by hand' "
                                "marks every mark that differs from the export."),
             ("Pass mark", PASS_MARK),
             ("Year-end modules", "Module codes whose second-last digit is 4-9 (e.g. 55336-344). A missing "
                                  "mark there is expected: 'Outstanding (year-end)', counted as provisional."),
             ("BDatSci rule", "OR 314, 344 and 352 passed (any year) or taken this year with the mark "
                              "outstanding; every other module this year passed. Provisional when marks "
                              "are outstanding (year-end only, or other)."),
             ("Honours rule", "Honours applicants only. Unweighted mean of all %s* modules >= %g%%. "
                              "Columns always shown: %s." % (OR3_PREFIX, HONOURS_THRESHOLD,
                                                             ", ".join(HONOURS_OR_MODULES))),
             ("Repeated modules", "A module enrolled this year counts only this year's mark; otherwise the "
                                  "%s attempt counts. All attempts are listed on the Modules tab." % REPEAT_ATTEMPT),
             ("Row order", "Rows are sorted when the report is generated; use the filter arrows to "
                           "re-sort after entering marks."),
             ("Filtering by programme", "Overview: pick a programme in the yellow cell under each heading. "
                                        "Tabs: use the Programme column's filter arrow, or click in the table "
                                        "and choose Table Design > Insert Slicer > Programme."),
             ("", "")] + [("%s [%s]" % (f, s), res) for f, s, res in log]
    sh = Sheet(wb, "Notes", ["Item", "Value"])
    for item in notes:
        sh.add(list(item))
    sh.finish(widths={"Item": 40, "Value": 100}, filter_=False)

    wb.calculation.fullCalcOnLoad = True
    wb.save(args.output)
    print("Wrote %s" % args.output)
    print("  BDatSci students: %d, Honours applicants: %d, Masters: %d, PhD: %d, module rows: %d"
          % (len(bd_students), len(applied), len(pg["Masters"]), len(pg["PhD"]),
             sum(len(v) for v in rows_by_su.values())))


if __name__ == "__main__":
    main()
