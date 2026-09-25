/* Conference map on the Engagements page.
   Markup: _includes/conference-map.html (panel + static Equal Earth coastlines
   + JSON dot data from _data/engagements.yml `map:` blocks).
   Toggle: the MAP control in the filter row. Desktop (>= 992px): map opens in a
   sticky right-hand column. Narrower: map opens above the list.
   Inside the map: zoom in/out/reset buttons, drag to pan when zoomed, and (from
   768px) an enlarge button that opens the map in a large overlay. */
(function () {
  "use strict";

  var toggle = document.getElementById("ecm-toggle");
  var shell = document.getElementById("ecm-shell");
  var dataEl = document.getElementById("ecm-data");
  if (!toggle || !shell || !dataEl) return;

  var entries;
  try { entries = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var MAP_W = 900, MAP_H = 460, MAX_ZOOM = 8;

  // Equal Earth forward projection, identical to
  // d3.geoEqualEarth().scale(155).translate([450, 230]) used to pre-render the
  // coastlines in the include, so dots land in the right place.
  function project(lon, lat) {
    var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
    var lambda = lon * Math.PI / 180, phi = lat * Math.PI / 180;
    var l = Math.asin(M * Math.sin(phi)), l2 = l * l, l6 = l2 * l2 * l2;
    var x = lambda * Math.cos(l) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)));
    var y = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2));
    return [450 + 155 * x, 230 - 155 * y];
  }

  // Sort key: exact date when known, otherwise the end of that year.
  function when(e) { return e.date ? String(e.date) : String(e.year) + "-12-31"; }

  // One dot per region, placed on the city of its most recent engagement;
  // older engagements in the same region are listed in the card, newest first.
  function groupByRegion(list) {
    var byRegion = {};
    list.forEach(function (e) { (byRegion[e.region] = byRegion[e.region] || []).push(e); });
    return Object.keys(byRegion).map(function (region) {
      var sorted = byRegion[region].slice().sort(function (a, b) { return when(b) < when(a) ? -1 : when(b) > when(a) ? 1 : 0; });
      var latest = sorted[0], xy = project(latest.lon, latest.lat);
      return { latest: latest, region: region, x: xy[0], y: xy[1], earlier: sorted.slice(1) };
    });
  }

  var regions = groupByRegion(entries);
  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("ecm-svg");
  var dots = document.getElementById("ecm-dots");
  var panel = document.getElementById("ecm-map-panel");
  var card = document.getElementById("ecm-card");
  var hint = document.getElementById("ecm-hint");
  var place = document.getElementById("ecm-card-place");
  var meta = document.getElementById("ecm-card-meta");
  var talk = document.getElementById("ecm-card-talk");
  var earlier = document.getElementById("ecm-card-earlier");
  var active = null;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  function label(e) { return e.title + (e.type === "poster" ? " (poster)" : ""); }

  // Upcoming: dated after today, checked in the visitor's browser, so an event
  // switches from "Upcoming" to presented on its date without a site rebuild.
  // Needs `start_date` in engagements.yml (a year alone can't be compared).
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function isUpcoming(e) { return !!e.date && new Date(e.date + "T00:00:00") > today; }
  function prettyDate(d) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  function status(e) { return isUpcoming(e) ? "upcoming" : (e.online ? "online" : ""); }

  function show(g, r) {
    if (active && active !== g) active.classList.remove("is-active");
    g.classList.add("is-active");
    active = g;
    place.textContent = r.latest.city + ", " + r.region;
    var when_ = isUpcoming(r.latest) ? "Upcoming, " + prettyDate(r.latest.date) : String(r.latest.year);
    meta.textContent = (r.latest.online ? "Online · " : "") + (r.latest.venue ? r.latest.venue + " · " : "") + when_;
    talk.textContent = label(r.latest);

    // Earlier engagements in the region: one per line, newest first.
    earlier.textContent = "";
    if (r.earlier.length) {
      var head = document.createElement("p");
      head.className = "ecm-earlier-head";
      head.textContent = "Earlier in this region";
      earlier.appendChild(head);
      var ul = document.createElement("ul");
      r.earlier.forEach(function (e) {
        var li = document.createElement("li");
        var st = status(e);
        li.textContent = e.year + " · " + e.city + (st ? " (" + st + ")" : "") + " · " + label(e);
        ul.appendChild(li);
      });
      earlier.appendChild(ul);
      earlier.style.display = "";
    } else {
      earlier.style.display = "none";
    }
    hint.style.display = "none";
    card.classList.add("is-visible");
  }

  function hide() {
    if (active) active.classList.remove("is-active");
    active = null;
    card.classList.remove("is-visible");
    hint.style.display = "";
  }

  // ---------- dots ----------
  // Sizes are in screen-like units at zoom 1 and divided by the zoom level, so
  // dots stay the same size on screen while the map magnifies around them.
  var CORE_R = 3.4, HALO_R = 7, HIT_MAX = 20;
  var dotEls = [];

  regions.forEach(function (r) {
    var nearest = Infinity;
    regions.forEach(function (o) { if (o !== r) nearest = Math.min(nearest, Math.hypot(o.x - r.x, o.y - r.y)); });

    var g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "ecm-dot" + (r.latest.online ? " is-online" : "") + (isUpcoming(r.latest) ? " is-upcoming" : ""));
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", r.latest.city + ", " + r.region);

    var hit = document.createElementNS(svgNS, "circle");
    hit.setAttribute("class", "ecm-dot-hit");
    var halo = document.createElementNS(svgNS, "circle");
    halo.setAttribute("class", "ecm-dot-halo");
    var core = document.createElementNS(svgNS, "circle");
    core.setAttribute("class", "ecm-dot-core");
    [hit, halo, core].forEach(function (c) { c.setAttribute("cx", r.x); c.setAttribute("cy", r.y); g.appendChild(c); });
    dots.appendChild(g);
    dotEls.push({ hit: hit, halo: halo, core: core, nearest: nearest });

    if (isTouch) {
      g.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (active === g) hide(); else show(g, r);
      });
    } else {
      g.addEventListener("mouseenter", function () { show(g, r); });
      g.addEventListener("mouseleave", function () { if (active === g) hide(); });
    }
    // Keyboard focus shows the card too. A tap or click also focuses the dot
    // before its click fires, so ignore focus that comes from a pointer;
    // otherwise the click would immediately toggle the card closed again.
    var fromPointer = false;
    g.addEventListener("pointerdown", function () { fromPointer = true; });
    g.addEventListener("focus", function () { if (!fromPointer) show(g, r); fromPointer = false; });
    g.addEventListener("blur", function () { if (!isTouch && active === g) hide(); });
    g.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); if (active === g) hide(); else show(g, r); }
      if (ev.key === "Escape") { hide(); }
    });
  });

  // ---------- zoom and pan ----------
  var view = { x: 0, y: 0, w: MAP_W, h: MAP_H };
  var zoomIn = document.getElementById("ecm-zoom-in");
  var zoomOut = document.getElementById("ecm-zoom-out");
  var zoomReset = document.getElementById("ecm-zoom-reset");

  function zoomLevel() { return MAP_W / view.w; }

  function sizeDots() {
    var z = zoomLevel();
    dotEls.forEach(function (d) {
      d.core.setAttribute("r", CORE_R / z);
      d.halo.setAttribute("r", HALO_R / z);
      // Tap target: up to HIT_MAX on screen, but never past halfway to the
      // nearest other dot (in map units), so close dots can't block each other.
      d.hit.setAttribute("r", Math.max(4 / z, Math.min(HIT_MAX / z, d.nearest / 2 - 0.5 / z)));
    });
  }

  function applyView() {
    svg.setAttribute("viewBox", [view.x, view.y, view.w, view.h].join(" "));
    sizeDots();
    var z = zoomLevel();
    if (zoomOut) zoomOut.disabled = z <= 1.001;
    if (zoomReset) zoomReset.disabled = z <= 1.001;
    if (zoomIn) zoomIn.disabled = z >= MAX_ZOOM - 0.001;
    svg.classList.toggle("is-zoomed", z > 1.001);
  }

  function clampView() {
    view.x = Math.min(Math.max(view.x, 0), MAP_W - view.w);
    view.y = Math.min(Math.max(view.y, 0), MAP_H - view.h);
  }

  // Zoom to level z, keeping map point (cx, cy) at the same place on screen.
  function zoomTo(z, cx, cy) {
    z = Math.min(Math.max(z, 1), MAX_ZOOM);
    if (cx === undefined) { cx = view.x + view.w / 2; cy = view.y + view.h / 2; }
    var fx = (cx - view.x) / view.w, fy = (cy - view.y) / view.h;
    view.w = MAP_W / z; view.h = MAP_H / z;
    view.x = cx - fx * view.w; view.y = cy - fy * view.h;
    clampView();
    applyView();
  }

  if (zoomIn) zoomIn.addEventListener("click", function (ev) { ev.stopPropagation(); zoomTo(zoomLevel() * 2); });
  if (zoomOut) zoomOut.addEventListener("click", function (ev) { ev.stopPropagation(); zoomTo(zoomLevel() / 2); });
  if (zoomReset) zoomReset.addEventListener("click", function (ev) { ev.stopPropagation(); zoomTo(1); });

  function toMap(clientX, clientY) {
    var rect = svg.getBoundingClientRect();
    return [view.x + (clientX - rect.left) / rect.width * view.w, view.y + (clientY - rect.top) / rect.height * view.h];
  }

  // Drag to pan (mouse or finger) once zoomed in. A press that starts on a dot
  // never starts a pan, so dots keep their own hover/tap behaviour.
  var drag = null;
  svg.addEventListener("pointerdown", function (ev) {
    if (zoomLevel() <= 1.001 || ev.target.closest(".ecm-dot")) return;
    drag = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y, id: ev.pointerId };
    svg.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", function (ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    var rect = svg.getBoundingClientRect();
    view.x = drag.vx - (ev.clientX - drag.x) / rect.width * view.w;
    view.y = drag.vy - (ev.clientY - drag.y) / rect.height * view.h;
    clampView();
    applyView();
  });
  function endDrag() { drag = null; svg.classList.remove("is-dragging"); }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // Mouse wheel zooms only in the enlarged view, so scrolling the page past the
  // small map never gets hijacked.
  svg.addEventListener("wheel", function (ev) {
    if (!panel.classList.contains("is-expanded")) return;
    ev.preventDefault();
    var p = toMap(ev.clientX, ev.clientY);
    zoomTo(zoomLevel() * (ev.deltaY < 0 ? 1.25 : 0.8), p[0], p[1]);
  }, { passive: false });

  // ---------- enlarge (overlay, 768px and up) ----------
  var expandBtn = document.getElementById("ecm-expand");
  var backdrop = document.getElementById("ecm-backdrop");

  // While enlarged, the panel (and its backdrop) move to the end of <body> so no
  // ancestor's stacking context (the sticky column creates one) can sit above
  // it; they go back to their original place when shrunk.
  var home = panel.parentNode, homeNext = panel.nextSibling;
  function setExpanded(on) {
    if (panel.classList.contains("is-expanded") === on) return;
    if (on) {
      if (backdrop) document.body.appendChild(backdrop);
      document.body.appendChild(panel);
    } else {
      home.insertBefore(panel, homeNext);
      if (backdrop) home.insertBefore(backdrop, panel);
    }
    panel.classList.toggle("is-expanded", on);
    if (backdrop) backdrop.hidden = !on;
    document.body.classList.toggle("ecm-noscroll", on);
    if (expandBtn) {
      expandBtn.setAttribute("aria-pressed", on ? "true" : "false");
      expandBtn.setAttribute("aria-label", on ? "Shrink map" : "Enlarge map");
      expandBtn.setAttribute("title", on ? "Shrink map" : "Enlarge map");
    }
  }
  if (expandBtn) expandBtn.addEventListener("click", function (ev) { ev.stopPropagation(); setExpanded(!panel.classList.contains("is-expanded")); });
  if (backdrop) backdrop.addEventListener("click", function () { setExpanded(false); });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && panel.classList.contains("is-expanded")) setExpanded(false);
  });

  // Legend: only list the online / upcoming styles when a dot uses them.
  var anyOnline = regions.some(function (r) { return r.latest.online; });
  var anyUpcoming = regions.some(function (r) { return isUpcoming(r.latest); });
  var lo = document.getElementById("ecm-legend-online"), lu = document.getElementById("ecm-legend-upcoming");
  if (lo) lo.style.display = anyOnline ? "" : "none";
  if (lu) lu.style.display = anyUpcoming ? "" : "none";

  // Tap anywhere else to dismiss (touch screens).
  document.addEventListener("click", function () { if (isTouch && active) hide(); });

  var labelEl = document.getElementById("ecm-toggle-label");
  toggle.addEventListener("click", function () {
    var open = !shell.classList.contains("is-open");
    shell.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Hide conference map" : "Show conference map");
    if (labelEl) labelEl.textContent = open ? "Hide map" : "Map";
    if (!open) { hide(); setExpanded(false); }
  });

  applyView();
})();
