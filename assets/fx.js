/* FireWatch — cinematic front-end effects
   Vanilla JS, no dependencies. Everything degrades gracefully:
   without JS the page is fully visible and static. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var docEl = document.documentElement;
  docEl.classList.add("fx-ready");

  /* ---------- Nav: shrink + scrollspy ---------- */
  function initNav() {
    var nav = document.querySelector("nav");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href*="#"]'));
    var map = links
      .map(function (a) {
        var id = (a.getAttribute("href") || "").split("#")[1];
        var sec = id ? document.getElementById(id) : null;
        return sec ? { a: a, sec: sec } : null;
      })
      .filter(Boolean);

    function onScroll() {
      nav.classList.toggle("scrolled", window.scrollY > 24);
      var pos = window.scrollY + 120;
      var current = null;
      for (var i = 0; i < map.length; i++) {
        if (map[i].sec.offsetTop <= pos) current = map[i];
      }
      links.forEach(function (a) { a.classList.remove("active"); });
      if (current) current.a.classList.add("active");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveal (staggered) ---------- */
  function initReveal() {
    var targets = document.querySelectorAll(
      "section h2, section > .container > p.lead, .card, .pipe-step, .stat, " +
      ".roadmap-item, .model-card, .about-photo, .about-text p, .timeline-item, " +
      ".careers-empty, header.page-hero h1, header.page-hero p"
    );
    if (!targets.length) return;

    // Tag everything, and give siblings a small stagger for a "cascade".
    targets.forEach(function (el) {
      el.setAttribute("data-reveal", "");
      var key = el.parentNode;
      var idx = 0;
      if (key) {
        if (!key.__revealIdx) key.__revealIdx = 0;
        idx = key.__revealIdx++;
      }
      el.style.setProperty("--reveal-delay", Math.min(idx * 80, 360) / 1000 + "s");
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Stat count-up ---------- */
  function initCounters() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var nums = document.querySelectorAll(".stat-num");
    if (!nums.length) return;

    function animate(el) {
      var raw = el.textContent.trim();
      // Only count a single leading number (skip ranges like "15–30 MIN").
      var m = raw.match(/^([^\d\-]*)(\d+(?:\.\d+)?)(.*)$/);
      if (!m || /[–-]\s*\d/.test(raw)) return; // range → leave as-is
      var prefix = m[1], target = parseFloat(m[2]), suffix = m[3];
      var decimals = (m[2].split(".")[1] || "").length;
      var start = null, dur = 1400;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = (target * eased).toFixed(decimals);
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Pointer glow on cards ---------- */
  function initCardGlow() {
    if (reduceMotion) return;
    var cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- Ember particle canvas ---------- */
  function initEmbers() {
    if (reduceMotion) return;
    var canvas = document.getElementById("ember-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var host = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var embers = [];
    var running = true;

    var COLORS = ["#ff4433", "#ff7a18", "#ffb020", "#d8352a"];

    function resize() {
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Density scales with width, capped for performance.
      var target = Math.min(90, Math.round(w / 14));
      while (embers.length < target) embers.push(spawn(true));
      if (embers.length > target) embers.length = target;
    }

    function spawn(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 10,
        r: Math.random() * 2 + 0.6,
        vy: -(Math.random() * 0.6 + 0.25),
        drift: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        wob: Math.random() * 0.02 + 0.005,
        life: Math.random() * 0.5 + 0.5,
        color: COLORS[(Math.random() * COLORS.length) | 0]
      };
    }

    function reset(p) {
      p.x = Math.random() * w;
      p.y = h + 8;
      p.r = Math.random() * 2 + 0.6;
      p.vy = -(Math.random() * 0.6 + 0.25);
      p.drift = (Math.random() - 0.5) * 0.4;
      p.life = Math.random() * 0.5 + 0.5;
      p.color = COLORS[(Math.random() * COLORS.length) | 0];
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < embers.length; i++) {
        var p = embers[i];
        p.phase += p.wob;
        p.x += p.drift + Math.sin(p.phase) * 0.3;
        p.y += p.vy;
        // Fade with height — brightest near the bottom.
        var alpha = Math.max(0, Math.min(1, (p.y / h))) * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.9;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        if (p.y < -10 || alpha <= 0.01) reset(p);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }

  function init() {
    initNav();
    initReveal();
    initCounters();
    initCardGlow();
    initEmbers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
