/* Sakib Hasan Jeebon — portfolio. Vanilla JS, no dependencies. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- metric counters ----------
     Markup already contains the final value (works with JS disabled);
     JS re-animates from 0 when the element scrolls into view. */
  function animateCount(el) {
    var target = parseFloat(el.dataset.target);
    var suffix = el.dataset.suffix || "";
    var dur = 1200, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var seen = new WeakSet();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || seen.has(entry.target)) return;
      seen.add(entry.target);
      io.unobserve(entry.target);
      if (entry.target.classList.contains("count")) {
        if (!reduced) animateCount(entry.target);
      } else {
        entry.target.classList.add("in-view");
      }
    });
  }, { threshold: 0.35 });

  document.querySelectorAll(".count").forEach(function (el) { io.observe(el); });
  var cards = [].slice.call(document.querySelectorAll(".tl-card"));
  cards.forEach(function (el) { io.observe(el); });
  // position-based fallback: reveal anything at or above the lower part of the viewport,
  // so a jump to an anchor never leaves the graph collapsed
  function revealCards() {
    cards.forEach(function (el) {
      if (!el.classList.contains("in-view") && el.getBoundingClientRect().top < window.innerHeight * 0.9) el.classList.add("in-view");
    });
  }

  /* ---------- scroll-spy nav ----------
     Position-based rather than IntersectionObserver: the active section is
     simply the last one whose top has crossed a line just below the sticky nav.
     This is symmetric (scrolling up behaves like scrolling down) and immune to
     short trailing sections that can never reach a mid-viewport trigger band. */
  var nav = document.querySelector(".nav");
  var navLinks = [].slice.call(document.querySelectorAll(".nav-links a"));
  var targets = navLinks.map(function (a) {
    var href = a.getAttribute("href");
    if (href.charAt(0) !== "#") return null;      // links to other pages are not scroll-spied
    var el = document.getElementById(href.slice(1));
    // a nav target may be the section itself or an alias span inside it
    if (el && el.classList.contains("anchor-alias")) el = el.parentElement;
    return el ? { link: a, el: el } : null;
  }).filter(Boolean);

  var spyQueued = false;
  function updateSpy() {
    spyQueued = false;
    revealCards();
    var line = window.scrollY + (nav ? nav.offsetHeight : 0) + 48;
    var active = null;
    if (!targets.length) {
      active = null;
    } else if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      active = targets[targets.length - 1];       // bottom of page: last section wins
    } else {
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].el.getBoundingClientRect().top + window.scrollY <= line) active = targets[i];
      }
    }
    navLinks.forEach(function (a) { a.classList.toggle("active", !!active && a === active.link); });
  }
  function queueSpy() {
    if (!spyQueued) { spyQueued = true; requestAnimationFrame(updateSpy); }
  }
  window.addEventListener("scroll", queueSpy, { passive: true });
  window.addEventListener("resize", queueSpy);
  updateSpy();

  /* ---------- terminal typer ---------- */
  var typer = document.getElementById("typer");
  if (typer && !reduced) {
    var lines = [
      "scaling SBTi targets across 25 factories",
      "auditing energy systems in 80+ plants",
      "shipping ESG reporting for GRI / CSRD / CSDDD",
      "onboarding 90+ businesses to RTIS",
      "training 400+ sustainability professionals"
    ];
    var li = 0, ci = lines[0].length, deleting = true;
    (function tick() {
      var line = lines[li];
      if (deleting) {
        ci--;
        if (ci <= 0) { deleting = false; li = (li + 1) % lines.length; ci = 0; }
      } else {
        ci++;
        if (ci >= lines[li].length) {
          deleting = true;
          typer.textContent = lines[li];
          setTimeout(tick, 2600);
          return;
        }
      }
      typer.textContent = lines[deleting ? li : li].slice(0, ci);
      setTimeout(tick, deleting ? 28 : 55);
    })();
  }

  /* ---------- hero canvas: data grid ----------
     Faint dot grid; green "data packets" travel along grid lines,
     leaving short trails. Paused off-screen and on hidden tabs. */
  var canvas = document.getElementById("datagrid");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var gridLayer = document.createElement("canvas");
    var W = 0, H = 0, CELL = 72;
    var packets = [];
    var running = false, rafId = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderGrid();
      drawGrid();
    }

    /* the dot grid never changes: paint it once into a layer and blit it each frame */
    function renderGrid() {
      gridLayer.width = canvas.width; gridLayer.height = canvas.height;
      var g = gridLayer.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = "rgba(52, 211, 153, 0.13)";
      g.beginPath();
      for (var x = CELL; x < W; x += CELL)
        for (var y = CELL; y < H; y += CELL) { g.moveTo(x + 1.2, y); g.arc(x, y, 1.2, 0, 6.2832); }
      g.fill();
    }

    function drawGrid() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(gridLayer, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      var horizontal = Math.random() < 0.5;
      var lanesX = Math.max(1, Math.floor(W / CELL));
      var lanesY = Math.max(1, Math.floor(H / CELL));
      packets.push({
        h: horizontal,
        lane: CELL * (1 + Math.floor(Math.random() * (horizontal ? lanesY - 1 : lanesX - 1))),
        pos: horizontal ? (Math.random() < 0.5 ? -20 : W + 20) : -20,
        dir: 1,
        speed: 40 + Math.random() * 70,
        len: 26 + Math.random() * 40
      });
      var p = packets[packets.length - 1];
      if (p.h && p.pos > 0) { p.dir = -1; }
    }

    var last = 0;
    function frame(ts) {
      if (!running) return;
      var dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      drawGrid();
      if (packets.length < 7 && Math.random() < 0.04) spawn();
      packets = packets.filter(function (p) {
        p.pos += p.speed * p.dir * dt;
        var grad, x0, y0, x1, y1;
        if (p.h) { x0 = p.pos - p.len * p.dir; y0 = p.lane; x1 = p.pos; y1 = p.lane; }
        else { x0 = p.lane; y0 = p.pos - p.len; x1 = p.lane; y1 = p.pos; }
        grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, "rgba(52, 211, 153, 0)");
        grad.addColorStop(1, "rgba(52, 211, 153, 0.55)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.fillStyle = "rgba(120, 240, 190, 0.9)";
        ctx.fillRect((p.h ? p.pos : p.lane) - 1.5, (p.h ? p.lane : p.pos) - 1.5, 3, 3);
        return p.h ? (p.pos > -80 && p.pos < W + 80) : (p.pos < H + 80);
      });
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced) return;
      running = true; last = performance.now();
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }).observe(canvas);
      document.addEventListener("visibilitychange", function () {
        document.hidden ? stop() : start();
      });
    }
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
        if (!t || t.id.indexOf("role-") !== 0) return;
        t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash");
        setTimeout(function () { t.classList.remove("flash"); }, 1600);
      });
    });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
