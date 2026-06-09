AOS.init({
  disable: true, // Scroll-Reveal bewusst aus: ruhigerer, wertigerer Eindruck; Elemente sofort sichtbar
  once: true,
  duration: 700,
  offset: 60,
  easing: 'ease-out-cubic',
  anchorPlacement: 'top-bottom',
});

/* Count-Animation: zaehlt [data-count-to] beim Reinscrollen hoch oder (mit data-count-from) runter.
   Startet erst, wenn das Element wirklich im Blick ist (negativer rootMargin). */
(function () {
  var els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var locale = document.documentElement.lang || 'de-DE';
  var fmt = function (n) { return Math.round(n).toLocaleString(locale); };
  function run(el) {
    var from = parseFloat(el.getAttribute('data-count-from')) || 0;
    var target = parseFloat(el.getAttribute('data-count-to')) || 0;
    if (reduce) { el.textContent = fmt(target); return; }
    var dur = 800, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(run);
  }
})();

const clientsEl = document.querySelectorAll('.clients-carousel');
if (clientsEl.length > 0) {
  const clients = new Swiper('.clients-carousel', {
    slidesPerView: 'auto',
    spaceBetween: 64,
    centeredSlides: true,
    loop: true,
    speed: 5000,
    noSwiping: true,
    noSwipingClass: 'swiper-slide',
    autoplay: {
      delay: 0,
      disableOnInteraction: true,
    },
  });
}

const carouselEl = document.querySelectorAll('.stellar-carousel');
if (carouselEl.length > 0) {
  const carousel = new Swiper('.stellar-carousel', {
    breakpoints: {
      320: {
        slidesPerView: 1
      },
      640: {
        slidesPerView: 2
      },
      1024: {
        slidesPerView: 3
      }
    },
    grabCursor: true,
    loop: false,
    centeredSlides: false,
    initialSlide: 0,
    spaceBetween: 24,
    navigation: {
      nextEl: '.carousel-next',
      prevEl: '.carousel-prev',
    },
  });
}

// Particle animation
class ParticleAnimation {
  constructor(el, { quantity = 30, staticity = 50, ease = 50 } = {}) {
    this.canvas = el;
    if (!this.canvas) return;
    this.canvasContainer = this.canvas.parentElement;
    this.context = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.settings = {
      quantity: quantity,
      staticity: staticity,
      ease: ease,
    };
    this.circles = [];
    this.mouse = {
      x: 0,
      y: 0,
    };
    this.canvasSize = {
      w: 0,
      h: 0,
    };
    this.onMouseMove = this.onMouseMove.bind(this);
    this.initCanvas = this.initCanvas.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
    this.drawCircle = this.drawCircle.bind(this);
    this.drawParticles = this.drawParticles.bind(this);
    this.remapValue = this.remapValue.bind(this);
    this.animate = this.animate.bind(this);
    this.init();
  }

  init() {
    this.initCanvas();
    this.animate();
    window.addEventListener('resize', this.initCanvas);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  initCanvas() {
    this.resizeCanvas();
    this.drawParticles();
  }

  onMouseMove(event) {
    const { clientX, clientY } = event;
    const rect = this.canvas.getBoundingClientRect();
    const { w, h } = this.canvasSize;
    const x = clientX - rect.left - (w / 2);
    const y = clientY - rect.top - (h / 2);
    const inside = x < (w / 2) && x > -(w / 2) && y < (h / 2) && y > -(h / 2);
    if(inside) {
      this.mouse.x = x;
      this.mouse.y = y;
    }
  }

  resizeCanvas() {
    this.circles.length = 0;
    this.canvasSize.w = this.canvasContainer.offsetWidth;
    this.canvasSize.h = this.canvasContainer.offsetHeight;
    this.canvas.width = this.canvasSize.w * this.dpr;
    this.canvas.height = this.canvasSize.h * this.dpr;
    this.canvas.style.width = this.canvasSize.w + 'px';
    this.canvas.style.height = this.canvasSize.h + 'px';
    this.context.scale(this.dpr, this.dpr);
  }

  circleParams() {
    const x = Math.floor(Math.random() * this.canvasSize.w);
    const y = Math.floor(Math.random() * this.canvasSize.h);
    const translateX = 0;
    const translateY = 0;
    const size = Math.floor(Math.random() * 2) + 1;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.2;
    const dy = (Math.random() - 0.5) * 0.2;
    const magnetism = 0.1 + Math.random() * 4;
    return { x, y, translateX, translateY, size, alpha, targetAlpha, dx, dy, magnetism };
  }

  drawCircle(circle, update = false) {
    const { x, y, translateX, translateY, size, alpha } = circle;
    this.context.translate(translateX, translateY);
    this.context.beginPath();
    this.context.arc(x, y, size, 0, 2 * Math.PI);
    this.context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.context.fill();
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (!update) {
      this.circles.push(circle);
    }
  }

  clearContext() {
    this.context.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);
  }  

