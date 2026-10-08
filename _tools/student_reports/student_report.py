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
Writes one workbook with tabs: BDatSci, Honours, Masters, PhD, Notes.

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


RESULT_ORDER = {"Failed": 0, "Not taken (required)": 1, "Outstanding": 2,
                "No grade recorded": 3, "Passed": 4}


def module_detail(mods, enrolled, current_year, required=(), keep=lambda code: True):
    """One dict per module for a student: result, counting mark, every attempt."""
    rows = []
    for code in sorted((set(mods) | set(enrolled) | set(required))):
        if not keep(code):
            continue
        atts = sorted(mods.get(code, []), key=lambda a: (a["year"] or 0, a["order"]))
        g = graded(atts)
        enr_years = enrolled.get(code, {}).get("years", set())
        pending_now = (current_year in enr_years and not graded([a for a in atts if a["year"] == current_year])) \
            or any(a["mark"] is None and a["year"] == current_year for a in atts)
        if any(a["mark"] >= PASS_MARK for a in g):
            result = "Passed"
        elif pending_now:
            result = "Outstanding"
        elif g:
            result = "Failed"
        elif code in required and not atts and not enr_years:
            result = "Not taken (required)"
        else:
            result = "No grade recorded"
        name = enrolled.get(code, {}).get("name") or next((a["name"] for a in atts if a["name"]), None)
        years = sorted({a["year"] for a in atts if a["year"]} | {y for y in enr_years if y})
        rows.append({
            "Module code": code,
            "Module": name or (required.get(code) if isinstance(required, dict) else None),
            "Result": result,
            "Mark": counting_mark(atts),
            "Attempts": "; ".join("%s: %s" % (a["year"] or "?", fmt_mark(a["mark"]) if a["mark"] is not None
                                               else "outstanding") for a in atts) or None,
            "Year(s)": ", ".join(str(y) for y in years) or None,
            "Required": "Yes" if code in required else None,
            "Repeated": "Yes" if len(g) > 1 and (len({a["year"] for a in g}) > 1
                                                 or any(a["mark"] < PASS_MARK for a in g)) else None,
        })
    rows.sort(key=lambda r: (RESULT_ORDER[r["Result"]], r["Module code"]))
    return rows


def grouped_detail(students):
    """students: list of (header dict, [module dicts]) -> one frame with an _level column."""
    out = []
    for head, mods in students:
        counts = {}
        for m in mods:
            counts[m["Result"]] = counts.get(m["Result"], 0) + 1
        summary = ", ".join("%s %d" % (k, counts[k]) for k in RESULT_ORDER if k in counts)
        out.append(dict(head, **{"Module": summary or "No module records", "_level": 0}))
        for m in mods:
            out.append(dict({"SU Number": head["SU Number"], "Student": head["Student"]}, **m, _level=1))
    cols = ["SU Number", "Student", "Status", "Module code", "Module", "Result", "Mark",
            "Attempts", "Year(s)", "Required", "Repeated", "_level"]
    return pd.DataFrame(out, columns=cols)


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


# ---------------------------------------------------------------------------
# BDatSci
# ---------------------------------------------------------------------------

def is_dropped(row):
    status = str(clean(row.get("Module Status")) or "").lower()
    if any(w in status for w in DROPPED_STATUS_WORDS):
        return True
    return clean(row.get("Unenrolled Date")) is not None


