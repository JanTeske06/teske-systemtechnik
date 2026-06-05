/* ------------------------------------------------------------------
 * showcase.js — populates the homepage <div class="project-showcase">
 * with a Swiper fade-carousel of projects flagged `featured: true`.
 * Depends on projects-data.js, i18n.json, projects.json and the Swiper
 * global from /static/js/vendors/swiper-bundle.min.js.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  // Showcase cards show up to 3 tech tags to keep the header row compact.
  const MAX_TECH_TAGS = 3;

  function renderSlide(project, lang) {
    const helpers = window.TeskeProjects;
    const loc = helpers.getLocalised(project, lang);
    const href = helpers.projectHref(project.slug, lang);
    const cover = helpers.escapeHtml(project.cover || '');
    const title = helpers.escapeHtml(loc.title || project.slug);
    const summary = helpers.escapeHtml(loc.summary || '');
    const tech = Array.isArray(project.tech)
      ? project.tech.slice(0, MAX_TECH_TAGS)
      : [];
    const techHtml = tech
      .map(function (t) {
        return (
          '<span class="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">' +
          helpers.escapeHtml(t) +
          '</span>'
        );
      })
      .join('');
    const badge = project.badge
      ? '<span class="rounded-full border px-2 py-0.5 text-[11px] font-medium" style="border-color:rgba(94,122,71,0.55);background-color:rgba(94,122,71,0.16);color:#c3d6ad">' +
        helpers.escapeHtml(project.badge) + '</span>'
      : '';

    return (
      '<div class="swiper-slide h-auto">' +
      '<a href="' +
      helpers.escapeHtml(href) +
      '" class="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition hover:border-orange-500/50">' +
      '<div class="aspect-[3/2] overflow-hidden">' +
      '<img src="' +
      cover +
      '" alt="' + title + '" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105">' +
      '</div>' +
      '<div class="flex flex-1 flex-col p-4 md:p-5">' +
      '<div class="mb-3 flex flex-wrap gap-1.5">' +
      badge +
      techHtml +
      '</div>' +
      '<h3 class="font-aspekta text-lg font-bold text-white md:text-2xl">' +
      title +
      '</h3>' +
      '<p class="mt-2 line-clamp-2 max-w-md text-sm text-stone-400 md:text-base">' +
      summary +
      '</p>' +
      '<span class="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-400 transition group-hover:text-amber-200">' +
      helpers.escapeHtml(helpers.label('viewCase', lang)) +
      '</span>' +
      '</div>' +
      '</a>' +
      '</div>'
    );
  }

  function initSwiper(lang, slideCount) {
    if (typeof Swiper === 'undefined') {
      console.warn('[teske] Swiper is not loaded; skipping carousel init.');
      return;
    }
    const helpers = window.TeskeProjects;
    // Loop mode needs >=2 slides, otherwise Swiper warns.
    const canLoop = slideCount > 1;
    const BASE_SPEED = 700;
    const CHAIN_SPEED = 320;
    const swiper = new Swiper('.project-showcase', {
      loop: canLoop,
      // Coverflow: the active project sits centred and full-size while its
      // neighbours peek in on either side — rotated back in 3D, scaled down
      // and faded (opacity handled in site.css). Pressing an arrow rotates
      // the next card to the front.
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      // 'auto' hands the slide width to CSS (clamp), so the preview cards
      // peek in responsively — one dominant card on phones, a roomy stage
      // with side previews on desktop.
      slidesPerView: 'auto',
      speed: BASE_SPEED,
      coverflowEffect: {
        rotate: 32,
        stretch: 0,
        depth: 140,
        modifier: 1,
        scale: 0.84,
        slideShadows: false,
      },
      // Auto-advance is handled by our own progress clock (see
      // initProgressClock) — Swiper 8 has no autoplayTimeLeft event to
      // sync a fill bar against, so the built-in autoplay stays off.
      pagination: {
        el: '.project-showcase .swiper-pagination',
        clickable: true,
      },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        prevSlideMessage: helpers.label('prev', lang),
        nextSlideMessage: helpers.label('next', lang),
      },
    });

    let queued = 0;
    let busy = false;
    function process() {
      if (busy || queued === 0 || !swiper || swiper.destroyed) return;
      busy = true;
      const step = queued > 0 ? 1 : -1;
      queued -= step;
      const speed = queued !== 0 ? CHAIN_SPEED : BASE_SPEED;
      if (step > 0) swiper.slideNext(speed);
      else swiper.slidePrev(speed);
      swiper.once('slideChangeTransitionEnd', function () {
        busy = false;
        process();
      });
    }
    function enqueue(dir) {
      return function (e) {
        if (!swiper || swiper.destroyed) return;
        e.preventDefault();
        queued += dir === 'next' ? 1 : -1;
        process();
      };
    }
    // Swiper's built-in nav ignores clicks during a transition. We replace
    // it with our own handler that queues rapid presses and chains them
    // smoothly — a single click feels smooth, three quick clicks rotate all
    // the way through to the third project without skipping or stalling.
    const prevBtn = document.querySelector('.project-showcase-prev');
    const nextBtn = document.querySelector('.project-showcase-next');
    if (prevBtn) prevBtn.addEventListener('click', enqueue('prev'));
    if (nextBtn) nextBtn.addEventListener('click', enqueue('next'));

    initProgressClock(swiper, slideCount, BASE_SPEED);
  }

  function hideSection() {
    const section = document.getElementById('homepage-showcase');
    if (section) section.style.display = 'none';
  }

  // --------------------------------------------------------------------
  // Progress clock — fills the active pagination segment over AUTOPLAY_MS,
  // then advances to the next slide. Swiper 8 ships no autoplayTimeLeft
  // event, so a single rAF clock drives BOTH the fill and the auto-advance
  // from one source of truth — the bar and the slide change can't drift.
  // Pauses while the stage is hovered; resets on every slide change
  // (auto-advance, arrows, pagination taps and swipes alike).
  // --------------------------------------------------------------------
  const AUTOPLAY_MS = 5000;

  function initProgressClock(swiper, slideCount, advanceSpeed) {
    if (slideCount <= 1) return;
    const stage = document.querySelector('.project-showcase');
    const bar = stage && stage.querySelector('.swiper-pagination');
    if (!bar) return;

    let rafId = null;
    let startTs = 0;
    let carried = 0; // elapsed ms banked before the current pause
    let hovering = false;

    function setFill(frac) {
      // 0..1, written straight into the active segment's scaleX (site.css).
      // scaleX is compositor-only, so this per-frame write costs no layout.
      bar.style.setProperty('--seg-fill', frac.toFixed(4));
    }
    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
    function frame(now) {
      const elapsed = carried + (now - startTs);
      if (elapsed >= AUTOPLAY_MS) {
        stop();
        setFill(1);
        swiper.slideNext(advanceSpeed); // slideChange → reset() restarts us
        return;
      }
      setFill(elapsed / AUTOPLAY_MS);
      rafId = requestAnimationFrame(frame);
    }
    function run() {
      if (rafId || hovering || carried >= AUTOPLAY_MS) return;
      startTs = performance.now();
      rafId = requestAnimationFrame(frame);
    }
    function reset() {
      stop();
      carried = 0;
      setFill(0);
      run();
    }
    function pause() {
      if (!rafId) return;
      carried += performance.now() - startTs;
      stop();
    }

    swiper.on('slideChange', reset);
    stage.addEventListener('mouseenter', function () { hovering = true; pause(); });
    stage.addEventListener('mouseleave', function () { hovering = false; run(); });
    reset();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const wrapper = document.querySelector('.project-showcase .swiper-wrapper');
    if (!wrapper || !window.TeskeProjects) return;

    window.TeskeProjects.loadContext().then(function (ctx) {
      const lang = ctx.lang;
      const featured = ctx.projects
        .filter(function (p) { return p && p.featured; })
        .sort(function (a, b) {
          return (a.showcase_order || 9999) - (b.showcase_order || 9999);
        });

      if (featured.length === 0) {
        hideSection();
        return;
      }

      wrapper.innerHTML = featured
        .map(function (p) { return renderSlide(p, lang); })
        .join('');
      wrapper.parentElement.classList.add('project-dyn-loaded');

      initSwiper(lang, featured.length);
    });
  });
})();
