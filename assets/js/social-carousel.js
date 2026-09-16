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
    // already sitting right there to slide into view. Marked with an
    // extra class so desktop CSS can hide them — this cloning exists
    // purely for the mobile loop illusion and has no purpose at desktop,
    // where all real cards are already shown at once in a static row.
    const leadingClones = realCards.slice(-CLONE_COUNT).map(function (c) {
      const clone = c.cloneNode(true);
      clone.classList.add("social-card-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      return clone;
    });
    const trailingClones = realCards.slice(0, CLONE_COUNT).map(function (c) {
      const clone = c.cloneNode(true);
      clone.classList.add("social-card-clone");
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

    // Swipe support via Pointer Events. Relies on the viewport having
    // touch-action: pan-y in CSS — without it, the browser's own native
    // touch scrolling can intercept the gesture before these handlers
    // ever see a clean sequence, which is why this didn't work last time.
    let dragStartX = null;
    let wasSwipe = false;
    const SWIPE_THRESHOLD = 40;

    viewport.addEventListener("pointerdown", function (evt) {
      dragStartX = evt.clientX;
      viewport.setPointerCapture(evt.pointerId);
    });

    viewport.addEventListener("pointerup", function (evt) {
      if (dragStartX === null) return;
      const deltaX = evt.clientX - dragStartX;
      if (deltaX > SWIPE_THRESHOLD) {
        wasSwipe = true;
        goPrev();
      } else if (deltaX < -SWIPE_THRESHOLD) {
        wasSwipe = true;
        goNext();
      }
      dragStartX = null;
    });

    viewport.addEventListener("pointercancel", function () {
      dragStartX = null;
    });

    // Clicking anywhere in the peeking area should act like the chevrons —
    // the chevron buttons alone are a narrow target. Excludes the active
    // (centred) card so its real link still behaves normally. Also skips
    // entirely right after a genuine swipe — a pointerdown+pointerup pair
    // is exactly what the browser turns into a native click afterward,
    // which would otherwise double-advance the carousel on every swipe.
    viewport.addEventListener("click", function (evt) {
      if (wasSwipe) {
        wasSwipe = false;
        return;
      }
      if (evt.target.closest(".social-card.is-active")) return;

      const rect = viewport.getBoundingClientRect();
      const clickX = evt.clientX - rect.left;
      if (clickX < rect.width / 2) {
        goPrev();
      } else {
        goNext();
      }
    });

    window.addEventListener("resize", function () { positionTrack(false); });
    window.addEventListener("load", function () { positionTrack(false); });
    positionTrack(false);

  });

});
