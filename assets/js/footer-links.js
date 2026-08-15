const currentPageFooterLinks = document.querySelectorAll(".footer-link.is-current");

currentPageFooterLinks.forEach(function (link) {
  link.addEventListener("click", function (event) {

    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });
});
