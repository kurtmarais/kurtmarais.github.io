/* Conference map on the Engagements page.
   Markup: _includes/conference-map.html (panel + static Equal Earth coastlines
   + JSON dot data from _data/engagements.yml `map:` blocks).
   Toggle: the MAP control in the filter row. Desktop (>= 992px): map opens in a
   sticky right-hand column. Narrower: map opens above the list. */
(function () {
  "use strict";

  var toggle = document.getElementById("ecm-toggle");
  var shell = document.getElementById("ecm-shell");
  var dataEl = document.getElementById("ecm-data");
  if (!toggle || !shell || !dataEl) return;

  var entries;
  try { entries = JSON.parse(dataEl.textContent); } catch (e) { return; }

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
  // older engagements in the same region are listed in the card.
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
  var dots = document.getElementById("ecm-dots");
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
  function status(e) { return isUpcoming(e) ? " (upcoming)" : (e.online ? " (online)" : ""); }

  function show(g, r) {
    if (active && active !== g) active.classList.remove("is-active");
    g.classList.add("is-active");
    active = g;
    place.textContent = r.latest.city + ", " + r.region;
    var when_ = isUpcoming(r.latest) ? "Upcoming, " + prettyDate(r.latest.date) : String(r.latest.year);
    meta.textContent = (r.latest.online ? "Online · " : "") + (r.latest.venue ? r.latest.venue + " · " : "") + when_;
    talk.textContent = label(r.latest);
    if (r.earlier.length) {
      earlier.textContent = "Also presented in this region: " + r.earlier.map(function (e) {
        return e.city + ", " + e.year + status(e) + " (" + label(e) + ")";
      }).join("; ");
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

  regions.forEach(function (r) {
    var g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "ecm-dot" + (r.latest.online ? " is-online" : "") + (isUpcoming(r.latest) ? " is-upcoming" : ""));
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", r.latest.city + ", " + r.region);

    // Larger invisible target for taps, capped at half the distance to the
    // nearest other dot so neighbouring targets never overlap and block each other.
    var nearest = Infinity;
    regions.forEach(function (o) { if (o !== r) nearest = Math.min(nearest, Math.hypot(o.x - r.x, o.y - r.y)); });
    var hit = document.createElementNS(svgNS, "circle");
    hit.setAttribute("class", "ecm-dot-hit");
    hit.setAttribute("cx", r.x); hit.setAttribute("cy", r.y); hit.setAttribute("r", Math.max(4, Math.min(20, nearest / 2 - 0.5)));
    var halo = document.createElementNS(svgNS, "circle");
    halo.setAttribute("class", "ecm-dot-halo");
    halo.setAttribute("cx", r.x); halo.setAttribute("cy", r.y); halo.setAttribute("r", 7);
    var core = document.createElementNS(svgNS, "circle");
    core.setAttribute("class", "ecm-dot-core");
    core.setAttribute("cx", r.x); core.setAttribute("cy", r.y); core.setAttribute("r", 3.4);
    g.appendChild(hit); g.appendChild(halo); g.appendChild(core);
    dots.appendChild(g);

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
    if (!open) hide();
  });
})();
