document.addEventListener("DOMContentLoaded", function () {

  const carousel = document.querySelector(".media-carousel");

  if (!carousel) {
    return;
  }

  const items = carousel.querySelectorAll(".media-item");
  const previousButton = document.querySelector(".media-carousel-prev");
  const nextButton = document.querySelector(".media-carousel-next");
  const currentDisplay = document.querySelector(".media-current");

  if (items.length <= 1) {
    return;
  }

  let currentIndex = 0;
  let autoPlayTimer;

  function showItem(index) {

    items.forEach(function (item) {
      item.classList.remove("active");
    });

    items[index].classList.add("active");

    if (currentDisplay) {
      currentDisplay.textContent = index + 1;
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

  showItem(currentIndex);
  resetAutoPlay();

});
