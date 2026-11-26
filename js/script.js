let next = document.getElementById('next');
let prev = document.getElementById('prev');

let carousel = document.querySelector('.carousel');
let carouselList = document.querySelector('.carousel .carousel__list');
let thumbnailList = document.querySelector('.carousel .thumbnail__list');
const progressBar = carousel.querySelector('.time');

const slideDuration = 7000;
let progressAnimation = null;
let autoAdvanceTimer;
let slideCycle = 0;

const imageTransitionDuration = 500;
let imageTransition = null;
let thumbnailAnimations = [];
let hasNavigated = false;

function updateSlideAccessibility() {
  const activeSlide = carouselList.firstElementChild;

  Array.from(carouselList.children).forEach(slide => {
    const isActive = slide === activeSlide;
    slide.toggleAttribute('inert', !isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });
}

function getImageFrame(rect, containerRect, imageWidth, imageHeight, radius) {
  const scale = Math.max(rect.width / imageWidth, rect.height / imageHeight);
  const insetX = Math.max(0, (imageWidth - rect.width / scale) / 2);
  const insetY = Math.max(0, (imageHeight - rect.height / scale) / 2);
  const x = rect.left - containerRect.left - insetX * scale;
  const y = rect.top - containerRect.top - insetY * scale;

  return {
    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
    clipPath: `inset(${insetY}px ${insetX}px round ${radius / scale}px)`,
  };
}

function stopImageTransition() {
  if (!imageTransition) return;

  const transition = imageTransition;
  imageTransition = null;
  transition.animation.onfinish = null;
  transition.animation.oncancel = null;
  transition.animation.cancel();
  transition.image.classList.remove('is-transitioning');
  transition.overlay.remove();
}

function stopThumbnailAnimations() {
  thumbnailAnimations.forEach(animation => animation.cancel());
  thumbnailAnimations = [];
}

function animateImage(image, firstRect, lastRect, firstRadius, lastRadius) {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight ||
      typeof image.animate !== 'function' ||
      typeof CSS === 'undefined' || typeof CSS.supports !== 'function' ||
      firstRect.width <= 0 || firstRect.height <= 0 ||
      lastRect.width <= 0 || lastRect.height <= 0 ||
      !CSS.supports('clip-path', 'inset(0)')) return;

  const coverScale = Math.max(
    firstRect.width / image.naturalWidth,
    firstRect.height / image.naturalHeight,
    lastRect.width / image.naturalWidth,
    lastRect.height / image.naturalHeight
  );
  const imageWidth = image.naturalWidth * coverScale;
  const imageHeight = image.naturalHeight * coverScale;
  const containerRect = carousel.getBoundingClientRect();
  const frames = [
    getImageFrame(firstRect, containerRect, imageWidth, imageHeight, firstRadius),
    getImageFrame(lastRect, containerRect, imageWidth, imageHeight, lastRadius),
  ];
  const overlay = image.cloneNode(false);
  overlay.className = 'carousel__image-transition';
  overlay.removeAttribute('id');
  overlay.removeAttribute('srcset');
  overlay.removeAttribute('sizes');
  overlay.src = image.currentSrc || image.src;
  overlay.alt = '';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.width = `${imageWidth}px`;
  overlay.style.height = `${imageHeight}px`;

  carousel.appendChild(overlay);
  image.classList.add('is-transitioning');
  const animation = overlay.animate(frames, {
    duration: imageTransitionDuration,
    easing: 'linear',
    fill: 'both',
  });
  imageTransition = { image, overlay, animation };
  animation.onfinish = stopImageTransition;
  animation.oncancel = stopImageTransition;
}

