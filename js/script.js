let next = document.getElementById('next');
let prev = document.getElementById('prev');

let carousel = document.querySelector('.carousel');
let carouselList = document.querySelector('.carousel .carousel__list');
let thumbnailList = document.querySelector('.carousel .thumbnail__list');

const imageTransitionDuration = 500;
let imageTransition = null;
let thumbnailAnimations = [];
let hasNavigated = false;

// Одна фотография масштабируется равномерно; маска задаёт видимый прямоугольник.
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

  // Наибольший прямоугольник определяет разрешение временного слоя.
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
  // Сначала все измерения, затем запуск анимаций — без чтения раскладки в кадрах.
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

next.onclick = function() {
  carousel.classList.remove('current');
  showSlider('next');
}

prev.onclick = function() {
  carousel.classList.remove('current');
  showSlider('prev');
}

// для автопереключения  
let timeOutoNext = 7000;
let runAutoRun = setTimeout(() => {
  next.click();
}, timeOutoNext);
carousel.classList.add('current');

// для линии тайминга
let timeProgressNext = 6990;
let timeProgress = setTimeout(() => {
    carousel.classList.remove('current');
  }, timeProgressNext);

// таймаут доступности переключения
let timeRunning = 2000;
let runTimeOut;

function showSlider(type) {
  hasNavigated = true;
  stopImageTransition();
  stopThumbnailAnimations();

  let itemSlider = document.querySelectorAll('.carousel .carousel__list .carousel__item');
  let itemThumbnail = document.querySelectorAll('.carousel .thumbnail__list .thumbnail__item');
  const outgoingImage = itemSlider[0].querySelector('img');
  const previousRects = new Map(Array.from(itemThumbnail, item => [item, item.getBoundingClientRect()]));
  const movedThumbnail = type === 'next' ? itemThumbnail[0] : itemThumbnail[itemThumbnail.length - 1];
  carousel.classList.remove('next', 'prev');

  if (type === 'next') {
    // элементы в конец списков
    carouselList.appendChild(itemSlider[0]);
    thumbnailList.appendChild(itemThumbnail[0]);
    carousel.classList.add('next');
    carousel.classList.add('current');
  } else {
    let positionLastItem = itemSlider.length - 1;
    carouselList.prepend(itemSlider[positionLastItem]);
    thumbnailList.prepend(itemThumbnail[positionLastItem]);
    carousel.classList.add('prev');
    carousel.classList.add('current');
  }

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

  clearTimeout(runTimeOut);
  runTimeOut = setTimeout(() => {
    carousel.classList.remove('next');
    carousel.classList.remove('prev');
  }, timeRunning);

  clearTimeout(runAutoRun);
  runAutoRun = setTimeout(() => {
    next.click();
  }, timeOutoNext);

  clearTimeout(timeProgress);
  timeProgress = setTimeout(() => {
    carousel.classList.remove('current');
  }, timeProgressNext);
}

// Начальное раскрытие сохраняется отдельно от намеренной блокировки стрелок.
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
