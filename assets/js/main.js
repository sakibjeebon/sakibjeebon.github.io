/* Sakib Hasan Jeebon — portfolio. Vanilla JS, no dependencies.
   Scroll work reads cached numbers only: element positions are measured once
   (and again on resize, font load and body size change), never during scroll. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var head = document.getElementById("head");
  var panel = document.querySelector(".hero-panel");
  var photo = document.querySelector(".hero-photo img");
  var chapters = [].slice.call(document.querySelectorAll(".hero-panel, .chapter, .post-nav a, .foot"));
  var navLinks = [].slice.call(document.querySelectorAll(".nav-links a"));
  var targets = navLinks.map(function (a) {
    var href = a.getAttribute("href");
    if (href.charAt(0) !== "#") return null;          /* links to other pages are not scroll-spied */
    var el = document.querySelector(href);
    return el ? { link: a, el: el } : null;
  }).filter(Boolean);
  document.body.classList.add(panel ? "has-hero" : "no-hero");

  /* ---------- cached geometry ---------- */
  var pending = [].slice.call(document.querySelectorAll(".rise, .lanes")).map(function (el) { return { el: el, top: 0 }; });
  var chap = [], tgt = [];

  function measure() {
    var y = window.scrollY;
    pending.forEach(function (p) { p.top = p.el.getBoundingClientRect().top + y; });
    chap = chapters.map(function (el) {
      var r = el.getBoundingClientRect(), cs = getComputedStyle(el), isPanel = el === panel;
      return { top: r.top + y, bottom: r.bottom + y, bg: isPanel ? "transparent" : cs.backgroundColor, ink: isPanel ? "#fff" : cs.color };
    });
    tgt = targets.map(function (t) { var r = t.el.getBoundingClientRect(); return { top: r.top + y, bottom: r.bottom + y }; });
    onScroll();
  }

  var measureTimer = 0;
  function measureSoon() { clearTimeout(measureTimer); measureTimer = setTimeout(measure, 120); }

  /* ---------- the one scroll handler ---------- */
  var lastKey = "", queued = false;
  function onScroll() {
    queued = false;
    var y = window.scrollY, vh = window.innerHeight, i;

    /* entrances: anything at or above the lower part of the viewport is revealed,
       so a jump to an anchor never leaves skipped sections hidden */
    if (pending.length) {
      var edge = y + vh * 0.92;
      pending = pending.filter(function (p) {
        if (p.top < edge) { p.el.classList.add("in"); return false; }
        return true;
      });
    }

    /* colour by chapter: the fixed header takes the field and ink under it */
    if (head && chap.length) {
      var line = y + 32, cur = null;
      for (i = 0; i < chap.length; i++) { if (chap[i].top <= line && chap[i].bottom > line) { cur = chap[i]; break; } }
      var bg = cur ? cur.bg : "transparent", ink = cur ? cur.ink : "#fff", key = bg + ink;
      if (key !== lastKey) {
        lastKey = key;
        head.style.setProperty("--h-bg", bg);
        head.style.setProperty("--h-ink", ink);
      }
    }

    /* scroll-spy */
    var active = -1, spy = y + vh * 0.3;
    if (tgt.length) {
      if (vh + y >= document.documentElement.scrollHeight - 4) active = tgt.length - 1;
      else for (i = 0; i < tgt.length; i++) { if (tgt[i].top <= spy && tgt[i].bottom > spy) active = i; }
    }
    for (i = 0; i < targets.length; i++) targets[i].link.classList.toggle("active", i === active);

    /* hero portrait drifts as you leave */
    if (photo && !reduced && y < vh) photo.style.transform = "translateX(-50%) translateY(" + (y * 0.09).toFixed(1) + "px)";
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", measureSoon);
  window.addEventListener("load", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureSoon);
  if ("ResizeObserver" in window) new ResizeObserver(measureSoon).observe(document.body);
  measure();

  /* ---------- counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.target), t0 = null, dur = 1100;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }
  if (!reduced && "IntersectionObserver" in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        countUp(e.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".count").forEach(function (el) { countIO.observe(el); });
  }

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
