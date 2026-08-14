const backToTop = document.querySelector(".back-to-top");

if (backToTop) {

  let hideTimer;

  function showBackToTop() {
    if (window.scrollY > 0) {
      backToTop.classList.add("show");

      clearTimeout(hideTimer);

      hideTimer = setTimeout(function () {
        backToTop.classList.remove("show");
      }, 3000);
    }
  }

  function hideBackToTop() {
    clearTimeout(hideTimer);
    backToTop.classList.remove("show");
  }

  window.addEventListener("scroll", function () {

    if (window.scrollY > 0) {
      showBackToTop();
    } else {
      hideBackToTop();
    }

  });

  document.addEventListener("mousemove", function () {

    if (window.scrollY > 0) {
      showBackToTop();
    }

  });

  backToTop.addEventListener("click", function (event) {

    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

}
