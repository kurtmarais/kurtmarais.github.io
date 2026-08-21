/*
  Nav wrap detection
  ------------------
  The header switches to hamburger mode whenever EITHER of these is true:
    1. The viewport is at or below 767px (the existing, original behaviour —
       kept as a floor so this never regresses below what was already working).
    2. The desktop nav links have actually wrapped onto a second line —
       detected directly, not guessed at with a fixed pixel width, so this
       stays correct even if links are added/renamed/re-ordered later.

  This does NOT touch title/logo sizing at all — that stays on its own
  separate, fixed 767px breakpoint in main.scss, by design.

  Toggles a single class, `.nav-collapsed`, on `.site-header`. All the
  actual show/hide styling lives in main.scss, keyed off that class.
*/

(function () {
  var header = document.querySelector(".site-header");
  var nav = document.querySelector(".desktop-navigation");

  if (!header || !nav) return;

  function navHasWrapped() {
    var items = nav.querySelectorAll(".nav-link, .theme-switch");
    if (items.length < 2) return false;

    var firstTop = items[0].offsetTop;
    for (var i = 1; i < items.length; i++) {
      if (items[i].offsetTop !== firstTop) {
        return true;
      }
    }
    return false;
  }

  function evaluate() {
    var narrow = window.innerWidth <= 767;
    var wasCollapsed = header.classList.contains("nav-collapsed");

    // Briefly force the nav visible/unwrapped-checkable: if it's already
    // collapsed from a previous check, offsetTop comparisons would be
    // meaningless (everything's hidden). Toggling the class off first
    // guarantees an accurate re-measurement every time.
    header.classList.remove("nav-collapsed");
    var wrapped = navHasWrapped();
    var shouldCollapse = narrow || wrapped;

    if (shouldCollapse) {
      header.classList.add("nav-collapsed");
    } else if (wasCollapsed) {
      // The window has widened enough to switch back to the full desktop
      // nav. If the hamburger dropdown was left open from before, close
      // it too — otherwise it stays stuck open, positioned under a
      // hamburger button that no longer exists on screen.
      var mobileNav = document.querySelector(".mobile-navigation");
      var toggle = document.querySelector(".mobile-menu-toggle");
      if (mobileNav) mobileNav.classList.remove("open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  }

  evaluate();

  window.addEventListener("resize", evaluate);
  window.addEventListener("load", evaluate); // fonts loading late can shift widths
})();
