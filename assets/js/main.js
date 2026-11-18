/* Sakib Hasan Jeebon — portfolio. Vanilla JS, no dependencies. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- entrances ----------
     Content is visible without JS (the .js class gates the hidden state).
     Anything at or above the bottom of the viewport is revealed on scroll, so a
     jump to an anchor never leaves skipped sections hidden. */
  var pending = [].slice.call(document.querySelectorAll(".rise, .lanes"));
  function reveal() {
    if (!pending.length) return;
    var edge = window.innerHeight * 0.92;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < edge) { el.classList.add("in"); return false; }
      return true;
    });
  }

  /* ---------- counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.target), t0 = null, dur = 1300;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }
  if (!reduced) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        countUp(e.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".count").forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- colour by chapter ----------
     The fixed header takes the field and ink of whichever chapter is under it,
     switching (300ms, CSS) as each hard edge passes. Over the hero panel it is
     transparent, with the nav links held back until the panel has gone. */
  var head = document.getElementById("head");
  var chapters = [].slice.call(document.querySelectorAll(".hero-panel, .chapter, .post-nav a, .foot"));
  var panel = document.querySelector(".hero-panel");
  var photo = document.querySelector(".hero-photo img");
  var navLinks = [].slice.call(document.querySelectorAll(".nav-links a"));
  var targets = navLinks.map(function (a) {
    var href = a.getAttribute("href");
    if (href.charAt(0) !== "#") return null;      /* links to other pages are not scroll-spied */
    var el = document.querySelector(href);
    return el ? { link: a, el: el } : null;
  }).filter(Boolean);
  if (!panel) document.body.classList.add("no-hero"); else document.body.classList.add("has-hero");
  var last = "";

  var queued = false;
  function onScroll() {
    queued = false;
    reveal();
    var y = window.scrollY, line = 32, cur = null;
    for (var i = 0; i < chapters.length; i++) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) { cur = chapters[i]; break; }
    }
    if (head) {
      var key, bg, ink;
      if (!cur || cur === panel) { bg = "transparent"; ink = "#fff"; key = "hero"; }
      else { var cs = getComputedStyle(cur); bg = cs.backgroundColor; ink = cs.color; key = bg + ink; }
      if (key !== last) {
        last = key;
        head.style.setProperty("--h-bg", bg);
        head.style.setProperty("--h-ink", ink);
      }
      head.classList.toggle("links", !!panel && panel.getBoundingClientRect().bottom < 80);
    }
    /* scroll-spy */
    var spy = window.innerHeight * 0.3, active = null;
    if (targets.length && window.innerHeight + y >= document.documentElement.scrollHeight - 4) active = targets[targets.length - 1];
    else targets.forEach(function (t) { var r = t.el.getBoundingClientRect(); if (r.top <= spy && r.bottom > spy) active = t; });
    navLinks.forEach(function (a) { a.classList.toggle("active", !!active && a === active.link); });
    /* hero portrait drifts as you leave */
    if (photo && !reduced && y < window.innerHeight) photo.style.transform = "translateX(-50%) translateY(" + (y * 0.09).toFixed(1) + "px)";
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  onScroll();

  /* ---------- career lanes: highlight a role, flash its entry ---------- */
  var lanes = document.getElementById("lanes");
  if (lanes) {
    var segs = [].slice.call(lanes.querySelectorAll(".seg"));
    var hot = function (seg) {
      lanes.classList.add("dim");
      segs.forEach(function (s) { s.classList.toggle("hot", s.getAttribute("href") === seg.getAttribute("href")); });
    };
    var cool = function () { lanes.classList.remove("dim"); segs.forEach(function (s) { s.classList.remove("hot"); }); };
    segs.forEach(function (s) {
      s.addEventListener("mouseenter", function () { hot(s); });
      s.addEventListener("focus", function () { hot(s); });
      s.addEventListener("mouseleave", cool);
      s.addEventListener("blur", cool);
      s.addEventListener("click", function () {
        var t = document.querySelector(s.getAttribute("href"));
        if (!t || !t.classList.contains("role")) return;
        t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash");
        setTimeout(function () { t.classList.remove("flash"); }, 1600);
      });
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
