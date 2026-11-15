document.addEventListener("DOMContentLoaded", function () {

  /* DARK MODE */

  const toggles = document.querySelectorAll(
    "#dark-mode-toggle, #dark-mode-toggle-desktop"
  );

  /* The theme itself is applied before first paint by the inline script at
     the top of <body> (_layouts/default.html): the saved choice, else the
     device setting. Here the toggles are synced to it. */
  toggles.forEach(function (toggle) {
    toggle.checked = document.body.classList.contains("dark-mode");
  });

  /* Until the visitor picks a theme with the toggle, follow the device
     setting live (e.g. a phone switching to dark at sunset). */
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const followSystem = function (event) {
    let saved = null;
    try { saved = localStorage.getItem("darkMode"); } catch (e) {}
    if (saved) return;
    window.siteSetTheme(event.matches);
    toggles.forEach(function (toggle) {
      toggle.checked = event.matches;
    });
  };
  if (systemDark.addEventListener) {
    systemDark.addEventListener("change", followSystem);
  }

  toggles.forEach(function (toggle) {

    toggle.addEventListener("change", function () {

      if (toggle.checked) {
        window.siteSetTheme(true);
        try { localStorage.setItem("darkMode", "enabled"); } catch (e) {}
      } else {
        window.siteSetTheme(false);
        try { localStorage.setItem("darkMode", "disabled"); } catch (e) {}
      }

      toggles.forEach(function (otherToggle) {
        otherToggle.checked = toggle.checked;
      });

    });

  });


  /* MOBILE MENU */

  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const mobileNavigation = document.querySelector(".mobile-navigation");

  if (menuToggle && mobileNavigation) {

    menuToggle.addEventListener("click", function () {

      const isOpen = mobileNavigation.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
      );

    });

  }

});
