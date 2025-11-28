function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("carouselTrack");
  const viewport = document.getElementById("carouselViewport");
  const btnNext = document.getElementById("carouselNext");
  const btnPrev = document.getElementById("carouselPrev");
  const carouselWrap = document.getElementById("carouselWrap");

  if (!track || !viewport) return;

  const items = track.querySelectorAll(".carousel-item");
  if (items.length === 0) return;

  let currentIndex = 0;
  let itemWidth = 0;
  let gap = parseInt(getComputedStyle(track).gap) || 20;
  let maxIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;

  function getVisibleWidth() {
    const viewportStyles = getComputedStyle(viewport);
    const paddingLeft = parseFloat(viewportStyles.paddingLeft) || 0;
    const paddingRight = parseFloat(viewportStyles.paddingRight) || 0;
    return viewport.clientWidth - paddingLeft - paddingRight;
  }

  function recalc() {
    const item = items[0];
    if (!item) return;
    itemWidth = item.offsetWidth + gap;
    
    const visibleWidth = getVisibleWidth();
    
    const lastItem = items[items.length - 1];
    const lastItemRight = lastItem.offsetLeft + lastItem.offsetWidth;
    if (lastItemRight <= visibleWidth) {
      maxIndex = 0;
    } else {
      const maxShift = lastItemRight - visibleWidth;
      
      maxIndex = Math.ceil(maxShift / itemWidth);
    }
  }

  function update() {
    const visibleWidth = getVisibleWidth();
    
    const lastItem = items[items.length - 1];
    const lastItemRight = lastItem.offsetLeft + lastItem.offsetWidth;
    const maxShift = Math.max(0, lastItemRight - visibleWidth);
    
    let shift = currentIndex * itemWidth;
    
    if (shift > maxShift) {
      shift = maxShift;
      currentIndex = Math.ceil(maxShift / itemWidth);
    }
    
    track.style.transform = `translateX(-${shift}px)`;
    updateButtons();
  }

  function updateButtons() {
    if (btnPrev && btnNext) {
      btnPrev.style.opacity = currentIndex === 0 ? "0.5" : "1";
      btnPrev.style.pointerEvents = currentIndex === 0 ? "none" : "auto";
      btnNext.style.opacity = currentIndex >= maxIndex ? "0.5" : "1";
      btnNext.style.pointerEvents = currentIndex >= maxIndex ? "none" : "auto";
    }
  }

  function goToSlide(index) {
    if (index < 0 || index > maxIndex) return;
    currentIndex = index;
    update();
  }

  function next() {
    if (currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
  }

  function handleTouchMove(e) {
    if (!touchStartX) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX - currentX;
    const visibleWidth = getVisibleWidth();
    const lastItem = items[items.length - 1];
    const lastItemRight = lastItem.offsetLeft + lastItem.offsetWidth;
    const maxShift = Math.max(0, lastItemRight - visibleWidth);
    const shift = currentIndex * itemWidth + diff;
    track.style.transition = "none";
    track.style.transform = `translateX(-${Math.max(0, Math.min(shift, maxShift))}px)`;
  }

  function handleTouchEnd(e) {
    if (!touchStartX) return;
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
    touchStartX = 0;
    track.style.transition = "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)";
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        next();
      } else {
        prev();
      }
    } else {
      update();
    }
  }

  if (btnNext) {
    btnNext.addEventListener("click", (e) => {
      e.stopPropagation();
      next();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      prev();
    });
  }

  viewport.addEventListener("touchstart", handleTouchStart, { passive: true });
  viewport.addEventListener("touchmove", handleTouchMove, { passive: true });
  viewport.addEventListener("touchend", handleTouchEnd, { passive: true });

  window.addEventListener("resize", () => {
    recalc();
    update();
  });

  document.addEventListener("keydown", (e) => {
    if (carouselWrap.matches(":hover") || document.activeElement === btnNext || document.activeElement === btnPrev) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    }
  });

  recalc();
  update();
});

