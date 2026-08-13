const backToTop = document.querySelector(".back-to-top");

if (backToTop) {
  function updateBackToTop() {
    if (window.scrollY > 0) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  }

  window.addEventListener("scroll", updateBackToTop, { passive: true });

  updateBackToTop();

  backToTop.addEventListener("click", function (event) {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}
