const backToTop = document.querySelector(".back-to-top");

window.addEventListener("scroll", function () {
  if (window.scrollY > 300) {
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
