document.addEventListener("DOMContentLoaded", function () {

  // Scoped per-instance (not global querySelector like media-carousel.js),
  // so this works correctly even if more than one ever exists on a page.
  document.querySelectorAll(".social-carousel").forEach(function (carousel) {

    const viewport = carousel.querySelector(".social-carousel-viewport");
    const track = carousel.querySelector(".social-links-track");
    const cards = carousel.querySelectorAll(".social-card");
    const prevButton = carousel.querySelector(".social-carousel-prev");
    const nextButton = carousel.querySelector(".social-carousel-next");

    if (!viewport || !track || cards.length === 0) return;

    let currentIndex = 0;

    // Centers the active card in the viewport, rather than jumping by a
    // full 100% per step — this is what lets neighbouring cards partially
    // show ("peek") at the edges instead of being fully hidden until paged to.
    function update() {
      const viewportWidth = viewport.getBoundingClientRect().width;
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;

      const cardOffset = currentIndex * (cardWidth + gap);
      const centeringOffset = (viewportWidth - cardWidth) / 2;

      track.style.transform = "translateX(" + (centeringOffset - cardOffset) + "px)";

      cards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === currentIndex);
      });
    }

    function goNext() {
      currentIndex = (currentIndex + 1) % cards.length;
      update();
    }

    function goPrev() {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      update();
    }

    if (nextButton) nextButton.addEventListener("click", goNext);
    if (prevButton) prevButton.addEventListener("click", goPrev);

    // No autoplay — these are links to deliberately choose between,
    // not passive content to browse, unlike the media carousel.

    window.addEventListener("resize", update);
    window.addEventListener("load", update); // re-measure after fonts/images finish, in case initial DOMContentLoaded measurement was too early
    update();

  });

});
