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
    sort: "newest",        // "newest" | "oldest"
    topics: "",             // lowercase search string
    mediaOnly: false        // true = show only media-format entries
  };

  function hasActiveFilters() {
    return state.types.size > 0 || state.topics.length > 0 || state.mediaOnly;
  }

  /* ---------- URL syncing (media filter only — the other three filters
     don't currently sync to the URL at all, so this is scoped narrowly
     to just the one thing that was actually asked for). ---------- */

  function setUrlParam(key, value) {
    var url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    // replaceState, not pushState: toggling a filter shouldn't fill up
    // the browser's back-button history with one entry per click.
    window.history.replaceState({}, "", url);
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

  /* ---------- Topics: live search ---------- */

  if (topicsInput) {
    topicsInput.addEventListener("input", function () {
      state.topics = topicsInput.value.trim().toLowerCase();
      applyFilters();
    });
  }

  /* ---------- Media: boolean toggle, the one filter that syncs to the URL ---------- */

  var mediaControl = document.querySelector('.filter-control[data-filter="media"]');
  var mediaCheckbox = mediaControl ? mediaControl.querySelector('input[type="checkbox"]') : null;

  if (mediaCheckbox) {
    mediaCheckbox.addEventListener("change", function () {
      state.mediaOnly = mediaCheckbox.checked;
      setUrlParam("media", state.mediaOnly ? "true" : null);
      applyFilters();
    });

    // apply on load if the page was reached via a link like ?media=true
    var initialParams = new URLSearchParams(window.location.search);
    if (initialParams.get("media") === "true") {
      mediaCheckbox.checked = true;
      state.mediaOnly = true;
      applyFilters(); // the other filters have nothing to apply on load (state starts empty either way), but this one can arrive pre-set from the URL
    }
  }

  /* ---------- Filtering ---------- */

  function entryMatches(entry) {
    var typeMatches = state.types.size === 0 || state.types.has(entry.getAttribute("data-type"));
    var mediaMatches = !state.mediaOnly || entry.classList.contains("engagement-media-entry");
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

    return typeMatches && mediaMatches && topicMatches;
  }

  function applyFilters() {
    var filtersActive = hasActiveFilters();

    var allWraps = list ? list.querySelectorAll(".engagement-entry-wrap") : [];
    var totalVisible = 0;

    allWraps.forEach(function (wrap) {
      var entry = wrap.querySelector(".engagement-entry");
      var matches = entry ? entryMatches(entry) : false;
      wrap.hidden = !matches; // hide the wrapper (article + its trailing <br><br>) together, so no orphaned gaps remain
      if (matches) totalVisible += 1;
    });

    // works whether entries currently sit inside their year-group section (newest/oldest sort)
    // or have been flattened directly under .engagements-list (A-Z/Z-A sort) — a group's own
    // visible count naturally comes out to 0 once flattened, which hides it and its heading too.
    yearGroups.forEach(function (group) {
      var heading = group.querySelector(".engagement-year-heading");
      var visibleInGroup = group.querySelectorAll(".engagement-entry-wrap:not([hidden])").length;

      // headings disappear as soon as any filter is active, not only once a group is empty
      if (heading) {
        heading.hidden = filtersActive || visibleInGroup === 0;
      }
      group.hidden = visibleInGroup === 0;
    });

    if (emptyState) {
      emptyState.hidden = totalVisible > 0;
    }
  }

  /* ---------- Sorting ---------- */

  function applySort() {
    if (!list) return;

    if (state.sort === "az" || state.sort === "za") {
      flattenAlphabetically();
    } else {
      regroupByYear();
    }

    applyFilters(); // group membership / heading visibility may have just changed
  }

  function getEntryTitle(wrap) {
    var titleEl = wrap.querySelector(".engagement-title, .engagement-media-title");
    return titleEl ? titleEl.textContent.trim().toLowerCase() : "";
  }

  // sorts by title regardless of year — pulls every entry out of its year-group section and
  // into one flat sequence directly under .engagements-list, since a title-based order chopped
  // into year buckets wouldn't actually read as alphabetical.
  function flattenAlphabetically() {
    var wraps = Array.from(list.querySelectorAll(".engagement-entry-wrap"));

    wraps.sort(function (a, b) {
      var comparison = getEntryTitle(a).localeCompare(getEntryTitle(b));
      return state.sort === "za" ? -comparison : comparison;
    });

    wraps.forEach(function (wrap) {
      list.appendChild(wrap); // moves the wrap out of its section, directly under .engagements-list
    });
  }

  // moves every entry back into the section matching its year, then orders the sections themselves
  function regroupByYear() {
    var wraps = Array.from(list.querySelectorAll(".engagement-entry-wrap"));

    wraps.forEach(function (wrap) {
      var entry = wrap.querySelector(".engagement-entry");
      var year = entry ? entry.getAttribute("data-year") : null;
      var targetGroup = list.querySelector('.engagement-year-group[data-year="' + year + '"]');
      if (targetGroup) {
        targetGroup.appendChild(wrap);
      }
    });

    // restore a deterministic order within each year group, regardless of any A-Z/Z-A sort that
    // ran previously — sort_date (if the entry has one) respects the newest/oldest direction;
    // entries without one fall back to their fixed original position in engagements.yml.
    yearGroups.forEach(function (group) {
      var groupWraps = Array.from(group.querySelectorAll(".engagement-entry-wrap"));

      groupWraps.sort(function (a, b) {
        var entryA = a.querySelector(".engagement-entry");
        var entryB = b.querySelector(".engagement-entry");
        var dateA = entryA ? entryA.getAttribute("data-sort-date") : "";
        var dateB = entryB ? entryB.getAttribute("data-sort-date") : "";

        if (dateA && dateB && dateA !== dateB) {
          return state.sort === "oldest"
            ? (dateA < dateB ? -1 : 1)
            : (dateA < dateB ? 1 : -1);
        }
        if (dateA && !dateB) return -1; // entries with a precise date sort before undated ones in the same year
        if (!dateA && dateB) return 1;

        var orderA = entryA ? parseInt(entryA.getAttribute("data-order"), 10) || 0 : 0;
        var orderB = entryB ? parseInt(entryB.getAttribute("data-order"), 10) || 0 : 0;
        return orderA - orderB; // fixed at render time — never affected by prior sorting
      });

      groupWraps.forEach(function (wrap) {
        group.appendChild(wrap);
      });
    });

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
