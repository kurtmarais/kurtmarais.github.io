const backToTop = document.querySelector(".back-to-top");

if (backToTop) {
  window.addEventListener("scroll", function () {
    if (window.scrollY > 0) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
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
