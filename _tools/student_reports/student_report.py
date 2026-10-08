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
            sheets = pd.read_excel(f, sheet_name=None, header=None, dtype=object)
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
    for _, r in body.iterrows():
        vals = r.tolist()
        rec = {base[i]: clean(vals[i]) for i in range(min(len(base), len(vals))) if base[i]}
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
        res.setdefault(r.su, {}).setdefault(r.code, []).append(
            {"year": r.year, "mark": r.mark, "period": r.period, "order": r.order, "name": r.name})
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


# ---------------------------------------------------------------------------
# BDatSci
# ---------------------------------------------------------------------------

def is_dropped(row):
    status = str(clean(row.get("Module Status")) or "").lower()
    if any(w in status for w in DROPPED_STATUS_WORDS):
        return True
    return clean(row.get("Unenrolled Date")) is not None


def build_bdatsci(enrol, attempts, current_year):
    if enrol.empty:
        return pd.DataFrame(), current_year
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

    rows = []
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

    df = pd.DataFrame(rows)
    if not df.empty:
        order = {"Eligible": 0, "Provisionally eligible": 1, "Not eligible": 2}
        df = df.sort_values(["Status", "Surname", "Name"],
                            key=lambda s: s.map(order) if s.name == "Status" else s.fillna("").str.lower())
    return df, current_year


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
    a["level"] = a.get("Program Name").map(classify)
    a = a.drop_duplicates(subset=[c for c in ("Application Code", "Program Name") if c in a.columns],
                          keep="last")
    return a


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


def build_honours(apps, attempts, grades_df, current_year, people):
    hons_apps = apps[apps.level == "Honours"] if not apps.empty else apps
    applied = {}
    for _, r in hons_apps.iterrows():
        key = r.su or ("EXT:" + str(clean(r.get("Application Code")) or len(applied)))
        applied.setdefault(key, []).append(r)

    # Internal students with OR3 activity this year, applied or not. BDatSci
    # students are left out unless they applied (they go on to the final year).
    candidates = set()
    if not grades_df.empty and current_year is not None:
        cur = grades_df[(grades_df.year == current_year) & grades_df.code.str.startswith(OR3_PREFIX)]
        cur = cur[~cur.programme.fillna("").str.contains(BDATSCI_PROGRAMME_KEYWORD, case=False, regex=False)]
        candidates = set(cur.su)
    keys = set(applied) | candidates

    rows = []
    for key in keys:
        app_rows = applied.get(key, [])
        r = app_rows[-1] if app_rows else None
        su = None if str(key).startswith("EXT:") else key
        if r is not None:
            row = applicant_base(r)
            row.update(tertiary_summary(r["_tertiary"]))
            if len(app_rows) > 1:
                row["Programme applied for"] = "; ".join(
                    sorted({str(clean(x.get("Program Name"))) for x in app_rows}))
        else:
            p = people.get(su, {})
            row = {"Internal / External": "Internal", "SU Number": su,
                   "Surname": p.get("surname"), "First Name": p.get("name"),
                   "Email": p.get("email"), "Current programme": p.get("programme")}
        row["Applied for Honours"] = "Yes" if app_rows else "No"

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
            "OR3 average": or3, "OR3 modules graded": n3,
            "OR3 outstanding": ", ".join(pend3) or None,
            "OR2 average": or2, "OR2 modules graded": n2,
            "OR2 + OR3 average": both,
            "Repeated OR modules": ", ".join(rep) or None,
            "Repeat flag": "Yes" if rep else None,
        })
        rows.append(row)

    df = pd.DataFrame(rows)
    if df.empty:
        return df
    order = {"Qualifies": 0, "Qualifies (provisional)": 1, "Grades outstanding": 3,
             "No SU grade records": 4, "External applicant": 5}
    df["_g"] = df.Status.map(lambda s: order.get(s, 2))
    df["_a"] = df["Applied for Honours"].map({"Yes": 0, "No": 1})
    df["_avg"] = -df["OR3 average"].fillna(-1)
    df = df.sort_values(["_g", "_avg", "_a", "Surname"], na_position="last").drop(columns=["_g", "_a", "_avg"])
    df.insert(0, "Rank", range(1, len(df) + 1))
    lead = ["Rank", "Status", "Applied for Honours", "Internal / External", "SU Number", "Surname",
            "First Name", "OR3 average", "OR3 modules graded", "OR3 outstanding", "OR2 average",
            "OR2 modules graded", "OR2 + OR3 average", "Repeat flag", "Repeated OR modules"]
    return df[[c for c in lead if c in df.columns] + [c for c in df.columns if c not in lead]]


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
    rows = []
    for _, r in sub.iterrows():
        row = applicant_base(r)
        row.update(tertiary_summary(r["_tertiary"]))
        mods = attempts.get(r.su, {}) if r.su else {}
        row["SU grade records"] = "Yes" if mods else ("No" if r.su else None)
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
}


def write_workbook(path, sheets):
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    with pd.ExcelWriter(path, engine="openpyxl") as xw:
        for name, df in sheets.items():
            if df is None or df.empty:
                df = pd.DataFrame({"Info": ["No records found for this tab."]})
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
            if "Status" in df.columns:
                sc = list(df.columns).index("Status") + 1
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
    bdat, year = build_bdatsci(enrol, attempts, args.year)
    if year is None and not grades.empty and grades.year.notna().any():
        year = int(grades.year.max())
    apps = prepare_applicants(apps_raw)
    hons = build_honours(apps, attempts, grades, year, people_lookup(enrol, grades))
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
             ("Honours list", "Honours applicants plus internal students with %s* modules in %s; "
                              "no-record and external applicants at the bottom." % (OR3_PREFIX, year)),
             ("Repeat flag", "Module graded more than once (across years, or after a fail)."),
             ("Unclassified applications", len(other))]
    notes_df = pd.DataFrame(notes, columns=["Item", "Value"])
    files_df = pd.DataFrame(log, columns=["File", "Sheet", "Result"])
    notes_df = pd.concat([notes_df, pd.DataFrame([("", "")], columns=["Item", "Value"]),
                          files_df.rename(columns={"File": "Item", "Result": "Value"})[["Item", "Value"]]
                          .assign(Item=files_df.File + " [" + files_df.Sheet.astype(str) + "]")],
                         ignore_index=True)

    sheets = {"BDatSci": bdat, "Honours": hons, "Masters": masters, "PhD": phd, "Notes": notes_df}
    if not other.empty:
        sheets["Other applications"] = build_pg(other.assign(level="Other"), "Other", attempts)
    write_workbook(args.output, sheets)

    print("Wrote %s" % args.output)
    for name, df in sheets.items():
        print("  %-20s %d rows" % (name, 0 if df is None else len(df)))


if __name__ == "__main__":
    main()
