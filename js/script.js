let next = document.getElementById('next');
let prev = document.getElementById('prev');

let carousel = document.querySelector('.carousel');
let carouselList = document.querySelector('.carousel .carousel__list');
let thumbnailList = document.querySelector('.carousel .thumbnail__list');

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
  let itemSlider = document.querySelectorAll('.carousel .carousel__list .carousel__item');
  let itemThumbnail = document.querySelectorAll('.carousel .thumbnail__list .thumbnail__item');

  if (type === 'next') {
    // перемещаем элементы в конец списков
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

  clearTimeout(timeRunning); //очищаем идентификатор для предотвращения дублирования и наложения задач
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


