// Section grouping for the Publications and Engagements lists, driven by
// their Sort control.
//
// - "default" (shown as "Default"): the type sections rendered by Jekyll,
//   in their original order (newest first within each).
// - "newest" / "oldest": one section per year, in that order, with the same
//   heading style ("2026 ———"). Within a year, entries with an exact date
//   come first, by date; undated ones keep their original order.
// - "az" / "za": one plain list by title, no headings.
//
// Entries are moved, not copied, so their open panels, filters and event
// handlers carry over. The list gets is-by-type / is-by-year / is-flat for
// mode-specific styles.
//
// Usage: var group = ListGrouping(listEl, {
//   wrap: ".entry-wrap",                    // one per entry
//   year: function (wrap) { return 2026; },
//   date: function (wrap) { return "2026-10-10"; },   // "" if none
//   title: function (wrap) { return "..."; }
// });
// group("newest");
(function () {
  "use strict";

  window.ListGrouping = function (list, opts) {
    var wraps = Array.from(list.querySelectorAll(opts.wrap));
    var home = new Map();
    wraps.forEach(function (wrap, index) {
      home.set(wrap, { parent: wrap.parentNode, index: index });
    });

    var box = document.createElement("div");
    box.className = "list-regroup";
    list.insertBefore(box, list.querySelector(".empty-state"));

    function newSection(label) {
      var section = document.createElement("section");
      section.className = "pub-section" + (label ? " is-year" : " is-flat");
      if (label) {
        var heading = document.createElement("h4");
        heading.className = "pub-section-label";
        heading.textContent = label;
        section.appendChild(heading);
      }
      var inner = document.createElement("div");
      inner.className = "pub-section-list";
      section.appendChild(inner);
      box.appendChild(section);
      return inner;
    }

    function restore() {
      wraps.slice().sort(function (a, b) {
        return home.get(a).index - home.get(b).index;
      }).forEach(function (wrap) {
        home.get(wrap).parent.appendChild(wrap);
      });
      box.textContent = "";
    }

    return function apply(mode) {
      restore();
      list.classList.toggle("is-by-type", mode === "default");
      list.classList.toggle("is-by-year", mode === "newest" || mode === "oldest");
      list.classList.toggle("is-flat", mode === "az" || mode === "za");
      if (mode === "default") return;

      var sorted = wraps.slice();

      if (mode === "az" || mode === "za") {
        sorted.sort(function (a, b) {
          var c = opts.title(a).localeCompare(opts.title(b));
          return mode === "za" ? -c : c;
        });
        var flat = newSection("");
        sorted.forEach(function (wrap) { flat.appendChild(wrap); });
        return;
      }

      var dir = mode === "oldest" ? 1 : -1;
      sorted.sort(function (a, b) {
        var ya = opts.year(a), yb = opts.year(b);
        if (ya !== yb) return dir * (ya - yb);
        var da = opts.date(a), db = opts.date(b);
        if (da && !db) return -1;
        if (!da && db) return 1;
        if (da && db && da !== db) return dir * (da < db ? -1 : 1);
        // Original order is newest first, so oldest-first reverses it.
        return dir * (home.get(b).index - home.get(a).index);
      });

      var current = null, currentYear = null;
      sorted.forEach(function (wrap) {
        var year = opts.year(wrap);
        if (year !== currentYear) {
          current = newSection(String(year || "Undated"));
          currentYear = year;
        }
        current.appendChild(wrap);
      });
    };
  };
})();
