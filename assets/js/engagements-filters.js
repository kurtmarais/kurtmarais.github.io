(function () {
  "use strict";

  var filtersPanel = document.getElementById("engagements-filters-panel");
  if (!filtersPanel) return; // this script only runs on the engagements page, but guard anyway

  var mobileToggle = document.querySelector(".filters-toggle");
  var filterControls = document.querySelectorAll(".filter-control");
  var list = document.querySelector(".engagements-list");
  var emptyState = document.querySelector(".empty-state");
  var topicsInput = document.querySelector(".filter-search-input");

  var state = {
    types: new Set(),      // empty set = "all types"
    years: new Set(),      // empty set = "all years"
    sort: "type",          // "type" | "newest" | "oldest" | "az" | "za"
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

    // Support a direct link (?media=true) that applies the Type filter
    // the same way checking the "Media" box by hand would — the
    // checkbox appears checked, the label updates, and it's the same
    // state.types the manual checkbox uses, not a separate mechanism.
    var params = new URLSearchParams(window.location.search);
    if (params.get("media") === "true") {
      var mediaCheckbox = typeControl.querySelector('input[type="checkbox"][value="media"]');
      if (mediaCheckbox) {
        mediaCheckbox.checked = true;
        state.types.add("media");
        updateTypeLabel();
        applyFilters();
      }
    }
  }

  /* ---------- Years: multi-select ---------- */

  var yearControl = document.querySelector('.filter-control[data-filter="years"]');
  if (yearControl) {
    var yearValueLabel = yearControl.querySelector(".filter-value");
    var yearCheckboxes = yearControl.querySelectorAll('input[type="checkbox"]');

    yearCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          state.years.add(checkbox.value);
        } else {
          state.years.delete(checkbox.value);
        }
        var picked = Array.from(yearCheckboxes)
          .filter(function (cb) { return cb.checked; })
          .map(function (cb) { return cb.value; });
        yearValueLabel.textContent = picked.length ? picked.join(", ") : "All years";
        applyFilters();
      });
    });
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

  /* ---------- Summary / Abstract panels ---------- */

  if (list) {
    list.addEventListener("click", function (event) {
      var btn = event.target.closest(".pub-toggle");
      if (!btn) return;
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
    });
  }

  /* ---------- Media grid: "View all" ---------- */

  // The media grid shows its newest items plus a "View all" tile that
  // expands it in place: 4 on desktops (2 while the map is open beside the
  // list), 3 on tablets and phones (two rows of 2 on phones). Items past
  // that get .is-extra, hidden while the grid has .is-collapsed. No tile
  // when it would only hide one item. While filtering, every match shows
  // and the tile hides (main.scss, .is-filtering). Resets on each visit.
  var mediaGrid = list ? list.querySelector('[data-section="media"] .eng-grid') : null;
  var viewAll = mediaGrid ? mediaGrid.querySelector(".eng-viewall") : null;
  var mapShell = document.getElementById("ecm-shell");
  var desktop = window.matchMedia("(min-width: 992px)");

  function mediaShown() {
    if (!desktop.matches) return 3;
    return mapShell && mapShell.classList.contains("is-open") ? 2 : 4;
  }

  function updateViewAll() {
    if (!viewAll) return;
    var wraps = Array.from(mediaGrid.children).filter(function (el) {
      return el.classList.contains("eng-wrap");
    });
    var shown = mediaShown();
    if (wraps.length <= shown + 1) shown = wraps.length;
    var open = !mediaGrid.classList.contains("is-collapsed");

    wraps.forEach(function (wrap, index) {
      wrap.classList.toggle("is-extra", index >= shown);
    });
    viewAll.hidden = shown === wraps.length;

    viewAll.querySelector(".eng-viewall-count").innerHTML = open
      ? '<i class="fas fa-chevron-up" aria-hidden="true"></i>'
      : "+" + (wraps.length - shown);
    viewAll.querySelector(".eng-viewall-more").textContent = open ? "Show fewer" : "more";
    viewAll.querySelector(".eng-viewall-title").textContent = open
      ? "Show the " + shown + " most recent"
      : "View all";
    viewAll.querySelector(".eng-viewall-sub").textContent = wraps.length + " media engagements";
    viewAll.querySelector(".eng-viewall-btn").setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (viewAll) {
    mediaGrid.classList.add("is-collapsed");

    viewAll.querySelector(".eng-viewall-btn").addEventListener("click", function () {
      mediaGrid.classList.toggle("is-collapsed");
      updateViewAll();
      // Collapsing from the bottom of a long grid can leave the tile above
      // the screen; bring it back into view.
      if (mediaGrid.classList.contains("is-collapsed")) {
        viewAll.scrollIntoView({ block: "nearest" });
      }
    });

    if (desktop.addEventListener) desktop.addEventListener("change", updateViewAll);
    if (mapShell && window.MutationObserver) {
      new MutationObserver(updateViewAll).observe(mapShell, { attributes: true, attributeFilter: ["class"] });
    }
  }

  /* ---------- Filtering ---------- */

  function entryMatches(entry) {
    var typeMatches = state.types.size === 0 || state.types.has(entry.getAttribute("data-type"));
    var yearMatches = state.years.size === 0 || state.years.has(entry.getAttribute("data-year"));
    var topicMatches = true;
    if (state.topics) {
      var searchableSelectors = [
        ".eng-title",
        ".eng-venue",
        ".pub-keywords",
        ".pub-badges",
        ".engagement-tags"
      ];

      var searchableText = searchableSelectors
        .map(function (selector) {
          var el = entry.querySelector(selector);
          return el ? el.textContent.toLowerCase() : "";
        })
        .concat(Array.from(entry.querySelectorAll(".pub-panel")).map(function (el) {
          return el.textContent.toLowerCase();
        }))
        .join(" ");

      topicMatches = searchableText.indexOf(state.topics) !== -1;
    }

    return typeMatches && yearMatches && topicMatches;
  }

  function applyFilters() {
    var allWraps = list ? list.querySelectorAll(".eng-wrap") : [];
    var totalVisible = 0;

    allWraps.forEach(function (wrap) {
      var entry = wrap.querySelector(".eng-entry");
      var matches = entry ? entryMatches(entry) : false;
      wrap.hidden = !matches;
      if (matches) totalVisible += 1;
    });

    // A section (type or year) hides when filters leave it with no entries.
    if (list) {
      list.querySelectorAll(".pub-section").forEach(function (section) {
        section.hidden = !section.querySelector(".eng-wrap:not([hidden])");
      });
    }

    if (emptyState) {
      emptyState.hidden = totalVisible > 0;
    }

    if (list) {
      list.classList.toggle("is-filtering", state.types.size > 0 || state.years.size > 0 || state.topics.length > 0);
    }
    updateViewAll();
  }

  /* ---------- Sorting ---------- */

  // "By type" keeps the type sections; newest / oldest regroup the list by
  // year; A-Z / Z-A make one list (assets/js/list-grouping.js).
  var group = list && window.ListGrouping ? window.ListGrouping(list, {
    wrap: ".eng-wrap",
    year: function (wrap) {
      var entry = wrap.querySelector(".eng-entry");
      return entry ? parseInt(entry.getAttribute("data-year"), 10) || 0 : 0;
    },
    date: function (wrap) {
      var entry = wrap.querySelector(".eng-entry");
      return entry ? entry.getAttribute("data-sort-date") || "" : "";
    },
    title: function (wrap) {
      var titleEl = wrap.querySelector(".eng-title");
      return titleEl ? titleEl.textContent.trim().toLowerCase() : "";
    }
  }) : null;

  function applySort() {
    if (group) group(state.sort);
    applyFilters();
  }

  applySort();
})();
