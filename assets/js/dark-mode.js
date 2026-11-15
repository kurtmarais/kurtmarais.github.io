document.addEventListener("DOMContentLoaded", function () {

  /* DARK MODE */

  const toggles = document.querySelectorAll(
    "#dark-mode-toggle, #dark-mode-toggle-desktop"
  );

  /* The theme itself is applied before first paint by the inline script at
     the top of <body> (_layouts/default.html): light by default, dark when
     the visitor chose it with the toggle. Here the toggles are synced to it. */
  toggles.forEach(function (toggle) {
    toggle.checked = document.body.classList.contains("dark-mode");
  });

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
