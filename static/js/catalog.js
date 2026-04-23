/* ------------------------------------------------------------------
 * catalog.js — populates the project catalog grid
 * (<div id="project-catalog">) with one card per project, rendered
 * from /static/data/projects.json. Depends on projects-data.js.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  const LABELS = {
    de: { readCase: 'Case Study lesen →' },
    en: { readCase: 'Read case study →' },
  };

  // Catalog cards show up to 3 tech tags (the showcase shows all).
  const MAX_TECH_TAGS = 3;

  function renderCard(project, lang) {
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
      '<a href="' +
      helpers.escapeHtml(href) +
      '" class="group block overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 transition hover:border-orange-500/50">' +
      '<div class="aspect-[16/9] overflow-hidden">' +
      '<img src="' +
      cover +
      '" alt="" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105">' +
      '</div>' +
      '<div class="p-5">' +
      '<div class="mb-3 flex flex-wrap gap-1.5">' +
      techHtml +
      '</div>' +
      '<h2 class="font-aspekta text-lg font-bold text-white">' +
      title +
      '</h2>' +
      '<p class="mt-2 line-clamp-2 text-sm text-stone-400">' +
      summary +
      '</p>' +
      '<span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-400 transition group-hover:text-amber-200">' +
      helpers.escapeHtml(LABELS[lang].readCase) +
      '</span>' +
      '</div>' +
      '</a>'
    );
  }

  function renderEmpty(lang) {
    const msg =
      lang === 'de'
        ? 'Aktuell sind keine Projekte verfügbar. Bitte schauen Sie später noch einmal vorbei.'
        : 'There are currently no projects to show. Please check back soon.';
    return (
      '<div class="col-span-full rounded-3xl border border-stone-800 bg-stone-900/60 p-10 text-center text-stone-400">' +
      window.TeskeProjects.escapeHtml(msg) +
      '</div>'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('project-catalog');
    if (!grid || !window.TeskeProjects) return;

    const lang = window.TeskeProjects.detectLang();

    window.TeskeProjects.loadProjects().then(function (projects) {
      const sorted = projects.slice().sort(function (a, b) {
        return (a.catalog_order || 9999) - (b.catalog_order || 9999);
      });

      if (sorted.length === 0) {
        grid.innerHTML = renderEmpty(lang);
        return;
      }

      grid.innerHTML = sorted
        .map(function (p) {
          return renderCard(p, lang);
        })
        .join('');
      grid.classList.add('project-dyn-loaded');
    });
  });
})();
