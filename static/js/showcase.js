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

    return (
      '<div class="swiper-slide h-auto">' +
      '<a href="' +
      helpers.escapeHtml(href) +
      '" class="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition hover:border-orange-500/50">' +
      '<div class="aspect-[16/9] overflow-hidden">' +
      '<img src="' +
      cover +
      '" alt="" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105">' +
      '</div>' +
      '<div class="flex flex-1 flex-col p-5 md:p-6">' +
      '<div class="mb-3 flex flex-wrap gap-1.5">' +
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
    new Swiper('.project-showcase', {
      loop: canLoop,
      effect: 'slide',
      speed: 900,
      spaceBetween: 32,
      autoplay: canLoop
        ? {
            delay: 5000,
            pauseOnMouseEnter: true,
            disableOnInteraction: false,
          }
        : false,
      navigation: {
        prevEl: '.project-showcase-prev',
        nextEl: '.project-showcase-next',
      },
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
  }

  function hideSection() {
    const section = document.getElementById('homepage-showcase');
    if (section) section.style.display = 'none';
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
