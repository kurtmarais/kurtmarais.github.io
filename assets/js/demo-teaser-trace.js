/* Homepage demo teaser: every 60 seconds a line traces the card's border,
   starting at the bottom-left corner and running anticlockwise (bottom,
   right, top, left), fading out as it nears the bottom-left corner again.
   The outline is an SVG path rebuilt whenever the card resizes, so its
   rounded corners always match the card. Skipped for reduced motion. */
(function () {
  "use strict";

  var card = document.querySelector(".demo-teaser");
  if (!card) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var EVERY_MS = 60000;   // time between traces
  var FIRST_MS = 30000;   // first trace, after the homepage is opened
  var RADIUS = 10;        // matches .demo-teaser border-radius
  var INSET = 1;          // half the trace's stroke width, so it sits on the border

  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "demo-teaser-trace");
  svg.setAttribute("aria-hidden", "true");
  var path = document.createElementNS(svgNS, "path");
  path.setAttribute("pathLength", "100");
  svg.appendChild(path);
  card.appendChild(svg);

  // Rounded rectangle starting in the middle of the bottom-left corner and
  // going anticlockwise on screen (sweep flag 0 in SVG's y-down space).
  function build() {
    var w = card.offsetWidth, h = card.offsetHeight;
    if (!w || !h) return;
    var i = INSET, r = RADIUS - i, x0 = i, y0 = i, x1 = w - i, y1 = h - i;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    path.setAttribute("d", [
      "M", x0, y1 - r,
      "A", r, r, 0, 0, 0, x0 + r, y1,
      "L", x1 - r, y1,
      "A", r, r, 0, 0, 0, x1, y1 - r,
      "L", x1, y0 + r,
      "A", r, r, 0, 0, 0, x1 - r, y0,
      "L", x0 + r, y0,
      "A", r, r, 0, 0, 0, x0, y0 + r,
      "Z"
    ].join(" "));
  }
  build();
  if (window.ResizeObserver) new ResizeObserver(build).observe(card);
  else window.addEventListener("resize", build);

  function trace() {
    if (document.hidden) return;
    svg.classList.remove("is-tracing");
    void svg.getBoundingClientRect();   // restart the CSS animation
    svg.classList.add("is-tracing");
  }
  svg.addEventListener("animationend", function () { svg.classList.remove("is-tracing"); });

  // First trace FIRST_MS after the page opens. If the card is off screen at
  // that point, the first trace waits until it scrolls into view, so it isn't
  // wasted; after that it repeats every EVERY_MS.
  var visible = !window.IntersectionObserver, due = false, started = false;
  function start() {
    if (started) return;
    started = true;
    trace();
    setInterval(trace, EVERY_MS);
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible && due) start();
    }, { threshold: 0.5 }).observe(card);
  }
  setTimeout(function () { due = true; if (visible) start(); }, FIRST_MS);
})();
