/* Sakib Hasan Jeebon — portfolio. Vanilla JS, no dependencies. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- section entrances ----------
     Content is visible without JS (the .js class gates the hidden state).
     Each .rise element fades up once as it enters. */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll(".rise, .lanes").forEach(function (el) { revealIO.observe(el); });

  /* ---------- counters inside the track-record sentence ---------- */
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

  /* ---------- header: field colour over green sections, paper elsewhere ---------- */
  var head = document.getElementById("head");
  var fields = [].slice.call(document.querySelectorAll("main > .field"));
  var navLinks = [].slice.call(document.querySelectorAll(".nav-links a"));
  var targets = navLinks.map(function (a) {
    var el = document.querySelector(a.getAttribute("href"));
    return el ? { link: a, el: el } : null;
  }).filter(Boolean);

  var queued = false;
  function onScroll() {
    queued = false;
    var h = head ? head.offsetHeight : 0;
    if (head) {
      var overField = fields.some(function (f) {
        var r = f.getBoundingClientRect();
        return r.top <= h + 1 && r.bottom > h + 1;
      });
      head.classList.toggle("on-paper", !overField);
    }
    var line = h + window.innerHeight * 0.3, active = null;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      active = targets[targets.length - 1];
    } else {
      targets.forEach(function (t) { if (t.el.getBoundingClientRect().top <= line) active = t; });
    }
    navLinks.forEach(function (a) { a.classList.toggle("active", !!active && a === active.link); });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  onScroll();

  /* ---------- career lanes: highlight a role, jump to its entry ---------- */
  var lanes = document.getElementById("lanes");
  if (lanes) {
    var segs = [].slice.call(lanes.querySelectorAll(".seg"));
    function hot(seg) {
      lanes.classList.add("dim");
      segs.forEach(function (s) { s.classList.toggle("hot", s.getAttribute("href") === seg.getAttribute("href")); });
    }
    function cool() { lanes.classList.remove("dim"); segs.forEach(function (s) { s.classList.remove("hot"); }); }
    segs.forEach(function (s) {
      s.addEventListener("mouseenter", function () { hot(s); });
      s.addEventListener("focus", function () { hot(s); });
      s.addEventListener("mouseleave", cool);
      s.addEventListener("blur", cool);
      s.addEventListener("click", function () {
        var target = document.querySelector(s.getAttribute("href"));
        if (!target || !target.classList.contains("role")) return;
        target.classList.remove("flash");
        void target.offsetWidth;
        target.classList.add("flash");
        setTimeout(function () { target.classList.remove("flash"); }, 1600);
      });
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
