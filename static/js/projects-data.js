/* ------------------------------------------------------------------
 * projects-data.js — Shared loader + renderer helpers.
 * Loaded by showcase.js and catalog.js. Vanilla JS, no dependencies.
 *
 * Behaviour:
 *   - fetches /static/data/projects.json exactly once (cached on window)
 *   - detects current UI language from <html lang="..">
 *   - builds path segments (/de/projekte/ vs /en/projects/) for slugs
 *   - provides a minimal escapeHtml to keep injected strings safe
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  const ESCAPE = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ESCAPE[ch];
    });
  }

  function detectLang() {
    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    if (htmlLang.startsWith('de')) return 'de';
    if (htmlLang.startsWith('en')) return 'en';
    // Fallback: guess from URL path (/de/… vs /en/…).
    if (location.pathname.indexOf('/en/') === 0) return 'en';
    return 'de';
  }

  function basePath(lang) {
    return lang === 'de' ? '/de/projekte' : '/en/projects';
  }

  function projectHref(slug, lang) {
    return basePath(lang) + '/' + encodeURIComponent(slug) + '/';
  }

  function getLocalised(project, lang) {
    return (project && project[lang]) || (project && project.de) || {};
  }

  // Singleton fetch, memoised on window to avoid duplicate requests
  // when both showcase.js and catalog.js live on the same page.
  function loadProjects() {
    if (window.__teskeProjectsPromise) return window.__teskeProjectsPromise;
    window.__teskeProjectsPromise = fetch('/static/data/projects.json', {
      cache: 'no-cache',
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        const projects = Array.isArray(data && data.projects)
          ? data.projects
          : [];
        return projects;
      })
      .catch(function (err) {
        console.error('[teske] Failed to load projects.json:', err);
        return [];
      });
    return window.__teskeProjectsPromise;
  }

  window.TeskeProjects = {
    escapeHtml: escapeHtml,
    detectLang: detectLang,
    projectHref: projectHref,
    getLocalised: getLocalised,
    loadProjects: loadProjects,
  };
})();
