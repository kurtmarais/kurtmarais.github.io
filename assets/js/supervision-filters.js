(function () {
  "use strict";

  var filtersPanel = document.getElementById("supervision-filters-panel");
  if (!filtersPanel) return; // this script only runs on the supervision page, but guard anyway

  var mobileToggle = document.querySelector(".supervision-filters-toggle");
  var filterControls = document.querySelectorAll(".supervision-filter-control");
  var currentList = document.querySelector(".supervision-current-list");
  var completedList = document.querySelector(".supervision-completed-list");
  var currentHeading = document.querySelector(".supervision-current-heading");
  var completedHeading = document.querySelector(".supervision-completed-heading");
  var emptyState = document.querySelector(".supervision-empty-state");
  var topicsInput = document.querySelector('.supervision-filter-search-input');

  var state = {
    years: new Set(),      // empty set = "all years"
    degrees: new Set(),    // empty set = "all degrees"
    sort: "newest",        // "newest" | "oldest"
    topics: ""              // lowercase search string
  };

  function hasActiveFilters() {
    return state.years.size > 0 || state.degrees.size > 0 || state.topics.length > 0;
  }

  /* ---------- Mobile "Filters" panel toggle ---------- */

  if (mobileToggle) {
    mobileToggle.addEventListener("click", function () {
      var isOpen = filtersPanel.classList.toggle("is-open");
      mobileToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  /* ---------- Individual dropdown open/close ---------- */

  filterControls.forEach(function (control) {
    var toggle = control.querySelector(".supervision-filter-toggle");
    var dropdown = control.querySelector(".supervision-filter-dropdown");
    if (!toggle || !dropdown) return;

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var willOpen = dropdown.hasAttribute("hidden");

      // close any other open dropdown first
      document.querySelectorAll(".supervision-filter-dropdown").forEach(function (other) {
        if (other !== dropdown) {
          other.setAttribute("hidden", "");
        }
      });
      document.querySelectorAll(".supervision-filter-toggle").forEach(function (other) {
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

    document.querySelectorAll(".supervision-filter-dropdown").forEach(function (dropdown) {
      dropdown.setAttribute("hidden", "");
    });
    document.querySelectorAll(".supervision-filter-toggle").forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Years: multi-select ---------- */

  var yearsControl = document.querySelector('.supervision-filter-control[data-filter="years"]');
  if (yearsControl) {
    var yearsValueLabel = yearsControl.querySelector(".supervision-filter-value");
    var yearCheckboxes = yearsControl.querySelectorAll('input[type="checkbox"]');

    yearCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          state.years.add(checkbox.value);
        } else {
          state.years.delete(checkbox.value);
        }
        updateYearsLabel();
        applyFilters();
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

  var degreeControl = document.querySelector('.supervision-filter-control[data-filter="degree"]');
  if (degreeControl) {
    var degreeValueLabel = degreeControl.querySelector(".supervision-filter-value");
    var degreeCheckboxes = degreeControl.querySelectorAll('input[type="checkbox"]');

    degreeCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          state.degrees.add(checkbox.value);
        } else {
          state.degrees.delete(checkbox.value);
        }
        updateDegreeLabel();
        applyFilters();
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

  var sortControl = document.querySelector('.supervision-filter-control[data-filter="sort"]');
  if (sortControl) {
    var sortValueLabel = sortControl.querySelector(".supervision-filter-value");
    var sortOptions = sortControl.querySelectorAll(".supervision-filter-option");
    var sortDropdown = sortControl.querySelector(".supervision-filter-dropdown");

    sortOptions.forEach(function (option) {
      option.addEventListener("click", function () {
        state.sort = option.getAttribute("data-value");
        sortValueLabel.textContent = option.textContent;
        sortDropdown.setAttribute("hidden", "");
        sortControl.querySelector(".supervision-filter-toggle").setAttribute("aria-expanded", "false");
        applySort();
      });
    });
  }

  /* ---------- Topics: live search ---------- */

  if (topicsInput) {
    topicsInput.addEventListener("input", function () {
      state.topics = topicsInput.value.trim().toLowerCase();
      applyFilters();
    });
  }

  /* ---------- Filtering ---------- */

  function entryMatches(entry) {
    var yearMatches = state.years.size === 0 || state.years.has(entry.getAttribute("data-year"));
    var degreeMatches = state.degrees.size === 0 || state.degrees.has(entry.getAttribute("data-degree-level"));

    var topicMatches = true;
    if (state.topics) {
      var keywordsEl = entry.querySelector(".supervision-keywords");
      var keywordsText = keywordsEl ? keywordsEl.textContent.toLowerCase() : "";

      var titleEl = entry.querySelector(".supervision-title");
      var titleText = titleEl ? titleEl.textContent.toLowerCase() : "";

      var abstractEl = entry.querySelector(".supervision-abstract p");
      var abstractText = abstractEl ? abstractEl.textContent.toLowerCase() : "";

      topicMatches =
        keywordsText.indexOf(state.topics) !== -1 ||
        titleText.indexOf(state.topics) !== -1 ||
        abstractText.indexOf(state.topics) !== -1;
    }

    return yearMatches && degreeMatches && topicMatches;
  }

  function applyFilters() {
    var filtersActive = hasActiveFilters();
    applyToList(currentList, currentHeading, filtersActive);
    applyToList(completedList, completedHeading, filtersActive);
    updateEmptyState();
  }

  function applyToList(list, heading, filtersActive) {
    if (!list) return;
    var entries = list.querySelectorAll(".supervision-entry");
    var visibleCount = 0;

    entries.forEach(function (entry) {
      var matches = entryMatches(entry);
      entry.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    // headings disappear as soon as any filter is active, not only once a section is empty
    if (heading) {
      heading.hidden = filtersActive || visibleCount === 0;
    }
    list.hidden = visibleCount === 0;
  }

  function updateEmptyState() {
    if (!emptyState) return;
    var currentVisible = currentList ? currentList.querySelectorAll(".supervision-entry:not([hidden])").length : 0;
    var completedVisible = completedList ? completedList.querySelectorAll(".supervision-entry:not([hidden])").length : 0;
    emptyState.hidden = (currentVisible + completedVisible) > 0;
  }

  /* ---------- Sorting ---------- */

  function applySort() {
    sortList(currentList);
    sortList(completedList);
  }

  function sortList(list) {
    if (!list) return;
    var entries = Array.from(list.querySelectorAll(".supervision-entry"));

    entries.sort(function (a, b) {
      var yearA = parseInt(a.getAttribute("data-year"), 10) || 0;
      var yearB = parseInt(b.getAttribute("data-year"), 10) || 0;
      return state.sort === "newest" ? yearB - yearA : yearA - yearB;
    });

    entries.forEach(function (entry) {
      list.appendChild(entry);
    });
  }
})();
