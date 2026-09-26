/* Homepage cards: the intro text under a title is never wider than the
   title's longest line as it's actually displayed (after wrapping), so the
   paragraph lines up with the heading's right edge instead of running past
   it or stopping at a fixed width. Measured from the rendered text, and
   re-measured when fonts finish loading and whenever the card resizes.
   Pairs: [title, text below it]. */
(function () {
  "use strict";

  var PAIRS = [
    [".hero-heading", ".hero-intro"],
    [".demo-teaser-body h4", ".demo-teaser-body > p:not(.eyebrow)"]
  ];

  // Width of the widest rendered line of an element's text.
  function longestLine(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var rects = range.getClientRects(), lines = {};
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (!r.width) continue;
      var key = Math.round(r.top);
      var line = lines[key] || (lines[key] = { left: r.left, right: r.right });
      line.left = Math.min(line.left, r.left);
      line.right = Math.max(line.right, r.right);
    }
    var widest = 0;
    Object.keys(lines).forEach(function (k) { widest = Math.max(widest, lines[k].right - lines[k].left); });
    return Math.ceil(widest);
  }

  function fit() {
    PAIRS.forEach(function (pair) {
      var title = document.querySelector(pair[0]);
      var texts = document.querySelectorAll(pair[1]);
      if (!title || !texts.length) return;
      var w = longestLine(title);
      if (!w) return;
      Array.prototype.forEach.call(texts, function (t) { t.style.maxWidth = w + "px"; });
    });
  }

  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  var pending = null;
  function later() { if (pending) cancelAnimationFrame(pending); pending = requestAnimationFrame(fit); }
  if (window.ResizeObserver) {
    PAIRS.forEach(function (pair) {
      var t = document.querySelector(pair[0]);
      if (t) new ResizeObserver(later).observe(t);
    });
  } else {
    window.addEventListener("resize", later);
  }
})();
