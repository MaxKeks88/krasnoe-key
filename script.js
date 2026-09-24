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

  /* Счётчик посещений: неделя / месяц / за всё время.
     Основной режим — онлайн (ваш backend на Netlify: бесплатно, без рекламы).
     Запасной режим — локальная статистика этого браузера (localStorage),
     включается автоматически, если онлайн недоступен. */
  var counterWrap = document.getElementById("visitCounter");
  if (counterWrap) {

    var STORE_KEY = "workshop_visits_v1";       /* история визитов (localStorage) */
    var SESSION_KEY = "workshop_visit_counted"; /* один визит на сессию */

    var loadVisits = function () {
      try {
        var data = JSON.parse(localStorage.getItem(STORE_KEY));
        return Array.isArray(data) ? data : [];
      } catch (e) { return []; }
    };

    var saveVisits = function (arr) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) {}
    };

    var now = Date.now();
    var visits = loadVisits();

    /* Засчитываем визит один раз за сессию: обновление страницы не дублирует счётчик */
    var counted = false;
    try { counted = !!sessionStorage.getItem(SESSION_KEY); } catch (e) {}
    if (!counted) {
      visits.push(now);
      if (visits.length > 90000) visits = visits.slice(-45000); /* защита от разрастания */
      saveVisits(visits);
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
    }

    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0"); };
    var setNum = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt(val);
    };

    /* Локальные цифры (запасной режим) */
    var DAY = 24 * 60 * 60 * 1000;
    var localWeek = 0, localMonth = 0;
    for (var i = 0; i < visits.length; i++) {
      if (now - visits[i] <= 7 * DAY) localWeek++;
      if (now - visits[i] <= 30 * DAY) localMonth++;
    }
    var showLocal = function () {
      setNum("vcWeek", localWeek);
      setNum("vcMonth", localMonth);
      setNum("vcTotal", visits.length);
    };

    /* ===== НАСТРОЙКИ ОНЛАЙН-СЧЁТЧИКА =====
       Чтобы считать реальных посетителей со всех устройств (бесплатно,
       без рекламы), разверните backend из папки netlify/ на Netlify
       (инструкция в конце этого файла) и впишите адрес функции ниже,
       например: "https://ваш-сайт.netlify.app/api/counter"
       Пока поле пустое — счётчик работает в локальном режиме. */
    var COUNT_API = {
      endpoint: "https://preeminent-biscotti-c7ad00.netlify.app/api/counter"
    };

    var onlineReady = !!(COUNT_API.endpoint && window.fetch);
    if (!onlineReady) {
      /* нет настроек — локальный режим */
      showLocal();
    } else {
      var q = counted ? "" : "?hit=1";
      /* сразу показываем локальные цифры, затем онлайн-значения */
      showLocal();
      fetch(COUNT_API.endpoint + q, { cache: "no-store" })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var w = parseInt(data && data.week, 10);
          var m = parseInt(data && data.month, 10);
          var t = parseInt(data && data.total, 10);
          if (isFinite(w)) setNum("vcWeek", w);
          if (isFinite(m)) setNum("vcMonth", m);
          if (isFinite(t)) setNum("vcTotal", t);
        })
        .catch(function () {
          /* сбой сети или сервиса — остаются локальные значения */
        });
    }
  }

  /* =========================================================
     ИНСТРУКЦИЯ: как включить учёт всех посетителей
     ---------------------------------------------------------
     1. Файлы backend уже готовы в этом проекте:
        - netlify/functions/counter.mjs  — сам счётчик
        - netlify.toml                   — настройка Netlify
     2. Зайдите на https://app.netlify.com → войдите через GitHub
        (кнопка "Sign up with GitHub").
     3. Нажмите "Add new site" → "Import an existing project" →
        выберите ваш репозиторий с сайтом → Deploy (ничего менять не нужно).
     4. Через 1–2 минуты Netlify выдаст адрес вида:
        https://ваш-сайт.netlify.app
     5. Скопируйте этот адрес + "/api/counter" в поле endpoint выше:
        endpoint: "https://ваш-сайт.netlify.app/api/counter"
     6. Загрузите обновлённые файлы на GitHub — и счётчик станет
        общим для всех посетителей. Виджет на GitHub Pages продолжит
        работать, просто получая данные от Netlify.
     ========================================================= */
})();
