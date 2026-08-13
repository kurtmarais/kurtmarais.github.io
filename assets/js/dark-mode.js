document.addEventListener("DOMContentLoaded", function () {

  /* DARK MODE */

  const toggles = document.querySelectorAll(
    "#dark-mode-toggle, #dark-mode-toggle-desktop"
  );

  const darkMode = localStorage.getItem("darkMode");

  if (darkMode === "enabled") {
    document.body.classList.add("dark-mode");

    toggles.forEach(function (toggle) {
      toggle.checked = true;
    });
  }

  toggles.forEach(function (toggle) {

    toggle.addEventListener("change", function () {

      if (toggle.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("darkMode", "enabled");
      } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("darkMode", "disabled");
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
