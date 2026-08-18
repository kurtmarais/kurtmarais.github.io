(function () {
  "use strict";

  var filtersPanel = document.getElementById("supervision-filters-panel");
  if (!filtersPanel) return; // this script only runs on the supervision page, but guard anyway

  var mobileToggle = document.querySelector(".filters-toggle");
  var filterControls = document.querySelectorAll(".filter-control");
  var currentList = document.querySelector(".supervision-current-list");
  var completedList = document.querySelector(".supervision-completed-list");
  var currentHeading = document.querySelector(".supervision-current-heading");
  var completedHeading = document.querySelector(".supervision-completed-heading");
  var sectionSpacer = document.querySelector(".supervision-section-spacer");
  var emptyState = document.querySelector(".empty-state");
  var topicsInput = document.querySelector('.filter-search-input');

  var state = {
    years: new Set(),      // empty set = "all years"
    degrees: new Set(),    // empty set = "all degrees"
    sort: "newest",        // "newest" | "oldest" | "az" | "za"
    topics: ""              // lowercase search string
  };

  /* ---------- Mobile "Filters" panel toggle ---------- */

  if (mobileToggle) {
    mobileToggle.addEventListener("click", function () {
      var isOpen = filtersPanel.classList.toggle("is-open");
      mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  /* ---------- Individual dropdown open/close ---------- */

  filterControls.forEach(function (control) {
    var toggle = control.querySelector(".filter-toggle");
    var dropdown = control.querySelector(".filter-dropdown");
    if (!toggle || !dropdown) return;

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var willOpen = dropdown.hasAttribute("hidden");

      // close any other open dropdown first
      document.querySelectorAll(".filter-dropdown").forEach(function (other) {
        if (other !== dropdown) {
          other.setAttribute("hidden", "");
        }
      });
      document.querySelectorAll(".filter-toggle").forEach(function (other) {
        if (other !== toggle) {
          other.setAttribute("aria-expanded", "false");
        }
      });

      if (willOpen) {
        dropdown.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
      } else {
        dropdown.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  // close any open dropdown when clicking outside the filters area
  document.addEventListener("click", function (event) {
    if (filtersPanel.contains(event.target)) return;
    if (mobileToggle && mobileToggle.contains(event.target)) return;

    document.querySelectorAll(".filter-dropdown").forEach(function (dropdown) {
      dropdown.setAttribute("hidden", "");
    });
    document.querySelectorAll(".filter-toggle").forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Years: multi-select ---------- */

  var yearsControl = document.querySelector('.filter-control[data-filter="years"]');
  if (yearsControl) {
    var yearsValueLabel = yearsControl.querySelector(".filter-value");
    var yearCheckboxes = yearsControl.querySelectorAll('input[type="checkbox"]');

    yearCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          state.years.add(checkbox.value);
        } else {
          state.years.delete(checkbox.value);
        }
        updateYearsLabel();
        refresh();
      });
    });

    function updateYearsLabel() {
      if (state.years.size === 0) {
        yearsValueLabel.textContent = "All years";
      } else {
        // sort selected years descending for a stable, readable label
        var selected = Array.from(state.years).sort(function (a, b) { return b - a; });
        yearsValueLabel.textContent = selected.join(", ");
      }
    }
  }

  /* ---------- Degree level: multi-select ---------- */

  var degreeControl = document.querySelector('.filter-control[data-filter="degree"]');
  if (degreeControl) {
    var degreeValueLabel = degreeControl.querySelector(".filter-value");
    var degreeCheckboxes = degreeControl.querySelectorAll('input[type="checkbox"]');

    degreeCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          state.degrees.add(checkbox.value);
        } else {
          state.degrees.delete(checkbox.value);
        }
        updateDegreeLabel();
        refresh();
      });
    });

    function updateDegreeLabel() {
      if (state.degrees.size === 0) {
        degreeValueLabel.textContent = "All degrees";
      } else {
        degreeValueLabel.textContent = Array.from(state.degrees).join(", ");
      }
    }
  }

  /* ---------- Sort: single-select ---------- */

  var sortControl = document.querySelector('.filter-control[data-filter="sort"]');
  if (sortControl) {
    var sortValueLabel = sortControl.querySelector(".filter-value");
    var sortOptions = sortControl.querySelectorAll(".filter-option");
    var sortDropdown = sortControl.querySelector(".filter-dropdown");

    sortOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        state.sort = option.getAttribute("data-value");
        sortValueLabel.textContent = option.textContent;
        sortDropdown.setAttribute("hidden", "");
        sortControl.querySelector(".filter-toggle").setAttribute("aria-expanded", "false");
        refresh();
      });
    });
  }

  /* ---------- Topics: live search ---------- */

  if (topicsInput) {
    topicsInput.addEventListener("input", function () {
      state.topics = topicsInput.value.trim().toLowerCase();
      refresh();
    });
  }

  /* ---------- Filtering ---------- */

  function entryMatches(entry) {
    var yearMatches = true;
    if (state.years.size > 0) {
      var startYear = parseInt(entry.getAttribute("data-start-year"), 10);
      var endYearAttr = entry.getAttribute("data-end-year");
      var endYear = endYearAttr ? parseInt(endYearAttr, 10) : new Date().getFullYear(); // ongoing supervision counts through the current year
      yearMatches = Array.from(state.years).some(function (y) {
        var yearNum = parseInt(y, 10);
        return yearNum >= startYear && yearNum <= endYear;
      });
    }

    var degreeMatches = state.degrees.size === 0 || state.degrees.has(entry.getAttribute("data-degree-level"));

    var topicMatches = true;
    if (state.topics) {
      var nameText = entry.getAttribute("data-name") || "";

      var keywordsEl = entry.querySelector(".supervision-keywords");
      var keywordsText = keywordsEl ? keywordsEl.textContent.toLowerCase() : "";

      var titleEl = entry.querySelector(".supervision-title");
      var titleText = titleEl ? titleEl.textContent.toLowerCase() : "";

      var abstractEl = entry.querySelector(".abstract-block p");
      var abstractText = abstractEl ? abstractEl.textContent.toLowerCase() : "";

      topicMatches =
        nameText.indexOf(state.topics) !== -1 ||
        keywordsText.indexOf(state.topics) !== -1 ||
        titleText.indexOf(state.topics) !== -1 ||
        abstractText.indexOf(state.topics) !== -1;
    }

    return yearMatches && degreeMatches && topicMatches;
  }

  /* ---------- Refresh: decides grouped-vs-flattened, sort comparator, and visibility ---------- */

  // PhD ranks first, then Masters, then everything else.
  var DEGREE_RANK = {
    "phd": 1,
    "masters": 2
  };

  function degreeRank(degreeLevel) {
    var key = (degreeLevel || "").toLowerCase();
    return DEGREE_RANK.hasOwnProperty(key) ? DEGREE_RANK[key] : 3;
  }

  function effectiveEndYear(entry) {
    var endYearAttr = entry.getAttribute("data-end-year");
    return endYearAttr ? parseInt(endYearAttr, 10) : new Date().getFullYear(); // ongoing supervision counts through the current year
  }

  // "Just sorting" — no filters active. Unchanged: degree first, then whichever Sort mode is selected.
  function compareDefault(a, b) {
    var degreeA = degreeRank(a.getAttribute("data-degree-level"));
    var degreeB = degreeRank(b.getAttribute("data-degree-level"));
    if (degreeA !== degreeB) {
      return degreeA - degreeB;
    }

    if (state.sort === "az" || state.sort === "za") {
      var nameA = (a.getAttribute("data-name") || "").toLowerCase();
      var nameB = (b.getAttribute("data-name") || "").toLowerCase();
      var comparison = nameA.localeCompare(nameB);
      return state.sort === "za" ? -comparison : comparison;
    }

    var yearA = parseInt(a.getAttribute("data-start-year"), 10) || 0;
    var yearB = parseInt(b.getAttribute("data-start-year"), 10) || 0;
    if (yearA !== yearB) {
      return state.sort === "newest" ? yearB - yearA : yearA - yearB;
    }

    var surnameA = a.getAttribute("data-surname") || "";
    var surnameB = b.getAttribute("data-surname") || "";
    return surnameA.localeCompare(surnameB);
  }

  // Years and/or degree filters active, no search term — degree drops out of the comparator
  // entirely and the whole list (current + completed merged) sorts true to the chosen Sort mode.
  //
  // Newest/Oldest add a seniority/duration tiering on top of year, reflecting how far along a
  // student's candidature is. The two directions are NOT mirror images of each other — see the
  // two dedicated comparators below.
  function isOngoing(entry) {
    var endYearAttr = entry.getAttribute("data-end-year");
    return !endYearAttr; // no end year recorded = still current/ongoing
  }

  function isSingleYear(entry) {
    var startYear = entry.getAttribute("data-start-year");
    var endYearAttr = entry.getAttribute("data-end-year");
    return !!endYearAttr && startYear === endYearAttr; // e.g. BDatSci/BComHons, start == end
  }

  // Newest first: ongoing research on top (no end year at all), then everything resolved
  // (single-year entries, and by extension any completed multi-year entry once those exist).
  // Within each group: degree level (PhD, Masters, other), then starting year descending
  // (most recent start first), then surname.
  // Oldest is the exact reverse of this entire ordering — not a separately-derived structure.
  function compareForYearDegreeFilterNewest(a, b) {
    var ongoingA = isOngoing(a) ? 0 : 1;
    var ongoingB = isOngoing(b) ? 0 : 1;
    if (ongoingA !== ongoingB) {
      return ongoingA - ongoingB;
    }

    var degreeA = degreeRank(a.getAttribute("data-degree-level"));
    var degreeB = degreeRank(b.getAttribute("data-degree-level"));
    if (degreeA !== degreeB) {
      return degreeA - degreeB;
    }

    var startA = parseInt(a.getAttribute("data-start-year"), 10) || 0;
    var startB = parseInt(b.getAttribute("data-start-year"), 10) || 0;
    if (startA !== startB) {
      return startB - startA; // most recent starting year first
    }

    var surnameA = a.getAttribute("data-surname") || "";
    var surnameB = b.getAttribute("data-surname") || "";
    return surnameA.localeCompare(surnameB);
  }

  function compareForYearDegreeFilterOldest(a, b) {
    return -compareForYearDegreeFilterNewest(a, b); // exact reverse, per spec
  }

  function compareForYearDegreeFilter(a, b) {
    if (state.sort === "az" || state.sort === "za") {
      var nameA = (a.getAttribute("data-name") || "").toLowerCase();
      var nameB = (b.getAttribute("data-name") || "").toLowerCase();
      var comparison = nameA.localeCompare(nameB);
      if (comparison !== 0) {
        return state.sort === "za" ? -comparison : comparison;
      }
      // tiebreak: newest to oldest
      var yearA = parseInt(a.getAttribute("data-start-year"), 10) || 0;
      var yearB = parseInt(b.getAttribute("data-start-year"), 10) || 0;
      return yearB - yearA;
    }

    return state.sort === "newest"
      ? compareForYearDegreeFilterNewest(a, b)
      : compareForYearDegreeFilterOldest(a, b);
  }

  // A search term is active — fixed scheme regardless of years/degree filters or the Sort dropdown.
  function compareForSearch(a, b) {
    var endA = effectiveEndYear(a);
    var endB = effectiveEndYear(b);
    if (endA !== endB) {
      return endB - endA; // most recently active/current end year first
    }

    var degreeA = degreeRank(a.getAttribute("data-degree-level"));
    var degreeB = degreeRank(b.getAttribute("data-degree-level"));
    if (degreeA !== degreeB) {
      return degreeA - degreeB;
    }

    var surnameA = a.getAttribute("data-surname") || "";
    var surnameB = b.getAttribute("data-surname") || "";
    return surnameA.localeCompare(surnameB);
  }

  function sortWithin(list, comparator) {
    if (!list) return;
    var entries = Array.from(list.querySelectorAll(".supervision-entry"));
    entries.sort(comparator);
    entries.forEach(function (entry) {
      list.appendChild(entry);
    });
  }

  function refresh() {
    var hasSearch = state.topics.length > 0;
    var hasYearOrDegree = state.years.size > 0 || state.degrees.size > 0;
    var isFiltered = hasSearch || hasYearOrDegree;

    var allEntries = Array.from(document.querySelectorAll(".supervision-entry"));

    if (isFiltered) {
      // merge current + completed into one flat, sorted sequence — the split stops mattering
      // the moment any filter is active, matching the headings-hide behavior below
      var comparator = hasSearch ? compareForSearch : compareForYearDegreeFilter;
      allEntries.sort(comparator);
      allEntries.forEach(function (entry) {
        currentList.appendChild(entry); // reuse .supervision-current-list as the single flat container
      });

      if (currentHeading) currentHeading.hidden = true;
      if (completedHeading) completedHeading.hidden = true;
      if (sectionSpacer) sectionSpacer.hidden = true;
      if (completedList) completedList.hidden = true;
    } else {
      // restore the current/completed split, each independently sorted as before
      allEntries.forEach(function (entry) {
        var target = entry.getAttribute("data-status") === "completed" ? completedList : currentList;
        if (target) target.appendChild(entry);
      });
      sortWithin(currentList, compareDefault);
      sortWithin(completedList, compareDefault);
      if (sectionSpacer) sectionSpacer.hidden = false;
    }

    // visibility applies uniformly regardless of grouped/flattened state
    var totalVisible = 0;
    allEntries.forEach(function (entry) {
      var matches = entryMatches(entry);
      entry.hidden = !matches;
      if (matches) totalVisible += 1;
    });

    if (isFiltered) {
      if (currentList) currentList.hidden = totalVisible === 0;
    } else {
      updateHeadingVisibility(currentList, currentHeading);
      updateHeadingVisibility(completedList, completedHeading);
    }

    if (emptyState) {
      emptyState.hidden = totalVisible > 0;
    }
  }

  function updateHeadingVisibility(list, heading) {
    if (!list) return;
    var visibleCount = list.querySelectorAll(".supervision-entry:not([hidden])").length;
    if (heading) heading.hidden = visibleCount === 0;
    list.hidden = visibleCount === 0;
  }

  refresh(); // apply the default degree/year/surname grouping on load, rather than raw YAML file order
})();
