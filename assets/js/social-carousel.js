document.addEventListener("DOMContentLoaded", function () {

  document.querySelectorAll(".social-carousel").forEach(function (carousel) {

    const viewport = carousel.querySelector(".social-carousel-viewport");
    const track = carousel.querySelector(".social-links-track");
    const prevButton = carousel.querySelector(".social-carousel-prev");
    const nextButton = carousel.querySelector(".social-carousel-next");

    if (!viewport || !track) return;

    const realCards = Array.from(track.querySelectorAll(".social-card"));
    if (realCards.length === 0) return;

    const CLONE_COUNT = Math.min(2, realCards.length);

    // Clone the last N cards and prepend them, and the first N cards and
    // append them. This is what makes wrapping feel like a continuous
    // loop rather than a jump back to a fixed start/end: when the user
    // pages past the "last" real card, a clone of the first card is
    // already sitting right there to slide into view.
    const leadingClones = realCards.slice(-CLONE_COUNT).map(function (c) {
      const clone = c.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      return clone;
    });
    const trailingClones = realCards.slice(0, CLONE_COUNT).map(function (c) {
      const clone = c.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      return clone;
    });

    const firstRealCard = track.querySelector(".social-card");
    leadingClones.forEach(function (clone) { track.insertBefore(clone, firstRealCard); });
    trailingClones.forEach(function (clone) { track.appendChild(clone); });

    const allCards = Array.from(track.querySelectorAll(".social-card"));
    let currentIndex = CLONE_COUNT; // the first real card, past the leading clones

    function positionTrack(withTransition) {
      const viewportWidth = viewport.getBoundingClientRect().width;
      const cardWidth = allCards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;

      const cardOffset = currentIndex * (cardWidth + gap);
      const centeringOffset = (viewportWidth - cardWidth) / 2;

      if (!withTransition) {
        track.style.transition = "none";
      }
      track.style.transform = "translateX(" + (centeringOffset - cardOffset) + "px)";
      if (!withTransition) {
        void track.offsetHeight; // force reflow so transition:none actually applies before we restore it
        track.style.transition = "";
      }

      allCards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === currentIndex);
      });
    }

    // After a real (animated) transition finishes, if we've slid into
    // cloned territory, silently snap back to the matching real card
    // with no animation — invisible to the user, but resets the index
    // so the loop can continue indefinitely in either direction.
    track.addEventListener("transitionend", function () {
      if (currentIndex >= CLONE_COUNT + realCards.length) {
        currentIndex -= realCards.length;
        positionTrack(false);
      } else if (currentIndex < CLONE_COUNT) {
        currentIndex += realCards.length;
        positionTrack(false);
      }
    });

    function goNext() {
      currentIndex++;
      positionTrack(true);
    }

    function goPrev() {
      currentIndex--;
      positionTrack(true);
    }

    if (nextButton) nextButton.addEventListener("click", goNext);
    if (prevButton) prevButton.addEventListener("click", goPrev);

    // Swipe support, via Pointer Events (covers touch and mouse alike).
    // Pointer capture ensures pointerup still fires on this element even
    // if the drag moves outside the viewport's narrow bounds — without
    // it, a longer swipe can silently miss the release event entirely.
    let dragStartX = null;

    viewport.addEventListener("pointerdown", function (evt) {
      dragStartX = evt.clientX;
      viewport.setPointerCapture(evt.pointerId);
    });

    viewport.addEventListener("pointerup", function (evt) {
      if (dragStartX === null) return;
      const deltaX = evt.clientX - dragStartX;
      const SWIPE_THRESHOLD = 40;
      if (deltaX > SWIPE_THRESHOLD) {
        goPrev();
      } else if (deltaX < -SWIPE_THRESHOLD) {
        goNext();
      }
      dragStartX = null;
    });

    viewport.addEventListener("pointercancel", function () {
      dragStartX = null;
    });

    window.addEventListener("resize", function () { positionTrack(false); });
    window.addEventListener("load", function () { positionTrack(false); });
    positionTrack(false);

  });

});