def build_bdatsci(enrol, attempts, current_year, enrolled_by):
    if enrol.empty:
        return pd.DataFrame(), pd.DataFrame(), current_year
    e = enrol.copy()
    e["su"] = e["SU Number"].map(su_number)
    e["year"] = e["Academic Term"].map(year_of)
    e["code"] = e["Module Code/Name"].map(module_code)
    e["mname"] = e["Module Code/Name"].map(module_name)
    e["prog"] = e["Program Code/Name"].map(clean).fillna("")
    e = e[e.su.notna() & e.code.notna()]
    e = e[~e.apply(is_dropped, axis=1)]
    bd = e[e.prog.str.contains(BDATSCI_PROGRAMME_KEYWORD, case=False, regex=False)]
    if current_year is None:
        current_year = int(bd.year.max()) if bd.year.notna().any() else None
    cur = bd[bd.year == current_year]

    rows, details = [], {}
    for su, grp in cur.groupby("su"):
        mods = attempts.get(su, {})
        enrolled_now = dict(zip(grp.code, grp.mname))
        all_enrolled = set(e[e.su == su].code)
        # Current-year modules = enrolled this year + anything graded this year
        current_codes = set(enrolled_now)
        for code, atts in mods.items():
            if any(a["year"] == current_year for a in atts):
                current_codes.add(code)

        req_codes = set(BDATSCI_REQUIRED_MODULES)
        if BDATSCI_ONLY_CANDIDATES and not (req_codes & (all_enrolled | set(mods))):
            continue

        failed, outstanding, missing = [], [], []
        req_state = {}
        for code in sorted(req_codes):
            atts = mods.get(code, [])
            passed = any(a["mark"] >= PASS_MARK for a in graded(atts))
            if passed:
                req_state[code] = "Passed (%s)" % fmt_mark(max(a["mark"] for a in graded(atts)))
            elif code in current_codes and not graded([a for a in atts if a["year"] == current_year]):
                req_state[code] = "Outstanding"
                outstanding.append(code)
            elif graded(atts):
                req_state[code] = "Failed (%s)" % fmt_mark(counting_mark(atts))
                failed.append(code)
            else:
                req_state[code] = "Not taken"
                missing.append(code)

        for code in sorted(current_codes - req_codes):
            this_year = [a for a in mods.get(code, []) if a["year"] == current_year]
            g = graded(this_year)
            if not g:
                outstanding.append(code)
            elif not any(a["mark"] >= PASS_MARK for a in g):
                failed.append(code)

        if failed or missing:
            status = "Not eligible"
        elif outstanding:
            status = "Provisionally eligible"
        else:
            status = "Eligible"

        first = grp.iloc[0]
        rep = repeated_codes(mods)
        row = {
            "Status": status,
            "SU Number": su,
            "Surname": clean(first.get("Surname")),
            "Name": clean(first.get("Student Name")) or clean(first.get("Full Name")),
            "Email": clean(first.get("Student Email ID")),
            "Programme": clean(first.get("Program Code/Name")),
            "Student Status": clean(first.get("Student Status")),
        }
        for code, label in BDATSCI_REQUIRED_MODULES.items():
            row[label] = req_state[code]
        row.update({
            "Failed modules": ", ".join(sorted(set(failed))) or None,
            "Not taken (required)": ", ".join(missing) or None,
            "Outstanding grades": ", ".join(sorted(set(outstanding))) or None,
            "Modules this year": len(current_codes),
            "Repeated modules": ", ".join(rep) or None,
            "Repeat flag": "Yes" if rep else None,
        })
        rows.append(row)
        details[su] = module_detail(mods, enrolled_by.get(su, {}), current_year,
                                    required=BDATSCI_REQUIRED_MODULES)

    df = pd.DataFrame(rows)
    detail = pd.DataFrame()
    if not df.empty:
        order = {"Eligible": 0, "Provisionally eligible": 1, "Not eligible": 2}
        df = df.sort_values(["Status", "Surname", "Name"],
                            key=lambda s: s.map(order) if s.name == "Status" else s.fillna("").str.lower())
        detail = grouped_detail([
            ({"SU Number": r["SU Number"], "Student": " ".join(x for x in (r["Name"], r["Surname"]) if x),
              "Status": r["Status"]}, details[r["SU Number"]]) for _, r in df.iterrows()])
    return df, detail, current_year


def fmt_mark(m):
    return ("%g" % m) if m is not None else "-"


# ---------------------------------------------------------------------------
# Applicants
# ---------------------------------------------------------------------------

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


