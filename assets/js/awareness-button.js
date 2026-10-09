// Floating awareness button (see _includes/awareness-button.html).
//
// - Only shown between data-start and data-end (inclusive), using the
//   visitor's local date, so it switches on and off without a rebuild.
// - Sits just below the header's bottom border, lined up with the header's
//   left edge (right edge on phones, where it opens leftwards).
//   On phones the header is sticky, so the button stays under it;
//   elsewhere it follows the header up as the page scrolls and then stays
//   MIN_TOP px from the top of the screen.
// - On the first page of a visit it opens with the full text, then shrinks
//   to the round icon after INTRO_MS (sessionStorage remembers this for the
//   rest of the visit). Hover / keyboard focus open it again (CSS). A tap on
//   a phone goes straight to the video page.
(function () {
  var btn = document.querySelector(".awareness-btn");
  if (!btn) return;

  var INTRO_MS = 4000;
  var MIN_TOP = 16;     // px from the top of the screen once the header has scrolled away
  var BELOW_HEADER = 6; // px gap under the header's bottom border
  var SEEN_KEY = "awarenessIntroSeen";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var now = new Date();
  var today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  var start = btn.getAttribute("data-start");
  var end = btn.getAttribute("data-end");
  if ((start && today < start) || (end && today > end)) return;

  var header = document.querySelector(".site-header");
  var phone = window.matchMedia("(max-width: 767px)");
  var ticking = false;
  function place() {
    ticking = false;
    var r = header ? header.getBoundingClientRect() : null;
    var top = r ? Math.max(MIN_TOP, r.bottom + BELOW_HEADER) : MIN_TOP;
    btn.style.top = Math.round(top) + "px";
    if (phone.matches) {
      var right = r ? Math.max(8, document.documentElement.clientWidth - r.right) : 16;
      btn.style.left = "";
      btn.style.right = Math.round(right) + "px";
    } else {
      btn.style.right = "";
      btn.style.left = Math.round(r ? Math.max(8, r.left) : 16) + "px";
    }
  }
  function queue() {
    if (!ticking) { ticking = true; requestAnimationFrame(place); }
  }

  place();
  btn.hidden = false;
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  if (window.ResizeObserver && header) new ResizeObserver(queue).observe(header);

  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) {}
  if (seen || still) return;
  try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
  btn.classList.add("is-open");
  setTimeout(function () { btn.classList.remove("is-open"); }, INTRO_MS);
})();
