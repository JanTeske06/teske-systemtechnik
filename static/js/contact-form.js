/* ------------------------------------------------------------------
 * contact-form.js — bilingual Formspree handler for the homepage
 * contact form. Shows Sending → Success/Error state on the submit
 * button, resets after 5s, never reloads the page.
 *
 * Requires the following DOM IDs to exist:
 *   #contact-form        — the <form action="https://formspree.io/f/...">
 *   #contact-submit      — the submit <button>
 *   #contact-submit-text — an inner <span> with the label text
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contact-form');
    const button = document.getElementById('contact-submit');
    const btnText = document.getElementById('contact-submit-text');
    if (!form || !button || !btnText) return;

    const htmlLang = (document.documentElement.lang || 'de').toLowerCase();
    const lang = htmlLang.indexOf('de') === 0 ? 'de' : 'en';

    const LABELS = {
      de: {
        sending: 'Wird gesendet…',
        success: 'Erfolgreich gesendet ✓',
        error: 'Fehler — bitte erneut versuchen',
      },
      en: {
        sending: 'Sending…',
        success: 'Sent successfully ✓',
        error: 'Failed — please try again',
      },
    };

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
      btnText.textContent = LABELS[lang].sending;
    }

    function showResult(ok) {
      button.style.backgroundColor = ok ? COLORS.success : COLORS.error;
      button.style.color = '#ffffff';
      btnText.textContent = ok ? LABELS[lang].success : LABELS[lang].error;
      if (ok) {
        form.reset();
      }
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
        .then(function (response) {
          showResult(response.ok);
        })
        .catch(function () {
          showResult(false);
        });
    });
  });
})();