function animateThumbnails(previousRects, movedThumbnail) {
  const thumbnails = Array.from(thumbnailList.children);
  const currentRects = thumbnails.map(item => item.getBoundingClientRect());

  thumbnails.forEach((item, index) => {
    if (typeof item.animate !== 'function') return;

    const previous = previousRects.get(item);
    const current = currentRects[index];
    const frames = item === movedThumbnail
      ? [{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)' }]
      : [
          { transform: `translateX(${previous.left - current.left}px)` },
          { transform: 'translateX(0)' },
        ];

    thumbnailAnimations.push(item.animate(frames, {
      duration: imageTransitionDuration,
      easing: 'linear',
    }));
  });
}

function restartSlideCycle() {
  const cycle = ++slideCycle;
  clearTimeout(autoAdvanceTimer);

  if (progressAnimation) {
    progressAnimation.onfinish = null;
    progressAnimation.cancel();
    progressAnimation = null;
  }

  const advanceSlide = () => {
    if (cycle === slideCycle) showSlider('next');
  };

  if (progressBar && typeof progressBar.animate === 'function') {
    progressAnimation = progressBar.animate([
      { transform: 'scaleX(0)' },
      { transform: 'scaleX(1)' },
    ], {
      duration: slideDuration,
      easing: 'linear',
      fill: 'forwards',
    });
    // Завершение полосы запускает следующий слайд
    progressAnimation.onfinish = advanceSlide;
  } else {
    autoAdvanceTimer = setTimeout(advanceSlide, slideDuration);
  }
}

next.onclick = function() {
  showSlider('next');
}

prev.onclick = function() {
  showSlider('prev');
}

// таймаут доступности переключения
let timeRunning = 2000;
let runTimeOut;

function scheduleArrowUnlock() {
  clearTimeout(runTimeOut);
  runTimeOut = setTimeout(() => {
    carousel.classList.remove('next', 'prev');
  }, timeRunning);
}

function showSlider(type) {
  hasNavigated = true;
  stopImageTransition();
  stopThumbnailAnimations();

  let itemSlider = document.querySelectorAll('.carousel .carousel__list .carousel__item');
  let itemThumbnail = document.querySelectorAll('.carousel .thumbnail__list .thumbnail__item');

  if (itemSlider[0].contains(document.activeElement)) {
    const navigationButton = type === 'prev' ? prev : next;
    navigationButton.focus({ preventScroll: true });
  }

  const outgoingImage = itemSlider[0].querySelector('img');
  const previousRects = new Map(Array.from(itemThumbnail, item => [item, item.getBoundingClientRect()]));
  const movedThumbnail = type === 'next' ? itemThumbnail[0] : itemThumbnail[itemThumbnail.length - 1];
  carousel.classList.remove('next', 'prev');

  if (type === 'next') {
    carouselList.appendChild(itemSlider[0]);
    thumbnailList.appendChild(itemThumbnail[0]);
    carousel.classList.add('next');
  } else {
    let positionLastItem = itemSlider.length - 1;
    carouselList.prepend(itemSlider[positionLastItem]);
    thumbnailList.prepend(itemThumbnail[positionLastItem]);
    carousel.classList.add('prev');
  }

  updateSlideAccessibility();

  const incomingImage = carouselList.firstElementChild.querySelector('img');
  const thumbnail = thumbnailList.firstElementChild;
  const thumbnailRect = thumbnail.getBoundingClientRect();
  const fullRect = incomingImage.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(thumbnail.querySelector('img')).borderTopLeftRadius) || 0;

  if (type === 'next') {
    animateImage(incomingImage, thumbnailRect, fullRect, radius, 0);
  } else {
    animateImage(outgoingImage, fullRect, thumbnailRect, 0, radius);
  }
  animateThumbnails(previousRects, movedThumbnail);

  scheduleArrowUnlock();
  restartSlideCycle();
}

updateSlideAccessibility();
const initialImage = carouselList.firstElementChild.querySelector('img');
function animateInitialImage() {
  if (hasNavigated) return;

  const thumbnail = thumbnailList.firstElementChild;
  const radius = parseFloat(getComputedStyle(thumbnail.querySelector('img')).borderTopLeftRadius) || 0;
  animateImage(initialImage, thumbnail.getBoundingClientRect(), initialImage.getBoundingClientRect(), radius, 0);
}

if (initialImage.complete) {
  animateInitialImage();
} else {
  initialImage.addEventListener('load', animateInitialImage, { once: true });
}

window.addEventListener('resize', () => {
  stopImageTransition();
  stopThumbnailAnimations();
});

restartSlideCycle();
scheduleArrowUnlock();
