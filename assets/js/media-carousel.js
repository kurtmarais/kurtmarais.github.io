document.addEventListener("DOMContentLoaded", function () {

  const carousel = document.querySelector(".media-carousel");

  if (!carousel) {
    return;
  }

  const track = carousel.querySelector(".media-carousel-track");
  const items = carousel.querySelectorAll(".media-item");
  const previousButton = document.querySelector(".media-carousel-prev");
  const nextButton = document.querySelector(".media-carousel-next");
  const currentDisplay = document.querySelector(".media-current");

  if (!track || items.length <= 1) {
    return;
  }

  let currentIndex = 0;
  let autoPlayTimer;

  function showItem(index) {

    currentIndex = index;

    track.style.transform =
      "translateX(-" + (currentIndex * 100) + "%)";

    if (currentDisplay) {
      currentDisplay.textContent = currentIndex + 1;
    }
  }

  function nextItem() {

    currentIndex++;

    if (currentIndex >= items.length) {
      currentIndex = 0;
    }

    showItem(currentIndex);
  }

  function previousItem() {

    currentIndex--;

    if (currentIndex < 0) {
      currentIndex = items.length - 1;
    }

    showItem(currentIndex);
  }

  function resetAutoPlay() {

    clearInterval(autoPlayTimer);

    autoPlayTimer = setInterval(function () {
      nextItem();
    }, 15000);
  }

  if (nextButton) {
    nextButton.addEventListener("click", function () {
      nextItem();
      resetAutoPlay();
    });
  }

  if (previousButton) {
    previousButton.addEventListener("click", function () {
      previousItem();
      resetAutoPlay();
    });
  }

  // Touch swiping (fingers and pens only; mouse clicks are untouched, so
  // desktop links behave as before). The card allows vertical page scrolling
  // (touch-action: pan-y in CSS), so only a mostly-horizontal swipe past the
  // threshold changes the item: left = next, right = previous, wrapping like
  // the arrows. No setPointerCapture: touch pointers are captured implicitly,
  // and capturing on desktop breaks nested links (see social-carousel.js).
  const SWIPE_THRESHOLD = 40;
  let startX = null;
  let startY = null;
  let justSwiped = false;

  carousel.addEventListener("pointerdown", function (evt) {
    if (evt.pointerType === "mouse") return;
    startX = evt.clientX;
    startY = evt.clientY;
  });

  carousel.addEventListener("pointerup", function (evt) {
    if (startX === null) return;
    const deltaX = evt.clientX - startX;
    const deltaY = evt.clientY - startY;
    startX = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) {
      nextItem();
    } else {
      previousItem();
    }
    resetAutoPlay();
    // A swipe that started on the image or "Read article" link must not also
    // open it: swallow the click the browser may fire right after.
    justSwiped = true;
    setTimeout(function () { justSwiped = false; }, 400);
  });

  carousel.addEventListener("pointercancel", function () {
    startX = null;   // the browser took the gesture over as a vertical scroll
  });

  carousel.addEventListener("click", function (evt) {
    if (!justSwiped) return;
    evt.preventDefault();
    evt.stopPropagation();
    justSwiped = false;
  }, true);

  showItem(currentIndex);
  resetAutoPlay();

});
