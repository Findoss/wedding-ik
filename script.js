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

  // 2. Анимация появления элементов при скролле (Intersection Observer)
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px", // Срабатывает чуть раньше
  };

  const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        anime({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 1000,
          easing: "easeOutCubic",
        });
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Находим элементы для анимации во всех секциях, кроме приветственной
  const revealElements = document.querySelectorAll(
    ".section:not(.envelope-section) .content-box, " +
      ".section:not(.envelope-section) .section-title, " +
      ".gallery-item, " +
      ".timeline-item, " +
      ".rsvp-form .form-group",
  );

  revealElements.forEach((el) => {
    el.style.opacity = "0"; // Исходное состояние
    scrollObserver.observe(el);
  });

  // Анимация покачивания кольца (непрерывная)
  anime({
    targets: ".wedding-ring",
    rotate: ["-15deg", "15deg"],
    direction: "alternate",
    loop: true,
    easing: "linear",
    duration: 2000,
  });

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

  // Обработка формы RSVP
  const rsvpForm = document.getElementById("rsvp-form");
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = rsvpForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;

      submitBtn.innerText = "Отправка...";
      submitBtn.disabled = true;

      const formData = new FormData(rsvpForm);
      const payload = Object.fromEntries(formData.entries());
      payload.alcohol = formData.getAll("alcohol");

      console.log(payload);

      try {
        // prod https://gistoyidosk.beget.app/webhook/d7617c0e-1fff-4668-978f-474d7ca67882
        // test https://gistoyidosk.beget.app/webhook-test/d7617c0e-1fff-4668-978f-474d7ca67882
        const response = await fetch(
          "https://gistoyidosk.beget.app/webhook/d7617c0e-1fff-4668-978f-474d7ca67882",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        if (response.ok) {
          showNotification(
            "Спасибо за ваш ответ! Мы получили вашу анкету.",
            "success",
          );
          rsvpForm.reset();
        } else {
          throw new Error(`Сервер ответил кодом ${response.status}`);
        }
      } catch (error) {
        console.error("Ошибка при отправке:", error);
        showNotification(
          `Не удалось отправить: ${error.message}. Попробуйте еще раз.`,
          "error",
        );
      } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});

// Функция для показа красивых уведомлений
function showNotification(message, type = "success") {
  // Удаляем старые уведомления, если они есть
  const oldToast = document.querySelector(".toast-notification");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notification toast-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  // Плавное появление
  setTimeout(() => toast.classList.add("show"), 100);

  // Исчезновение через 5 секунд
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

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
