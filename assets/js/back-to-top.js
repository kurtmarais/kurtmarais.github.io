const backToTop = document.querySelector(".back-to-top");

if (backToTop) {

  function showBackToTop() {
    backToTop.classList.add("show");
  }

  function updateBackToTop() {
    if (window.scrollY > 0) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }
  }

  /* Normal scrolling */
  window.addEventListener("scroll", updateBackToTop, { passive: true });

  /* Mobile touch scrolling */
  window.addEventListener("touchmove", function () {
    requestAnimationFrame(function () {
      if (window.scrollY > 0) {
        showBackToTop();
      }
    });
  }, { passive: true });

  /* Set the correct initial state */
  updateBackToTop();

  /* Return to top */
  backToTop.addEventListener("click", function (event) {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}
