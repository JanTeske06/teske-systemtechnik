/* ------------------------------------------------------------------
 * contact-form.js — multilingual Formspree handler for the homepage
 * contact form. Shows Sending → Success/Error state on the submit
 * button, resets after 5s, never reloads the page.
 *
 * Labels are pulled from /static/data/i18n.json via TeskeProjects.
 *
 * Requires the following DOM IDs to exist:
 *   #contact-form        — the <form action="https://formspree.io/f/...">
 *   #contact-submit      — the submit <button>
 *   #contact-submit-text — an inner <span> with the label text
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  // Local fallbacks used if TeskeProjects helpers are unavailable
  // (e.g. page loaded contact-form.js without projects-data.js).
  const FALLBACK = {
    de: { sending: 'Wird gesendet…', success: 'Erfolgreich gesendet ✓', error: 'Fehler — bitte erneut versuchen' },
    en: { sending: 'Sending…',       success: 'Sent successfully ✓',     error: 'Failed — please try again' },
    ru: { sending: 'Отправка…',      success: 'Отправлено ✓',            error: 'Ошибка — попробуйте ещё раз' },
  };

  function detectLang() {
    if (window.TeskeProjects && typeof window.TeskeProjects.detectLang === 'function') {
      return window.TeskeProjects.detectLang();
    }
    const htmlLang = (document.documentElement.lang || 'de').toLowerCase();
    if (htmlLang.indexOf('en') === 0) return 'en';
    if (htmlLang.indexOf('ru') === 0) return 'ru';
    return 'de';
  }

  function labelFactory(lang) {
    const helpers = window.TeskeProjects;
    const bag = FALLBACK[lang] || FALLBACK.de;
    return function (key) {
      const mapped = 'contact' + key.charAt(0).toUpperCase() + key.slice(1);
      if (helpers && typeof helpers.label === 'function') {
        const v = helpers.label(mapped, lang);
        if (v) return v;
      }
      return bag[key];
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const button = document.getElementById('contact-submit');
    const btnText = document.getElementById('contact-submit-text');
    if (!form || !button || !btnText) return;

    const lang = detectLang();
    // Preload i18n config so labels resolve without a flash of the fallback.
    if (window.TeskeProjects && typeof window.TeskeProjects.loadConfig === 'function') {
      window.TeskeProjects.loadConfig().catch(function () {});
    }

    const t = labelFactory(lang);
    const originalLabel = btnText.innerHTML;
    const COLORS = {
      success: '#10b981', /* emerald-500 */
      error: '#ef4444',   /* red-500    */
    };

    function resetButton() {
      button.style.backgroundColor = '';
      button.style.color = '';
      button.disabled = false;
      btnText.innerHTML = originalLabel;
    }

    function showSending() {
      button.disabled = true;
      btnText.textContent = t('sending');
    }

    function showResult(ok) {
      button.style.backgroundColor = ok ? COLORS.success : COLORS.error;
      button.style.color = '#ffffff';
      btnText.textContent = ok ? t('success') : t('error');
      if (ok) form.reset();
      button.disabled = !ok; // allow retry on error immediately
      setTimeout(resetButton, 5000);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      showSending();

      fetch(form.action, {
        method: form.method || 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
        .then(function (response) { showResult(response.ok); })
        .catch(function () { showResult(false); });
    });
  });
})();
