/* ------------------------------------------------------------------
 * projects-data.js — Shared loader + renderer helpers.
 * Loaded by showcase.js and catalog.js. Vanilla JS, no dependencies.
 *
 * Behaviour:
 *   - fetches /static/data/i18n.json and /static/data/projects.json
 *     exactly once (both cached on window)
 *   - detects current UI language from <html lang="..">
 *   - builds path segments per language (e.g. /de/projekte/, /en/projects/,
 *     /ru/proekty/) from i18n.json → paths.projectsBase
 *   - exposes localised UI strings (viewCase, prev/next, etc.)
 *   - provides a minimal escapeHtml to keep injected strings safe
 *
 * To add a new language:
 *   1. register it in /static/data/i18n.json (languages, paths, labels)
 *   2. add an i18n.<code> block to each project in projects.json
 *   3. create the localised HTML pages under /<code>/
 *   No changes required here.
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

  // Fallback used before i18n.json resolves. Mirrors the bundled default.
  const FALLBACK_I18N = {
    default: 'de',
    languages: [
      { code: 'de' },
      { code: 'en' },
      { code: 'ru' },
    ],
    paths: {
      projectsBase: {
        de: '/de/projekte',
        en: '/en/projects',
        ru: '/ru/proekty',
      },
    },
    labels: { de: {}, en: {}, ru: {} },
  };

  function knownCodes(config) {
    return (config.languages || []).map(function (l) { return l.code; });
  }

  function detectLang(config) {
    const cfg = config || FALLBACK_I18N;
    const codes = knownCodes(cfg);
    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    for (let i = 0; i < codes.length; i++) {
      if (htmlLang.startsWith(codes[i])) return codes[i];
    }
    // Fallback: guess from URL path (/de/, /en/, /ru/, …).
    const first = (location.pathname.split('/')[1] || '').toLowerCase();
    if (codes.indexOf(first) !== -1) return first;
    return cfg.default || codes[0] || 'de';
  }

  function basePath(lang, config) {
    const cfg = config || FALLBACK_I18N;
    const base = cfg.paths && cfg.paths.projectsBase && cfg.paths.projectsBase[lang];
    return base || FALLBACK_I18N.paths.projectsBase[lang] || FALLBACK_I18N.paths.projectsBase.de;
  }

  function projectHref(slug, lang, config) {
    return basePath(lang, config) + '/' + encodeURIComponent(slug) + '/';
  }

  function getLocalised(project, lang, config) {
    if (!project) return {};
    // New schema: project.i18n.<code>. Fallback to legacy flat project.<code>.
    const i18n = project.i18n || {};
    const fallback = (config && config.default) || 'de';
    return i18n[lang] || project[lang] || i18n[fallback] || project[fallback] || {};
  }

  function label(key, lang, config) {
    const cfg = config || FALLBACK_I18N;
    const bag = (cfg.labels && cfg.labels[lang]) || {};
    if (Object.prototype.hasOwnProperty.call(bag, key)) return bag[key];
    const fallbackBag = (cfg.labels && cfg.labels[cfg.default || 'de']) || {};
    return fallbackBag[key] || '';
  }

  // Memoised JSON fetch to avoid duplicate network requests when both
  // showcase.js and catalog.js live on the same page.
  function memoFetch(url, cacheKey) {
    if (window[cacheKey]) return window[cacheKey];
    window[cacheKey] = fetch(url, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        console.error('[teske] Failed to load ' + url + ':', err);
        return null;
      });
    return window[cacheKey];
  }

  function loadConfig() {
    return memoFetch('/static/data/i18n.json', '__teskeI18nPromise').then(
      function (data) { return data || FALLBACK_I18N; }
    );
  }

  function loadProjects() {
    return memoFetch('/static/data/projects.json', '__teskeProjectsPromise').then(
      function (data) {
        return Array.isArray(data && data.projects) ? data.projects : [];
      }
    );
  }

  // Convenience: resolve both in parallel and return { config, projects, lang }.
  function loadContext() {
    return Promise.all([loadConfig(), loadProjects()]).then(function (pair) {
      const config = pair[0];
      const projects = pair[1];
      const lang = detectLang(config);
      return { config: config, projects: projects, lang: lang };
    });
  }

  window.TeskeProjects = {
    escapeHtml: escapeHtml,
    detectLang: function () { return detectLang(window.__teskeConfigCache || FALLBACK_I18N); },
    projectHref: function (slug, lang) { return projectHref(slug, lang, window.__teskeConfigCache); },
    getLocalised: function (project, lang) { return getLocalised(project, lang, window.__teskeConfigCache); },
    label: function (key, lang) { return label(key, lang, window.__teskeConfigCache); },
    loadConfig: loadConfig,
    loadProjects: loadProjects,
    loadContext: function () {
      return loadContext().then(function (ctx) {
        // Cache the resolved config so synchronous helpers can use it.
        window.__teskeConfigCache = ctx.config;
        return ctx;
      });
    },
  };
})();