def build_honours(apps, attempts, grades_df, current_year, people, enrolled_by):
    hons_apps = apps[apps.level == "Honours"] if not apps.empty else apps
    applied = {}
    for _, r in hons_apps.iterrows():
        key = r.su or ("EXT:" + str(r.person))
        applied.setdefault(key, []).append(r)

    is_or = lambda c: c.startswith(OR2_PREFIX) or c.startswith(OR3_PREFIX)
    # One column per OR2/OR3 module found in the applicants' records (or enrolments)
    or_codes = set()
    for key in applied:
        if not str(key).startswith("EXT:"):
            or_codes |= {c for c in attempts.get(key, {}) if is_or(c)}
            or_codes |= {c for c in enrolled_by.get(key, {}) if is_or(c)}
    or_codes = sorted(or_codes)

    rows = []
    for key, app_rows in applied.items():
        su = None if str(key).startswith("EXT:") else key
        row = person_record(app_rows)
        row.pop("Applications", None)

        mods = attempts.get(su, {}) if su else {}
        or3, n3, pend3 = avg_for_prefix(mods, OR3_PREFIX)
        or2, n2, _ = avg_for_prefix(mods, OR2_PREFIX)
        both, nb, _ = avg_for_prefix({k: v for k, v in mods.items()
                                      if k.startswith(OR2_PREFIX) or k.startswith(OR3_PREFIX)}, "")
        rep = [c for c in repeated_codes(mods) if c.startswith(OR2_PREFIX) or c.startswith(OR3_PREFIX)]

        if su is None:
            status = "External applicant"
        elif n3 == 0 and not pend3:
            status = "No SU grade records"
        elif n3 == 0:
            status = "Grades outstanding"
        elif or3 >= HONOURS_THRESHOLD:
            status = "Qualifies (provisional)" if pend3 else "Qualifies"
        else:
            status = "Below %g%%" % HONOURS_THRESHOLD + (" (provisional)" if pend3 else "")

        row.update({
            "Status": status,
            "OR3 average": or3,
            "OR2 average": or2,
            "OR2 + OR3 average": both,
            "OR3 outstanding": ", ".join(pend3) or None,
            "Repeat flag": "Yes" if rep else None,
            "Repeated OR modules": ", ".join(rep) or None,
        })
        enr = enrolled_by.get(su, {}) if su else {}
        for code in or_codes:
            atts = mods.get(code, [])
            m = counting_mark(atts)
            if m is not None:
                row[or_label(code, mods, enr)] = m
            elif atts or enr.get(code, {}).get("years"):
                row[or_label(code, mods, enr)] = "Outstanding"
            else:
                row[or_label(code, mods, enr)] = None
        rows.append(row)

    df = pd.DataFrame(rows)
    if df.empty:
        return df, pd.DataFrame()
    order = {"Qualifies": 0, "Qualifies (provisional)": 1, "Grades outstanding": 3,
             "No SU grade records": 4, "External applicant": 5}
    df["_g"] = df.Status.map(lambda s: order.get(s, 2))
    df["_avg"] = -df["OR3 average"].fillna(-1)
    df = df.sort_values(["_g", "_avg", "Surname"], na_position="last").drop(columns=["_g", "_avg"])
    df.insert(0, "Rank", range(1, len(df) + 1))
    module_cols = [c for c in df.columns if c.startswith("OR ")]
    module_cols.sort(key=lambda c: (not c.startswith("OR 3"), c))   # OR3 modules first
    lead = (["Rank", "Status", "Internal / External", "SU Number", "Surname", "First Name",
             "OR3 average"] + [c for c in module_cols if c.startswith("OR 3")] +
            ["OR2 average"] + [c for c in module_cols if not c.startswith("OR 3")] +
            ["OR2 + OR3 average", "OR3 outstanding", "Repeat flag", "Repeated OR modules"])
    df = df[[c for c in lead if c in df.columns] + [c for c in df.columns if c not in lead]]
    detail = grouped_detail([
        ({"SU Number": r["SU Number"],
          "Student": " ".join(str(x) for x in (r.get("First Name"), r.get("Surname")) if clean(x)),
          "Status": r["Status"]},
         module_detail(attempts.get(r["SU Number"], {}), enrolled_by.get(r["SU Number"], {}),
                       current_year, keep=is_or))
        for _, r in df.iterrows() if clean(r["SU Number"]) is not None])
    return df, detail


def or_label(code, mods, enrolled):
    """'55336-314' -> 'OR 314 (55336-314)' for a column heading."""
    return "OR %s (%s)" % (code.split("-", 1)[1], code)


def people_lookup(enrol, grades_df):
    """{su: {surname, name, email, programme}} from enrolment, else grade roster."""
    out = {}
    if not enrol.empty:
        for _, r in enrol.iterrows():
            su = su_number(r.get("SU Number"))
            if su and su not in out:
                out[su] = {"surname": clean(r.get("Surname")),
                           "name": clean(r.get("Student Name")) or clean(r.get("Full Name")),
                           "email": clean(r.get("Student Email ID")),
                           "programme": clean(r.get("Program Code/Name"))}
    if not grades_df.empty:
        for r in grades_df.itertuples(index=False):
            if r.su not in out:
                out[r.su] = {"surname": None, "name": r.student_name, "email": None,
                             "programme": r.programme}
    return out


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


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

FILLS = {
    "Eligible": "C6EFCE", "Qualifies": "C6EFCE",
    "Provisionally eligible": "FFEB9C", "Qualifies (provisional)": "FFEB9C", "Grades outstanding": "FFEB9C",
    "Not eligible": "FFC7CE",
    "No SU grade records": "EDEDED", "External applicant": "DDEBF7",
    "Passed": "C6EFCE", "Failed": "FFC7CE", "Not taken (required)": "FFC7CE", "Outstanding": "FFEB9C",
}


