(function () {
  "use strict";

  var filtersPanel = document.getElementById("publications-filters-panel");
  if (!filtersPanel) return;

  var mobileToggle = document.querySelector(".filters-toggle");
  var filterControls = document.querySelectorAll(".filter-control");
  var list = document.querySelector(".publications-list");
  var emptyState = document.querySelector(".empty-state");
  var topicsInput = document.querySelector(".filter-search-input");

  var state = {
    types: new Set(),
    sort: "type",
    topics: ""
  };

  function hasActiveFilters() {
    return state.types.size > 0 || state.topics.length > 0;
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

  /* ---------- Search: live search ---------- */

  if (topicsInput) {
    topicsInput.addEventListener("input", function () {
      state.topics = topicsInput.value.trim().toLowerCase();
      applyFilters();
    });
  }

  /* ---------- Filtering ---------- */

  function entryMatches(entry) {
    var typeMatches = state.types.size === 0 || state.types.has(entry.getAttribute("data-type"));

    var topicMatches = true;
    // A keyword clicked on an entry (publications-cite.js sets data-keyword on
    // the search box) matches that keyword exactly, not any text containing it.
    var clickedKeyword = topicsInput && topicsInput.dataset.keyword;
    if (state.topics && clickedKeyword && clickedKeyword.toLowerCase() === state.topics) {
      var kwEl = entry.querySelector(".publication-keywords");
      var kws = kwEl ? kwEl.textContent.toLowerCase().split(",").map(function (k) { return k.trim(); }) : [];
      topicMatches = kws.indexOf(state.topics) !== -1;
    } else if (state.topics) {
      var searchableSelectors = [
        ".publication-title",
        ".publication-byline",
        ".publication-description",
        ".abstract-block",
        ".pub-abstract",
        ".publication-keywords",
        ".publication-tags"
      ];

      var searchableText = searchableSelectors
        .map(function (selector) {
          var el = entry.querySelector(selector);
          return el ? el.textContent.toLowerCase() : "";
        })
        .join(" ");

      topicMatches = searchableText.indexOf(state.topics) !== -1;
    }

    return typeMatches && topicMatches;
  }

  function applyFilters() {
    var allWraps = list ? list.querySelectorAll(".publication-entry-wrap") : [];
    var totalVisible = 0;

    allWraps.forEach(function (wrap) {
      var entry = wrap.querySelector(".publication-entry");
      var matches = entry ? entryMatches(entry) : false;
      wrap.hidden = !matches;
      if (matches) totalVisible += 1;
    });

    // A section heading hides when filters leave it with no entries.
    if (list) {
      list.querySelectorAll(".pub-section").forEach(function (section) {
        var anyVisible = Array.from(section.querySelectorAll(".publication-entry-wrap"))
          .some(function (wrap) { return !wrap.hidden; });
        section.hidden = !anyVisible;
      });
    }

    if (emptyState) {
      emptyState.hidden = totalVisible > 0;
    }
  }

  /* ---------- Sorting ---------- */

  // "By type" keeps the type sections; newest / oldest regroup the list by
  // year; A-Z / Z-A make one list (assets/js/list-grouping.js).
  var group = list && window.ListGrouping ? window.ListGrouping(list, {
    wrap: ".publication-entry-wrap",
    year: function (wrap) {
      var entry = wrap.querySelector(".publication-entry");
      return entry ? parseInt(entry.getAttribute("data-year"), 10) || 0 : 0;
    },
    date: function () { return ""; },
    title: function (wrap) {
      var titleEl = wrap.querySelector(".publication-title");
      return titleEl ? titleEl.textContent.trim().toLowerCase() : "";
    }
  }) : null;

  function applySort() {
    if (group) group(state.sort);
    applyFilters();
  }

  applySort();
})();
