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
})();