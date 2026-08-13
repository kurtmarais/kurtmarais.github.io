const backToTop = document.querySelector(".back-to-top");

if (backToTop) {

  let hideTimer;

  function showBackToTop() {
    backToTop.classList.add("show");

    clearTimeout(hideTimer);

    hideTimer = setTimeout(function () {
      if (window.scrollY > 0) {
        backToTop.classList.remove("show");
      }
    }, 3000);
  }

  function updateBackToTop() {
    if (window.scrollY > 0) {
      showBackToTop();
    } else {
      clearTimeout(hideTimer);
      backToTop.classList.remove("show");
    }
  }

  window.addEventListener("scroll", updateBackToTop, { passive: true });

  window.addEventListener("touchmove", function () {
    requestAnimationFrame(function () {
      if (window.scrollY > 0) {
        showBackToTop();
      }
    });
  }, { passive: true });

  updateBackToTop();

  backToTop.addEventListener("click", function (event) {
    event.preventDefault();

    clearTimeout(hideTimer);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}
