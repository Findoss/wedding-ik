// script.js
// Принудительно сбрасываем скролл на самый верх при перезагрузке страницы
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
  // 1. Анимация открытия конверта по клику на печать
  const openEnvelopeBtn = document.getElementById("open-envelope");
  let isEnvelopeOpen = false;

  if (openEnvelopeBtn) {
    openEnvelopeBtn.addEventListener("click", () => {
      if (isEnvelopeOpen) return; // Защита от повторного клика
      isEnvelopeOpen = true;

      const envelopeTimeline = anime.timeline({
        easing: "easeOutExpo",
      });

      // Исчезновение печати
      envelopeTimeline
        .add({
          targets: ".mark-container",
          opacity: 0,
          duration: 500,
          easing: "easeInBack",
          begin: function () {
            // Разрешаем скролл и показываем фон при начале анимации
            document.body.classList.remove("no-scroll");

            // Пытаемся запустить музыку сразу при клике (без появления самого плеера пока что)
            const audio = document.getElementById("wedding-audio");
            if (audio) {
              audio
                .play()
                .catch((e) =>
                  console.log("Автозапуск отменен (нет файла или блок):", e),
                );
            }
          },
        })
        // Открытие верхней части конверта (вверх)
        .add(
          {
            targets: ".polygon-top",
            translateY: [0, "-100%"],
            rotate: 0,
            duration: 1200,
            easing: "easeInOutQuart",
          },
          "+=100",
        )
        // Открытие нижней части конверта (вниз)
        .add(
          {
            targets: ".polygon-bottom",
            translateY: [0, "100%"],
            duration: 1200,
            easing: "easeInOutQuart",
          },
          "-=1000",
        )
        // Исчезновение подложки, скрывающей карточку
        .add(
          {
            targets: ".envelope-overlay",
            opacity: 0,
            duration: 500,
            easing: "easeInOutQuart",
          },
          "-=1000",
        )
        // Появление содержимого
        .add(
          {
            targets: ".hero-content",
            scale: [1, 1.1],
            duration: 1000,
          },
          "-=1000",
        )
        // Появление листьев (из углов)
        .add(
          {
            targets: ".leaf-lt",
            opacity: [0, 1],
            scale: [1.5, 1],
            translateX: ["-20%", "0%"],
            translateY: ["-20%", "0%"],
            duration: 1500,
            easing: "easeOutQuart",
          },
          "-=600",
        )
        .add(
          {
            targets: ".leaf-rb",
            opacity: [0, 1],
            scale: [1.5, 1],
            translateX: ["20%", "0%"],
            translateY: ["20%", "0%"],
            duration: 1500,
            easing: "easeOutQuart",
            complete: function () {
              // Запускаем легкое покачивание после появления
              anime({
                targets: ".leaf-lt",
                rotate: ["-1deg", "2deg"],
                duration: 3000,
                direction: "alternate",
                loop: true,
                easing: "easeInOutSine",
              });
              anime({
                targets: ".leaf-rb",
                rotate: ["2deg", "-1deg"],
                duration: 3500,
                direction: "alternate",
                loop: true,
                easing: "easeInOutSine",
              });
            },
          },
          "-=1400",
        )
        // Появление плеера
        .add(
          {
            targets: ".custom-audio-player",
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            easing: "easeOutBack",
            begin: function () {
              // Делаем плеер кликабельным
              const player = document.querySelector(".custom-audio-player");
              if (player) {
                player.style.pointerEvents = "auto";
              }
            },
          },
          "-=1000",
        );
    });
  }

  // 2. Анимация появления элементов при скролле (используем Intersection Observer)
  const observerOptions = {
    threshold: 0.2, // Срабатывает, когда видно 20% элемента
  };

  // Анимация покачивания кольца (непрерывная)
  anime({
    targets: ".wedding-ring",
    rotate: ["-15deg", "15deg"],
    direction: "alternate",
    loop: true,
    easing: "linear",
    duration: 2000,
  });

  const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Анимация для блока "О нас"
        if (entry.target.classList.contains("content-box")) {
          anime({
            targets: entry.target,
            opacity: [0, 1],
            translateY: [100, 0],
            duration: 1500,
            easing: "easeOutQuart",
          });
          // Перестаем следить после того, как анимация проиграла
          observer.unobserve(entry.target);
        }
      }
    });
  }, observerOptions);

  // Скрываем элементы перед скроллом (чтобы они не мигали)
  document.querySelector(".content-box").style.opacity = "0";

  // Начинаем следить за элементами
  scrollObserver.observe(document.querySelector(".content-box"));

  // 3. Параллакс эффект для фона секций
  window.addEventListener("scroll", () => {
    const scrollPos = window.pageYOffset;
    const sections = document.querySelectorAll(".section");
    sections.forEach((section) => {
      // Рассчитываем смещение относительно положения секции на странице
      const sectionTop = section.offsetTop;
      const speed = 0.15; // Коэффициент скорости параллакса
      const offset = (scrollPos - sectionTop) * speed;
      section.style.backgroundPositionY = `${offset}px`;
    });
  });

  // Инициализация анимации сердечка в таймлайне
  initTimelineHeart();

  // Инициализация обратного отсчета
  initCountdown();
});

function initTimelineHeart() {
  const heart = document.getElementById("timeline-heart");
  const timeline = document.getElementById("timeline");
  const section = document.getElementById("timing-section");

  if (!heart || !timeline || !section) return;

  window.addEventListener("scroll", () => {
    const sectionRect = section.getBoundingClientRect();
    const timelineRect = timeline.getBoundingClientRect();

    // Высота области просмотра
    const viewportHeight = window.innerHeight;

    // Если секция в поле зрения
    if (sectionRect.top < viewportHeight && sectionRect.bottom > 0) {
      // Расчет прогресса: 0 в начале таймлайна, 1 в конце
      // Сердечко стремится к центру экрана
      const scrollStart = timelineRect.top;
      const scrollEnd = timelineRect.bottom;
      const totalDist = scrollEnd - scrollStart;

      // Рассчитываем, где относительно верха таймлайна находится центр экрана
      const heartPos = viewportHeight / 2 - scrollStart;

      // Ограничиваем движение границами таймлайна
      let progress = heartPos / totalDist;
      progress = Math.max(0, Math.min(1, progress));

      const topOffset = progress * 100;
      heart.style.top = `${topOffset}%`;
    }
  });
}

function initCountdown() {
  // Дата: 05.08.2026 16:30 UTC+3
  // Формат ISO: YYYY-MM-DDTHH:mm:ss+03:00
  const targetDate = new Date("2026-08-05T16:30:00+03:00").getTime();

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minutesEl = document.getElementById("cd-minutes");
  const secondsEl = document.getElementById("cd-seconds");

  if (!daysEl) return;

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      daysEl.innerText = "00";
      hoursEl.innerText = "00";
      minutesEl.innerText = "00";
      secondsEl.innerText = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.innerText = days.toString().padStart(2, "0");
    hoursEl.innerText = hours.toString().padStart(2, "0");
    minutesEl.innerText = minutes.toString().padStart(2, "0");
    secondsEl.innerText = seconds.toString().padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}
