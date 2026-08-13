const backToTop = document.querySelector(".back-to-top");

if (backToTop) {
  window.addEventListener("scroll", function () {
    backToTop.classList.toggle("show", window.scrollY > 0);
  });

  backToTop.addEventListener("click", function (event) {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}