  drawParticles() {
    this.clearContext();
    const particleCount = this.settings.quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = this.circleParams();
      this.drawCircle(circle);
    }
  }

  // This function remaps a value from one range to another range
  remapValue(value, start1, end1, start2, end2) {
    const remapped = (value - start1) * (end2 - start2) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  }

  animate() {
    this.clearContext();
    this.circles.forEach((circle, i) => {
      // Handle the alpha value
      const edge = [
        circle.x + circle.translateX - circle.size, // distance from left edge
        this.canvasSize.w - circle.x - circle.translateX - circle.size, // distance from right edge
        circle.y + circle.translateY - circle.size, // distance from top edge
        this.canvasSize.h - circle.y - circle.translateY - circle.size, // distance from bottom edge
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = this.remapValue(closestEdge, 0, 20, 0, 1).toFixed(2);
      if(remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if(circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx;
      circle.y += circle.dy;
      circle.translateX += ((this.mouse.x / (this.settings.staticity / circle.magnetism)) - circle.translateX) / this.settings.ease;
      circle.translateY += ((this.mouse.y / (this.settings.staticity / circle.magnetism)) - circle.translateY) / this.settings.ease;
      // circle gets out of the canvas
      if (circle.x < -circle.size || circle.x > this.canvasSize.w + circle.size || circle.y < -circle.size || circle.y > this.canvasSize.h + circle.size) {
        // remove the circle from the array
        this.circles.splice(i, 1);
        // create a new circle
        const circle = this.circleParams();
        this.drawCircle(circle);
        // update the circle position
      } else {
        this.drawCircle({ ...circle, x: circle.x, y: circle.y, translateX: circle.translateX, translateY: circle.translateY, alpha: circle.alpha }, true);
      }
    });
    window.requestAnimationFrame(this.animate);
  }
}

// Init ParticleAnimation
const canvasElements = document.querySelectorAll('[data-particle-animation]');
canvasElements.forEach(canvas => {
  const options = {
    quantity: canvas.dataset.particleQuantity,
    staticity: canvas.dataset.particleStaticity,
    ease: canvas.dataset.particleEase,
  };
  new ParticleAnimation(canvas, options);
});


// Box highlighter
class Highlighter {
  constructor(containerElement) {
    this.container = containerElement;
    this.boxes = Array.from(this.container.children);
    this.mouse = {
      x: 0,
      y: 0,
    };
    this.containerSize = {
      w: 0,
      h: 0,
    };
    this.initContainer = this.initContainer.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.init();
  }

  initContainer() {
    this.containerSize.w = this.container.offsetWidth;
    this.containerSize.h = this.container.offsetHeight;        
  }

  onMouseMove(event) {
    const { clientX, clientY } = event;
    const rect = this.container.getBoundingClientRect();
    const { w, h } = this.containerSize;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const inside = x < w && x > 0 && y < h && y > 0;
    if (inside) {
      this.mouse.x = x;
      this.mouse.y = y;
      this.boxes.forEach((box) => {
        const boxX = -(box.getBoundingClientRect().left - rect.left) + this.mouse.x;
        const boxY = -(box.getBoundingClientRect().top - rect.top) + this.mouse.y;
        box.style.setProperty('--mouse-x', `${boxX}px`);
        box.style.setProperty('--mouse-y', `${boxY}px`);
      });
    }
  }

  init() {
    this.initContainer();
    window.addEventListener('resize', this.initContainer);
    window.addEventListener('mousemove', this.onMouseMove);
  }  
}

// Init Highlighter
const highlighters = document.querySelectorAll('[data-highlighter]');
highlighters.forEach((highlighter) => {
  new Highlighter(highlighter);
});


// Note: page transitions are handled by the native View Transitions API
// via CSS in static/css/site.css. Logo, brand, and the active language
// button get view-transition-name so the browser animates them
// smoothly between pages. No JS needed.


// --- Table-of-contents scrollspy (Datenschutz / Privacy / Impressum) -
// Highlights the TOC entry that corresponds to the section currently
// at the top of the viewport. Works for both the desktop aside list
// and the mobile collapsible list, and updates the mobile summary
// label to the current section.
(function initTocScrollSpy() {
  const tocLinks = document.querySelectorAll('.toc-link[href^="#"]');
  if (tocLinks.length === 0) return;

  const linksByTarget = new Map();
  tocLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    if (!linksByTarget.has(id)) linksByTarget.set(id, []);
    linksByTarget.get(id).push(link);
  });

  const targets = [];
  linksByTarget.forEach((_links, id) => {
    const el = document.getElementById(id);
    if (el) targets.push(el);
  });
  if (targets.length === 0) return;
  targets.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

  const currentLabel = document.querySelector('.toc-mobile-current');
  let active = null;
  const setActive = (id) => {
    if (id === active) return;
    active = id;
    document.querySelectorAll('.toc-link.is-active').forEach((l) => l.classList.remove('is-active'));
    if (!id) return;
    const links = linksByTarget.get(id) || [];
    links.forEach((l) => l.classList.add('is-active'));
    if (currentLabel && links[0]) {
      const num = links[0].querySelector('.toc-num');
      const text = links[0].querySelector('span:last-child');
      if (num && text) {
        currentLabel.textContent = '§ ' + parseInt(num.textContent, 10) + ' · ' + text.textContent;
      }
    }
  };

  const recompute = () => {
    const offsetTop = 140;
    let candidate = targets[0];
    for (const t of targets) {
      if (t.getBoundingClientRect().top - offsetTop <= 0) {
        candidate = t;
      } else {
        break;
      }
    }
    setActive(candidate.id);
  };

  let raf = 0;
  window.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; recompute(); });
  }, { passive: true });
  window.addEventListener('resize', recompute, { passive: true });

  // Immediate feedback on click — beats the smooth-scroll latency.
  tocLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href').slice(1);
      if (id) setActive(id);
    });
  });

  recompute();
})();


