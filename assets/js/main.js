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
  document.querySelectorAll(".chart-card, .spark-card").forEach(function (el) { io.observe(el); });

  /* ---------- scroll-spy nav ---------- */
  var navLinks = document.querySelectorAll(".nav-links a");
  var linkFor = new WeakMap();
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = linkFor.get(entry.target);
      if (link && entry.isIntersecting) {
        navLinks.forEach(function (a) { a.classList.remove("active"); });
        link.classList.add("active");
      }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  navLinks.forEach(function (a) {
    var el = document.getElementById(a.getAttribute("href").slice(1));
    if (!el) return;
    // a nav target may be the section itself or an alias span inside it
    if (el.classList.contains("anchor-alias")) el = el.parentElement;
    linkFor.set(el, a);
    spy.observe(el);
  });

  /* ---------- terminal typer ---------- */
  var typer = document.getElementById("typer");
  if (typer && !reduced) {
    var lines = [
      "scaling SBTi targets across 25 factories",
      "auditing energy systems in 80+ plants",
      "shipping ESG reporting for GRI / CSRD / CSDDD",
      "training 200+ sustainability professionals"
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
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, CELL = 72;
    var packets = [];
    var running = false, rafId = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGrid();
    }

    function drawGrid() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(52, 211, 153, 0.13)";
      for (var x = CELL; x < W; x += CELL)
        for (var y = CELL; y < H; y += CELL) {
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, 6.2832); ctx.fill();
        }
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

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
