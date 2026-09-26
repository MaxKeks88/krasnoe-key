/* ============================================================
   Мастерская ключей, обуви и сумок — интерактив
   ============================================================ */
(function () {
  "use strict";

  /* Текущий год в подвале */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Шапка: тень при скролле */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Мобильное меню */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Плавное появление блоков при скролле */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============================================================
     РЕЖИМ РАБОТЫ: ежедневно 11:00–20:00, среда — выходной
     Живой статус «открыто / закрыто» + время следующего открытия
     ============================================================ */
  var OPEN_HOUR = 11;
  var CLOSE_HOUR = 20;
  var DAY_OFF = 3; /* среда */

  var DAY_NAMES = [
    "в понедельник", "во вторник", "в среду",
    "в четверг", "в пятницу", "в субботу", "в воскресенье"
  ];

  var statusBadges = document.querySelectorAll("[data-open-status]");

  function nextOpenLabel(now) {
    var today = now.getDay();
    var hours = now.getHours();

    /* Сегодня рабочий, но ещё не открылись */
    if (today !== DAY_OFF && hours < OPEN_HOUR) {
      return "Сегодня открываемся в " + OPEN_HOUR + ":00";
    }

    /* Среда — выходной */
    if (today === DAY_OFF) {
      return "Сегодня среда — выходной";
    }

    /* Ищем следующий рабочий день */
    var next = today;
    var step = 0;
    for (var i = 1; i <= 7; i++) {
      next = (today + i) % 7;
      if (next !== DAY_OFF) { step = i; break; }
    }

    var name = DAY_NAMES[next];
    return (
      "Открываемся " +
      (step === 1 ? "завтра, " + name : name) +
      " в " + OPEN_HOUR + ":00"
    );
  }

  function updateStatus() {
    if (!statusBadges.length) return;

    var now = new Date();
    var today = now.getDay();
    var isOpen =
      today !== DAY_OFF &&
      now.getHours() >= OPEN_HOUR &&
      now.getHours() < CLOSE_HOUR;

    var text;
    if (isOpen) {
      var left = CLOSE_HOUR - now.getHours();
      text = "Сейчас открыто · до 20:00" + (left <= 1 ? " · заканчиваемся скоро" : "");
    } else {
      text = nextOpenLabel(now);
    }

    statusBadges.forEach(function (badge) {
      badge.classList.toggle("is-open", isOpen);
      badge.classList.toggle("is-closed", !isOpen);
      var label = badge.querySelector("[data-open-text]");
      if (label) label.textContent = text;
    });
  }

  updateStatus();
  setInterval(updateStatus, 60000);

  /* Видео-карточки: клик = развернуть в модалке, со звуком и перемоткой */
  var modal = document.getElementById("videoModal");
  var modalVideo = modal ? modal.querySelector("video") : null;

  function openVideo(src) {
    if (!modal || !modalVideo) return;
    modalVideo.src = src;
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    /* клик — это пользовательский жест, звук разрешён */
    var p = modalVideo.play();
    if (p && p.catch) p.catch(function () {});
  }

  function closeVideo() {
    if (!modal || !modalVideo) return;
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    modalVideo.load();
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
  }

  var cards = document.querySelectorAll(".work-card");
  cards.forEach(function (card) {
    var media = card.querySelector(".work-media");
    if (!media) return;
    var open = function () { openVideo(media.getAttribute("data-src")); };
    var playBtn = card.querySelector(".work-play");
    if (playBtn) playBtn.addEventListener("click", open);
    media.addEventListener("click", open);
  });

  if (modal) {
    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeVideo);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeVideo();
    });
  }
})();