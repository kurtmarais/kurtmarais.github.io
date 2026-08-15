(function () {
  "use strict";

  var filtersPanel = document.getElementById("engagements-filters-panel");
  if (!filtersPanel) return; // this script only runs on the engagements page, but guard anyway

  var mobileToggle = document.querySelector(".filters-toggle");
  var filterControls = document.querySelectorAll(".filter-control");
  var list = document.querySelector(".engagements-list");
  var yearGroups = document.querySelectorAll(".engagement-year-group");
  var emptyState = document.querySelector(".empty-state");
  var topicsInput = document.querySelector(".filter-search-input");

  var state = {
    types: new Set(),      // empty set = "all types"
    years: new Set(),      // empty set = "all years"
    sort: "newest",        // "newest" | "oldest"
    topics: ""              // lowercase search string
  };

  function hasActiveFilters() {
    return state.types.size > 0 || state.years.size > 0 || state.topics.length > 0;
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
    var toggle = control.querySelector(".filter-toggle");
    var dropdown = control.querySelector(".filter-dropdown");
    if (!toggle || !dropdown) return;

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var willOpen = dropdown.hasAttribute("hidden");

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

  /* ---------- Type: multi-select ---------- */

  var typeControl = document.querySelector('.filter-control[data-filter="type"]');
  if (typeControl) {
    var typeValueLabel = typeControl.querySelector(".filter-value");
    var typeCheckboxes = typeControl.querySelectorAll('input[type="checkbox"]');

    typeCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          state.types.add(checkbox.value);
        } else {
          state.types.delete(checkbox.value);
        }
        updateTypeLabel();
        applyFilters();
      });
    });

    function updateTypeLabel() {
      if (state.types.size === 0) {
        typeValueLabel.textContent = "All types";
      } else {
        var labels = Array.from(typeCheckboxes)
          .filter(function (cb) { return cb.checked; })
          .map(function (cb) { return cb.closest("label").textContent.trim(); });
        typeValueLabel.textContent = labels.join(", ");
      }
    }
  }

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
        applyFilters();
      });
    });

    function updateYearsLabel() {
      if (state.years.size === 0) {
        yearsValueLabel.textContent = "All years";
      } else {
        var selected = Array.from(state.years).sort(function (a, b) { return b - a; });
        yearsValueLabel.textContent = selected.join(", ");
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
    var typeMatches = state.types.size === 0 || state.types.has(entry.getAttribute("data-type"));
    var yearMatches = state.years.size === 0 || state.years.has(entry.getAttribute("data-year"));

    var topicMatches = true;
    if (state.topics) {
      var searchableSelectors = [
        ".engagement-title",
        ".engagement-media-title",
        ".engagement-venue",
        ".engagement-location",
        ".engagement-description",
        ".abstract-block p",
        ".engagement-keywords",
        ".engagement-tags"
      ];

      var searchableText = searchableSelectors
        .map(function (selector) {
          var el = entry.querySelector(selector);
          return el ? el.textContent.toLowerCase() : "";
        })
        .join(" ");

      topicMatches = searchableText.indexOf(state.topics) !== -1;
    }

    return typeMatches && yearMatches && topicMatches;
  }

  function applyFilters() {
    var filtersActive = hasActiveFilters();
    var totalVisible = 0;

    yearGroups.forEach(function (group) {
      var heading = group.querySelector(".engagement-year-heading");
      var wraps = group.querySelectorAll(".engagement-entry-wrap");
      var visibleCount = 0;

      wraps.forEach(function (wrap) {
        var entry = wrap.querySelector(".engagement-entry");
        var matches = entry ? entryMatches(entry) : false;
        wrap.hidden = !matches; // hide the wrapper (article + its trailing <br><br>) together, so no orphaned gaps remain
        if (matches) visibleCount += 1;
      });

      // headings disappear as soon as any filter is active, not only once a group is empty
      if (heading) {
        heading.hidden = filtersActive || visibleCount === 0;
      }
      group.hidden = visibleCount === 0;
      totalVisible += visibleCount;
    });

    if (emptyState) {
      emptyState.hidden = totalVisible > 0;
    }
  }

  /* ---------- Sorting (reorders whole year-group sections) ---------- */

  function applySort() {
    if (!list) return;
    var groups = Array.from(list.querySelectorAll(".engagement-year-group"));

    groups.sort(function (a, b) {
      var yearA = parseInt(a.getAttribute("data-year"), 10) || 0;
      var yearB = parseInt(b.getAttribute("data-year"), 10) || 0;
      return state.sort === "newest" ? yearB - yearA : yearA - yearB;
    });

    groups.forEach(function (group) {
      list.appendChild(group);
    });
  }
})();