def write_workbook(path, sheets):
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    with pd.ExcelWriter(path, engine="openpyxl") as xw:
        for name, df in sheets.items():
            if df is None or df.empty:
                df = pd.DataFrame({"Info": ["No records found for this tab."]})
            levels = None
            if "_level" in df.columns:
                levels = list(df["_level"])
                df = df.drop(columns="_level")
            if "SU Number" in df.columns:
                df = df.copy()
                df["SU Number"] = [int(v) if isinstance(v, str) and v.isdigit() else v
                                   for v in df["SU Number"]]
            df.to_excel(xw, sheet_name=name, index=False)
            ws = xw.sheets[name]
            ws.freeze_panes = "A2"
            ws.auto_filter.ref = ws.dimensions
            for c in ws[1]:
                c.font = Font(bold=True, color="FFFFFF")
                c.fill = PatternFill("solid", fgColor="365B52")
                c.alignment = Alignment(wrap_text=True, vertical="top")
            for i, col in enumerate(df.columns, start=1):
                width = max([len(str(col))] + [len(str(v)) for v in df[col].head(500) if v is not None])
                ws.column_dimensions[get_column_letter(i)].width = min(max(width + 2, 8), 60)
            if levels:
                # Student line in bold, its module lines grouped under it (+/- to collapse)
                ws.sheet_properties.outlinePr.summaryBelow = False
                for i, lvl in enumerate(levels, start=2):
                    if lvl:
                        ws.row_dimensions[i].outline_level = 1
                    else:
                        for c in ws[i]:
                            c.font = Font(bold=True)
                            c.fill = PatternFill("solid", fgColor="E7EEEC")
            for col_name in ("Status", "Result"):
                if col_name not in df.columns:
                    continue
                sc = list(df.columns).index(col_name) + 1
                for row in ws.iter_rows(min_row=2, min_col=sc, max_col=sc):
                    for c in row:
                        key = "Below" if str(c.value).startswith("Below") else c.value
                        color = FILLS.get(key, "FFC7CE" if key == "Below" else None)
                        if color:
                            c.fill = PatternFill("solid", fgColor=color)


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
    bdat, bdat_detail, year = build_bdatsci(enrol, attempts, args.year, enrolled_by)
    if year is None and not grades.empty and grades.year.notna().any():
        year = int(grades.year.max())
    apps = prepare_applicants(apps_raw)
    hons, hons_detail = build_honours(apps, attempts, grades, year, people_lookup(enrol, grades), enrolled_by)
    masters = build_pg(apps, "Masters", attempts)
    phd = build_pg(apps, "PhD", attempts)

    other = apps[apps.level == "Other"] if not apps.empty else apps
    notes = [("Generated", date.today().isoformat()),
             ("Current academic year", year),
             ("Pass mark", PASS_MARK),
             ("BDatSci required modules", ", ".join("%s (%s)" % kv for kv in BDATSCI_REQUIRED_MODULES.items())),
             ("BDatSci rule", "Required modules passed (any year) or enrolled now with grade outstanding; "
                              "every other module this year passed. Outstanding grades -> Provisionally eligible."),
             ("Honours rule", "Unweighted mean of %s* modules >= %g%%. Repeated module counts its %s attempt."
              % (OR3_PREFIX, HONOURS_THRESHOLD, REPEAT_ATTEMPT)),
             ("Honours list", "Honours applicants only, ranked by OR3 average; no-record and external "
                              "applicants at the bottom. One column per OR module (mark that counts, "
                              "or 'Outstanding')."),
             ("Repeat flag", "Module graded more than once (across years, or after a fail)."),
             ("Module tabs", "One bold line per student, then every module with its result, counting "
                             "mark and all attempts. Use the +/- in the margin to collapse a student."),
             ("Applications", "Rows split over several lines (merged cells) are combined; one row per "
                              "person per tab, with every programme applied for listed."),
             ("Unclassified applications", len(other))]
    notes_df = pd.DataFrame(notes, columns=["Item", "Value"])
    files_df = pd.DataFrame(log, columns=["File", "Sheet", "Result"])
    notes_df = pd.concat([notes_df, pd.DataFrame([("", "")], columns=["Item", "Value"]),
                          files_df.rename(columns={"File": "Item", "Result": "Value"})[["Item", "Value"]]
                          .assign(Item=files_df.File + " [" + files_df.Sheet.astype(str) + "]")],
                         ignore_index=True)

    sheets = {"BDatSci": bdat, "BDatSci modules": bdat_detail, "Honours": hons,
              "Honours OR modules": hons_detail, "Masters": masters, "PhD": phd, "Notes": notes_df}
    if not other.empty:
        sheets["Other applications"] = build_pg(other.assign(level="Other"), "Other", attempts)
    write_workbook(args.output, sheets)

    print("Wrote %s" % args.output)
    for name, df in sheets.items():
        print("  %-20s %d rows" % (name, 0 if df is None else len(df)))


if __name__ == "__main__":
    main()