// --- Sticky header backdrop -
// The header is pinned with `position: fixed` in site.css so it travels with
// the page. Here we just toggle `.scrolled` once the page is scrolled past the
// top, letting site.css fade in the blurred dark backdrop + bottom border.
// Runs on every content page (all load main.js); guarded for pages without it.
(function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 16);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


// --- Keep scroll position across a language switch -
// Clicking a language link (DE/EN/RU, desktop or mobile) remembers the relative
// scroll position (percent of scrollable height); on the target page we scroll
// roughly back there instead of jumping to the top. The language versions share
// the same section structure, so the percentage lands close. A language link is
// detected by its 2-letter text + an href into a /de|en|ru/ path; the active
// one (href="#") is skipped. Delegated + capture, so it also covers the
// Alpine-rendered mobile menu. Works on desktop and mobile.
(function initLangScrollMemory() {
  const KEY = 'tsk:langScroll';

  const maxScroll = () =>
    Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    ) - window.innerHeight;

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!/^\/(de|en|ru)\//.test(href)) return;
    const txt = (a.textContent || '').trim();
    if (txt !== 'DE' && txt !== 'EN' && txt !== 'RU') return;
    const max = maxScroll();
    const pct = max > 0 ? (window.scrollY || window.pageYOffset || 0) / max : 0;
    try { sessionStorage.setItem(KEY, pct.toFixed(4)); } catch (err) {}
  }, true);

  let raw = null;
  try { raw = sessionStorage.getItem(KEY); } catch (err) {}
  if (raw === null) return;
  try { sessionStorage.removeItem(KEY); } catch (err) {}
  const pct = parseFloat(raw);
  if (!(pct > 0)) return;

  const restore = () => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';   // instant, bypass scroll-smooth
    window.scrollTo(0, Math.round(pct * maxScroll()));
    html.style.scrollBehavior = prev;
  };
  let userScrolled = false;
  const tryRestore = () => { if (!userScrolled) restore(); };
  if (document.readyState === 'complete') restore();
  else window.addEventListener('load', restore);
  // Stop re-applying the moment the user takes over scrolling.
  ['wheel', 'touchmove'].forEach((ev) =>
    window.addEventListener(ev, () => { userScrolled = true; }, { passive: true, once: true })
  );
  // Re-apply after late reflow (fonts, lazy images, carousel change page height).
  setTimeout(tryRestore, 160);
  setTimeout(tryRestore, 440);
})();