// Publications list: Abstract / Cite panels.
//
// - Abstract and Cite are toggle buttons (aria-expanded / aria-controls) that
//   show a panel under the entry.
// - Cite builds the reference from each entry's <script class="pub-cite-data">
//   JSON in APA 7, Harvard, MLA 9, Chicago (author-date), IEEE, BibTeX and RIS.
//   "Copy" puts it on the clipboard (formatted where the browser allows);
//   BibTeX and RIS can also be downloaded as files.
(function () {
  "use strict";

  var list = document.querySelector(".publications-list");
  if (!list) return;

  /* ---------- Toggles ---------- */

  list.addEventListener("click", function (event) {
    var btn = event.target.closest(".pub-toggle");
    if (!btn) return;
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    var open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    if (open && btn.classList.contains("pub-cite-toggle") && !panel.dataset.built) {
      buildCitePanel(panel);
    }
  });

  /* ---------- Author names ---------- */

  // Names arrive as "Surname, Given" (author-parse.html), given names in
  // full where they were entered ("Marais, Kurt") or as initials ("Marais, K.").
  // -> { family: "Marais", given: "Kurt", initials: ["K."] }
  function parseAuthor(raw) {
    var parts = String(raw).split(",");
    var family = parts[0].trim();
    var given = (parts.slice(1).join(" ") || "").trim();
    var initials = given
      .split(/\s+/)
      .filter(Boolean)
      .map(function (g) {
        return g.split("-").map(function (h) {
          return h.replace(/\./g, "").charAt(0).toUpperCase() + ".";
        }).join("-");
      });
    return { family: family, given: given, initials: initials };
  }

  // Initials (APA, Harvard, IEEE) ...
  function famInit(a) { return a.family + (a.initials.length ? ", " + a.initials.join(" ") : ""); }
  function initFam(a) { return (a.initials.length ? a.initials.join(" ") + " " : "") + a.family; }
  // ... or given names as entered (MLA, Chicago, BibTeX, RIS).
  function famGiven(a) { return a.family + (a.given ? ", " + a.given : ""); }
  function givenFam(a) { return (a.given ? a.given + " " : "") + a.family; }

  function joinList(names, finalSep) {
    if (names.length <= 1) return names.join("");
    return names.slice(0, -1).join(", ") + finalSep + names[names.length - 1];
  }

  /* ---------- Small helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function bareDoi(d) { return d ? String(d).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : ""; }
  function doiUrl(d) { return d ? "https://doi.org/" + bareDoi(d) : ""; }
  function enPages(p) { return p ? String(p).replace(/\s*[-–]\s*/, "–") : ""; }
  function endDot(s) { return /[.?!]$/.test(s) ? s : s + "."; }
  function isReview(d) { return d.status === "under-review" || d.status === "revise-resubmit"; }
  // Italic markers: \u0001 opens, \u0002 closes. Rendered as <em> in HTML, dropped in plain text.
  function it(s) { return "\u0001" + s + "\u0002"; }
  function toHtml(s) { return esc(s).replace(/\u0001/g, "<em>").replace(/\u0002/g, "</em>"); }
  function toText(s) { return s.replace(/[\u0001\u0002]/g, ""); }

  function thesisLabel(d) { return d.type === "dissertation" ? "Doctoral dissertation" : "Master's thesis"; }

  /* ---------- Formats ---------- */

  function apa(d, A) {
    var n = A.length;
    var names = n === 2 ? famInit(A[0]) + ", & " + famInit(A[1]) : joinList(A.map(famInit), ", & ");
    var out = names + " (" + (isReview(d) ? "in review" : d.year) + "). ";
    var t = d.title;
    if (isReview(d)) return out + t + " [Manuscript submitted for publication].";
    switch (d.type) {
      case "journal-article":
      case "conference-paper":
        out += endDot(t) + " " + it(d.journal || "");
        if (d.volume) out += ", " + it(d.volume);
        if (d.issue) out += "(" + d.issue + ")";
        if (d.pages) out += ", " + enPages(d.pages);
        out += ".";
        break;
      case "dataset":
        out += it(t) + " [Data set]." + (d.publisher ? " " + d.publisher + "." : "");
        break;
      case "thesis":
      case "dissertation":
        out += it(t) + " [" + thesisLabel(d) + ", " + (d.institution || "") + "].";
        break;
      default:
        out += it(endDot(t));
    }
    var link = doiUrl(d.doi) || d.url;
    return out + (link ? " " + link : "");
  }

  function harvard(d, A) {
    var names = joinList(A.map(famInit), " and ");
    var out = names + " (" + (isReview(d) ? "n.d." : d.year) + ") ";
    if (isReview(d)) return out + "'" + d.title + "'. Manuscript under review.";
    switch (d.type) {
      case "journal-article":
      case "conference-paper":
        out += "'" + d.title + "', " + it(d.journal || "");
        if (d.volume) out += ", " + d.volume;
        if (d.issue) out += "(" + d.issue + ")";
        if (d.pages) out += ", pp. " + enPages(d.pages);
        out += ".";
        break;
      case "dataset":
        out += it(d.title) + " [Dataset]." + (d.publisher ? " " + d.publisher + "." : "");
        break;
      case "thesis":
      case "dissertation":
        out += it(d.title) + ". " + thesisLabel(d) + ". " + (d.institution || "") + ".";
        break;
      default:
        out += it(d.title) + ".";
    }
    if (d.doi) return out + " doi:" + bareDoi(d.doi) + ".";
    if (d.url) return out + " Available at: " + d.url + ".";
    return out;
  }

  function mla(d, A) {
    var first = A[0] ? famGiven(A[0]) : "";
    var names = A.length === 1 ? first : A.length === 2 ? first + ", and " + givenFam(A[1]) : first + ", et al";
    var out = endDot(names) + " ";
    if (isReview(d)) return out + "“" + endDot(d.title) + "” Manuscript under review.";
    switch (d.type) {
      case "journal-article":
      case "conference-paper":
        out += "“" + endDot(d.title) + "” " + it(d.journal || "");
        if (d.volume) out += ", vol. " + d.volume;
        if (d.issue) out += ", no. " + d.issue;
        out += ", " + d.year;
        if (d.pages) out += ", pp. " + enPages(d.pages);
        out += ".";
        break;
      case "dataset":
        out += it(endDot(d.title)) + " " + (d.publisher ? d.publisher + ", " : "") + d.year + ".";
        break;
      case "thesis":
      case "dissertation":
        out += it(endDot(d.title)) + " " + (d.type === "dissertation" ? "PhD dissertation" : "Master's thesis") + ", " + (d.institution || "") + ", " + d.year + ".";
        break;
      default:
        out += it(endDot(d.title)) + " " + d.year + ".";
    }
    var link = doiUrl(d.doi) || d.url;
    return out + (link ? " " + link.replace(/^https?:\/\//, "") + "." : "");
  }

  function chicago(d, A) {
    var names = A.length === 1 ? famGiven(A[0])
      : famGiven(A[0]) + (A.length === 2 ? ", and " + givenFam(A[1]) : ", " + A.slice(1, -1).map(givenFam).join(", ") + ", and " + givenFam(A[A.length - 1]));
    var out = endDot(names) + " " + (isReview(d) ? "Forthcoming" : d.year) + ". ";
    if (isReview(d)) return out + "“" + endDot(d.title) + "” Manuscript under review.";
    switch (d.type) {
      case "journal-article":
      case "conference-paper":
        out += "“" + endDot(d.title) + "” " + it(d.journal || "");
        if (d.volume) out += " " + d.volume;
        if (d.issue) out += " (" + d.issue + ")";
        if (d.pages) out += ": " + enPages(d.pages);
        out += ".";
        break;
      case "dataset":
        out += it(endDot(d.title)) + " Dataset." + (d.publisher ? " " + d.publisher + "." : "");
        break;
      case "thesis":
      case "dissertation":
        out += "“" + endDot(d.title) + "” " + (d.type === "dissertation" ? "PhD diss." : "Master's thesis") + ", " + (d.institution || "") + ".";
        break;
      default:
        out += it(endDot(d.title));
    }
    var link = doiUrl(d.doi) || d.url;
    return out + (link ? " " + link + "." : "");
  }

  function ieee(d, A) {
    var names = A.length <= 2 ? A.map(initFam).join(" and ")
      : A.slice(0, -1).map(initFam).join(", ") + ", and " + initFam(A[A.length - 1]);
    var out = names + ", “" + d.title + ",” ";
    if (isReview(d)) return out + "manuscript under review.";
    switch (d.type) {
      case "journal-article":
      case "conference-paper":
        out += it(d.journal || "");
        if (d.volume) out += ", vol. " + d.volume;
        if (d.issue) out += ", no. " + d.issue;
        if (d.pages) out += ", pp. " + enPages(d.pages);
        out += ", " + d.year;
        break;
      case "dataset":
        out += (d.publisher ? d.publisher + ", " : "") + d.year + ". [Dataset]";
        break;
      case "thesis":
      case "dissertation":
        out += (d.type === "dissertation" ? "Ph.D. dissertation" : "M.S. thesis") + ", " + (d.institution || "") + ", " + d.year;
        break;
      default:
        out += d.year;
    }
    if (d.doi) return out + ", doi: " + bareDoi(d.doi) + ".";
    if (d.url) return out + ". [Online]. Available: " + d.url;
    return out + ".";
  }

  function citeKey(d, A) {
    var fam = (A[0] ? A[0].family : "item").toLowerCase().replace(/[^a-z]/g, "");
    var word = (String(d.title).toLowerCase().match(/[a-z]{4,}/) || ["paper"])[0];
    return fam + (d.year || "") + word;
  }

  function bibtex(d, A) {
    var kind = "misc";
    if (isReview(d)) kind = "unpublished";
    else if (d.type === "journal-article") kind = "article";
    else if (d.type === "conference-paper") kind = "inproceedings";
    else if (d.type === "book-chapter") kind = "incollection";
    else if (d.type === "thesis") kind = "mastersthesis";
    else if (d.type === "dissertation") kind = "phdthesis";
    var f = [["author", A.map(famGiven).join(" and ")], ["title", "{" + d.title + "}"]];
    if (kind === "article") f.push(["journal", d.journal]);
    if (kind === "inproceedings") f.push(["booktitle", d.journal]);
    if (kind === "incollection") f.push(["booktitle", d.book || d.journal]);
    if (kind === "mastersthesis" || kind === "phdthesis") f.push(["school", d.institution]);
    if (kind === "misc" && d.publisher) f.push(["publisher", d.publisher]);
    if (kind === "misc" && d.type === "dataset") f.push(["note", "Dataset"]);
    if (kind === "unpublished") f.push(["note", "Manuscript under review"]);
    f.push(["year", isReview(d) ? null : d.year]);
    f.push(["volume", d.volume], ["number", d.issue]);
    if (d.pages) f.push(["pages", String(d.pages).replace(/\s*[-–]\s*/, "--")]);
    if (d.doi) f.push(["doi", bareDoi(d.doi)]);
    else if (d.url) f.push(["url", d.url]);
    var body = f.filter(function (p) { return p[1] !== null && p[1] !== undefined && p[1] !== ""; })
      .map(function (p) { return "  " + p[0] + " = {" + p[1] + "}"; }).join(",\n");
    return "@" + kind + "{" + citeKey(d, A) + ",\n" + body + "\n}";
  }

  function ris(d, A) {
    var ty = "GEN";
    if (isReview(d)) ty = "UNPB";
    else if (d.type === "journal-article") ty = "JOUR";
    else if (d.type === "conference-paper") ty = "CPAPER";
    else if (d.type === "book-chapter") ty = "CHAP";
    else if (d.type === "thesis" || d.type === "dissertation") ty = "THES";
    else if (d.type === "dataset") ty = "DATA";
    var lines = ["TY  - " + ty];
    A.forEach(function (a) { lines.push("AU  - " + famGiven(a)); });
    lines.push("TI  - " + d.title);
    if (d.journal && ty !== "THES" && ty !== "DATA") lines.push((ty === "JOUR" ? "JO" : "T2") + "  - " + d.journal);
    if (!isReview(d) && d.year) lines.push("PY  - " + d.year);
    if (d.volume) lines.push("VL  - " + d.volume);
    if (d.issue) lines.push("IS  - " + d.issue);
    if (d.pages) {
      var pp = String(d.pages).split(/\s*[-–]\s*/);
      lines.push("SP  - " + pp[0]);
      if (pp[1]) lines.push("EP  - " + pp[1]);
    }
    if (d.institution) lines.push("PB  - " + d.institution);
    else if (d.publisher) lines.push("PB  - " + d.publisher);
    if (ty === "THES") lines.push("M3  - " + thesisLabel(d));
    if (d.doi) lines.push("DO  - " + bareDoi(d.doi));
    if (d.url) lines.push("UR  - " + d.url);
    lines.push("ER  - ");
    return lines.join("\n");
  }

  var FORMATS = [
    { id: "apa", label: "APA", fn: apa },
    { id: "harvard", label: "Harvard", fn: harvard },
    { id: "mla", label: "MLA", fn: mla },
    { id: "chicago", label: "Chicago", fn: chicago },
    { id: "ieee", label: "IEEE", fn: ieee },
    { id: "bibtex", label: "BibTeX", fn: bibtex, code: true, ext: "bib", mime: "application/x-bibtex" },
    { id: "ris", label: "RIS", fn: ris, code: true, ext: "ris", mime: "application/x-research-info-systems" }
  ];

  /* ---------- Cite panel ---------- */

  function buildCitePanel(panel) {
    var dataEl = panel.parentNode.querySelector(".pub-cite-data");
    if (!dataEl) return;
    var d;
    try { d = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var A = (d.authors || []).map(parseAuthor);
    var key = citeKey(d, A);

    var tabs = document.createElement("div");
    tabs.className = "pub-cite-formats";
    tabs.setAttribute("role", "tablist");
    var out = document.createElement("div");
    out.className = "pub-cite-text";
    var row = document.createElement("div");
    row.className = "pub-cite-row";
    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "pub-cite-copy";
    copyBtn.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i> Copy';
    var dl = document.createElement("a");
    dl.className = "pub-cite-download";
    var status = document.createElement("span");
    status.className = "pub-cite-status";
    status.setAttribute("aria-live", "polite");
    row.appendChild(copyBtn);
    row.appendChild(dl);
    row.appendChild(status);

    var current = null;
    function show(fmt) {
      current = fmt;
      var raw = fmt.fn(d, A);
      tabs.querySelectorAll("button").forEach(function (b) {
        var on = b.dataset.fmt === fmt.id;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      out.classList.toggle("is-code", !!fmt.code);
      out.innerHTML = fmt.code ? "<pre>" + esc(raw) + "</pre>" : toHtml(raw);
      out.dataset.raw = raw;
      status.textContent = "";
      if (fmt.ext) {
        dl.hidden = false;
        dl.textContent = "Download ." + fmt.ext;
        dl.download = key + "." + fmt.ext;
        dl.href = "data:" + fmt.mime + ";charset=utf-8," + encodeURIComponent(raw);
      } else {
        dl.hidden = true;
        dl.removeAttribute("href");
      }
    }

    FORMATS.forEach(function (fmt) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.fmt = fmt.id;
      b.setAttribute("role", "tab");
      b.textContent = fmt.label;
      b.addEventListener("click", function () { show(fmt); });
      tabs.appendChild(b);
    });

    copyBtn.addEventListener("click", function () {
      var raw = out.dataset.raw || "";
      var text = toText(raw);
      var html = current && current.code ? null : toHtml(raw);
      var done = function () { status.textContent = "Copied"; };
      var fail = function () { status.textContent = "Select the text to copy"; };
      try {
        if (html && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
          navigator.clipboard.write([new ClipboardItem({
            "text/plain": new Blob([text], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" })
          })]).then(done, function () {
            navigator.clipboard.writeText(text).then(done, fail);
          });
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fail);
        } else {
          fail();
        }
      } catch (e) { fail(); }
    });

    panel.appendChild(tabs);
    panel.appendChild(out);
    panel.appendChild(row);
    panel.dataset.built = "1";
    show(FORMATS[0]);
  }
})();
